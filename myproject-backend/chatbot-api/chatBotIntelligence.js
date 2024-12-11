const { OpenAI } = require("openai");
const { Op } = require("sequelize");
const db = require("../models");
const path = require('path');
const ChatbotService = require('./chatBotService');
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
        if (!apiKey) {
            throw new Error('API key is required for ChatbotIntelligence');
        }
        if (!chatBotService) {
            throw new Error('ChatbotService is required for ChatbotIntelligence');
        }

        this.chatBotService = chatBotService;
        this.openai = new OpenAI({ apiKey });

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

    async handleUserResponse(conversationId, message) {
        const conversation = this.getOrCreateConversation(conversationId);
        
        // Add user message to history
        conversation.history.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });

        // Generate contextual response based on conversation state
        const response = await this.generateContextualResponse(conversation, message);
        
        // Update conversation with bot's response
        conversation.history.push({
            role: 'assistant',
            content: response.message,
            actions: response.suggestedActions,
            timestamp: new Date()
        });

        return response;
    }

    async generateContextualResponse(conversation, message) {
        // Add timeout control
        const TIMEOUT_MS = 30000; // 30 seconds
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Response generation timed out')), TIMEOUT_MS);
        });

        try {
            const context = this.buildConversationContext(conversation);
            
            // Race between API call and timeout
            const response = await Promise.race([
                this.openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: `You are an intelligent stock management assistant handling purchase orders and warranties. 
                            Current context: ${JSON.stringify(context)}`
                        },
                        ...conversation.history.slice(-5),
                        { role: "user", content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 500  // Add token limit
                }),
                timeoutPromise
            ]);

            return {
                message: response.choices[0].message.content,
                suggestedActions: this.determineSuggestedActions(context, message)
            };
        } catch (error) {
            if (error.message === 'Response generation timed out') {
                return {
                    message: "I apologize, but the request timed out. Please try again or break your request into smaller parts.",
                    suggestedActions: ['retry']
                };
            }
            throw error;
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

    // Private Helper Methods
    #requiresWarranty(product) {
        return product.category === 'Battery' || 
               product.manufacturer === 'Bateriku' || 
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