const { OpenAI } = require("openai");
const { Op } = require("sequelize");
const db = require("../models");
const path = require('path');
const ChatbotService = require('./chatBotService');
const IntentAnalyzer = require('./intentAnalyzer');
const QueryBuilder = require('./queryBuilder');
const ChatIntegration = require('./chatIntegration');
const { 
    processDocument,
    extractTextFromImage,
    extractTextFromPDF,
    parseInventoryInfo 
} = require('./documentProcessor');

class ChatbotIntelligence {

    // Define private fields for the class
    #warrantyRules;
    #conversationTimeouts;
    #conversations;

    constructor(chatBotService, apiKey) {
        if (typeof apiKey !== 'string' || !apiKey) {
            throw new Error('Valid API key string is required for ChatbotIntelligence');
        }
        if (!chatBotService) {
            throw new Error('ChatbotService is required for ChatbotIntelligence');
        }

        this.chatBotService = chatBotService;
        this.openai = new OpenAI({ apiKey });
        this.queryBuilder = new QueryBuilder(db);
        this.integration = new ChatIntegration(db, this.openai)

        this.errorTemplates = {
            DOCUMENT_PROCESSING_ERROR: 'Error processing document: {message}',
            VALIDATION_ERROR: 'Validation failed: {message}',
            EXTRACTION_ERROR: 'Could not extract required information: {message}',
            ANALYSIS_ERROR: 'Analysis failed: {message}',
            DEFAULT_ERROR: 'An unexpected error occurred: {message}'
        };
        
        // Initialize conversation store with session management
        this.#conversations = new Map();
        this.#conversationTimeouts = new Map();
        
        // Initialize warranty rules
        this.#warrantyRules = {
            battery: {
                manufacturer: {
                    defaultDuration: 365,
                    minDuration: 180,
                    maxDuration: 730
                },
                consumer: {
                    defaultDuration: 90,
                    minDuration: 30,
                    maxDuration: 180
                }
            },
            default: {
                manufacturer: {
                    defaultDuration: 180,
                    minDuration: 90,
                    maxDuration: 365
                },
                consumer: {
                    defaultDuration: 90,
                    minDuration: 30,
                    maxDuration: 180
                }
            }
        };

        this.analysisCategories = {
            INVENTORY: {
                metrics: ['stock_levels', 'low_stock', 'fast_moving', 'value'],
                dataQueries: {
                    stock_levels: async (db, username) => {
                        return await db.Product.findAll({
                            where: { user_id: username },
                            attributes: [
                                'product_name',
                                'product_stock',
                                'reorder_point',
                                'price'
                            ]
                        });
                    },
                    low_stock: async (db, username) => {
                        return await db.Product.findAll({
                            where: { 
                                user_id: username,
                                product_stock: { [Op.lt]: db.sequelize.col('reorder_point') }
                            }
                        });
                    },
                    fast_moving: async (db, username) => {
                        // Use your existing fast-moving items query logic
                        const timeRange = 30; // Default to 30 days
                        return await db.sequelize.query(
                            // Your existing fast-moving items SQL
                        );
                    }
                },
                responseGenerators: {
                    stock_levels: (data) => {
                        const totalValue = data.reduce((sum, item) => 
                            sum + (item.product_stock * item.price), 0);
                        return {
                            summary: `Your current inventory consists of ${data.length} products with a total value of RM${totalValue.toFixed(2)}`,
                            details: this.formatStockLevelsDetail(data)
                        };
                    },
                    low_stock: (data) => {
                        return this.generateLowStockAnalysis(data);
                    }
                }
            },
            SALES: {
                metrics: ['daily_sales', 'trends', 'performance'],
                dataQueries: {
                    daily_sales: async (db, username) => {
                        const today = new Date();
                        // Query your sales data for today
                        return await db.SalesOrder.sum('total_amount', {
                            where: {
                                user_id: username,
                                created_at: {
                                    [Op.gte]: today.setHours(0,0,0,0)
                                }
                            }
                        });
                    },
                    sales_trends: async (db, username) => {
                        // Implement your sales trend analysis
                    }
                }
            },
            APPOINTMENTS: {
                metrics: ['today', 'upcoming', 'statistics'],
                dataQueries: {
                    today_appointments: async (db, username) => {
                        // Query appointments for today
                    }
                }
            }
        };

        // Enhanced prompt template for better context awareness
        this.ENHANCED_PROMPT = `You are a sophisticated inventory management assistant with access to:
        1. Real-time inventory data including stock levels, values, and movements
        2. Sales performance metrics and trends
        3. Customer engagement data
        4. Appointment scheduling information

        When analyzing user queries:
        - Provide specific numerical insights when available
        - Compare current values against historical averages
        - Suggest actionable recommendations
        - Format responses with clear sections and visual indicators (emojis)
        
        Current business context: {businessContext}
        Recent system alerts: {systemAlerts}
        User's role: {userRole}`;
        
    }

    async handleUserResponse(username, message) {
        try {
            if (!username) {
                throw new Error('Username is required for chatbot interactions');
            }

            // First, get user details from database
            const user = await this.db.User.findOne({
                where: { username: username }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Check if it's a greeting or general message
            const isGreeting = this.isGreeting(message.toLowerCase());
            if (isGreeting) {
                return {
                    message: `Hello ${user.username}! 👋 I'm your StockSavvy Assistant. I can help you with:
                    • Inventory management and stock levels
                    • Sales analysis and performance
                    • Purchase orders and vendor management
                    • Warranty tracking and claims
                    
                    What would you like to know about?`,
                    data: null,
                    suggestions: [
                        { text: "Check inventory status", action: "check_inventory" },
                        { text: "View sales performance", action: "view_sales" },
                        { text: "Track warranties", action: "track_warranties" }
                    ]
                };
            }

            // If not a greeting, proceed with intent analysis
            const intent = await this.analyzeIntent(message);
            console.log('Analyzed intent:', intent);

            // Get context data based on the intent
            const contextData = await this.gatherContextData(intent, username);

            // Generate response using GPT with the context data
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful inventory management assistant. Use this real-time data to provide a specific, detailed response:
                        ${JSON.stringify(contextData, null, 2)}
                        
                        Focus on providing specific numbers, insights, and actionable recommendations based on the actual data.
                        Do not use generic templates - respond directly to what the user is asking about.`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7
            });

            return {
                message: completion.choices[0].message.content,
                data: contextData,
                suggestions: this.generateSuggestions(intent, contextData)
            };

        } catch (error) {
            console.error('Error handling user response:', error);
            throw error;
        }
    }

    // Add this helper method
    isGreeting(message) {
        const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'];
        return greetings.some(greeting => message.includes(greeting));
    }

    async analyzeIntent(message) {
        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are an inventory management assistant. Analyze user queries to determine:
                    - The main category (INVENTORY, SALES, WARRANTY, etc.)
                    - Specific metrics needed (stock_levels, low_stock, etc.)
                    - Time range if applicable
                    - Any specific items or categories mentioned
                    Return a JSON structure with these details.`
                },
                {
                    role: "user",
                    content: message
                }
            ],
            temperature: 0.3
        });

        return JSON.parse(completion.choices[0].message.content);
    }

    async gatherContextData(intent, username) {
        const data = {};

        // Based on the intent category, gather relevant data
        switch (intent.category) {
            case 'INVENTORY':
                data.inventory = await this.gatherInventoryData(username, intent);
                break;
            case 'SALES':
                data.sales = await this.gatherSalesData(username, intent);
                break;
            case 'APPOINTMENTS':
                data.appointments = await this.gatherAppointmentData(username, intent);
                break;
            case 'ORGANIZATION':
                data.organization = await this.gatherOrganizationData(username, intent);
                break;
            case 'DISCOUNTS':
                data.discounts = await this.gatherDiscountData(username, intent);
                break;
            case 'PURCHASE_ORDERS':
                data.purchaseOrders = await this.gatherPurchaseOrderData(username, intent);
                break;
            case 'SALES_ANALYSIS':
                data.salesAnalysis = await this.gatherSalesAnalysisData(username, intent);
                break;
            case 'FULFILLMENT_TRACKING':
                data.fulfillment = await this.gatherFulfillmentData(username, intent);
                break;
            case 'TAX_MANAGEMENT':
                data.tax = await this.gatherTaxData(username, intent);
                break;
            case 'USER_MANAGEMENT':
                data.users = await this.gatherUserData(username, intent);
                break;
            case 'WARRANTY_MANAGEMENT':
                data.warranty = await this.gatherWarrantyData(username, intent);
                break;
            default:
                data.general = {
                    message: "Unable to determine specific data requirements"
                };
        }

        return data;
    }

    async gatherInventoryData(username, intent) {
        // Example of gathering inventory data using QueryBuilder
        const queries = {
            stock_levels: async () => {
                return await this.queryBuilder.executeQuery('INVENTORY', 'stock_levels', {
                    userId: username
                });
            },
            low_stock: async () => {
                return await this.queryBuilder.executeQuery('INVENTORY', 'low_stock', {
                    userId: username,
                    threshold: 10
                });
            },
            total_value: async () => {
                return await this.queryBuilder.executeQuery('INVENTORY', 'total_value', {
                    userId: username
                });
            }
        };

        const data = {};
        
        // Execute queries based on requested metrics
        for (const metric of intent.metrics) {
            if (queries[metric]) {
                data[metric] = await queries[metric]();
            }
        }

        return data;
    }

    async generateResponse(intent, contextData) {
        // Format the context data for GPT
        const formattedContext = this.formatContextForGPT(contextData);

        // Generate response using GPT
        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are StockSavvy, an inventory management assistant. Use this real-time data to answer the query:
                    ${JSON.stringify(formattedContext, null, 2)}`
                },
                {
                    role: "user",
                    content: intent.originalQuery
                }
            ],
            temperature: 0.7
        });

        // Parse and structure the response
        const message = completion.choices[0].message.content;
        
        return {
            message,
            data: contextData, // Return the raw data for UI rendering
            suggestions: this.generateSuggestions(intent, contextData)
        };
    }

    formatContextForGPT(contextData) {
        // Transform raw database data into a format suitable for GPT
        const formatted = {};

        if (contextData.inventory) {
            formatted.inventory = {
                totalProducts: contextData.inventory.stock_levels?.length || 0,
                totalValue: this.calculateTotalValue(contextData.inventory.stock_levels),
                lowStockItems: contextData.inventory.low_stock?.length || 0,
                stockHealth: this.analyzeStockHealth(contextData.inventory.stock_levels)
            };
        }

        return formatted;
    }

    generateSuggestions(intent, contextData) {
        const suggestions = [];

        // Add relevant suggestions based on the data
        if (contextData.inventory?.low_stock?.length > 0) {
            suggestions.push({
                text: "View low stock items",
                action: "view_low_stock"
            });
        }

        return suggestions;
    }

    calculateTotalValue(stockLevels) {
        if (!stockLevels) return 0;
        return stockLevels.reduce((sum, item) => sum + (item.price * item.product_stock), 0);
    }

    analyzeStockHealth(stockLevels) {
        if (!stockLevels) return { healthy: 0, low: 0, out: 0 };

        return stockLevels.reduce((health, item) => {
            if (item.product_stock === 0) health.out++;
            else if (item.product_stock < 10) health.low++;
            else health.healthy++;
            return health;
        }, { healthy: 0, low: 0, out: 0 });
    }

    isPurchaseOrderQuery(message) {
        // Add logic to detect purchase order related queries
        const poKeywords = ['purchase order', 'po', 'vendor order', 'buying'];
        return poKeywords.some(keyword => 
            message.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    generateErrorExplanation(error) {
        // Get the error template based on error type or use default
        const template = this.errorTemplates[error.code] || this.errorTemplates.DEFAULT_ERROR;
        
        // Create user-friendly error message
        const explanation = template.replace('{message}', error.message);
        
        // Add suggestions for resolution if available
        let resolution = '';
        switch (error.code) {
            case 'DOCUMENT_PROCESSING_ERROR':
                resolution = '\nPlease ensure your document is a valid PDF or image file and try again.';
                break;
            case 'VALIDATION_ERROR':
                resolution = '\nPlease review the document contents and ensure all required information is present.';
                break;
            case 'EXTRACTION_ERROR':
                resolution = '\nPlease check if the document follows the expected format and contains all required fields.';
                break;
            default:
                resolution = '\nPlease try again or contact support if the issue persists.';
        }

        return explanation + resolution;
    }

    async analyzeVendorPurchaseOrder(data) {
        try {
            const analysis = {
                newProducts: [],
                existingProducts: [], // Simplified from previous structure
                financialValidation: {},
                suggestedActions: []
            };

            // Validate data structure
            if (!data.items || !Array.isArray(data.items)) {
                throw new Error('Invalid purchase order data structure');
            }

            // Process each product with more generic pattern matching
            for (const item of data.items) {
                const existingProduct = await db.Product.findOne({
                    where: {
                        [Op.or]: [
                            { sku_number: item.sku },
                            { product_name: item.description }
                        ]
                    }
                });

                if (!existingProduct) {
                    analysis.newProducts.push({
                        productName: item.description,
                        sku: item.sku,
                        unitPrice: item.unitPrice,
                        category: item.category || 'General', // More generic category handling
                        manufacturer: data.vendorName,
                        quantity: item.quantity,
                        unit: item.unit || 'piece',
                        status_id: 1
                    });
                } else {
                    analysis.existingProducts.push({
                        product: existingProduct,
                        newPrice: item.unitPrice,
                        priceChanged: existingProduct.price !== item.unitPrice,
                        quantity: item.quantity
                    });
                }
            }

            // Financial validation logic remains the same
            analysis.financialValidation = this.validateFinancials(data);

            // Generate actions based on analysis
            analysis.suggestedActions = this.determineSuggestedActions(analysis);

            return analysis;

        } catch (error) {
            console.error('Purchase order analysis error:', error);
            throw error;
        }
    }

    validateFinancials(data) {
        const calculatedSubtotal = data.items.reduce((sum, item) => 
            sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice)), 0
        );
        const calculatedTax = calculatedSubtotal * 0.06;
        const calculatedTotal = calculatedSubtotal + calculatedTax + (data.shippingFee || 0);

        return {
            subtotalMatch: Math.abs(calculatedSubtotal - data.subtotal) < 0.01,
            taxMatch: Math.abs(calculatedTax - data.tax) < 0.01,
            totalMatch: Math.abs(calculatedTotal - data.grandTotal) < 0.01,
            calculations: {
                calculatedSubtotal,
                calculatedTax,
                calculatedTotal
            }
        };
    }

    async analyzeDocument(file, conversationId) {
        try {
            const conversation = this.getOrCreateConversation(conversationId);
            console.log('Processing document:', file.originalname);
            
            // Use the document processor through chatbot service
            const documentResults = await this.chatBotService.processDocument(file);
            
            // Check if it's a purchase order and handle accordingly
            if (documentResults.metadata?.documentType === 'purchase_order') {
                return await this.analyzePurchaseOrder(documentResults, conversation);
            }

            // Perform complete analysis for other document types
            const analysis = await this.performCompleteAnalysis({
                extractedItems: documentResults.extractedItems,
                metadata: documentResults.metadata
            });

            // Update conversation context
            conversation.currentDocument = {
                extractedItems: documentResults.extractedItems,
                analysis,
                status: analysis.isValid ? 'pending_confirmation' : 'needs_review'
            };

            return {
                success: true,
                analysis,
                explanation: this.chatBotService.generateAnalysisExplanation(analysis),
                fileAnalysis: documentResults
            };

        } catch (error) {
            console.error('Document analysis error:', error);
            return {
                success: false,
                error: error.message,
                explanation: this.generateErrorExplanation({
                    code: error.code || 'PROCESSING_ERROR',
                    message: error.message
                })
            };
        }
    }

    processDocument(file) {
        return require('./documentProcessor').processDocument(file);
    }

    determineSuggestedActions(analysis) {
        const actions = [];

        if (analysis.isValid) {
            actions.push({
                type: 'confirm',
                label: 'Confirm and Process',
                action: 'process_document'
            });
        }

        // Add edit action if there are warnings but document is still processable
        if (analysis.warnings?.length > 0) {
            actions.push({
                type: 'edit',
                label: 'Edit Details',
                action: 'edit_document'
            });
        }

        // Always add cancel option
        actions.push({
            type: 'cancel',
            label: 'Cancel',
            action: 'cancel_processing'
        });

        return actions;
    }

    buildConversationContext(conversation) {
        const context = {
            processingStage: conversation?.currentDocument?.status || 'initial',
            pendingValidations: [],
            previousActions: [],
            currentDocument: null
        };

        // Add document context if available
        if (conversation?.currentDocument) {
            context.currentDocument = {
                status: conversation.currentDocument.status,
                analysis: conversation.currentDocument.analysis,
                extractedItems: conversation.currentDocument.extractedItems
            };
        }

        // Add recent conversation history context
        if (conversation?.history?.length) {
            const recentHistory = conversation.history.slice(-3);
            context.recentInteractions = recentHistory.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            }));
        }

        // Add any pending actions
        if (conversation?.context?.pendingActions?.length) {
            context.pendingActions = conversation.context.pendingActions;
        }

        return context;
    }

    async performCompleteAnalysis(data) {
        try {
            // Analyze product data and availability
            const productAnalysis = await this.validateProducts(data.extractedItems);
            
            // Analyze warranty requirements
            const warrantyAnalysis = await this.analyzeWarrantyRequirements(data);
            
            // Calculate financials with error handling
            const financialAnalysis = this.calculateFinancials(data.extractedItems);

            return {
                products: productAnalysis,
                warranties: warrantyAnalysis,
                financials: financialAnalysis,
                isValid: this.validateCompleteAnalysis(
                    productAnalysis, 
                    warrantyAnalysis, 
                    financialAnalysis
                )
            };
        } catch (error) {
            console.error('Complete analysis error:', error);
            throw error;
        }
    }

    validateCompleteAnalysis(productAnalysis, warrantyAnalysis, financialAnalysis) {
        return (
            productAnalysis.length > 0 && 
            !productAnalysis.some(p => !p.found) &&
            financialAnalysis.isValid &&
            financialAnalysis.calculations?.total > 0
        );
    }

    async validateProducts(items) {
        const validations = [];
        
        for (const item of items) {
            // Find product in database
            const product = await db.Product.findOne({
                where: { sku_number: item.sku },
                include: [{ 
                    model: db.Warranty,
                    as: 'warranties',
                    where: { 
                        end_date: { [Op.gt]: new Date() }
                    },
                    required: false
                }]
            });

            validations.push({
                sku: item.sku,
                productName: item.productName,
                found: !!product,
                requiresWarranty: product?.category === 'Battery',
                currentStock: product?.product_stock || 0,
                requestedQuantity: item.quantity,
                isStockSufficient: product ? (product.product_stock >= item.quantity) : false,
                activeWarranties: product?.warranties || []
            });
        }

        return validations;
    }

    async analyzeWarrantyRequirements(data) {
        const analysis = {
            applicableProducts: [],
            warrantyTerms: [],
            missingInfo: [],
            warnings: []
        };

        for (const item of data.extractedItems) {
            const product = await db.Product.findOne({
                where: { sku_number: item.sku },
                include: [{
                    model: db.Warranty,
                    as: 'warranties'
                }]
            });

            if (product && this.#requiresWarranty(product)) {
                const suggestedTerms = await this.#suggestWarrantyTerms(product);
                analysis.applicableProducts.push({
                    sku: item.sku,
                    productName: item.productName,
                    warrantyTypes: this.#determineWarrantyTypes(product),
                    suggestedTerms,
                    existingWarranties: product.warranties
                });
            }
        }

        return analysis;
    }

async gatherWarrantyData(username, intent) {
    try {
        // Get user first
        const user = await db.User.findOne({
            where: { username: username }
        });

        if (!user) {
            throw new Error('User not found');
        }

        const warranties = await db.Warranty.findAll({
            where: { 
                organization_id: user.organization_id  
            },
            include: [
                {
                    model: db.Product,
                    as: 'product',
                    attributes: ['product_name', 'sku_number', 'manufacturer']
                },
                {
                    model: db.WarrantyClaim,
                    as: 'claims',
                    required: false,
                    attributes: [
                        'claim_id',
                        'warranty_id',
                        'customer_id',
                        'date_of_claim',
                        'claim_status',
                        'resolution_details',
                        'claim_type',
                        'priority',
                        'assigned_to'
                    ]
                }
            ],
            // Specify warranty attributes we want
            attributes: [
                'warranty_id',
                'product_id',
                'warranty_type',
                'description',
                'terms',
                'duration'
            ]
        });

        // Structure the warranty data for response
        const contextData = {
            metrics: {
                total_warranties: warranties.length,
                active_warranties: warranties.filter(w => w.warranty_type === 1).length,
                manufacturer_warranties: warranties.filter(w => w.warranty_type === 2).length
            },
            insights: {
                warranty_distribution: {
                    by_type: this.analyzeWarrantyTypes(warranties),
                    by_product: this.analyzeWarrantyProducts(warranties)
                },
                claim_status: this.analyzeWarrantyClaims(warranties)
            }
        };

        return contextData;

    } catch (error) {
        console.error('Error gathering warranty data:', error);
        throw new Error(`Failed to gather warranty data: ${error.message}`);
    }
}

// Helper methods for warranty analysis
analyzeWarrantyTypes(warranties) {
    const typeDistribution = {
        consumer: 0,
        manufacturer: 0
    };

    warranties.forEach(warranty => {
        if (warranty.warranty_type === 1) {
            typeDistribution.consumer++;
        } else if (warranty.warranty_type === 2) {
            typeDistribution.manufacturer++;
        }
    });

    return typeDistribution;
}

analyzeWarrantyProducts(warranties) {
    const productMap = new Map();

    warranties.forEach(warranty => {
        const product = warranty.product;
        if (product) {
            const key = product.product_name;
            if (!productMap.has(key)) {
                productMap.set(key, {
                    count: 0,
                    manufacturer: product.manufacturer
                });
            }
            productMap.get(key).count++;
        }
    });

    return Array.from(productMap.entries()).map(([product, data]) => ({
        product_name: product,
        warranty_count: data.count,
        manufacturer: data.manufacturer
    }));
}

analyzeWarrantyClaims(warranties) {
    const claimStatus = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        resolved: 0
    };

    warranties.forEach(warranty => {
        if (warranty.claims) {
            warranty.claims.forEach(claim => {
                claimStatus.total++;
                switch (claim.claim_status) {
                    case 1: // PENDING
                        claimStatus.pending++;
                        break;
                    case 2: // APPROVED
                        claimStatus.approved++;
                        break;
                    case 3: // REJECTED
                        claimStatus.rejected++;
                        break;
                    case 4: // RESOLVED
                        claimStatus.resolved++;
                        break;
                }
            });
        }
    });

    return claimStatus;
}

    processWarrantyStatus(warranties) {
    return {
        totalWarranties: warranties.length,
        activeWarranties: warranties.filter(w => new Date(w.end_date) > new Date()).length,
        expiredWarranties: warranties.filter(w => new Date(w.end_date) <= new Date()).length,
        pendingClaims: warranties.reduce((total, w) => 
            total + w.claims.filter(c => c.status === 'pending').length, 0
        )
    };
    }

    getExpiringWarranties(warranties) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        return warranties
            .filter(w => {
                const endDate = new Date(w.end_date);
                return endDate > new Date() && endDate <= thirtyDaysFromNow;
            })
            .map(w => ({
                product: w.product.product_name,
                endDate: w.end_date,
                daysRemaining: Math.ceil((new Date(w.end_date) - new Date()) / (1000 * 60 * 60 * 24))
            }));
    }

    analyzeWarrantyClaims(warranties) {
        const claims = warranties.flatMap(w => w.claims);
        
        return {
            totalClaims: claims.length,
            pendingClaims: claims.filter(c => c.status === 'pending').length,
            approvedClaims: claims.filter(c => c.status === 'approved').length,
            rejectedClaims: claims.filter(c => c.status === 'rejected').length,
            averageResolutionDays: this.calculateAverageResolutionTime(claims)
        };
    }

    calculateAverageResolutionTime(claims) {
        const resolvedClaims = claims.filter(c => 
            c.status === 'approved' || c.status === 'rejected'
        );

        if (resolvedClaims.length === 0) return 0;

        const totalDays = resolvedClaims.reduce((sum, claim) => {
            const submitDate = new Date(claim.submit_date);
            const resolveDate = new Date(claim.resolve_date);
            return sum + Math.ceil((resolveDate - submitDate) / (1000 * 60 * 60 * 24));
        }, 0);

        return Math.round(totalDays / resolvedClaims.length);
    }

    generateWarrantyAlerts(warranties) {
        const alerts = [];

        // Check for expiring warranties
        const expiringWarranties = this.getExpiringWarranties(warranties);
        if (expiringWarranties.length > 0) {
            alerts.push({
                type: 'warranty_expiry',
                severity: 'warning',
                message: `${expiringWarranties.length} warranties are expiring within 30 days`,
                items: expiringWarranties
            });
        }

        // Check for pending warranty claims
        const pendingClaims = warranties.reduce((total, w) => 
            total + w.claims.filter(c => c.status === 'pending').length, 0
        );
        if (pendingClaims > 0) {
            alerts.push({
                type: 'pending_claims',
                severity: 'medium',
                message: `${pendingClaims} warranty claims are pending review`,
                count: pendingClaims
            });
        }

        return alerts;
    }

    generateWarrantyRecommendations(warranties) {
        const recommendations = [];
        const expiringWarranties = this.getExpiringWarranties(warranties);

        // Recommend renewal for expiring warranties
        if (expiringWarranties.length > 0) {
            recommendations.push({
                type: 'warranty_renewal',
                priority: 'high',
                suggestion: 'Consider renewing warranties for the following products',
                items: expiringWarranties
            });
        }

        // Analyze and recommend based on claim patterns
        const claims = warranties.flatMap(w => w.claims);
        const claimAnalysis = this.analyzeWarrantyClaims(warranties);
        
        if (claimAnalysis.averageResolutionDays > 7) {
            recommendations.push({
                type: 'claim_processing',
                priority: 'medium',
                suggestion: 'Consider optimizing warranty claim processing time',
                details: {
                    currentResolutionTime: claimAnalysis.averageResolutionDays,
                    targetResolutionTime: 7,
                    improvement: 'Aim to reduce resolution time by reviewing claim processing workflow'
                }
            });
        }

        return recommendations;
    }

    // Conversation Management Methods
    getOrCreateConversation(id) {
        // Clear any existing timeout for this conversation
        if (this.#conversationTimeouts.has(id)) {
            clearTimeout(this.#conversationTimeouts.get(id));
        }

        if (!this.#conversations.has(id)) {
            this.#conversations.set(id, {
                history: [],
                currentDocument: null,
                context: {
                    lastInteractionTime: new Date(),
                    processingStage: 'initial',
                    validationState: {},
                    pendingActions: []
                }
            });
        }

        // Set new timeout for conversation cleanup
        const timeout = setTimeout(() => {
            this.#conversations.delete(id);
            this.#conversationTimeouts.delete(id);
        }, 30 * 60 * 1000); // 30 minutes timeout

        this.#conversationTimeouts.set(id, timeout);
        return this.#conversations.get(id);
    }

    async handleUserResponse(username, message) {
        if (!username) {
            throw new Error('Username is required for chatbot interactions');
        }

        const conversation = this.getOrCreateConversation(username);
        
        // Add user message to history
        conversation.history.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });

        // Store username in conversation context
        conversation.username = username;
        
        // Generate contextual response based on conversation state
        const response = await this.generateContextualResponse(conversation, message);
        
        // Update conversation with bot's response
        conversation.history.push({
            role: 'assistant',
            content: response.message,
            data: response.data,
            actions: response.suggestedActions,
            timestamp: new Date()
        });

        return response;
    }

    async gatherAppointmentData(username, intent) {
    try {
        if (!username) {
            throw new Error('Username is required for appointment data gathering');
        }

        // First get the user to ensure authorization
        const user = await db.User.findOne({
            where: { username }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Query appointments with proper associations
        const appointments = await db.Appointment.findAll({
            where: { user_id: user.user_id },
            include: [{
                model: db.Customer,
                attributes: ['customer_name', 'customer_contact', 'customer_company']
            }],
            order: [['appointment_date', 'DESC']]
        });

        // Structure the response data
        const contextData = {
            metrics: {
                totalAppointments: appointments.length,
                upcomingAppointments: this.getUpcomingAppointments(appointments),
                todayAppointments: this.getTodayAppointments(appointments)
            },
            insights: {
                appointmentDistribution: this.analyzeAppointmentDistribution(appointments),
                customerEngagement: this.analyzeCustomerEngagement(appointments),
                serviceTypeBreakdown: this.analyzeServiceTypes(appointments)
            },
            alerts: this.generateAppointmentAlerts(appointments)
        };

        return contextData;

    } catch (error) {
        console.error('Error gathering appointment data:', error);
        throw new Error(`Failed to gather appointment data: ${error.message}`);
    }
}

// Helper methods for appointment analysis
getUpcomingAppointments(appointments) {
    const now = new Date();
    return appointments.filter(apt => {
        const appointmentDateTime = new Date(`${apt.appointment_date} ${apt.time_slot}`);
        return appointmentDateTime > now;
    }).map(apt => ({
        id: apt.appointment_sn,
        customerName: apt.Customer?.customer_name || 'Unknown Customer',
        date: apt.appointment_date,
        timeSlot: apt.time_slot,
        serviceType: apt.service_type,
        status: apt.status
    }));
}

getTodayAppointments(appointments) {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => 
        apt.appointment_date === today
    ).map(apt => ({
        id: apt.appointment_sn,
        customerName: apt.Customer?.customer_name || 'Unknown Customer',
        timeSlot: apt.time_slot,
        serviceType: apt.service_type,
        status: apt.status
    }));
}

analyzeAppointmentDistribution(appointments) {
    // Group appointments by date
    const distribution = appointments.reduce((acc, apt) => {
        const date = apt.appointment_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(apt);
        return acc;
    }, {});

    // Calculate statistics
    return Object.entries(distribution).map(([date, apts]) => ({
        date,
        count: apts.length,
        serviceTypes: this.countServiceTypes(apts),
        completionRate: apts.filter(apt => apt.status === 'completed').length / apts.length
    }));
}

analyzeCustomerEngagement(appointments) {
    // Group by customer
    const customerAppointments = appointments.reduce((acc, apt) => {
        const customerId = apt.customer_id;
        if (!acc[customerId]) acc[customerId] = [];
        acc[customerId].push(apt);
        return acc;
    }, {});

    return Object.entries(customerAppointments).map(([customerId, apts]) => ({
        customerId,
        customerName: apts[0].Customer?.customer_name || 'Unknown Customer',
        totalAppointments: apts.length,
        completedAppointments: apts.filter(apt => apt.status === 'completed').length,
        preferredService: this.getPreferredService(apts)
    }));
}

analyzeServiceTypes(appointments) {
    return this.countServiceTypes(appointments);
}

countServiceTypes(appointments) {
    return appointments.reduce((acc, apt) => {
        const serviceType = apt.service_type;
        acc[serviceType] = (acc[serviceType] || 0) + 1;
        return acc;
    }, {});
}

getPreferredService(appointments) {
    const services = this.countServiceTypes(appointments);
    return Object.entries(services)
        .sort(([,a], [,b]) => b - a)[0][0];
}

generateAppointmentAlerts(appointments) {
    const alerts = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check for overdue appointments
    const overdue = appointments.filter(apt => {
        const aptDateTime = new Date(`${apt.appointment_date} ${apt.time_slot}`);
        return aptDateTime < now && apt.status !== 'completed';
    });

    if (overdue.length > 0) {
        alerts.push({
            type: 'overdue',
            severity: 'high',
            message: `${overdue.length} overdue appointments require attention`,
            appointments: overdue.map(apt => ({
                id: apt.appointment_sn,
                customerName: apt.Customer?.customer_name,
                date: apt.appointment_date,
                timeSlot: apt.time_slot
            }))
        });
    }

    // Check for upcoming appointments today
    const upcoming = appointments.filter(apt => 
        apt.appointment_date === today && apt.status === 'pending'
    );

    if (upcoming.length > 0) {
        alerts.push({
            type: 'upcoming',
            severity: 'medium',
            message: `${upcoming.length} appointments scheduled for today`,
            appointments: upcoming.map(apt => ({
                id: apt.appointment_sn,
                customerName: apt.Customer?.customer_name,
                timeSlot: apt.time_slot
            }))
        });
    }

    return alerts;
}

async gatherDiscountData(username, intent) {
    try {
        if (!username) {
            throw new Error('Username is required for discount data gathering');
        }

        const user = await db.User.findOne({
            where: { username }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Get active discounts
        const discounts = await db.Discount.findAll({
            where: { 
                user_id: user.user_id,
                status: 'active'
            },
            include: [{
                model: db.SalesOrder,
                through: db.SalesOrderDiscount,
                required: false
            }]
        });

        return {
            metrics: {
                activeDiscounts: discounts.length,
                totalDiscountValue: this.calculateTotalDiscountValue(discounts),
                averageDiscount: this.calculateAverageDiscount(discounts)
            },
            insights: {
                discountUsage: this.analyzeDiscountUsage(discounts),
                performanceImpact: await this.analyzeDiscountPerformance(discounts)
            }
        };

    } catch (error) {
        console.error('Error gathering discount data:', error);
        throw new Error(`Failed to gather discount data: ${error.message}`);
    }
}

async gatherFulfillmentData(username, intent) {
    try {
        if (!username) {
            throw new Error('Username is required for fulfillment data gathering');
        }

        const user = await db.User.findOne({
            where: { username }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Get orders that need fulfillment
        const orders = await db.SalesOrder.findAll({
            where: {
                user_id: user.user_id,
                status_id: [1, 2] // Pending and Processing statuses
            },
            include: [{
                model: db.SalesOrderInventory,
                as: 'items',
                include: [{
                    model: db.Product,
                    as: 'Product'
                }]
            }]
        });

        return {
            metrics: {
                pendingOrders: orders.length,
                readyToShip: this.countReadyToShip(orders),
                awaitingStock: this.countAwaitingStock(orders)
            },
            insights: {
                fulfillmentStatus: this.analyzeFulfillmentStatus(orders),
                stockAvailability: await this.checkStockAvailability(orders)
            }
        };

    } catch (error) {
        console.error('Error gathering fulfillment data:', error);
        throw new Error(`Failed to gather fulfillment data: ${error.message}`);
    }
}

async gatherTaxData(username, intent) {
    try {
        if (!username) {
            throw new Error('Username is required for tax data gathering');
        }

        const user = await db.User.findOne({
            where: { username }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Get tax records and calculations
        const taxes = await db.Tax.findAll({
            where: { 
                organization_id: user.organization_id 
            },
            include: [{
                model: db.SalesOrder,
                through: db.SalesOrderTax,
                required: false
            }]
        });

        return {
            metrics: {
                activeTaxRates: taxes.length,
                totalTaxCollected: this.calculateTotalTax(taxes),
                averageTaxRate: this.calculateAverageTaxRate(taxes)
            },
            insights: {
                taxBreakdown: this.analyzeTaxBreakdown(taxes),
                taxCompliance: await this.assessTaxCompliance(taxes)
            }
        };

    } catch (error) {
        console.error('Error gathering tax data:', error);
        throw new Error(`Failed to gather tax data: ${error.message}`);
    }
}

async generateContextualResponse(conversation, message) {
    try {
        const intent = await this.analyzeQueryIntent(message);
        let contextData = {};

        // Change the switch statement to handle unknown/general intents better
        switch (intent.category) {
            case 'INVENTORY':
                contextData = await this.gatherInventoryData(conversation.username, intent);
                break;
            case 'SALES':
                contextData = await this.gatherSalesData(conversation.username, intent);
                break;
            case 'APPOINTMENTS':
                contextData = await this.gatherAppointmentData(conversation.username, intent);
                break;
            case 'DISCOUNTS':
                contextData = await this.gatherDiscountData(conversation.username, intent);
                break;
            case 'PURCHASE_ORDERS':
                contextData = await this.gatherPurchaseOrderData(conversation.username, intent);
                break;
            case 'SALES_ANALYSIS':
                contextData = await this.gatherSalesAnalysisData(conversation.username, intent);
                break;
            case 'FULFILLMENT_TRACKING':
                contextData = await this.gatherFulfillmentData(conversation.username, intent);
                break;
            case 'TAX_MANAGEMENT':
                contextData = await this.gatherTaxData(conversation.username, intent);
                break;
            case 'USER_MANAGEMENT':
                contextData = await this.gatherUserData(conversation.username);
                break;
            case 'WARRANTY_MANAGEMENT':
                contextData = await this.gatherWarrantyData(conversation.username, intent);
                break;
            default:
                // Instead of trying to gather general data, handle unknown intents gracefully
                contextData = {
                    metrics: {},
                    insights: {
                        message: "I understand you're asking about something, but I'm not sure which aspect of your business you want to know about. Could you please specify if you're asking about inventory, sales, orders, or another area?"
                    },
                    alerts: []
                };
        }

        // Create a more dynamic prompt based on available data
        const enhancedPrompt = `You are an inventory management assistant with access to real-time business data.
        
        Available Data:
        ${JSON.stringify(contextData, null, 2)}
        
        User Question: "${message}"
        
        Analyze this data and provide a natural, conversational response that:
        1. Directly addresses the user's specific question
        2. Includes relevant metrics and insights
        3. Highlights important patterns or concerns
        4. Makes data-driven recommendations when appropriate
        
        Keep the response conversational and natural, avoiding rigid templates.`;

        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: enhancedPrompt
                }
            ],
            temperature: 0.7
        });

        return {
            message: completion.choices[0].message.content,
            data: contextData,
            suggestions: this.generateSuggestions(intent, contextData)
        };

    } catch (error) {
        console.error('Error generating response:', error);
        return {
            message: "I encountered an error while analyzing your request. Could you please try rephrasing your question?",
            error: true
        };
    }
}

    generateCategoryBreakdown(products) {
        // Create a breakdown of products by category and manufacturer
        const breakdown = products.reduce((acc, product) => {
            // Get category and manufacturer, with defaults
            const category = product.category || 'Uncategorized';
            const manufacturer = product.manufacturer || 'Unknown';

            // Initialize category if it doesn't exist
            if (!acc[category]) {
                acc[category] = {
                    total: 0,
                    value: 0,
                    manufacturers: {},
                    stockCount: 0
                };
            }

            // Initialize manufacturer if it doesn't exist in this category
            if (!acc[category].manufacturers[manufacturer]) {
                acc[category].manufacturers[manufacturer] = {
                    count: 0,
                    value: 0,
                    stockCount: 0
                };
            }

            // Update counts and values
            acc[category].total++;
            acc[category].value += (product.price * product.product_stock);
            acc[category].stockCount += product.product_stock;
            acc[category].manufacturers[manufacturer].count++;
            acc[category].manufacturers[manufacturer].value += (product.price * product.product_stock);
            acc[category].manufacturers[manufacturer].stockCount += product.product_stock;

            return acc;
        }, {});

        // Calculate percentages and format for display
        return Object.entries(breakdown).map(([category, data]) => ({
            category,
            totalProducts: data.total,
            totalValue: parseFloat(data.value.toFixed(2)),
            stockCount: data.stockCount,
            manufacturers: Object.entries(data.manufacturers).map(([name, mfgData]) => ({
                name,
                productCount: mfgData.count,
                value: parseFloat(mfgData.value.toFixed(2)),
                stockCount: mfgData.stockCount
            }))
        }));
    }

    calculateValueDistribution(products) {
        const total = products.reduce((sum, p) => sum + (p.product_stock * p.price), 0);
        
        return products
            .map(product => ({
                name: product.product_name,
                value: product.product_stock * product.price,
                percentage: ((product.product_stock * product.price) / total * 100).toFixed(2)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 products by value
    }

    async gatherInventoryData(username, intent) {
        try {
            if (!username) {
                throw new Error('Username is required for inventory data gathering');
            }

            // Get user first
            const user = await db.User.findOne({
                where: { username: username }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Query products with proper eager loading
            const products = await db.Product.findAll({
                where: { 
                    user_id: user.user_id,
                    status_id: 1 // Only active products
                },
                include: [
                    {
                        model: db.SalesOrderInventory,
                        as: 'salesOrderItems',
                        required: false,
                        include: [
                            {
                                model: db.ProductUnit,
                                as: 'productUnits',
                                required: false
                            }
                        ]
                    }
                ]
            });

            // Structure the response data
            const contextData = {
                metrics: {
                    stock_status: this.processStockStatus(products)
                },
                insights: {
                    lowStockAlert: {
                        count: products.filter(p => p.product_stock < 10).length,
                        items: products
                            .filter(p => p.product_stock < 10)
                            .map(p => ({
                                name: p.product_name,
                                stock: p.product_stock,
                                reorderPoint: 10,
                                sku: p.sku_number
                            }))
                    },
                    valueDistribution: this.calculateValueDistribution(products)
                },
                alerts: this.generateInventoryAlerts(products),
                recommendations: this.generateStockRecommendations(products)
            };

            return contextData;

        } catch (error) {
            console.error('Error gathering inventory data:', error);
            throw new Error(`Failed to gather inventory data: ${error.message}`);
        }
    }

    processStockStatus(products) {
        return {
            totalProducts: products.length,
            totalValue: products.reduce((sum, p) => sum + (p.product_stock * p.price), 0),
            lowStockItems: products.filter(p => p.product_stock < 10).map(p => ({
                name: p.product_name,
                currentStock: p.product_stock,
                sku: p.sku_number
            })),
            stockSummary: {
                inStock: products.filter(p => p.product_stock > 10).length,
                lowStock: products.filter(p => p.product_stock <= 10 && p.product_stock > 0).length,
                outOfStock: products.filter(p => p.product_stock === 0).length
            }
        };
    }

    // Helper methods
    processDailyStocks(products) {
        return {
            totalProducts: products.length,
            totalValue: products.reduce((sum, p) => sum + (p.product_stock * p.price), 0),
            lowStockItems: products.filter(p => p.product_stock < 10).map(p => ({
                name: p.product_name,
                currentStock: p.product_stock,
                sku: p.sku_number
            })),
            outOfStock: products.filter(p => p.product_stock === 0).length
        };
    }

    async calculateStockPerformance(products) {
        const performanceData = {
            turnoverRate: [],
            mostSold: [],
            leastSold: []
        };

        // Calculate performance metrics using sales order data
        for (const product of products) {
            const salesData = product.salesOrderItems || [];
            const totalSold = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
            
            performanceData.turnoverRate.push({
                product: product.product_name,
                rate: totalSold / (product.product_stock || 1)
            });
        }

        // Sort and get top/bottom performers
        performanceData.turnoverRate.sort((a, b) => b.rate - a.rate);
        performanceData.mostSold = performanceData.turnoverRate.slice(0, 5);
        performanceData.leastSold = performanceData.turnoverRate.slice(-5);

        return performanceData;
    }

    generateInventoryInsights(products) {
        return {
            lowStockAlert: {
                count: products.filter(p => p.product_stock < 10).length,
                items: products
                    .filter(p => p.product_stock < 10)
                    .map(p => ({
                        name: p.product_name,
                        stock: p.product_stock,
                        reorderPoint: 10
                    }))
            },
            categoryBreakdown: this.generateCategoryBreakdown(products),
            valueDistribution: this.calculateValueDistribution(products)
        };
    }

    generateInventoryAlerts(products) {
        const alerts = [];

        // Check for low stock
        const lowStockItems = products.filter(p => p.product_stock < 10);
        if (lowStockItems.length > 0) {
            alerts.push({
                type: 'low_stock',
                severity: 'warning',
                message: `${lowStockItems.length} products are running low on stock`,
                items: lowStockItems.map(p => ({
                    name: p.product_name,
                    stock: p.product_stock
                }))
            });
        }

        // Check for expiring items
        const nearingExpiry = products.filter(p => 
            p.is_expiry_goods && 
            p.expiry_date && 
            new Date(p.expiry_date) <= new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
        );
        
        if (nearingExpiry.length > 0) {
            alerts.push({
                type: 'expiring_soon',
                severity: 'warning',
                message: `${nearingExpiry.length} products are nearing expiry`,
                items: nearingExpiry.map(p => ({
                    name: p.product_name,
                    expiryDate: p.expiry_date
                }))
            });
        }

        return alerts;
    }

    generateStockRecommendations(products) {
        return products
            .filter(p => p.product_stock < 10)
            .map(p => ({
                product: p.product_name,
                currentStock: p.product_stock,
                recommendedOrder: 10 - p.product_stock,
                reason: 'Low stock level'
            }));
    }

    generateSuggestions(intent, contextData) {
        const suggestions = [];

        switch (intent.category) {
            case 'INVENTORY':
                if (contextData.alerts?.length > 0) {
                    suggestions.push({
                        text: "View low stock items",
                        action: "view_low_stock"
                    });
                }
                suggestions.push({
                    text: "Check fast-moving items",
                    action: "view_fast_moving"
                });
                break;
            case 'SALES':
                suggestions.push({
                    text: "View detailed sales report",
                    action: "view_sales_report"
                });
                break;
        }

        return suggestions;
    }

    async analyzeQueryIntent(message) {
        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `Analyze the following query and return a JSON object with this exact structure:
                    {
                        "category": "INVENTORY" | "SALES" | "APPOINTMENTS" | "ORGANIZATION" | 
                                "DISCOUNTS" | "PURCHASE_ORDERS" | "SALES_ANALYSIS" | 
                                "FULFILLMENT_TRACKING" | "TAX_MANAGEMENT" | "USER_MANAGEMENT" | 
                                "WARRANTY_MANAGEMENT" | "GENERAL",
                        "metrics": string[],
                        "intent": string,
                        "context": {
                            "timeRange": string | null,
                            "specificItem": string | null,
                            "entityType": string | null
                        }
                    }
                    
                    Category Guidelines:
                    - INVENTORY: Stock levels, product queries
                    - SALES: Direct sales performance
                    - SALES_ANALYSIS: Detailed sales metrics and trends
                    - PURCHASE_ORDERS: Vendor orders and procurement
                    - WARRANTY_MANAGEMENT: Product warranties and claims
                    - USER_MANAGEMENT: Staff and user access
                    - TAX_MANAGEMENT: Tax rates and calculations
                    
                    For example, for "how many vendors do I have", return:
                    {
                        "category": "USER_MANAGEMENT",
                        "metrics": ["vendor_count", "vendor_status"],
                        "intent": "check_vendor_count",
                        "context": {
                            "timeRange": null,
                            "specificItem": null,
                            "entityType": "vendor"
                        }
                    }`
                },
                {
                    role: "user",
                    content: message
                }
            ],
            temperature: 0.3
        });

        return JSON.parse(completion.choices[0].message.content);
    }

    async gatherContextData(intent, username) {
        const category = this.analysisCategories[intent.category];
        if (!category) return null;

        const contextData = {
            metrics: {},
            alerts: [],
            recommendations: []
        };

        // Gather data for each relevant metric
        for (const metric of intent.metrics) {
            if (category.dataQueries[metric]) {
                contextData.metrics[metric] = await category.dataQueries[metric](this.db, username);
            }
        }

        return contextData;
    }

    // Add these methods to the ChatbotIntelligence class

async gatherSalesData(username, intent) {
    try {
        if (!username) {
            throw new Error('Username is required for sales data gathering');
        }

        const contextData = {
            metrics: {},
            insights: {},
            alerts: []
        };

        // Get user first to ensure we have a valid user_id
        const user = await db.User.findOne({
            where: { username: username }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Query sales orders with proper associations
        const salesOrders = await db.SalesOrder.findAll({
            where: { 
                user_id: user.user_id 
            },
            include: [
                {
                    model: db.SalesOrderInventory,
                    as: 'items',
                    include: [{
                        model: db.Product,
                        as: 'Product'
                    }]
                },
                {
                    model: db.Tax,
                    through: db.SalesOrderTax,
                    attributes: ['tax_rate', 'tax_name']
                },
                {
                    model: db.Discount,
                    through: db.SalesOrderDiscount,
                    attributes: ['discount_rate', 'discount_name']
                }
            ],
            order: [['order_date_time', 'DESC']]
        });

        // Process data based on requested metrics
        for (const metric of intent.metrics) {
            switch (metric) {
                case 'sales_performance':
                    contextData.metrics.performance = await this.calculateSalesPerformance(salesOrders);
                    break;
                case 'daily_sales':
                    contextData.metrics.dailySales = await this.calculateDailySales(salesOrders);
                    break;
            }
        }

        // Add sales insights
        contextData.insights = this.generateSalesInsights(salesOrders);
        
        // Add any alerts or recommendations
        contextData.alerts = this.generateSalesAlerts(salesOrders);
        contextData.recommendations = this.generateSalesRecommendations(salesOrders);

        return contextData;

    } catch (error) {
        console.error('Error gathering sales data:', error);
        throw new Error(`Failed to gather sales data: ${error.message}`);
    }
}

async calculateSalesPerformance(salesOrders) {
    // Calculate various performance metrics
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    const recentOrders = salesOrders.filter(order => 
        new Date(order.order_date_time) >= thirtyDaysAgo
    );

    return {
        totalOrders: salesOrders.length,
        recentOrders: recentOrders.length,
        averageOrderValue: this.calculateAverageOrderValue(salesOrders),
        topProducts: this.identifyTopProducts(salesOrders),
        revenue: {
            total: this.calculateTotalRevenue(salesOrders),
            monthly: this.calculateTotalRevenue(recentOrders)
        }
    };
}

calculateAverageOrderValue(orders) {
    if (!orders.length) return 0;
    const total = orders.reduce((sum, order) => sum + parseFloat(order.grand_total), 0);
    return parseFloat((total / orders.length).toFixed(2));
}

calculateTotalRevenue(orders) {
    return parseFloat(orders.reduce((sum, order) => 
        sum + parseFloat(order.grand_total), 0
    ).toFixed(2));
}

identifyTopProducts(orders) {
    // Create a map to track product sales
    const productSales = new Map();

    orders.forEach(order => {
        order.items.forEach(item => {
            const productId = item.product_id;
            const currentSales = productSales.get(productId) || {
                productName: item.Product.product_name,
                totalQuantity: 0,
                totalRevenue: 0
            };

            currentSales.totalQuantity += item.quantity;
            currentSales.totalRevenue += item.price * item.quantity;
            productSales.set(productId, currentSales);
        });
    });

    // Convert to array and sort by revenue
    return Array.from(productSales.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5); // Top 5 products
}

generateSalesInsights(orders) {
    return {
        trends: this.analyzeSalesTrends(orders),
        performance: {
            dailyAverage: this.calculateDailyAverageSales(orders),
            growthRate: this.calculateGrowthRate(orders)
        },
        customerBehavior: this.analyzeCustomerBehavior(orders)
    };
}

analyzeSalesTrends(orders) {
    try {
        const today = new Date();
        const periods = {
            daily: 1,
            weekly: 7,
            monthly: 30
        };

        // Create analysis for different time periods
        const trends = {};
        
        for (const [period, days] of Object.entries(periods)) {
            const cutoffDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
            const periodOrders = orders.filter(order => 
                new Date(order.order_date_time) >= cutoffDate
            );

            trends[period] = {
                orderCount: periodOrders.length,
                revenue: this.calculateTotalRevenue(periodOrders),
                averageOrderValue: this.calculateAverageOrderValue(periodOrders),
                productMix: this.analyzeProductMix(periodOrders)
            };
        }

        // Calculate growth rates comparing periods
        trends.growth = {
            daily: this.calculatePeriodGrowth(orders, 1),
            weekly: this.calculatePeriodGrowth(orders, 7),
            monthly: this.calculatePeriodGrowth(orders, 30)
        };

        return trends;
    } catch (error) {
        console.error('Error analyzing sales trends:', error);
        return {
            daily: { orderCount: 0, revenue: 0 },
            weekly: { orderCount: 0, revenue: 0 },
            monthly: { orderCount: 0, revenue: 0 },
            growth: { daily: 0, weekly: 0, monthly: 0 }
        };
    }
}

calculatePeriodGrowth(orders, days) {
    const today = new Date();
    const periodEnd = today.getTime();
    const periodStart = periodEnd - (days * 24 * 60 * 60 * 1000);
    const previousStart = periodStart - (days * 24 * 60 * 60 * 1000);

    // Current period orders
    const currentPeriodOrders = orders.filter(order => {
        const orderDate = new Date(order.order_date_time).getTime();
        return orderDate >= periodStart && orderDate < periodEnd;
    });

    // Previous period orders
    const previousPeriodOrders = orders.filter(order => {
        const orderDate = new Date(order.order_date_time).getTime();
        return orderDate >= previousStart && orderDate < periodStart;
    });

    const currentRevenue = this.calculateTotalRevenue(currentPeriodOrders);
    const previousRevenue = this.calculateTotalRevenue(previousPeriodOrders);

    // Calculate growth rate
    if (previousRevenue === 0) return 0;
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
}

calculateDailyAverageSales(orders) {
    if (!orders.length) return 0;

    const dateRange = this.calculateDateRange(orders);
    const totalDays = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24)) || 1;
    const totalRevenue = this.calculateTotalRevenue(orders);

    return parseFloat((totalRevenue / totalDays).toFixed(2));
}

calculateDateRange(orders) {
    if (!orders.length) {
        return { start: new Date(), end: new Date() };
    }

    const dates = orders.map(order => new Date(order.order_date_time).getTime());
    return {
        start: new Date(Math.min(...dates)),
        end: new Date(Math.max(...dates))
    };
}

calculateGrowthRate(orders) {
    // Calculate month-over-month growth rate
    const thisMonth = this.filterOrdersByPeriod(orders, 30);
    const lastMonth = this.filterOrdersByPeriod(orders, 60, 30);

    const thisMonthRevenue = this.calculateTotalRevenue(thisMonth);
    const lastMonthRevenue = this.calculateTotalRevenue(lastMonth);

    if (lastMonthRevenue === 0) return 0;
    return parseFloat(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(2));
}

filterOrdersByPeriod(orders, daysAgo, endDaysAgo = 0) {
    const now = new Date();
    const start = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    const end = new Date(now.getTime() - (endDaysAgo * 24 * 60 * 60 * 1000));

    return orders.filter(order => {
        const orderDate = new Date(order.order_date_time);
        return orderDate >= start && orderDate <= end;
    });
}

analyzeProductMix(orders) {
    // Create a map to aggregate product sales
    const productSales = new Map();

    orders.forEach(order => {
        order.items.forEach(item => {
            const productId = item.product_id;
            const currentStats = productSales.get(productId) || {
                name: item.Product.product_name,
                quantity: 0,
                revenue: 0,
                occurrences: 0
            };

            currentStats.quantity += item.quantity;
            currentStats.revenue += item.price * item.quantity;
            currentStats.occurrences++;

            productSales.set(productId, currentStats);
        });
    });

    return Array.from(productSales.values())
        .map(stats => ({
            ...stats,
            averageOrderSize: stats.quantity / stats.occurrences
        }))
        .sort((a, b) => b.revenue - a.revenue);
}

analyzeCustomerBehavior(orders) {
    if (!orders.length) {
        return {
            averageOrderFrequency: 0,
            repeatPurchaseRate: 0,
            orderSizeDistribution: {
                small: 0,
                medium: 0,
                large: 0
            }
        };
    }

    // Group orders by customer
    const customerOrders = new Map();
    orders.forEach(order => {
        const customerId = order.customer_id;
        const customerOrderList = customerOrders.get(customerId) || [];
        customerOrderList.push(order);
        customerOrders.set(customerId, customerOrderList);
    });

    // Calculate metrics
    const totalCustomers = customerOrders.size;
    const repeatCustomers = Array.from(customerOrders.values())
        .filter(customerOrderList => customerOrderList.length > 1).length;

    return {
        averageOrderFrequency: orders.length / totalCustomers,
        repeatPurchaseRate: (repeatCustomers / totalCustomers) * 100,
        orderSizeDistribution: this.calculateOrderSizeDistribution(orders)
    };
}

calculateOrderSizeDistribution(orders) {
    // Calculate quartiles for order values
    const orderValues = orders.map(order => order.grand_total).sort((a, b) => a - b);
    const q1 = orderValues[Math.floor(orderValues.length * 0.25)];
    const q3 = orderValues[Math.floor(orderValues.length * 0.75)];

    // Categorize orders by size
    const distribution = {
        small: 0,
        medium: 0,
        large: 0
    };

    orders.forEach(order => {
        if (order.grand_total <= q1) distribution.small++;
        else if (order.grand_total <= q3) distribution.medium++;
        else distribution.large++;
    });

    // Convert to percentages
    const total = orders.length;
    return {
        small: (distribution.small / total) * 100,
        medium: (distribution.medium / total) * 100,
        large: (distribution.large / total) * 100
    };
}

async calculateDailySales(orders) {
    try {
        // Get today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day

        // Filter orders for today
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.order_date_time);
            return orderDate >= today;
        });

        // Calculate daily metrics
        const dailyMetrics = {
            orderCount: todayOrders.length,
            totalRevenue: this.calculateTotalRevenue(todayOrders),
            itemsSold: 0,
            averageOrderValue: 0,
            productBreakdown: new Map()
        };

        // Process each order's items
        todayOrders.forEach(order => {
            // Process items in the order
            order.items.forEach(item => {
                // Count total items sold
                dailyMetrics.itemsSold += item.quantity;

                // Track sales by product
                const productKey = item.Product?.product_name || 'Unknown Product';
                const currentProduct = dailyMetrics.productBreakdown.get(productKey) || {
                    quantity: 0,
                    revenue: 0,
                    orderCount: 0
                };

                currentProduct.quantity += item.quantity;
                currentProduct.revenue += (item.price * item.quantity);
                currentProduct.orderCount++;

                dailyMetrics.productBreakdown.set(productKey, currentProduct);
            });
        });

        // Calculate average order value
        dailyMetrics.averageOrderValue = dailyMetrics.orderCount > 0 
            ? dailyMetrics.totalRevenue / dailyMetrics.orderCount 
            : 0;

        // Format product breakdown for response
        dailyMetrics.products = Array.from(dailyMetrics.productBreakdown.entries())
            .map(([name, stats]) => ({
                name,
                quantity: stats.quantity,
                revenue: parseFloat(stats.revenue.toFixed(2)),
                averagePerOrder: parseFloat((stats.revenue / stats.orderCount).toFixed(2))
            }))
            .sort((a, b) => b.revenue - a.revenue); // Sort by revenue

        // Add comparison to average
        const averageDailySales = await this.getAverageDailySales(orders);
        dailyMetrics.comparison = {
            vsAverage: parseFloat(((dailyMetrics.totalRevenue - averageDailySales) / averageDailySales * 100).toFixed(2)),
            averageDailySales
        };

        return dailyMetrics;

    } catch (error) {
        console.error('Error calculating daily sales:', error);
        throw new Error('Failed to calculate daily sales metrics');
    }
}

// Helper method to calculate average daily sales
async getAverageDailySales(orders) {
    if (!orders.length) return 0;

    // Get date range of orders
    const dates = orders.map(order => new Date(order.order_date_time).getTime());
    const earliestDate = new Date(Math.min(...dates));
    const latestDate = new Date(Math.max(...dates));

    // Calculate number of days
    const daysDifference = Math.max(
        1,
        Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24))
    );

    // Calculate total revenue
    const totalRevenue = this.calculateTotalRevenue(orders);

    // Return average daily revenue
    return parseFloat((totalRevenue / daysDifference).toFixed(2));
}

async generateSalesRecommendations(orders) {
    try {
        // Create recommendations array to store our suggestions
        const recommendations = [];

        // First, let's analyze recent sales patterns
        const recentOrders = this.filterOrdersByPeriod(orders, 7);
        const historicalOrders = this.filterOrdersByPeriod(orders, 30, 7);
        
        // Calculate key metrics for analysis
        const recentMetrics = {
            dailyRevenue: this.calculateTotalRevenue(recentOrders) / 7,
            orderFrequency: recentOrders.length / 7,
            averageOrderValue: this.calculateAverageOrderValue(recentOrders)
        };

        const historicalMetrics = {
            dailyRevenue: this.calculateTotalRevenue(historicalOrders) / 23,
            orderFrequency: historicalOrders.length / 23,
            averageOrderValue: this.calculateAverageOrderValue(historicalOrders)
        };

        // Analyze product performance trends
        const productTrends = await this.analyzeProductTrends(orders);
        
        // Generate revenue-based recommendations
        if (recentMetrics.dailyRevenue < historicalMetrics.dailyRevenue) {
            const revenueDrop = ((historicalMetrics.dailyRevenue - recentMetrics.dailyRevenue) 
                / historicalMetrics.dailyRevenue * 100).toFixed(1);
            
            recommendations.push({
                type: 'revenue_improvement',
                priority: 'high',
                suggestion: `Consider promotional strategies to address ${revenueDrop}% revenue decline`,
                details: {
                    currentRevenue: recentMetrics.dailyRevenue,
                    historicalRevenue: historicalMetrics.dailyRevenue,
                    percentageChange: -parseFloat(revenueDrop)
                }
            });
        }

        // Generate order frequency recommendations
        if (recentMetrics.orderFrequency < historicalMetrics.orderFrequency) {
            recommendations.push({
                type: 'order_frequency',
                priority: 'medium',
                suggestion: 'Consider customer engagement initiatives to increase order frequency',
                details: {
                    currentFrequency: recentMetrics.orderFrequency,
                    historicalFrequency: historicalMetrics.orderFrequency,
                    percentageChange: ((recentMetrics.orderFrequency - historicalMetrics.orderFrequency) 
                        / historicalMetrics.orderFrequency * 100).toFixed(1)
                }
            });
        }

        // Product-specific recommendations
        productTrends.forEach(trend => {
            // Identify declining products
            if (trend.salesChange < -20) {
                recommendations.push({
                    type: 'product_performance',
                    priority: 'medium',
                    suggestion: `Review pricing and promotion strategy for ${trend.productName}`,
                    details: {
                        product: trend.productName,
                        salesChange: trend.salesChange,
                        currentSales: trend.currentPeriodSales,
                        historicalSales: trend.previousPeriodSales
                    }
                });
            }
            
            // Identify high-performing products
            if (trend.salesChange > 20) {
                recommendations.push({
                    type: 'inventory_optimization',
                    priority: 'medium',
                    suggestion: `Consider increasing stock levels for high-performing ${trend.productName}`,
                    details: {
                        product: trend.productName,
                        salesChange: trend.salesChange,
                        currentSales: trend.currentPeriodSales
                    }
                });
            }
        });

        // Average order value recommendations
        const orderValueChange = ((recentMetrics.averageOrderValue - historicalMetrics.averageOrderValue) 
            / historicalMetrics.averageOrderValue * 100);
            
        if (orderValueChange < -10) {
            recommendations.push({
                type: 'order_value',
                priority: 'medium',
                suggestion: 'Consider bundle offers or upselling strategies to increase average order value',
                details: {
                    currentValue: recentMetrics.averageOrderValue,
                    historicalValue: historicalMetrics.averageOrderValue,
                    percentageChange: orderValueChange.toFixed(1)
                }
            });
        }

        // Sort recommendations by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return recommendations.sort((a, b) => 
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );

    } catch (error) {
        console.error('Error generating sales recommendations:', error);
        return [{
            type: 'error',
            priority: 'high',
            suggestion: 'Unable to generate sales recommendations due to a system error',
            details: {
                error: error.message
            }
        }];
    }
}

async analyzeProductTrends(orders) {
    const productTrends = [];
    const productMap = new Map();

    // Group orders by product and period
    orders.forEach(order => {
        const orderDate = new Date(order.order_date_time);
        const isRecent = orderDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        order.items.forEach(item => {
            const productId = item.product_id;
            if (!productMap.has(productId)) {
                productMap.set(productId, {
                    productName: item.Product.product_name,
                    recentSales: 0,
                    historicalSales: 0
                });
            }

            const productData = productMap.get(productId);
            if (isRecent) {
                productData.recentSales += item.quantity;
            } else {
                productData.historicalSales += item.quantity;
            }
        });
    });

    // Calculate trends for each product
    productMap.forEach((data, productId) => {
        const recentDailySales = data.recentSales / 7;
        const historicalDailySales = data.historicalSales / 23;
        const salesChange = historicalDailySales === 0 ? 100 :
            ((recentDailySales - historicalDailySales) / historicalDailySales) * 100;

        productTrends.push({
            productId,
            productName: data.productName,
            salesChange,
            currentPeriodSales: data.recentSales,
            previousPeriodSales: data.historicalSales
        });
    });

    return productTrends;
}

async generateSalesAlerts(orders) {
    try {
        const alerts = [];
        
        // Get baseline metrics for comparison
        const recentOrders = this.filterOrdersByPeriod(orders, 7);
        const historicalOrders = this.filterOrdersByPeriod(orders, 30, 7);

        const recentMetrics = {
            dailyRevenue: this.calculateTotalRevenue(recentOrders) / 7,
            dailyOrders: recentOrders.length / 7,
            averageOrderValue: this.calculateAverageOrderValue(recentOrders)
        };

        const historicalMetrics = {
            dailyRevenue: this.calculateTotalRevenue(historicalOrders) / 23,
            dailyOrders: historicalOrders.length / 23,
            averageOrderValue: this.calculateAverageOrderValue(historicalOrders)
        };

        // Check revenue changes
        const revenueChange = ((recentMetrics.dailyRevenue - historicalMetrics.dailyRevenue) 
            / historicalMetrics.dailyRevenue) * 100;

        if (Math.abs(revenueChange) > 20) {
            alerts.push({
                type: revenueChange > 0 ? 'positive' : 'warning',
                category: 'revenue',
                severity: 'high',
                message: `Daily revenue has ${revenueChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueChange).toFixed(1)}% compared to historical average`,
                metrics: {
                    current: recentMetrics.dailyRevenue,
                    historical: historicalMetrics.dailyRevenue,
                    change: revenueChange
                }
            });
        }

        // Check order volume changes
        const orderVolumeChange = ((recentMetrics.dailyOrders - historicalMetrics.dailyOrders) 
            / historicalMetrics.dailyOrders) * 100;

        if (Math.abs(orderVolumeChange) > 15) {
            alerts.push({
                type: orderVolumeChange > 0 ? 'positive' : 'warning',
                category: 'order_volume',
                severity: 'medium',
                message: `Order volume has ${orderVolumeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(orderVolumeChange).toFixed(1)}% compared to historical average`,
                metrics: {
                    current: recentMetrics.dailyOrders,
                    historical: historicalMetrics.dailyOrders,
                    change: orderVolumeChange
                }
            });
        }

        // Analyze product-specific trends
        const productTrends = await this.analyzeProductTrends(orders);
        
        productTrends.forEach(trend => {
            if (Math.abs(trend.salesChange) > 25) {
                alerts.push({
                    type: trend.salesChange > 0 ? 'positive' : 'warning',
                    category: 'product_performance',
                    severity: 'medium',
                    message: `Sales for ${trend.productName} have ${trend.salesChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(trend.salesChange).toFixed(1)}%`,
                    metrics: {
                        product: trend.productName,
                        change: trend.salesChange,
                        currentPeriodSales: trend.currentPeriodSales,
                        previousPeriodSales: trend.previousPeriodSales
                    }
                });
            }
        });

        // Check unusual order values
        const orderValueChange = ((recentMetrics.averageOrderValue - historicalMetrics.averageOrderValue)
            / historicalMetrics.averageOrderValue) * 100;

        if (Math.abs(orderValueChange) > 15) {
            alerts.push({
                type: orderValueChange > 0 ? 'positive' : 'warning',
                category: 'order_value',
                severity: 'medium',
                message: `Average order value has ${orderValueChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(orderValueChange).toFixed(1)}%`,
                metrics: {
                    current: recentMetrics.averageOrderValue,
                    historical: historicalMetrics.averageOrderValue,
                    change: orderValueChange
                }
            });
        }

        // Sort alerts by severity and type
        return alerts.sort((a, b) => {
            if (a.severity === b.severity) {
                return a.type === 'warning' ? -1 : 1;
            }
            return a.severity === 'high' ? -1 : 1;
        });

    } catch (error) {
        console.error('Error generating sales alerts:', error);
        return [{
            type: 'error',
            category: 'system',
            severity: 'high',
            message: 'Unable to generate sales alerts due to a system error',
            error: error.message
        }];
    }
}

    generatePurchaseOrderResponse(poAnalysis) {
        // Generate AI-enhanced insights
        const enhancedInsights = this.generateEnhancedInsights(poAnalysis);
        
        // Use the chatBotService to generate the base response with our enhanced insights
        return this.chatBotService.generatePurchaseOrderResponse(poAnalysis, {
            enhancedAnalysis: enhancedInsights
        });
    }

async gatherPurchaseOrderData(username, intent) {
    try {
        if (!username) {
            throw new Error('Username is required for purchase order data gathering');
        }

        // First get the user to ensure authorization
        const user = await db.User.findOne({
            where: { username: username }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Query purchase orders with necessary associations for analyzing vendor orders
        const purchaseOrders = await db.PurchaseOrder.findAll({
            where: { user_id: user.user_id },
            include: [
                {
                    model: db.PurchaseOrderItem,
                    as: 'PurchaseOrderItems',
                    include: [{
                        model: db.Product,
                        as: 'Product',
                        include: [{
                            model: db.ProductUnit,
                            required: false
                        }]
                    }]
                },
                {
                    model: db.Vendor,
                    attributes: ['vendor_id', 'vendor_name']
                }
            ],
            order: [['order_date', 'DESC']]
        });

        // Structure the response to focus on order tracking and fulfillment
        const contextData = {
            metrics: {
                // Track orders by status
                pendingOrders: this.calculatePendingOrderMetrics(purchaseOrders),
                orderFulfillment: this.calculateOrderFulfillment(purchaseOrders)
            },
            insights: {
                // Track vendor order history and delivery performance
                vendorPerformance: this.analyzeVendorPerformance(purchaseOrders),
                recentDeliveries: this.getRecentDeliveries(purchaseOrders)
            }
        };

        return contextData;

    } catch (error) {
        console.error('Error gathering purchase order data:', error);
        throw new Error(`Failed to gather purchase order data: ${error.message}`);
    }
}

getExpectedDeliveries(orders) {
    // This function processes in-transit orders to provide delivery expectations
    return orders.map(order => {
        // Calculate expected delivery date based on order date
        // If no specific delivery date is set, estimate based on standard delivery time
        const orderDate = new Date(order.order_date);
        const expectedDeliveryDate = order.delivered_date 
            ? new Date(order.delivered_date)
            : new Date(orderDate.setDate(orderDate.getDate() + 7)); // Default to 7 days delivery time

        return {
            orderId: order.purchase_order_id,
            vendorName: order.Vendor?.vendor_name || 'Unknown Vendor',
            orderDate: order.order_date,
            expectedDeliveryDate: expectedDeliveryDate,
            items: order.PurchaseOrderItems?.map(item => ({
                productName: item.Product?.product_name || 'Unknown Product',
                quantity: item.quantity,
                unregisteredQuantity: item.unregistered_quantity || item.quantity,
                status: this.determineDeliveryStatus(expectedDeliveryDate)
            })) || [],
            deliveryMethod: order.delivery_method || 'Standard Delivery',
            status: this.determineDeliveryStatus(expectedDeliveryDate)
        };
    });
}

// Helper method to determine delivery status
determineDeliveryStatus(expectedDate) {
    const now = new Date();
    const expected = new Date(expectedDate);
    const daysDifference = Math.ceil((expected - now) / (1000 * 60 * 60 * 24));

    if (daysDifference < 0) {
        return {
            status: 'delayed',
            daysDelayed: Math.abs(daysDifference)
        };
    } else if (daysDifference === 0) {
        return {
            status: 'arriving_today'
        };
    } else {
        return {
            status: 'on_time',
            daysRemaining: daysDifference
        };
    }
}

calculatePendingOrderMetrics(purchaseOrders) {
    // Calculate metrics for orders that haven't been fulfilled yet
    const pendingOrders = purchaseOrders.filter(po => po.status_id === 1);
    const inTransitOrders = purchaseOrders.filter(po => po.status_id === 2);
    
    return {
        pending: {
            count: pendingOrders.length,
            value: pendingOrders.reduce((sum, po) => sum + parseFloat(po.grand_total), 0),
            expectedItems: this.calculateExpectedItems(pendingOrders)
        },
        inTransit: {
            count: inTransitOrders.length,
            value: inTransitOrders.reduce((sum, po) => sum + parseFloat(po.grand_total), 0),
            expectedDeliveries: this.getExpectedDeliveries(inTransitOrders)
        }
    };
}

calculateExpectedItems(orders) {
    // Track what items are on order from vendors
    const expectedItems = new Map();
    
    orders.forEach(order => {
        order.PurchaseOrderItems.forEach(item => {
            const productId = item.product_id;
            const currentExpected = expectedItems.get(productId) || {
                productName: item.Product.product_name,
                sku: item.Product.sku_number,
                totalQuantity: 0,
                orderDetails: []
            };
            
            currentExpected.totalQuantity += item.quantity;
            currentExpected.orderDetails.push({
                orderDate: order.order_date,
                quantity: item.quantity,
                expectedDelivery: order.delivered_date
            });
            
            expectedItems.set(productId, currentExpected);
        });
    });
    
    return Array.from(expectedItems.values());
}

calculateOrderFulfillment(purchaseOrders) {
    // Track delivery and fulfillment performance
    return {
        totalOrders: purchaseOrders.length,
        delivered: purchaseOrders.filter(po => po.delivered_date).length,
        averageFulfillmentDays: this.calculateAverageFulfillmentTime(purchaseOrders)
    };
}

analyzeVendorPerformance(purchaseOrders) {
    // Initialize a Map to track statistics for each vendor
    const vendorStats = new Map();
    
    purchaseOrders.forEach(po => {
        // Add null checking when accessing vendor data
        const vendorId = po.vendor_id;
        const vendorName = po.Vendor ? po.Vendor.vendor_name : 'Unknown Vendor';
        
        // Get or initialize vendor statistics
        const stats = vendorStats.get(vendorId) || {
            vendorName: vendorName,
            orderCount: 0,
            deliveredOrders: 0,
            totalValue: 0,
            averageDeliveryDays: 0,
            onTimeDeliveries: 0
        };
        
        // Update order statistics
        stats.orderCount++;
        stats.totalValue += parseFloat(po.grand_total || 0);
        
        // Calculate delivery performance if applicable
        if (po.delivered_date && po.order_date) {
            stats.deliveredOrders++;
            
            // Calculate delivery time in days
            const deliveryDays = Math.ceil(
                (new Date(po.delivered_date) - new Date(po.order_date)) / 
                (1000 * 60 * 60 * 24)
            );
            
            // Update average delivery days using a rolling average
            stats.averageDeliveryDays = 
                (stats.averageDeliveryDays * (stats.deliveredOrders - 1) + deliveryDays) / 
                stats.deliveredOrders;
            
            // Check if delivery was on time (assuming 7-day standard delivery)
            if (deliveryDays <= 7) {
                stats.onTimeDeliveries++;
            }
        }
        
        // Update the stats in the Map
        vendorStats.set(vendorId, stats);
    });
    
    return Array.from(vendorStats.values())
        .map(stats => ({
            ...stats,
            deliveryRate: stats.deliveredOrders > 0 ? 
                (stats.onTimeDeliveries / stats.deliveredOrders * 100).toFixed(1) + '%' : 'N/A',
            averageOrderValue: stats.orderCount > 0 ? 
                (stats.totalValue / stats.orderCount).toFixed(2) : '0.00',
            averageDeliveryTime: stats.deliveredOrders > 0 ? 
                Math.ceil(stats.averageDeliveryDays) : 'N/A'
        }));
}

getRecentDeliveries(purchaseOrders) {
    // Get the 5 most recent delivered orders
    return purchaseOrders
        .filter(po => po.delivered_date)
        .sort((a, b) => new Date(b.delivered_date) - new Date(a.delivered_date))
        .slice(0, 5)
        .map(po => ({
            orderId: po.purchase_order_id,
            // Add null checking when accessing vendor name
            vendorName: po.Vendor?.vendor_name || 'Unknown Vendor', 
            orderDate: po.order_date,
            deliveryDate: po.delivered_date,
            total: parseFloat(po.grand_total),
            itemCount: po.PurchaseOrderItems?.length || 0 
        }));
}

calculateAverageFulfillmentTime(purchaseOrders) {
    // Calculate average time from order to delivery
    const deliveredOrders = purchaseOrders.filter(po => po.delivered_date);
    if (!deliveredOrders.length) return 0;
    
    const totalDays = deliveredOrders.reduce((sum, po) => {
        const days = Math.ceil(
            (new Date(po.delivered_date) - new Date(po.order_date)) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
    }, 0);
    
    return Math.ceil(totalDays / deliveredOrders.length);
}

    generateEnhancedInsights(poAnalysis) {
        try {
            let insights = '';
            
            // Analyze purchase patterns
            if (poAnalysis.existingProducts.length > 0) {
                const priceChanges = poAnalysis.existingProducts.filter(p => p.priceChanged);
                if (priceChanges.length > 0) {
                    insights += "📊 Price Trend Analysis:\n";
                    insights += `• ${priceChanges.length} products have price changes\n`;
                    const avgChange = priceChanges.reduce((acc, p) => 
                        acc + ((p.newPrice - p.product.price) / p.product.price) * 100, 0
                    ) / priceChanges.length;
                    insights += `• Average price change: ${avgChange.toFixed(1)}%\n\n`;
                }
            }

            // Stock optimization suggestions
            if (poAnalysis.newProducts.length > 0) {
                insights += "📈 Stock Optimization Suggestions:\n";
                poAnalysis.newProducts.forEach(product => {
                    const recommendedStock = Math.ceil(product.initialStock * 1.2); // 20% buffer
                    insights += `• Consider stocking ${recommendedStock} units of ${product.productName} `;
                    insights += `to maintain optimal inventory levels\n`;
                });
                insights += "\n";
            }

            // Financial efficiency analysis
            const fin = poAnalysis.financialValidation;
            if (fin.calculations) {
                insights += "💡 Financial Efficiency Analysis:\n";
                const profitMargin = ((fin.calculations.calculatedTotal - fin.calculations.calculatedSubtotal) / 
                    fin.calculations.calculatedSubtotal * 100).toFixed(1);
                insights += `• Current profit margin: ${profitMargin}%\n`;
                
                if (fin.calculations.calculatedSubtotal > 10000) {
                    insights += "• Order qualifies for bulk purchase discounts\n";
                }
            }

            return insights;

        } catch (error) {
            console.error('Error generating enhanced insights:', error);
            return 'Unable to generate enhanced insights at this time.';
        }
    }

    calculateFinancials(extractedItems) {
            try {
                const calculations = {
                    subtotal: 0,
                    tax: 0,
                    shipping: 0,
                    total: 0,
                    itemBreakdown: [],
                    warnings: []
                };

                // Process each item
                extractedItems.forEach(item => {
                    const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
                    
                    // Validate item calculations
                    if (isNaN(itemTotal)) {
                        calculations.warnings.push({
                            item: item.productName || 'Unknown item',
                            message: 'Invalid price or quantity'
                        });
                        return;
                    }

                    calculations.itemBreakdown.push({
                        name: item.productName,
                        quantity: item.quantity,
                        price: item.price,
                        total: itemTotal
                    });

                    calculations.subtotal += itemTotal;
                });

                // Calculate tax (assuming 6% standard rate)
                calculations.tax = calculations.subtotal * 0.06;

                // Add standard shipping
                calculations.shipping = calculations.subtotal > 1000 ? 0 : 500.00;

                // Calculate final total
                calculations.total = calculations.subtotal + calculations.tax + calculations.shipping;

                // Validate final calculations
                if (isNaN(calculations.total)) {
                    throw new Error('Invalid total calculation');
                }

                return {
                    calculations,
                    isValid: calculations.warnings.length === 0,
                    warnings: calculations.warnings
                };
            } catch (error) {
                console.error('Financial calculation error:', error);
                return {
                    calculations: null,
                    isValid: false,
                    warnings: [{
                        message: 'Failed to calculate financials',
                        error: error.message
                    }]
                };
            }
    }

    async gatherUserData(username) {
        try {
            // First get the user
            const user = await db.User.findOne({
                where: { username },
                include: [{
                    model: db.Customer,
                    required: false
                }]
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Gather user's customer data with properly structured includes
            const customers = await db.Customer.findAll({
                where: { user_id: user.user_id },
                include: [
                    {
                        model: db.SalesOrder,
                        required: false,
                        attributes: [
                            'sales_order_id',
                            'order_date_time',
                            'grand_total',
                            'status_id'
                        ]
                    },
                    {
                        model: db.WarrantyClaim,
                        as: 'claims',  // This matches the association name in your models
                        required: false,
                        attributes: [
                            'claim_id',
                            'warranty_id',
                            'date_of_claim',
                            'claim_status',
                            'priority'
                        ],
                        include: [{
                            model: db.Warranty,
                            as: 'warranty',
                            attributes: ['warranty_id', 'warranty_type', 'duration']
                        }]
                    }
                ]
            });

            // Structure the response data
            return {
                metrics: {
                    totalCustomers: customers.length,
                    activeCustomers: customers.filter(c => 
                        c.SalesOrders && c.SalesOrders.length > 0
                    ).length,
                    newCustomers: customers.filter(c => {
                        const createdAt = new Date(c.created_at);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return createdAt >= thirtyDaysAgo;
                    }).length
                },
                insights: {
                    customerSegments: this.analyzeCustomerSegments(customers),
                    recentActivity: this.getRecentCustomerActivity(customers),
                    warrantyClaimMetrics: this.analyzeWarrantyClaims(customers)
                }
            };
        } catch (error) {
            console.error('Error gathering user data:', error);
            throw new Error(`Failed to gather user data: ${error.message}`);
        }
    }

    // Add these helper methods as well
    analyzeCustomerSegments(customers) {
        return {
            byCompany: this.groupCustomersByCompany(customers),
            byActivity: this.groupCustomersByActivity(customers)
        };
    }

    groupCustomersByCompany(customers) {
        const companyGroups = customers.reduce((groups, customer) => {
            const company = customer.customer_company || 'Unspecified';
            if (!groups[company]) {
                groups[company] = 0;
            }
            groups[company]++;
            return groups;
        }, {});

        return Object.entries(companyGroups)
            .map(([company, count]) => ({
                company,
                customerCount: count,
                percentage: (count / customers.length * 100).toFixed(1)
            }))
            .sort((a, b) => b.customerCount - a.customerCount);
    }

    groupCustomersByActivity(customers) {
        return {
            active: customers.filter(c => 
                c.SalesOrders && c.SalesOrders.length > 0
            ).length,
            inactive: customers.filter(c => 
                !c.SalesOrders || c.SalesOrders.length === 0
            ).length
        };
    }

    getRecentCustomerActivity(customers) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return customers
            .filter(customer => customer.SalesOrders && customer.SalesOrders.length > 0)
            .map(customer => ({
                customerId: customer.customer_id,
                name: customer.customer_name,
                company: customer.customer_company,
                recentOrders: customer.SalesOrders.filter(order => 
                    new Date(order.created_at) >= thirtyDaysAgo
                ).length,
                totalOrders: customer.SalesOrders.length,
                hasWarrantyClaims: customer.claims && customer.claims.length > 0
            }))
            .sort((a, b) => b.recentOrders - a.recentOrders)
            .slice(0, 5);  // Get top 5 most active customers
    }

    async gatherSalesAnalysisData(username, intent) {
    try {
        if (!username) {
            throw new Error('Username is required for sales analysis');
        }

        // First get the user to ensure authorization
        const user = await db.User.findOne({
            where: { username }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Fetch sales orders with related data
        const salesOrders = await db.SalesOrder.findAll({
            where: { user_id: user.user_id },
            include: [{
                model: db.SalesOrderInventory,
                as: 'items',
                include: [{
                    model: db.Product,
                    as: 'Product',
                    attributes: ['product_id', 'product_name', 'sku_number', 'price']
                }]
            }],
            attributes: [
                'sales_order_id',
                'order_date_time',
                'subtotal',
                'grand_total',
                'total_tax',
                'discount_amount',
                'status_id'
            ],
            order: [['order_date_time', 'DESC']]
        });

        // Calculate various metrics for analysis
        const analysisData = {
            metrics: {
                totalOrders: salesOrders.length,
                totalRevenue: this.calculateTotalRevenue(salesOrders),
                averageOrderValue: this.calculateAverageOrderValue(salesOrders),
                // Calculate period-specific metrics
                periods: {
                    daily: this.calculatePeriodMetrics(salesOrders, 1),
                    weekly: this.calculatePeriodMetrics(salesOrders, 7),
                    monthly: this.calculatePeriodMetrics(salesOrders, 30)
                }
            },
            insights: {
                // Analyze sales trends
                trends: this.analyzeSalesTrends(salesOrders),
                // Analyze product performance
                productPerformance: this.analyzeProductPerformance(salesOrders),
                // Calculate revenue distribution
                revenueDistribution: this.analyzeRevenueDistribution(salesOrders)
            },
            alerts: this.generateSalesAlerts(salesOrders)
        };

        return analysisData;

    } catch (error) {
        console.error('Error gathering sales analysis data:', error);
        throw new Error(`Failed to gather sales analysis data: ${error.message}`);
    }
}

// Helper methods for sales analysis
calculateTotalRevenue(orders) {
    return orders.reduce((sum, order) => sum + Number(order.grand_total), 0).toFixed(2);
}

calculateAverageOrderValue(orders) {
    if (!orders.length) return 0;
    return (orders.reduce((sum, order) => sum + Number(order.grand_total), 0) / orders.length).toFixed(2);
}

calculatePeriodMetrics(orders, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const periodOrders = orders.filter(order => 
        new Date(order.order_date_time) >= cutoffDate
    );

    return {
        orderCount: periodOrders.length,
        revenue: this.calculateTotalRevenue(periodOrders),
        averageOrderValue: this.calculateAverageOrderValue(periodOrders),
        itemsSold: periodOrders.reduce((sum, order) => 
            sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        )
    };
}

analyzeSalesTrends(orders) {
    // Calculate daily sales for trend analysis
    const dailySales = new Map();
    orders.forEach(order => {
        const date = new Date(order.order_date_time).toISOString().split('T')[0];
        dailySales.set(date, (dailySales.get(date) || 0) + Number(order.grand_total));
    });

    return {
        dailyRevenue: Array.from(dailySales.entries()).map(([date, revenue]) => ({
            date,
            revenue: revenue.toFixed(2)
        })),
        growthRate: this.calculateGrowthRate(orders)
    };
}

analyzeProductPerformance(orders) {
    const productSales = new Map();

    // Aggregate sales by product
    orders.forEach(order => {
        order.items.forEach(item => {
            const productId = item.Product.product_id;
            const currentStats = productSales.get(productId) || {
                productName: item.Product.product_name,
                sku: item.Product.sku_number,
                totalQuantity: 0,
                totalRevenue: 0,
                orderCount: 0
            };

            currentStats.totalQuantity += item.quantity;
            currentStats.totalRevenue += item.quantity * item.price;
            currentStats.orderCount++;
            productSales.set(productId, currentStats);
        });
    });

    return Array.from(productSales.values())
        .map(stats => ({
            ...stats,
            averageOrderSize: stats.totalQuantity / stats.orderCount,
            totalRevenue: stats.totalRevenue.toFixed(2)
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

analyzeRevenueDistribution(orders) {
    const total = orders.reduce((sum, order) => sum + Number(order.grand_total), 0);
    
    // Distribution by payment terms
    const paymentTerms = new Map();
    orders.forEach(order => {
        const terms = order.payment_terms || 'Not specified';
        paymentTerms.set(terms, (paymentTerms.get(terms) || 0) + Number(order.grand_total));
    });

    return {
        byPaymentTerms: Array.from(paymentTerms.entries()).map(([terms, revenue]) => ({
            terms,
            revenue: revenue.toFixed(2),
            percentage: ((revenue / total) * 100).toFixed(1)
        }))
    };
}

generateSalesAlerts(orders) {
    const alerts = [];
    const recentOrders = this.calculatePeriodMetrics(orders, 7);
    const previousPeriod = this.calculatePeriodMetrics(orders.filter(order => {
        const orderDate = new Date(order.order_date_time);
        const sevenDaysAgo = new Date();
        const fourteenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        return orderDate >= fourteenDaysAgo && orderDate < sevenDaysAgo;
    }), 7);

    // Check for significant changes
    if (recentOrders.revenue < previousPeriod.revenue * 0.8) {
        alerts.push({
            type: 'revenue_decrease',
            severity: 'high',
            message: `Revenue has decreased by ${(((previousPeriod.revenue - recentOrders.revenue) / previousPeriod.revenue) * 100).toFixed(1)}% compared to previous period`
        });
    }

    return alerts;
}

calculateGrowthRate(orders) {
    if (orders.length < 2) return 0;
    
    const periodLength = 30; // 30 days for monthly growth rate
    const currentPeriodEnd = new Date();
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(currentPeriodStart.getDate() - periodLength);
    
    const previousPeriodEnd = new Date(currentPeriodStart);
    const previousPeriodStart = new Date(previousPeriodEnd);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodLength);
    
    const currentPeriodOrders = orders.filter(order => {
        const orderDate = new Date(order.order_date_time);
        return orderDate >= currentPeriodStart && orderDate <= currentPeriodEnd;
    });
    
    const previousPeriodOrders = orders.filter(order => {
        const orderDate = new Date(order.order_date_time);
        return orderDate >= previousPeriodStart && orderDate < previousPeriodEnd;
    });
    
    const currentRevenue = this.calculateTotalRevenue(currentPeriodOrders);
    const previousRevenue = this.calculateTotalRevenue(previousPeriodOrders);
    
    if (previousRevenue === 0) return 0;
    return (((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1);
}

groupProductsByCategory(products) {
    // Group products by their categories and calculate metrics
    return products.reduce((categories, product) => {
        const category = product.category || 'uncategorized';
        if (!categories[category]) {
            categories[category] = {
                count: 0,
                totalStock: 0,
                totalValue: 0
            };
        }
        
        categories[category].count++;
        categories[category].totalStock += product.product_stock;
        categories[category].totalValue += product.product_stock * product.price;
        
        return categories;
    }, {});
}

// Helper methods for Discount analysis
calculateTotalDiscountValue(discounts) {
    return discounts.reduce((total, discount) => {
        const discountAmount = discount.SalesOrders.reduce((sum, order) => {
            // Calculate actual discount applied to each order
            const discountValue = (order.subtotal * (discount.discount_rate / 100));
            return sum + discountValue;
        }, 0);
        return total + discountAmount;
    }, 0);
}

calculateAverageDiscount(discounts) {
    if (!discounts.length) return 0;
    
    const totalDiscountRate = discounts.reduce((sum, discount) => 
        sum + discount.discount_rate, 0);
    return totalDiscountRate / discounts.length;
}

analyzeDiscountUsage(discounts) {
    return discounts.map(discount => ({
        discountId: discount.discount_id,
        name: discount.discount_name,
        rate: discount.discount_rate,
        usageCount: discount.SalesOrders.length,
        totalValue: this.calculateDiscountValue(discount),
        averageOrderValue: this.calculateAverageDiscountedOrder(discount),
        effectiveDate: discount.effective_date,
        expiryDate: discount.expiry_date
    }));
}

async analyzeDiscountPerformance(discounts) {
    const performance = await Promise.all(discounts.map(async discount => {
        // Get orders before discount period
        const beforeDiscountOrders = await db.SalesOrder.findAll({
            where: {
                order_date_time: {
                    [Op.lt]: discount.effective_date
                }
            },
            limit: 100 // Compare with last 100 orders
        });

        // Get orders during discount period
        const duringDiscountOrders = discount.SalesOrders;

        return {
            discountId: discount.discount_id,
            name: discount.discount_name,
            metrics: {
                averageOrderValueBefore: this.calculateAverageOrderValue(beforeDiscountOrders),
                averageOrderValueDuring: this.calculateAverageOrderValue(duringDiscountOrders),
                orderVolumeBefore: beforeDiscountOrders.length,
                orderVolumeDuring: duringDiscountOrders.length
            }
        };
    }));

    return performance;
}

// Helper methods for Fulfillment tracking
countReadyToShip(orders) {
    return orders.filter(order => {
        // Check if all items in order have sufficient stock
        return order.items.every(item => 
            item.Product.product_stock >= item.quantity
        );
    }).length;
}

countAwaitingStock(orders) {
    return orders.filter(order => {
        // Check if any items in order are waiting for stock
        return order.items.some(item => 
            item.Product.product_stock < item.quantity
        );
    }).length;
}

analyzeFulfillmentStatus(orders) {
    return orders.map(order => ({
        orderId: order.sales_order_id,
        status: order.status_id,
        items: order.items.map(item => ({
            productName: item.Product.product_name,
            required: item.quantity,
            available: item.Product.product_stock,
            readyToShip: item.Product.product_stock >= item.quantity
        })),
        fulfillmentPossible: order.items.every(item => 
            item.Product.product_stock >= item.quantity
        )
    }));
}

async checkStockAvailability(orders) {
    const stockNeeds = new Map();
    
    // Aggregate total stock needs across all orders
    orders.forEach(order => {
        order.items.forEach(item => {
            const productId = item.product_id;
            const currentNeed = stockNeeds.get(productId) || {
                productName: item.Product.product_name,
                totalNeeded: 0,
                currentStock: item.Product.product_stock,
                pendingOrders: 0
            };
            
            currentNeed.totalNeeded += item.quantity;
            currentNeed.pendingOrders++;
            stockNeeds.set(productId, currentNeed);
        });
    });

    return Array.from(stockNeeds.entries()).map(([productId, need]) => ({
        productId,
        productName: need.productName,
        totalNeeded: need.totalNeeded,
        currentStock: need.currentStock,
        shortage: Math.max(0, need.totalNeeded - need.currentStock),
        pendingOrders: need.pendingOrders,
        fulfillmentStatus: this.determineFulfillmentStatus(need)
    }));
}

determineFulfillmentStatus(need) {
    if (need.currentStock >= need.totalNeeded) {
        return 'ready';
    } else if (need.currentStock > 0) {
        return 'partial';
    }
    return 'unavailable';
}

// Helper methods for Tax management
calculateTotalTax(taxes) {
    return taxes.reduce((total, tax) => {
        const taxAmount = tax.SalesOrders.reduce((sum, order) => {
            return sum + (order.subtotal * (tax.tax_rate / 100));
        }, 0);
        return total + taxAmount;
    }, 0);
}

calculateAverageTaxRate(taxes) {
    if (!taxes.length) return 0;
    
    const totalRate = taxes.reduce((sum, tax) => sum + tax.tax_rate, 0);
    return totalRate / taxes.length;
}

analyzeTaxBreakdown(taxes) {
    return taxes.map(tax => ({
        taxId: tax.tax_id,
        name: tax.tax_name,
        rate: tax.tax_rate,
        appliedCount: tax.SalesOrders.length,
        totalCollected: this.calculateTaxCollected(tax),
        averagePerOrder: this.calculateAverageTaxPerOrder(tax),
        effectiveDate: tax.effective_date,
        applicableRegions: tax.applicable_regions
    }));
}

async assessTaxCompliance(taxes) {
    // Group tax applications by region and rate
    const compliance = {
        byRegion: this.analyzeTaxByRegion(taxes),
        byRate: this.analyzeTaxByRate(taxes),
        unusualPatterns: await this.detectUnusualTaxPatterns(taxes)
    };

    return {
        ...compliance,
        complianceScore: this.calculateComplianceScore(compliance),
        recommendations: this.generateTaxRecommendations(compliance)
    };
}

analyzeTaxByRegion(taxes) {
    const regionMap = new Map();
    
    taxes.forEach(tax => {
        const regions = tax.applicable_regions || ['default'];
        regions.forEach(region => {
            if (!regionMap.has(region)) {
                regionMap.set(region, {
                    totalOrders: 0,
                    totalTax: 0,
                    rates: new Set()
                });
            }
            
            const regionStats = regionMap.get(region);
            regionStats.totalOrders += tax.SalesOrders.length;
            regionStats.totalTax += this.calculateTaxCollected(tax);
            regionStats.rates.add(tax.tax_rate);
        });
    });

    return Array.from(regionMap.entries()).map(([region, stats]) => ({
        region,
        orderCount: stats.totalOrders,
        totalTaxCollected: stats.totalTax,
        uniqueRates: Array.from(stats.rates)
    }));
}

calculateComplianceScore(compliance) {
    // Calculate a compliance score based on various factors
    let score = 100;
    
    // Deduct points for missing region information
    if (compliance.byRegion.some(r => r.region === 'default')) {
        score -= 10;
    }
    
    // Deduct points for unusual patterns
    score -= (compliance.unusualPatterns.length * 5);
    
    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, score));
}

    // Private Helper Methods
    #requiresWarranty(product) {
        return product.manufacturer === 'Bateriku' || 
            product.requiresWarranty;  
    }

    async #suggestWarrantyTerms(product) {
        const rules = product.category === 'Battery' 
            ? this.#warrantyRules.battery 
            : this.#warrantyRules.default;

        const similarProducts = await db.Product.findAll({
            where: {
                manufacturer: product.manufacturer,
                category: product.category
            },
            include: [{
                model: db.Warranty,
                as: 'warranties'
            }],
            limit: 5
        });

        return {
            manufacturer: {
                suggestedDuration: rules.manufacturer.defaultDuration,
                commonPatterns: this.#analyzeWarrantyPatterns(similarProducts, 'manufacturer'),
                terms: "Standard manufacturer warranty terms apply"
            },
            consumer: {
                suggestedDuration: rules.consumer.defaultDuration,
                commonPatterns: this.#analyzeWarrantyPatterns(similarProducts, 'consumer'),
                terms: "Standard consumer warranty terms apply"
            }
        };
    }

    #analyzeWarrantyPatterns(products, warrantyType) {
        const warranties = products
            .flatMap(p => p.warranties)
            .filter(w => w.warranty_type === (warrantyType === 'manufacturer' ? 2 : 1));

        if (warranties.length === 0) return null;

        const durations = warranties.map(w => 
            Math.ceil((new Date(w.end_date) - new Date(w.start_date)) / (1000 * 60 * 60 * 24))
        );

        return {
            averageDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
            commonTerms: this.extractCommonTerms(warranties)
        };
    }

    #determineWarrantyTypes(product) {
        const types = [];
        
        if (this.#requiresWarranty(product)) {
            types.push({
                type: 'manufacturer',
                required: true,
                defaultDuration: this.#warrantyRules.battery.manufacturer.defaultDuration
            });
            
            types.push({
                type: 'consumer',
                required: true,
                defaultDuration: this.#warrantyRules.battery.consumer.defaultDuration
            });
        }

        return types;
    }
}

module.exports = {
    ChatbotService,
    ChatbotIntelligence
};