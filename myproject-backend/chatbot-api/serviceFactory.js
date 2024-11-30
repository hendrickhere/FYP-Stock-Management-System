const ChatbotService = require('./chatBotService');
const { ChatbotIntelligence } = require('./chatBotIntelligence');
const DocumentProcessor = require('./documentProcessor');

function createChatbotServices() {
    console.log('Initializing chatbot services...');

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    // Create services in dependency order
    const documentProcessor = new DocumentProcessor();
    
    // Initialize base service
    const chatbotService = new ChatbotService(apiKey, documentProcessor);

    const chatbotIntelligence = new ChatbotIntelligence(chatbotService, apiKey);

    // Create middleware to attach services to requests
    const attachServices = (req, res, next) => {
        req.services = {
            documentProcessor,
            chatbotService,
            chatbotIntelligence
        };
        next();
    };
    
    // Return all services
    return { documentProcessor, chatbotService, chatbotIntelligence };
}

// Export the factory function
module.exports = { createChatbotServices };
