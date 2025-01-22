const ChatbotService = require('./chatBotService');
const { ChatbotIntelligence } = require('./chatBotIntelligence');
const { DocumentProcessor, PurchaseOrderProcessor } = require('./documentProcessor');
const { OpenAI } = require("openai");
const db = require('../models');
const QueryBuilder = require('./queryBuilder');
const ChatIntegration = require('./chatIntegration');

async function createChatbotServices() {
    console.log('Starting services creation...');
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Validate API key is a string
    if (typeof apiKey !== 'string' || !apiKey) {
        throw new Error('Invalid OpenAI API key configuration');
    }

    // Database connection check - using a single try/catch block
    try {
        if (process.env.INITIALIZE_DB === 'false') {
            console.log('Database initialization skipped');
            return {
                // Return mock services or minimal implementation
                documentProcessor: {
                    processDocument: () => Promise.resolve({}),
                    extractItems: () => Promise.resolve([]),
                },
                purchaseOrderProcessor: {
                    processDocument: () => Promise.resolve({}),
                    extractItems: () => Promise.resolve([]),
                },
                chatbotService: {
                    processDocument: () => Promise.resolve({}),
                    generateAnalysisExplanation: () => Promise.resolve(''),
                },
                chatbotIntelligence: {
                    handleUserResponse: () => Promise.resolve(''),
                    generateAnalysisMessage: () => Promise.resolve(''),
                },
                queryBuilder: {},
                chatIntegration: {},
                openai: {}
            };
        }

        await db.sequelize.sync();
        console.log('Database synced successfully');

        await db.sequelize.authenticate();
    } catch (error) {
        throw new Error(`Database connection failed: ${error.message}`);
    }

    // Create OpenAI instance once
    const openai = new OpenAI({ apiKey });

    // Create services with the same OpenAI instance
    const baseProcessor = new DocumentProcessor(openai, db);
    const poProcessor = new PurchaseOrderProcessor(openai, db);
    const queryBuilder = new QueryBuilder(db);
    const chatIntegration = new ChatIntegration(db, openai);
    const chatbotService = new ChatbotService(openai, baseProcessor, poProcessor);
    const chatbotIntelligence = new ChatbotIntelligence(chatbotService, apiKey);

    return {
        documentProcessor: baseProcessor,
        purchaseOrderProcessor: poProcessor,
        chatbotService,
        chatbotIntelligence,
        queryBuilder,
        chatIntegration,
        openai  
    };
}

function validateService(service, name) {
    if (!service) {
        throw new Error(`Failed to initialize ${name} service`);
    }
    
    // Check for required methods based on service type
    const requiredMethods = {
        documentProcessor: ['processDocument', 'extractItems'],
        chatbotService: ['processDocument', 'generateAnalysisExplanation'],
        chatbotIntelligence: ['handleUserResponse', 'generateAnalysisMessage']
    };

    if (requiredMethods[name]) {
        requiredMethods[name].forEach(method => {
            if (typeof service[method] !== 'function') {
                throw new Error(`${name} service is missing required method: ${method}`);
            }
        });
    }

    return service;
}

// Export factory function with type checking helper
async function validateServiceCreation() {
    const services = await createChatbotServices();
    
    // Validate each critical service
    const validatedServices = {
        documentProcessor: validateService(services.documentProcessor, 'documentProcessor'),
        chatbotService: validateService(services.chatbotService, 'chatbotService'),
        chatbotIntelligence: validateService(services.chatbotIntelligence, 'chatbotIntelligence'),
        queryBuilder: validateService(services.queryBuilder, 'queryBuilder'),
        chatIntegration: validateService(services.chatIntegration, 'chatIntegration')
    };

    return validatedServices;
}

module.exports = {
    createChatbotServices,
    validateServiceCreation
};
