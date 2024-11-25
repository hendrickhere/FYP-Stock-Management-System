const Tesseract = require('tesseract.js');
const { PDFExtract } = require('pdf.js-extract');
const pdfExtract = new PDFExtract();

async function processDocument(file) {
    try {
        console.log('Starting document processing for:', file.originalname);
        
        // Step 1: Extract text using OCR/PDF parser
        let extractedText = '';
        if (file.mimetype === 'application/pdf') {
            console.log('Processing PDF file...');
            extractedText = await extractTextFromPDF(file.buffer);
        } else if (file.mimetype.startsWith('image/')) {
            console.log('Processing image file...');
            extractedText = await extractTextFromImage(file.buffer);
        }

        console.log('Raw extracted text:', extractedText);

        // Clean up the extracted text
        const cleanedText = extractedText
            .replace(/\r\n/g, '\n')
            .replace(/\s+/g, ' ')
            .trim();

        console.log('Cleaned text:', cleanedText);

        // Step 2: Parse the extracted text for inventory items
        const parsedItems = parseInventoryInfo(cleanedText);
        console.log('Parsed items:', parsedItems);

        if (parsedItems.length === 0) {
            throw new Error('No items could be extracted from the document. Raw text was:\n' + cleanedText);
        }

        return {
            extractedItems: parsedItems,
            metadata: {
                filename: file.originalname,
                filesize: file.size,
                mimeType: file.mimetype
            }
        };

    } catch (error) {
        console.error('Document processing error:', error);
        throw error;
    }
}

async function extractTextFromImage(buffer) {
    try {
        const worker = await Tesseract.createWorker('eng');
        const { data: { text } } = await worker.recognize(buffer);
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

module.exports = {
    processDocument,
    extractTextFromImage,
    extractTextFromPDF,
    parseInventoryInfo
};