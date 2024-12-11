const Tesseract = require('tesseract.js');
const { PDFExtract } = require('pdf.js-extract');

class ProductMatcher {
    constructor(db, config = {}) {
        if (!db) {
            throw new Error('Database instance is required for ProductMatcher');
        }
        
        this.db = db;
        this.config = {
            minNameSimilarity: 0.4,
            modelMatchBonus: 0.2,
            brandMatchBonus: 0.15,
            specificationMatchBonus: 0.1,
            ...config
        };
    }

    async findMatchingProduct(poItem) {
            try {
                // Extract key information from product name
                const { type, brand, model, specifications } = this.parseProductName(poItem.productName);
                
                // Build the base query for fuzzy matching using existing columns
                const matches = await this.db.Product.findAll({
                    where: {
                        status_id: 1,
                        [this.db.Sequelize.Op.and]: [
                            // Base similarity on product name
                            this.db.Sequelize.literal(`
                                similarity(LOWER(product_name), LOWER('${poItem.productName}')) > 
                                ${this.config.minNameSimilarity}
                            `)
                        ]
                    },
                    attributes: {
                        include: [
                            [
                                this.db.Sequelize.literal(`
                                    similarity(LOWER(product_name), LOWER('${poItem.productName}')) *
                                    CASE 
                                        WHEN LOWER(brand) = LOWER('${brand || ''}') THEN 1 + ${this.config.brandMatchBonus}
                                        ELSE 1
                                    END *
                                    CASE
                                        WHEN LOWER(manufacturer) = LOWER('${brand || ''}') THEN 1 + ${this.config.brandMatchBonus}
                                        ELSE 1
                                    END *
                                    CASE
                                        WHEN product_name ILIKE '%${model || ''}%' THEN 1 + ${this.config.modelMatchBonus}
                                        ELSE 1
                                    END
                                `),
                                'matching_score'
                            ]
                        ]
                    },
                    order: [
                        [this.db.Sequelize.literal('matching_score DESC')]
                    ],
                    limit: 5 // Get top 5 matches for analysis
                });

                // Analyze matches and select the best one
                const bestMatch = this.analyzePotentialMatches(matches, poItem, {
                    type,
                    brand,
                    model,
                    specifications
                });

                return bestMatch;

            } catch (error) {
                console.error('Error in product matching:', error);
                
                // Handle the error gracefully and return a structured response
                return {
                    found: false,
                    confidence: 0,
                    suggestedSku: this.generateSku({
                        productName: poItem.productName,
                        type: this.parseProductName(poItem.productName).type
                    }),
                    error: error.message
                };
            }
        }

    async matchProductsWithInventory(items) {
        const existingProducts = [];
        const newProducts = [];

        for (const item of items) {

            console.log('Processing item:', {
                productName: item.productName,
                price: item.price,
                quantity: item.quantity
            });

            const matchResult = await this.findMatchingProduct(item);
            
            if (matchResult.found && matchResult.confidence >= 0.7) {
                existingProducts.push({
                    productId: matchResult.product.product_id,
                    productName: matchResult.product.product_name,
                    sku: matchResult.product.sku_number,
                    quantity: item.quantity,
                    cost: item.price, 
                });
            } else {
                const suggestedSku = matchResult.suggestedSku || this.generateSku({
                    productName: item.productName,
                    type: this.parseProductName(item.productName).type
                });

                console.log('Generated SKU:', {
                    productName: item.productName,
                    suggestedSku,
                    originalPrice: item.price
                });

                newProducts.push({
                    productName: item.productName,
                    suggestedSku,
                    quantity: item.quantity,
                    cost: item.price || item.cost,
                    manufacturer: item.manufacturer || item.vendorName || null,
                    unit: 'piece',
                    brand: matchResult.brand || null
                });
            }
        }

        return { existingProducts, newProducts };
    }

    parseProductName(productName) {
        // Common patterns in product names
        const patterns = {
            types: {
                battery: {
                    pattern: /(?:car|truck|motorcycle)?\s*battery/i,
                    prefix: 'BAT'
                },
                charger: {
                    pattern: /charger/i,
                    prefix: 'CHR'
                },
                cable: {
                    pattern: /cable|cord/i,
                    prefix: 'CBL'
                },
                accessory: {
                    pattern: /accessory|accessor(?:y|ies)/i,
                    prefix: 'ACC'
                }
            },
            brands: [
                'Bateriku',
                'Amaron',
                'Century',
                // Add more known brands
            ],
            modelPattern: /(?:model|type)?\s*([A-Z0-9]{3,})/i,
            specifications: {
                voltage: /(\d+)\s*V(?:olt)?s?/i,
                amperage: /(\d+)\s*(?:Ah|amp(?:ere)?[-\s]hours?)/i,
                size: /(?:group\s*size|size)\s*(\d+)/i
            }
        };

        // Extract information using patterns
        let type = 'General';
        let prefix = 'GEN';
        
        // Find matching product type
        for (const [key, value] of Object.entries(patterns.types)) {
            if (value.pattern.test(productName)) {
                type = key;
                prefix = value.prefix;
                break;
            }
        }

        const brand = patterns.brands
            .find(brand => productName.toLowerCase().includes(brand.toLowerCase()));

        const modelMatch = productName.match(patterns.modelPattern);
        const model = modelMatch ? modelMatch[1] : null;

        // Extract specifications
        const specifications = {};
        Object.entries(patterns.specifications).forEach(([key, pattern]) => {
            const match = productName.match(pattern);
            if (match) specifications[key] = match[1];
        });

        return { type, prefix, brand, model, specifications };
    }

    analyzePotentialMatches(matches, poItem, parsedInfo) {
        if (!matches.length) {
            return {
                found: false,
                suggestedSku: this.generateSku({
                    productName: poItem.productName,
                    type: parsedInfo.type
                }),
                confidence: 0,
                message: 'No matching products found'
            };
        }

        const bestMatch = matches[0];
        const matchScore = parseFloat(bestMatch.getDataValue('matching_score'));
        
        const analysis = {
            found: true,
            product: bestMatch,
            confidence: matchScore,
            matchType: 'fuzzy_name',
            alternativeMatches: matches.slice(1).map(match => ({
                productName: match.product_name,
                score: parseFloat(match.getDataValue('matching_score'))
            }))
        };

        if (matchScore < 0.7) {
            analysis.warnings = ['Low confidence match - manual verification recommended'];
        }

        analysis.matchingFactors = this.explainMatchingFactors(bestMatch, poItem, parsedInfo);

        return analysis;
    }

    explainMatchingFactors(match, poItem, parsedInfo) {
        const factors = [];
        
        if (match.product_name.toLowerCase().includes(parsedInfo.model?.toLowerCase())) {
            factors.push('Model number match');
        }
        
        if (match.brand?.toLowerCase() === parsedInfo.brand?.toLowerCase()) {
            factors.push('Brand match');
        }

        if (match.category === parsedInfo.category) {
            factors.push('Category match');
        }

        Object.entries(parsedInfo.specifications).forEach(([spec, value]) => {
            if (match[spec] === value) {
                factors.push(`${spec} specification match`);
            }
        });

        return factors;
    }

    generateSku({ productName, type }) {
        const parsedInfo = this.parseProductName(productName);
        const prefix = parsedInfo.prefix;
        const identifier = productName
            .replace(/[^A-Z0-9]/gi, '')
            .substring(0, 5)
            .toUpperCase();
        const timestamp = Date.now().toString().slice(-5);
        
        return `${prefix}-${identifier}-${timestamp}`;
    }
}

class DocumentProcessor {
    constructor(openai, db) {
        if (!openai || !db) {
            throw new Error('Both OpenAI and database instances are required');
        }

        this.openai = openai;
        this.db = db;
        this.pdfExtract = new PDFExtract();
        this.productMatcher = new ProductMatcher(db);
        
        // Define analysis prompts
        this.ANALYSIS_PROMPT = `Analyze this purchase order and extract structured data matching these database fields:

PURCHASE ORDER TABLE:
- order_date (timestamp)
- payment_terms (varchar 50)
- delivery_method (varchar 50)
- total_amount (numeric 10,2)
- subtotal (numeric 10,2)
- total_tax (numeric 10,2)
- grand_total (numeric 10,2)

PURCHASE ORDER ITEMS TABLE:
- quantity (integer)
- tax (numeric 10,2)
- discount (numeric 10,2)
- total_price (numeric 10,2)
- unregistered_quantity (integer)

Additional rules:
1. All prices should be numeric with 2 decimal places
2. Tax rate is 6% of subtotal
3. Quantities must be positive integers
4. Validate all calculations match line items

Return a JSON object matching this structure:
{ 
  "metadata": {
    "poNumber": string,
    "orderDate": ISO timestamp,
    "vendorName": string,
    "paymentTerms": string,
    "deliveryMethod": string
  },
  "items": [{
    "productName": string,
    "sku": string,
    "quantity": integer,
    "cost": decimal,      
    "totalCost": decimal,
    "tax": decimal,
    "discount": decimal
  }],
  "financials": {
    "subtotal": decimal,
    "tax": decimal,
    "shipping": decimal,
    "grandTotal": decimal
  }
}`;
    }

    async processDocument(file) {
        try {
            const extractedText = await this.extractTextFromPDF(file.buffer);
            const analysis = await this.analyzeWithGPT(extractedText);
            console.log('GPT Analysis Result:', analysis);
            const matchedProducts = await this.matchProductsWithInventory(analysis.items);
            console.log('Product Matching Results:', matchedProducts);

            return {
                success: true,
                analysisResult: {
                    metadata: {
                        poNumber: analysis.metadata.poNumber,
                        poDate: analysis.metadata.orderDate,
                        vendorName: analysis.metadata.vendorName,
                        paymentTerms: analysis.metadata.paymentTerms,
                        deliveryMethod: analysis.metadata.deliveryMethod
                    },
                    items: {
                        // Only include essential fields for existing products
                        existingProducts: matchedProducts.existingProducts.map(product => ({
                            productId: product.productId,
                            productName: product.productName,
                            sku: product.sku,
                            orderQuantity: product.quantity,  
                            cost: parseFloat(product.cost).toFixed(2)
                        })),
                        // For new products, we just need enough info to create them
                        newProducts: matchedProducts.newProducts.map(product => ({
                            productName: product.productName,
                            suggestedSku: product.suggestedSku,
                            orderQuantity: product.quantity,  
                            cost: parseFloat(product.cost).toFixed(2)
                        }))
                    },
                    financials: {
                        subtotal: parseFloat(analysis.financials.subtotal).toFixed(2),
                        tax: parseFloat(analysis.financials.tax).toFixed(2),
                        shipping: parseFloat(analysis.financials.shipping).toFixed(2),
                        total: parseFloat(analysis.financials.grandTotal).toFixed(2)
                    },
                    status: {
                        // Simple flag to determine if we need to create products first
                        requiresProductCreation: matchedProducts.newProducts.length > 0,
                        // We can only create PO directly if all products exist
                        canCreatePurchaseOrder: matchedProducts.newProducts.length === 0
                    }
                }
            };
        } catch (error) {
            console.error('Document processing error:', error);
            throw error;
        }
    }

    async matchProductsWithInventory(items) {

        return await this.productMatcher.matchProductsWithInventory(items);
    }

    async analyzeWithGPT(text) {
        try {
            // Create a more structured prompt that encourages JSON output
            const structuredPrompt = `
    You are a document processing assistant. Analyze the following purchase order text and extract the required information.

    Return ONLY a JSON object with this exact structure, and no other text:
    {
        "metadata": {
            "poNumber": "string",
            "orderDate": "ISO timestamp",
            "vendorName": "string",
            "paymentTerms": "string",
            "deliveryMethod": "string"
        },
        "items": [
            {
                "productName": "string",
                "sku": "string",
                "quantity": "number",
                "price": "number",
                "totalPrice": "number",
                "tax": "number",
                "discount": "number"
            }
        ],
        "financials": {
            "subtotal": "number",
            "tax": "number",
            "shipping": "number",
            "grandTotal": "number"
        }
    }

    Purchase order text to analyze:
    ${text}`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a purchase order processing assistant. Always respond with valid JSON only."
                    },
                    {
                        role: "user",
                        content: structuredPrompt
                    }
                ],
                temperature: 0.3
            });

            const response = completion.choices[0].message.content;
            
            // Add validation and cleaning before parsing
            const cleanedResponse = this.cleanJsonResponse(response);
            
            try {
                return JSON.parse(cleanedResponse);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                console.error('Cleaned Response:', cleanedResponse);
                throw new Error('Failed to parse GPT response as JSON');
            }
        } catch (error) {
            console.error('GPT Analysis Error:', error);
            throw new Error('GPT analysis failed: ' + error.message);
        }
    }

    // Add this helper method to clean the response
    cleanJsonResponse(response) {
        // Remove any markdown code block indicators
        let cleaned = response.replace(/```json\s?|```/g, '');
        
        // Remove any additional text before or after the JSON object
        cleaned = cleaned.trim();
        
        // Find the first '{' and last '}'
        const startIndex = cleaned.indexOf('{');
        const endIndex = cleaned.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error('No valid JSON object found in response');
        }
        
        // Extract just the JSON object
        cleaned = cleaned.slice(startIndex, endIndex + 1);
        
        return cleaned;
    }

    async performProductMatching(items) {
        const groupedItems = {
            newProducts: [],
            existingProducts: [],
            matchResults: []
        };

        for (const item of items) {
            try {
                const matchResult = await this.productMatcher.findMatchingProduct(item);
                
                if (matchResult.found && matchResult.confidence >= 0.7) {
                    groupedItems.existingProducts.push({
                        ...item,
                        productId: matchResult.product.product_id,
                        matchedName: matchResult.product.product_name,
                        matchedSku: matchResult.product.sku_number,
                        currentStock: matchResult.product.product_stock,
                        matchType: matchResult.matchType,
                        matchingFactors: matchResult.matchingFactors,
                        confidence: matchResult.confidence
                    });
                } else {
                    // Handle new product case
                    const parsedInfo = this.productMatcher.parseProductName(item.productName);
                    const suggestedSku = matchResult.suggestedSku || 
                        this.productMatcher.generateSku(parsedInfo);

                    groupedItems.newProducts.push({
                        ...item,
                        suggestedSku,
                        category: parsedInfo.category || 'General',
                        brand: parsedInfo.brand || item.manufacturer || 'Unknown',
                        specifications: parsedInfo.specifications,
                        matchType: 'new_product'
                    });
                }

                groupedItems.matchResults.push({
                    originalItem: item,
                    matchResult
                });
            } catch (error) {
                console.error(`Error matching product: ${item.productName}`, error);
                continue;
            }
        }

        return groupedItems;
    }

    normalizeMetadata(metadata) {
        return {
            poNumber: metadata.poNumber || `PO-${Date.now()}`,
            poDate: new Date(metadata.orderDate).toISOString(),
            vendorName: metadata.vendorName || 'Unknown Vendor',
            paymentTerms: (metadata.paymentTerms || 'Net 30').substring(0, 50),
            deliveryMethod: (metadata.deliveryMethod || 'Standard Delivery').substring(0, 50)
        };
    }

    normalizeItems(items) {
        return items.map(item => {
            // Convert price to cost since this is a purchase order
            const cost = parseFloat(item.price || item.cost);
            const quantity = parseInt(item.quantity);

            if (isNaN(cost) || isNaN(quantity)) {
                console.warn('Invalid cost or quantity for item:', item);
                throw new Error(`Invalid cost or quantity values for ${item.productName}`);
            }

            return {
                productName: item.productName,
                sku: this.normalizeSku(item),
                quantity: quantity,
                cost: parseFloat(cost).toFixed(2),
                totalCost: parseFloat(cost * quantity).toFixed(2),
                tax: parseFloat(cost * quantity * 0.06).toFixed(2),
                discount: parseFloat(item.discount || 0).toFixed(2)
            };
        });
    }

    normalizeSku(item) {
        // If SKU is already provided and valid, use it
        if (item.sku && typeof item.sku === 'string' && item.sku.trim()) {
            return item.sku.trim().toUpperCase();
        }

        // Generate SKU from product name if no SKU is provided
        const productName = item.productName || item.description || '';
        if (!productName) {
            throw new Error('Cannot generate SKU: No product name or description provided');
        }

        // Extract product category and model from name
        const categories = {
            'battery': 'BAT',
            'charger': 'CHR',
            'cable': 'CBL',
            'accessory': 'ACC'
            // Add more categories as needed
        };

        // Find matching category prefix
        let prefix = 'GEN'; // Default prefix for general items
        for (const [key, value] of Object.entries(categories)) {
            if (productName.toLowerCase().includes(key)) {
                prefix = value;
                break;
            }
        }

        // Generate a unique identifier from the product name
        const identifier = productName
            .replace(/[^A-Z0-9]/gi, '') // Remove special characters
            .substring(0, 5)            // Take first 5 characters
            .toUpperCase();

        return `${prefix}-${identifier}`;
    }

    async findProductBySkuOrName(item) {
        try {
            const sku = this.normalizeSku(item);
            const productName = item.productName || item.description;

            // Try to find by SKU first
            let product = await db.Product.findOne({
                where: {
                    sku_number: sku,
                    status_id: 1
                }
            });

            // If not found by SKU, try to find by name using fuzzy matching
            if (!product && productName) {
                product = await db.Product.findOne({
                    where: {
                        status_id: 1,
                        [Op.or]: [
                            // Exact match
                            { product_name: productName },
                            // Partial match
                            { product_name: { [Op.iLike]: `%${productName}%` } }
                        ]
                    }
                });
            }

            return {
                found: !!product,
                product,
                matchedBy: product ? (product.sku_number === sku ? 'sku' : 'name') : null,
                suggestedSku: sku
            };
        } catch (error) {
            console.error('Error finding product:', error);
            return {
                found: false,
                error: error.message,
                suggestedSku: this.normalizeSku(item)
            };
        }
    }

    async classifyItems(items, username) {
        // Input validation
        if (!items || !Array.isArray(items)) {
            console.warn('Invalid items input:', items);
            return {
                newProducts: [],
                existingProducts: [],
                matchResults: [] // Add tracking for match results
            };
        }

        try {
            const groupedItems = {
                newProducts: [],
                existingProducts: [],
                matchResults: [] // Track matching process for debugging
            };

            for (const item of items) {
                try {
                    // Validate individual item
                    if (!item) {
                        console.warn('Invalid item:', item);
                        continue;
                    }

                    let matchedProduct = null;
                    let matchType = null;

                    // Step 1: Try exact SKU match
                    if (item.sku) {
                        matchedProduct = await db.Product.findOne({
                            where: {
                                sku_number: item.sku.trim().toUpperCase(),
                                status_id: 1
                            }
                        });

                        if (matchedProduct) {
                            matchType = 'sku_exact';
                        }
                    }

                    // Step 2: If no SKU match, try fuzzy name matching
                    if (!matchedProduct && item.productName) {
                        const fuzzyMatches = await db.Product.findAll({
                            where: {
                                status_id: 1,
                                [Op.or]: [
                                    // Exact name match
                                    { product_name: item.productName },
                                    // Fuzzy match using PostgreSQL's similarity function
                                    sequelize.literal(`similarity(product_name, '${item.productName}') > 0.4`)
                                ]
                            },
                            order: [
                                // Order by similarity score descending
                                [sequelize.literal(`similarity(product_name, '${item.productName}')`), 'DESC']
                            ],
                            limit: 1 // Get the best match only
                        });

                        if (fuzzyMatches.length > 0) {
                            matchedProduct = fuzzyMatches[0];
                            matchType = 'name_fuzzy';
                        }
                    }

                    // Track the matching result
                    groupedItems.matchResults.push({
                        originalItem: item,
                        matchType,
                        matchedProduct: matchedProduct ? {
                            id: matchedProduct.product_id,
                            name: matchedProduct.product_name,
                            sku: matchedProduct.sku_number
                        } : null,
                        confidence: matchType === 'sku_exact' ? 1.0 : 
                                matchType === 'name_fuzzy' ? 0.8 : 0
                    });

                    if (matchedProduct) {
                        // Product exists in system
                        groupedItems.existingProducts.push({
                            ...item,
                            productId: matchedProduct.product_id,
                            currentStock: matchedProduct.product_stock,
                            price: matchedProduct.price,
                            matchType,
                            originalSku: item.sku,
                            matchedSku: matchedProduct.sku_number
                        });
                    } else {
                        // Generate a suggested SKU for new product
                        const suggestedSku = generateSku(item.productName);
                        console.log(`Product not found - suggesting SKU ${suggestedSku} for ${item.productName}`);
                        
                        groupedItems.newProducts.push({
                            ...item,
                            suggestedSku,
                            manufacturer: item.manufacturer || 'Unknown',
                            category: determineCategory(item.productName),
                            initialStock: 0
                        });
                    }
                } catch (error) {
                    console.error(`Error processing item ${item?.productName || 'unknown'}:`, error);
                    // Log error but continue processing other items
                    groupedItems.matchResults.push({
                        originalItem: item,
                        matchType: 'error',
                        error: error.message
                    });
                }
            }

            return groupedItems;

        } catch (error) {
            console.error('Error in classifyItems:', error);
            throw new Error('System error while classifying items: ' + error.message);
        }
    }

    async findProductMatch(item) {
        try {
            // First try SKU matching
            if (item.sku && typeof item.sku === 'string') {
                const skuMatch = await db.Product.findOne({
                    where: {
                        sku_number: item.sku.trim().toUpperCase(),
                        status_id: 1  // Ensure product is active
                    }
                });
                
                if (skuMatch) {
                    return {
                        found: true,
                        product: skuMatch,
                        matchType: 'sku'
                    };
                }
            }

            // If no SKU match, try fuzzy name matching
            const productName = item.productName || item.description;
            if (productName) {
                // Using PostgreSQL's similarity function for fuzzy matching
                // This gives us better control over match quality
                const nameMatch = await db.Product.findOne({
                    where: {
                        status_id: 1,
                        [Op.or]: [
                            // Exact match first
                            { product_name: productName },
                            // Then try fuzzy match with minimum similarity threshold
                            sequelize.literal(`SIMILARITY(product_name, '${productName}') > 0.4`)
                        ]
                    },
                    order: [
                        // Order by similarity score descending to get best match first
                        [sequelize.literal(`SIMILARITY(product_name, '${productName}')`), 'DESC']
                    ]
                });

                if (nameMatch) {
                    return {
                        found: true,
                        product: nameMatch,
                        matchType: 'name'
                    };
                }
            }

            // No match found
            return {
                found: false,
                suggestedSku: this.generateSku(item)
            };

        } catch (error) {
            console.error('Error in findProductMatch:', error);
            return {
                found: false,
                error: error.message,
                suggestedSku: this.generateSku(item)
            };
        }
    }

    // Helper method to determine product category
    determineCategory(productName) {
        if (!productName) return 'General';
        
        const categoryMap = {
            'battery': 'Battery',
            'charger': 'Charger',
            'cable': 'Cable',
            'accessory': 'Accessory'
        };

        const lowercaseName = productName.toLowerCase();
        for (const [key, value] of Object.entries(categoryMap)) {
            if (lowercaseName.includes(key)) {
                return value;
            }
        }

        return 'General';
    }

    validateFinancials(financials, items) {
        try {
            // Validate individual items first
            items.forEach((item, index) => {
                const cost = parseFloat(item.cost || item.price);
                const quantity = parseInt(item.quantity);
                
                if (isNaN(cost)) {
                    throw new Error(`Item ${item.productName} (index ${index}) has invalid cost value`);
                }
                if (isNaN(quantity)) {
                    throw new Error(`Item ${item.productName} (index ${index}) has invalid quantity value`);
                }
            });

            // Calculate totals using validated values
            const calculatedSubtotal = items.reduce((sum, item) => {
                const cost = parseFloat(item.cost || item.price);
                const quantity = parseInt(item.quantity);
                return sum + (cost * quantity);
            }, 0);

            const calculatedTax = calculatedSubtotal * 0.06;
            const shipping = 500.00;
            const calculatedTotal = calculatedSubtotal + calculatedTax + shipping;

            return {
                subtotal: parseFloat(calculatedSubtotal.toFixed(2)),
                tax: parseFloat(calculatedTax.toFixed(2)),
                shipping: parseFloat(shipping.toFixed(2)),
                grandTotal: parseFloat(calculatedTotal.toFixed(2)),
                itemizedTotals: items.map(item => ({
                    sku: item.sku,
                    lineTotal: parseFloat((parseFloat(item.cost || item.price) * parseInt(item.quantity)).toFixed(2))
                })),
                isValid: true
            };
        } catch (error) {
            console.error('Financial validation error:', error);
            return {
                isValid: false,
                error: error.message,
                details: 'Failed to validate financial calculations'
            };
        }
    }

    handleProcessingError(error) {
        const errorResponse = new Error();
        
        if (error.message.includes('GPT analysis failed')) {
            errorResponse.code = 'ANALYSIS_ERROR';
            errorResponse.message = 'Failed to analyze the document. Please ensure it contains valid purchase order information.';
        } else if (error.message.includes('Validation failed')) {
            errorResponse.code = 'VALIDATION_ERROR';
            errorResponse.message = error.message;
        } else {
            errorResponse.code = 'PROCESSING_ERROR';
            errorResponse.message = 'Error processing purchase order document. Please check the format and try again.';
        }

        return errorResponse;
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
        // Calculate subtotal from all items
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

        // Validate items first
        if (!Array.isArray(items) || items.length === 0) {
            errors.push('No valid items found in document');
            confidence *= 0.5;
        }

        // Validate each item has required fields
        items.forEach((item, index) => {
            if (!item.cost || !item.quantity) {
                errors.push(`Item at index ${index} missing required cost or quantity`);
                confidence *= 0.9;
            }
        });

        // Validate financials
        if (!financials || !financials.isValid) {
            errors.push('Financial calculations failed validation');
            if (financials && financials.error) {
                errors.push(`Financial error: ${financials.error}`);
            }
            confidence *= 0.7;
        }

        // Validate metadata
        if (!metadata.poNumber || !metadata.poDate || !metadata.vendorName) {
            errors.push('Missing required metadata fields');
            confidence *= 0.8;
        }

        const isValid = errors.length === 0;

        // Add detailed logging for debugging
        console.log('Validation Results:', {
            isValid,
            errors,
            confidence,
            itemCount: items.length,
            hasFinancials: !!financials,
            hasMetadata: !!metadata
        });

        return {
            isValid,
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

    async processPurchaseOrder(document) {
        const metadata = await this.extractMetadata(document);
        const items = await this.extractItems(document);
        const financials = await this.calculateFinancials(items);

        return {
            metadata: {
                ...metadata,
                documentType: 'purchase_order',
                processingConfidence: this.calculateConfidence(items)
            },
            extractedItems: items,
            financials
        };
    }

    extractItems(text) {
        const items = [];
        // Update pattern to be more generic and configurable
        const itemPattern = /([^\n]+?)\s+(\d+)\s+(\d+(?:\.\d{2})?)\s+(\d+(?:\.\d{2})?)/g;
        
        let match;
        while ((match = itemPattern.exec(text)) !== null) {
            try {
                const [fullMatch, description, quantity, price, total] = match;
                
                const item = {
                    description: description.trim(),
                    sku: this.generateSku(description), 
                    quantity: parseInt(quantity),
                    price: parseFloat(price),
                    total: parseFloat(total)
                };

                if (this.validateItem(item)) {
                    items.push(item);
                }
            } catch (error) {
                console.error('Error parsing item:', error);
            }
        }

        return items;
    }

    // Add helper method for SKU generation
    generateSku({ productName, category }) {
        const prefix = category ? category.substring(0, 3).toUpperCase() : 'GEN';
        const identifier = productName
            .replace(/[^A-Z0-9]/gi, '')
            .substring(0, 5)
            .toUpperCase();
        const timestamp = Date.now().toString().slice(-5);
        
        return `${prefix}-${identifier}${timestamp}`;
    }
}

module.exports = { DocumentProcessor, PurchaseOrderProcessor };