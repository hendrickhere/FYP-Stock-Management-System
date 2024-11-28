require('dotenv').config();
const { OpenAI } = require("openai");
const { Op } = require("sequelize");
const db = require("../models");
const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '.env');
const { 
    processDocument,
    extractTextFromImage,
    extractTextFromPDF,
    parseInventoryInfo 
} = require('./documentProcessor');

if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

console.log('Environment loaded from:', envPath);
console.log('API Key present:', !!process.env.OPENAI_API_KEY);

class ChatbotIntelligence {

    // Define private fields for the class
    #warrantyRules;
    #conversationTimeouts;

    constructor() {
        // Initialize OpenAI with API key
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        // Initialize conversation store with session management
        this.conversations = new Map();
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

    async analyzeVendorPurchaseOrder(data) {
        try {
            const analysis = {
                newProducts: [],
                existingProducts: [],
                financialValidation: {},
                suggestedActions: []
            };

            // Validate data structure
            if (!data.items || !Array.isArray(data.items)) {
                throw new Error('Invalid purchase order data structure');
            }

            // Process each product
            for (const item of data.items) {
                // Extract model number from product name/description
                const modelMatch = item.description.match(/Model\s+([A-Z0-9]+)/i);
                const modelNumber = modelMatch ? modelMatch[1] : null;

                if (!modelNumber) {
                    throw new Error(`Could not extract model number from item: ${item.description}`);
                }

                const existingProduct = await db.Product.findOne({
                    where: {
                        [Op.or]: [
                            { sku_number: `BAT-${modelNumber}` },
                            { product_name: item.description }
                        ]
                    }
                });

                if (!existingProduct) {
                    analysis.newProducts.push({
                        productName: item.description,
                        suggestedSku: `BAT-${modelNumber}`,
                        unitPrice: item.unitPrice,
                        category: item.description.includes('Truck') ? 'Truck Battery' : 'Car Battery',
                        manufacturer: data.vendorName,
                        initialStock: item.quantity,
                        unit: 'piece',  // Default unit for batteries
                        status_id: 1    // Default active status
                    });
                } else {
                    analysis.existingProducts.push({
                        product: existingProduct,
                        newPrice: item.unitPrice,
                        priceChanged: existingProduct.price !== item.unitPrice,
                        quantityToAdd: item.quantity
                    });
                }
            }

            // Financial validation logic
            analysis.financialValidation = this.validateFinancials(data);

            // Generate actions based on analysis
            this.generateSuggestedActions(analysis);

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
        console.log('Starting document analysis for conversation:', conversationId);
        const conversation = this.getOrCreateConversation(conversationId);
        
        try {
            // Step 1: Process the document using imported processor
            console.log('Processing document:', file.originalname);
            const documentResults = await processDocument(file);

            // If it's a purchase order, analyze it as such
            if (documentResults.metadata?.documentType === 'purchase_order') {
                const poAnalysis = await this.analyzeVendorPurchaseOrder({
                    items: documentResults.extractedItems,
                    vendorName: documentResults.metadata.vendorName,
                    subtotal: documentResults.metadata.subtotal,
                    tax: documentResults.metadata.tax,
                    grandTotal: documentResults.metadata.grandTotal,
                    shippingFee: documentResults.metadata.shippingFee
                });

                return {
                    success: true,
                    analysis: poAnalysis,
                    explanation: this.generatePurchaseOrderResponse(poAnalysis),
                    fileAnalysis: documentResults
                };
            }
            
            if (!documentResults || !documentResults.extractedItems) {
                throw new Error('Document processing failed to return valid results');
            }

            console.log('Document processing successful. Found items:', documentResults.extractedItems.length);

            // Step 2: Perform complete analysis
            const analysis = await this.performCompleteAnalysis({
                extractedItems: documentResults.extractedItems,
                metadata: documentResults.metadata
            });

            // Step 3: Generate user-friendly explanation
            const explanation = this.generateAnalysisExplanation(analysis);

            // Step 4: Update conversation context
            conversation.currentDocument = {
                extractedItems: documentResults.extractedItems,
                analysis,
                status: analysis.isValid ? 'pending_confirmation' : 'needs_review'
            };

            console.log('Analysis complete. Status:', conversation.currentDocument.status);

            return {
                success: true,
                analysis,
                explanation,
                fileAnalysis: {
                    metadata: documentResults.metadata,
                    extractedItems: documentResults.extractedItems
                },
                suggestedActions: this.determineSuggestedActions(analysis)
            };

        } catch (error) {
            console.error('Document analysis error:', error);
            
            // Update conversation to reflect error state
            conversation.currentDocument = {
                error: error.message,
                status: 'error'
            };

            const errorExplanation = this.generateErrorExplanation(error);
            console.log('Generated error explanation:', errorExplanation);

            return {
                success: false,
                error: error.message,
                explanation: errorExplanation
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

    generateAnalysisExplanation(analysis) {
        try {
            let explanation = `I've analyzed your document and here's what I found:\n\n`;

            // Add product analysis summary
            if (analysis.products && analysis.products.length > 0) {
                explanation += `1. Product Analysis:\n`;
                let validProducts = 0;
                analysis.products.forEach(product => {
                    if (product.found) validProducts++;
                    explanation += `   • ${product.productName}: ${product.found ? 'Found in inventory' : 'Not found'}\n`;
                    if (product.isStockSufficient === false) {
                        explanation += `     (Warning: Insufficient stock - ${product.currentStock} available)\n`;
                    }
                });
                explanation += `   Total Valid Products: ${validProducts}/${analysis.products.length}\n\n`;
            }

            // Add financial summary
            if (analysis.financials?.calculations) {
                const fin = analysis.financials.calculations;
                explanation += `2. Financial Summary:\n`;
                explanation += `   • Subtotal: RM${fin.subtotal.toFixed(2)}\n`;
                explanation += `   • Tax (6%): RM${fin.tax.toFixed(2)}\n`;
                explanation += `   • Shipping: RM${fin.shipping.toFixed(2)}\n`;
                explanation += `   • Total: RM${fin.total.toFixed(2)}\n\n`;
            }

            // Add warranty analysis if applicable
            if (analysis.warranties?.applicableProducts.length > 0) {
                explanation += `3. Warranty Requirements:\n`;
                analysis.warranties.applicableProducts.forEach(product => {
                    explanation += `   • ${product.productName}:\n`;
                    explanation += `     - Manufacturer warranty: ${product.suggestedTerms.manufacturer.suggestedDuration} days\n`;
                    explanation += `     - Consumer warranty: ${product.suggestedTerms.consumer.suggestedDuration} days\n`;
                });
                explanation += '\n';
            }

            // Add validation summary and next steps
            if (analysis.isValid) {
                explanation += `This document appears to be valid and can be processed. Would you like to proceed with creating the purchase order?`;
            } else {
                explanation += `Some issues need attention before proceeding:\n`;
                if (analysis.products.some(p => !p.found)) {
                    explanation += `• Some products are not in the inventory system\n`;
                }
                if (analysis.products.some(p => !p.isStockSufficient)) {
                    explanation += `• Some products have insufficient stock\n`;
                }
                if (analysis.financials?.warnings?.length > 0) {
                    explanation += `• There are financial calculation warnings\n`;
                }
            }

            return explanation;

        } catch (error) {
            console.error('Error generating analysis explanation:', error);
            return 'Sorry, I encountered an error while preparing the analysis explanation. Please try again.';
        }
    }

    generateErrorExplanation(error) {
        const errorMessages = {
            'DOCUMENT_PROCESSING_ERROR': 'I had trouble processing the document. Please ensure it\'s a valid purchase order in PDF or image format.',
            'NO_ITEMS_FOUND': 'I couldn\'t find any valid items in the document. Please check the format and try again.',
            'VALIDATION_ERROR': 'Some items in the document couldn\'t be validated against our inventory system.',
            'DEFAULT': 'There was an error processing your document. Please try again or contact support.'
        };

        return errorMessages[error.code] || errorMessages.DEFAULT;
    }

    // Document Analysis and Processing Methods
    async analyzeDocument(file, conversationId) {
        const conversation = this.getOrCreateConversation(conversationId);
        
        try {
            // Use the documentProcessor to extract information
            const documentResults = await processDocument(file);
            
            // Perform our complete analysis
            const analysis = await this.performCompleteAnalysis({
                extractedItems: documentResults.extractedItems,
                metadata: documentResults.metadata
            });
            
            // Generate a user-friendly explanation
            const explanation = this.generateAnalysisExplanation(analysis);
            
            // Update conversation context
            conversation.currentDocument = {
                extractedItems: documentResults.extractedItems,
                analysis,
                status: 'pending_validation'
            };

            return {
                success: true,
                analysis,
                explanation,
                fileAnalysis: {
                    metadata: documentResults.metadata,
                    extractedItems: documentResults.extractedItems
                }
            };
        } catch (error) {
            console.error('Document analysis error:', error);
            return {
                success: false,
                error: error.message,
                explanation: this.generateErrorExplanation(error)
            };
        }
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

        if (!this.conversations.has(id)) {
            this.conversations.set(id, {
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
            this.conversations.delete(id);
            this.#conversationTimeouts.delete(id);
        }, 30 * 60 * 1000); // 30 minutes timeout

        this.#conversationTimeouts.set(id, timeout);
        return this.conversations.get(id);
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

module.exports = new ChatbotIntelligence();