const Tesseract = require('tesseract.js');
const { PDFExtract } = require('pdf.js-extract');

class DocumentProcessor {
    constructor() {
        if (new.target === DocumentProcessor) {
            this.pdfExtract = new PDFExtract();
            console.log('Base DocumentProcessor initialized');
        }
    }

async processDocument(file) {
    try {
        console.log('Starting document processing for:', file.originalname);
        
        if (!file || !file.buffer) {
            throw new Error('Invalid file data');
        }

        let extractedText = '';
        if (file.mimetype === 'application/pdf') {
            console.log('Processing PDF file...');
            extractedText = await this.extractTextFromPDF(file.buffer);
            console.log('Extracted text:', extractedText.substring(0, 200) + '...');
        } else {
            throw new Error('Unsupported file type. Please upload a PDF file.');
        }

        // Clean and preprocess the text
        const cleanedText = this.preprocessText(extractedText);
        
        // Extract metadata
        const metadata = this.extractMetadata(cleanedText);
        console.log('Extracted metadata:', metadata);
        
        // Extract items with updated regex pattern
        const items = this.extractItems(cleanedText);
        console.log('Extracted items:', items);

        if (items.length === 0) {
            throw new Error('No valid items found in document');
        }

        // Calculate financials
        const financials = this.calculateFinancials(items);
        
        // Validate the extracted data
        const validationResult = this.validateExtractedData(items, financials, metadata);
        
        if (!validationResult.isValid) {
            throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
        }

        return {
            metadata: {
                ...metadata,
                documentType: 'purchase_order',
                processingConfidence: validationResult.confidence
            },
            extractedItems: items,
            financials
        };

    } catch (error) {
        console.error('Document processing error:', error);
        throw error;
    }
}

    extractMetadata(text) {
        const metadata = {
            poNumber: '',
            poDate: '',
            vendorName: '',
            vendorAddress: '',
            vendorContact: '',
            buyerDetails: {},
            deliveryDetails: {}
        };

        // Improved regex patterns with better field boundary handling
        const patterns = {
            poNumber: /PO\s*(?:Number|No\.?)?\s*[:;]\s*([\w-]+)/i,
            poDate: /(?:PO\s*)?Date\s*[:;]\s*(\d{1,2}\s+\w+\s+\d{4})/i,
            // Updated to stop at 'Vendor Address' or end of line
            vendorName: /Vendor\s*Name\s*[:;]\s*([^,\n]*?)(?=\s*Vendor\s*Address:|$)/i,
            vendorAddress: /Vendor\s*Address\s*[:;]\s*([^,\n]*?)(?=\s*Vendor\s*Contact:|$)/i,
            vendorContact: /Vendor\s*Contact\s*[:;]\s*((?:\+\d{2,3}[-\s]?)?\d[\d\s-]{8,})/i
        };

        // Extract each metadata field
        for (const [key, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            if (match) {
                metadata[key] = match[1].trim();
            }
        }

        return metadata;
    }

    calculateFinancials(items) {
        // Ensure items is an array and handle empty case
        if (!Array.isArray(items) || items.length === 0) {
            return {
                subtotal: 0,
                tax: 0,
                shipping: 500.00,
                grandTotal: 500.00,
                itemizedTotals: []
            };
        }

        const subtotal = items.reduce((sum, item) => 
            sum + (item.quantity * item.price), 0
        );

        const tax = subtotal * 0.06; // 6% tax rate
        const shipping = 500.00; // Standard shipping fee
        const grandTotal = subtotal + tax + shipping;

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            tax: parseFloat(tax.toFixed(2)),
            shipping: parseFloat(shipping.toFixed(2)),
            grandTotal: parseFloat(grandTotal.toFixed(2)),
            itemizedTotals: items.map(item => ({
                sku: item.sku,
                lineTotal: parseFloat((item.quantity * item.price).toFixed(2))
            }))
        };
    }

    // Validate extracted data
    validateExtractedData(items, financials, metadata) {
        const errors = [];
        let confidence = 1.0;

        // Just check if we have items
        if (items.length === 0) {
            errors.push('No items found in document');
            confidence *= 0.5;
        }

        // Validate required metadata
        if (!metadata.poNumber) {
            errors.push('Missing PO number');
            confidence *= 0.9;
        }
        if (!metadata.poDate) {
            errors.push('Missing PO date');
            confidence *= 0.9;
        }
        if (!metadata.vendorName) {
            errors.push('Missing vendor name');
            confidence *= 0.9;
        }

        return {
            isValid: errors.length === 0,
            errors,
            confidence
        };
    }

    extractItems(text) {
        const items = [];
        const itemPattern = /(?:Car|Truck)\s+Battery\s*-\s*Model\s+([A-Z0-9]+)\s+(\d+)\s+(\d+(?:\.\d{2})?)\s+(\d+(?:\.\d{2})?)/g;
        
        let match;
        while ((match = itemPattern.exec(text)) !== null) {
            try {
                const [fullMatch, model, quantity, price, total] = match;
                const productType = fullMatch.startsWith('Car') ? 'Car' : 'Truck';
                
                const item = {
                    productType,
                    model,
                    sku: `BAT-${model}`,
                    productName: `${productType} Battery - Model ${model}`,
                    quantity: parseInt(quantity),
                    price: parseFloat(price),
                    total: parseFloat(total)
                };

                // Just validate data extraction, not business logic
                if (this.validateItem(item)) {
                    items.push(item);
                }
            } catch (error) {
                console.error('Error parsing item:', error);
            }
        }

        // Ensure we return an empty array if no items found
        return items || [];
    }

    async extractTextFromImage(buffer) {
        try {
            const worker = await Tesseract.createWorker();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');

            // Configure OCR settings for better accuracy
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-.,()& ',
                tessedit_pageseg_mode: '6',
                preserve_interword_spaces: '1'
            });

            const { data: { text } } = await worker.recognize(buffer);
            await worker.terminate();
            
            return text;
        } catch (error) {
            console.error('OCR processing error:', error);
            throw new Error('Failed to extract text from image');
        }
    }

    async extractTextFromPDF(buffer) {
        try {
            const data = await this.pdfExtract.extractBuffer(buffer);
            return data.pages
                .map(page => page.content
                    .map(item => item.str)
                    .join(' ')
                )
                .join('\n');
        } catch (error) {
            console.error('PDF processing error:', error);
            throw new Error('Failed to extract text from PDF');
        }
    }

    preprocessText(text) {
        return text
            .replace(/\r\n/g, '\n')
            .replace(/[^\x20-\x7E\n]/g, '')
            .replace(/\s+/g, ' ')
            .replace(/['"]/g, '')
            .trim();
    }

    async parseInventoryInfoWithMultipleStrategies(text) {
        // Parsing logic here (same as previous function)
        // Ensure you include all strategies
    }

    validateExtractedItems(items) {
        return items.map(item => ({
            ...item,
            confidence: this.calculateItemConfidence(item)
        })).filter(item => item.confidence > 0.7);
    }

    validateItem(item) {
        // Only validate that we successfully extracted all required fields
        if (!item.productType || !item.model || !item.quantity || !item.price || !item.total) {
            console.warn('Missing required fields in extracted item:', {
                hasProductType: !!item.productType,
                hasModel: !!item.model,
                hasQuantity: !!item.quantity,
                hasPrice: !!item.price,
                hasTotal: !!item.total
            });
            return false;
        }

        // Ensure numeric fields are actually numbers
        const quantity = parseInt(item.quantity);
        const price = parseFloat(item.price);
        const total = parseFloat(item.total);

        if (isNaN(quantity) || isNaN(price) || isNaN(total)) {
            console.warn('Invalid numeric values:', {
                quantity: item.quantity,
                price: item.price,
                total: item.total
            });
            return false;
        }

        // Basic format validation for model number
        if (!item.model.match(/^[A-Z0-9]+$/)) {
            console.warn('Invalid model number format:', item.model);
            return false;
        }

        return true;
    }

    calculateItemConfidence(itemText) {
        let confidence = 1.0;

        // Check for expected patterns and format
        if (!itemText.match(/Battery/i)) confidence *= 0.8;
        if (!itemText.match(/Model [A-Z0-9]+/i)) confidence *= 0.8;
        if (!itemText.match(/\d+(?:\.\d{2})?/)) confidence *= 0.7;

        // Check for price and quantity format
        const hasValidQuantity = /\s\d+\s/.test(itemText);
        const hasValidPrice = /\s\d+\.\d{2}\s/.test(itemText);
        
        if (!hasValidQuantity) confidence *= 0.6;
        if (!hasValidPrice) confidence *= 0.6;

        return confidence;
    }

    calculateConfidenceScore(items) {
        if (items.length === 0) return 0;
        return items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
    }
}

class PurchaseOrderProcessor extends DocumentProcessor {
    constructor() {
        super();
        // Initialize specific recognizers only if they're needed
        this.recognizers = {
            vendorInfo: null,
            productDetails: null,
            financialDetails: null
        };
        console.log('PurchaseOrderProcessor initialized');
    }

    initializeRecognizers() {
        if (!this.recognizers.vendorInfo) {
            // Simple recognizer implementation for now
            this.recognizers = {
                vendorInfo: {
                    analyze: text => this.extractVendorInfo(text)
                },
                productDetails: {
                    analyze: text => this.extractProductDetails(text)
                },
                financialDetails: {
                    analyze: text => this.extractFinancialDetails(text)
                }
            };
        }
    }

    // Add helper methods for recognizers
    extractVendorInfo(text) {
        // Implementation using existing patterns
        return super.extractMetadata(text);
    }

    extractProductDetails(text) {
        // Implementation using existing patterns
        return super.extractItems(text);
    }

    extractFinancialDetails(text) {
        // Implementation using existing patterns
        const items = this.extractProductDetails(text);
        return super.calculateFinancials(items);
    }

  async processPurchaseOrder(document) {
    // First pass: Extract basic structure and metadata
    const metadata = await this.extractMetadata(document);
    
    // Second pass: Detailed line item extraction with confidence scores
    const items = await this.extractLineItems(document);
    
    // Third pass: Financial validation and reconciliation
    const financials = await this.validateFinancials(items);
    
    // Fourth pass: Cross-reference with existing inventory
    const inventoryAnalysis = await this.analyzeInventoryImpact(items);

    return {
      metadata,
      items,
      financials,
      inventoryAnalysis,
      confidence: this.calculateOverallConfidence()
    };
  }

    async analyzeInventoryImpact(items) {
    // This connects to your existing inventory checking logic
    return {
      newProducts: items.filter(item => !this.productExists(item)),
      insufficientStock: items.filter(item => this.hasInsufficientStock(item)),
      readyToProcess: items.filter(item => 
        this.productExists(item) && !this.hasInsufficientStock(item)
      )
    };
  }

  // Add methods that work with your existing stock validation
  async validateFinancials(items) {
    const financials = await super.calculateFinancials(items);
    // Add additional validation specific to purchase orders
    return {
      ...financials,
      validationResults: await this.validateFinancialCalculations(financials)
    };
  }
}

module.exports = { DocumentProcessor, PurchaseOrderProcessor };