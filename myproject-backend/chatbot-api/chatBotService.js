const { Op } = require("sequelize");
const db = require("../models");
const { OpenAI } = require("openai");

class ChatbotService {
    constructor(apiKey, documentProcessor) {
        if (!apiKey) {
            throw new Error('API key is required for ChatbotService');
        }
        if (!documentProcessor) {
            throw new Error('DocumentProcessor is required for ChatbotService');
        }

        this.openai = new OpenAI({ apiKey });
        this.documentProcessor = documentProcessor;
        console.log('API Key passed to ChatbotService:', apiKey);
        
        // Conversation management with timeouts
        this.conversations = new Map();
        this.conversationTimeouts = new Map();
        
        // Warranty rules configuration
        this.warrantyRules = {
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

    // Document Analysis Methods
    async processDocument(file) {
        try {
            // Validate file input
            if (!file || !file.buffer) {
                throw new Error('Invalid file data');
            }

            // Use the document processor to process the file
            const result = await this.documentProcessor.processDocument(file);
            
            if (!result) {
                throw new Error('Document processing failed to return results');
            }

            return result;
        } catch (error) {
            console.error('Document processing error:', error);
            throw error;
        }
    }

    // Purchase Order Analysis
    async analyzePurchaseOrder(documentResults, conversation) {
        const poAnalysis = await this.analyzeVendorPurchaseOrder({
            items: documentResults.extractedItems,
            vendorName: documentResults.metadata.vendorName,
            subtotal: documentResults.metadata.subtotal,
            tax: documentResults.metadata.tax,
            grandTotal: documentResults.metadata.grandTotal,
            shippingFee: documentResults.metadata.shippingFee
        });

        // Update conversation context for purchase order
        conversation.currentDocument = {
            type: 'purchase_order',
            status: 'analyzing',
            data: poAnalysis
        };

        return {
            success: true,
            analysis: poAnalysis,
            explanation: this.generatePurchaseOrderResponse(poAnalysis),
            fileAnalysis: documentResults
        };
    }

    // Product Validation and Analysis
    async validateProducts(items) {
        const validations = [];
        
        for (const item of items) {
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

    // Warranty Analysis
    async analyzeWarrantyRequirements(product) {
        const analysis = {
            applicableProducts: [],
            warrantyTerms: [],
            missingInfo: [],
            warnings: []
        };

        if (this.requiresWarranty(product)) {
            const suggestedTerms = await this.suggestWarrantyTerms(product);
            analysis.applicableProducts.push({
                sku: product.sku_number,
                productName: product.product_name,
                warrantyTypes: this.determineWarrantyTypes(product),
                suggestedTerms,
                existingWarranties: product.warranties
            });
        }

        return analysis;
    }

    // Conversation Management
    getOrCreateConversation(id) {
        if (this.conversationTimeouts.has(id)) {
            clearTimeout(this.conversationTimeouts.get(id));
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

        const timeout = setTimeout(() => {
            this.conversations.delete(id);
            this.conversationTimeouts.delete(id);
        }, 30 * 60 * 1000); // 30 minutes timeout

        this.conversationTimeouts.set(id, timeout);
        return this.conversations.get(id);
    }

    // Helper Methods
    requiresWarranty(product) {
        return product.category === 'Battery' || 
               product.manufacturer === 'Bateriku' || 
               product.requiresWarranty;
    }

    async suggestWarrantyTerms(product) {
        const rules = product.category === 'Battery' 
            ? this.warrantyRules.battery 
            : this.warrantyRules.default;

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
                commonPatterns: this.analyzeWarrantyPatterns(similarProducts, 'manufacturer'),
                terms: "Standard manufacturer warranty terms apply"
            },
            consumer: {
                suggestedDuration: rules.consumer.defaultDuration,
                commonPatterns: this.analyzeWarrantyPatterns(similarProducts, 'consumer'),
                terms: "Standard consumer warranty terms apply"
            }
        };
    }

    // Response Generation Methods
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

    generatePurchaseOrderResponse(poAnalysis, options = {}) {
        try {
            // Start with our basic response
            let response = "I've analyzed your purchase order. Here's what I found:\n\n";

            // New products section
            if (poAnalysis.newProducts.length > 0) {
                response += "📦 New Products to Add:\n";
                poAnalysis.newProducts.forEach(product => {
                    response += `• ${product.productName}\n`;
                    response += `  - Suggested SKU: ${product.suggestedSku}\n`;
                    response += `  - Category: ${product.category}\n`;
                    response += `  - Initial Stock: ${product.initialStock} units\n`;
                    response += `  - Unit Price: RM${product.unitPrice.toFixed(2)}\n`;
                });
                response += "\n";
            }

            // Existing products section
            if (poAnalysis.existingProducts.length > 0) {
                response += "🔄 Existing Products to Update:\n";
                poAnalysis.existingProducts.forEach(item => {
                    response += `• ${item.product.product_name}\n`;
                    if (item.priceChanged) {
                        response += `  - Price Change: RM${item.product.price} → RM${item.newPrice}\n`;
                    }
                    response += `  - Adding: ${item.quantityToAdd} units\n`;
                });
                response += "\n";
            }

            // Financial validation results
            const fin = poAnalysis.financialValidation;
            response += "💰 Financial Summary:\n";
            if (fin.calculations) {
                response += `• Subtotal: RM${fin.calculations.calculatedSubtotal.toFixed(2)}\n`;
                response += `• Tax (6%): RM${fin.calculations.calculatedTax.toFixed(2)}\n`;
                response += `• Total: RM${fin.calculations.calculatedTotal.toFixed(2)}\n`;
            }

            // Add validation warnings if any
            if (!fin.subtotalMatch || !fin.taxMatch || !fin.totalMatch) {
                response += "\n⚠️ Financial Validation Warnings:\n";
                if (!fin.subtotalMatch) response += "• Subtotal calculation mismatch\n";
                if (!fin.taxMatch) response += "• Tax calculation mismatch\n";
                if (!fin.totalMatch) response += "• Total amount mismatch\n";
            }

            // Add AI-enhanced insights if provided
            if (options.enhancedAnalysis) {
                response += "\n🤖 AI-Enhanced Insights:\n";
                response += options.enhancedAnalysis;
                response += "\n";
            }

            // Next steps
            response += "\nWhat would you like to do next?\n";
            if (poAnalysis.newProducts.length > 0) {
                response += "1. Add new products to inventory\n";
            }
            if (poAnalysis.existingProducts.length > 0) {
                response += "2. Update existing product stock\n";
            }
            response += "3. Review financial details\n";
            response += "4. Cancel processing\n";

            return response;

        } catch (error) {
            console.error('Error generating purchase order response:', error);
            return 'Sorry, I encountered an error while generating the purchase order analysis. Please try again.';
        }
    }
}

module.exports = ChatbotService;