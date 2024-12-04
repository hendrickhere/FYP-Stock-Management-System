const ChatbotService = require('./chatBotService');
const { ChatbotIntelligence } = require('./chatBotIntelligence');
const { DocumentProcessor, PurchaseOrderProcessor } = require('./documentProcessor');

function createProcessors() {
    // Create document processors
    const baseProcessor = new DocumentProcessor();
    const poProcessor = new PurchaseOrderProcessor();

    return {
        baseProcessor,
        poProcessor
    };
}

function createChatbotServices() {
    // Create processors first
    const { baseProcessor, poProcessor } = createProcessors();
    
    // Create chatbot service with explicit processor injection
    const chatbotService = new ChatbotService(
        process.env.OPENAI_API_KEY,
        baseProcessor,
        poProcessor
    );

    // Create chatbot intelligence with chatbot service
    const chatbotIntelligence = new ChatbotIntelligence(
        chatbotService,
        process.env.OPENAI_API_KEY
    );

    return {
        documentProcessor: baseProcessor,  // Use baseProcessor as the main document processor
        chatbotService,
        chatbotIntelligence,
        processors: { baseProcessor, poProcessor }  // Include processors in case needed elsewhere
    };
}

module.exports = {
    createChatbotServices
};
