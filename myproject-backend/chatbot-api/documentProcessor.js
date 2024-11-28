const Tesseract = require('tesseract.js');
const { PDFExtract } = require('pdf.js-extract');
const pdfExtract = new PDFExtract();

async function processDocument(file) {
    try {
        console.log('Starting document processing for:', file.originalname);
        
        let extractedText = '';
        if (file.mimetype === 'application/pdf') {
            console.log('Processing PDF file...');
            extractedText = await extractTextFromPDF(file.buffer);
        } else if (file.mimetype.startsWith('image/')) {
            console.log('Processing image file...');
            extractedText = await extractTextFromImage(file.buffer);
        }

        // Enhanced text preprocessing
        const cleanedText = preprocessText(extractedText);
        console.log('Preprocessed text:', cleanedText);

        // Multiple parsing attempts with different patterns
        const parsedItems = await parseInventoryInfoWithMultipleStrategies(cleanedText);
        
        if (parsedItems.length === 0) {
            throw new Error('No items could be extracted from the document');
        }

        // Validate extracted items
        const validatedItems = validateExtractedItems(parsedItems);

        return {
            extractedItems: validatedItems,
            metadata: {
                filename: file.originalname,
                filesize: file.size,
                mimeType: file.mimetype,
                confidence: calculateConfidenceScore(validatedItems)
            }
        };

    } catch (error) {
        console.error('Document processing error:', error);
        throw error;
    }
}

async function extractTextFromImage(buffer) {
    try {
        // Enhanced Tesseract configuration
        const worker = await Tesseract.createWorker();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        
        // Configure Tesseract for better accuracy
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-.,()& ', // Allowed characters
            tessedit_pageseg_mode: '6', // Assume uniform text block
            tessedit_ocr_engine_mode: '3', // Use default + LSTM OCR Engine
            preserve_interword_spaces: '1',
            textord_heavy_nr: '1', // Handle noisy images better
            textord_min_linesize: '2.5' // Better handle small text
        });

        const { data: { text, confidence } } = await worker.recognize(buffer);
        console.log('OCR Confidence:', confidence);
        
        await worker.terminate();
        return text;
    } catch (error) {
        console.error('OCR processing error:', error);
        throw new Error('Failed to extract text from image');
    }
}

async function extractTextFromPDF(buffer) {
    try {
        const data = await pdfExtract.extractBuffer(buffer);
        return data.pages.map(page => page.content.map(item => item.str).join(' ')).join('\n');
    } catch (error) {
        console.error('PDF processing error:', error);
        throw new Error('Failed to extract text from PDF');
    }
}

function preprocessText(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
        .replace(/\s+/g, ' ')
        .replace(/['"]/g, '') // Remove quotes that might interfere with parsing
        .replace(/(\d),(\d)/g, '$1$2') // Remove thousands separators
        .trim();
}

function parseInventoryInfo(text) {
    console.log('Starting to parse text:', text);
    
    const items = [];
    
    // Split into lines and process each line
    const lines = text.split('\n');
    
    // Improved regex to match your format:
    // Matches patterns like "001 Car Battery - Model A123 50 350.00 1750"
    const itemRegex = /(\d{3})\s+(Car Battery|Truck Battery)\s+-\s+Model\s+([A-Z0-9]+)\s+(\d+)\s+(\d+(?:\.\d{2})?)\s+(\d+)/;
    
    lines.forEach(line => {
        const match = itemRegex.exec(line);
        if (match) {
            const item = {
                productName: `${match[2]} - Model ${match[3]}`,
                sku: `BAT-${match[3]}`,
                quantity: parseInt(match[4], 10),
                price: parseFloat(match[5]),
                total: parseFloat(match[6])
            };
            console.log('Found item:', item);
            items.push(item);
        }
    });

    if (items.length === 0) {
        console.log('No items found using primary regex, trying alternative pattern...');
        
        // Alternative pattern matching
        const basicPattern = /(?:Car|Truck) Battery.*?Model ([A-Z0-9]+)\s+(\d+)\s+(\d+(?:\.\d{2})?)/g;
        let match;
        
        while ((match = basicPattern.exec(text)) !== null) {
            const item = {
                productName: `Battery Model ${match[1]}`,
                sku: `BAT-${match[1]}`,
                quantity: parseInt(match[2], 10),
                price: parseFloat(match[3])
            };
            console.log('Found item with alternative pattern:', item);
            items.push(item);
        }
    }

    console.log('Final parsed items:', items);
    return items;
}

async function parseInventoryInfoWithMultipleStrategies(text) {
    const items = [];
    const strategies = [
        // Strategy 1: Standard format
        {
            pattern: /(\d{3})\s+(Car Battery|Truck Battery)\s*-\s*Model\s*([A-Z0-9]+)\s+(\d+)\s+(\d+(?:\.\d{2})?)\s+(\d+(?:\.\d{2})?)/g,
            extract: matches => ({
                productName: `${matches[2]} - Model ${matches[3]}`,
                sku: `BAT-${matches[3]}`,
                quantity: parseInt(matches[4], 10),
                price: parseFloat(matches[5]),
                total: parseFloat(matches[6])
            })
        },
        // Strategy 2: Looser format
        {
            pattern: /(?:Car|Truck)\s*Battery.*?Model\s*([A-Z0-9]+)\s+(\d+)\s+(\d+(?:\.\d{2})?)/g,
            extract: matches => ({
                productName: `Battery Model ${matches[1]}`,
                sku: `BAT-${matches[1]}`,
                quantity: parseInt(matches[2], 10),
                price: parseFloat(matches[3]),
                total: matches[2] * matches[3]
            })
        },
        // Strategy 3: Table format
        {
            pattern: /(\d{3})\s+([^\n]+?)\s+(\d+)\s+(\d+(?:\.\d{2})?)\s+(\d+(?:\.\d{2})?)/g,
            extract: matches => ({
                productName: matches[2].trim(),
                sku: `BAT-${matches[1]}`,
                quantity: parseInt(matches[3], 10),
                price: parseFloat(matches[4]),
                total: parseFloat(matches[5])
            })
        }
    ];

    // Try each strategy
    for (const strategy of strategies) {
        let match;
        while ((match = strategy.pattern.exec(text)) !== null) {
            try {
                const item = strategy.extract(match);
                if (isValidItem(item)) {
                    items.push(item);
                }
            } catch (error) {
                console.warn('Failed to extract item:', error);
                continue;
            }
        }
    }

    return items;
}

function isValidItem(item) {
    return (
        item.productName &&
        item.sku &&
        !isNaN(item.quantity) && item.quantity > 0 &&
        !isNaN(item.price) && item.price > 0 &&
        (!item.total || (item.total === item.quantity * item.price))
    );
}

function validateExtractedItems(items) {
    return items.map(item => ({
        ...item,
        confidence: calculateItemConfidence(item)
    })).filter(item => item.confidence > 0.7); // Only keep items with high confidence
}

function calculateItemConfidence(item) {
    let confidence = 1.0;
    
    // Check product name format
    if (!item.productName.match(/(Car|Truck)\s+Battery.*Model\s+[A-Z0-9]+/)) {
        confidence *= 0.8;
    }
    
    // Check price and quantity relationship
    if (item.total && Math.abs(item.total - (item.quantity * item.price)) > 0.01) {
        confidence *= 0.7;
    }
    
    // Check reasonable ranges
    if (item.price < 10 || item.price > 10000) confidence *= 0.6;
    if (item.quantity < 1 || item.quantity > 1000) confidence *= 0.6;
    
    return confidence;
}

function calculateConfidenceScore(items) {
    if (items.length === 0) return 0;
    return items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
}

module.exports = {
    processDocument,
    extractTextFromImage,
    extractTextFromPDF,
    parseInventoryInfo
};