const ChatbotService = require('./chatBotService');
const { ChatbotIntelligence } = require('./chatBotIntelligence');
const { DocumentProcessor, PurchaseOrderProcessor } = require('./documentProcessor');
const { OpenAI } = require("openai");
const db = require('../models');

function createProcessors(apiKey, database) {
    // Create OpenAI instance to be shared across services
    const openai = new OpenAI({ apiKey });

    // Create document processors with both OpenAI and database injection
    const baseProcessor = new DocumentProcessor(openai, database);
    
    // Pass both dependencies to PurchaseOrderProcessor
    const poProcessor = new PurchaseOrderProcessor(openai, database);

    return {
        baseProcessor,
        poProcessor,
        openai
    };
}

function createChatbotServices() {
    // Validate essential dependencies
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is required but not found in environment variables');
    }

    if (!db || !db.sequelize) {
        throw new Error('Database connection is required but not properly initialized');
    }

    try {
        // Initialize database connection if not already done
        if (!db.sequelize.authenticate()) {
            throw new Error('Database connection failed');
        }

        // Create processors with both OpenAI and database instances
        const { baseProcessor, poProcessor, openai } = createProcessors(
            process.env.OPENAI_API_KEY,
            db
        );
        
        // Create chatbot service with enhanced processors
        const chatbotService = new ChatbotService(
            openai,
            baseProcessor,
            poProcessor
        );

        // Create chatbot intelligence with all required dependencies
        const chatbotIntelligence = new ChatbotIntelligence(
            chatbotService,
            openai,
            db // Pass database instance to ChatbotIntelligence
        );

        // Return all service instances with documentation
        return {
            // Core processing components
            documentProcessor: baseProcessor,
            purchaseOrderProcessor: poProcessor,
            
            // Service layer components
            chatbotService,
            chatbotIntelligence,
            
            // Individual processors for specific use cases
            processors: { 
                baseProcessor, 
                poProcessor 
            },

            // Database instance for direct access if needed
            db
        };
    } catch (error) {
        console.error('Failed to initialize chatbot services:', error);
        throw new Error(`Service initialization failed: ${error.message}`);
    }
}

// Export factory function with type checking helper
function validateServiceCreation() {
    const services = createChatbotServices();
    
    // Validate that all critical services are present
    const requiredServices = [
        'documentProcessor',
        'chatbotService',
        'chatbotIntelligence'
    ];

    const missingServices = requiredServices.filter(
        service => !services[service]
    );

    if (missingServices.length > 0) {
        throw new Error(
            `Service initialization incomplete. Missing: ${missingServices.join(', ')}`
        );
    }

    return services;
}

module.exports = {
    createChatbotServices,
    validateServiceCreation
};
