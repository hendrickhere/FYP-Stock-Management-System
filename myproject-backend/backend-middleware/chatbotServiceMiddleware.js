const { createChatbotServices } = require('../chatbot-api/serviceFactory');

// Single instance of services that will be reused across requests
let servicesInstance = null;

// Single function to handle service initialization
async function initializeServices() {
    try {
        // Only initialize services if they haven't been created yet
        if (!servicesInstance) {
            console.log('Initializing new services instance...');
            
            // Create services using the factory
            const services = await createChatbotServices();
            
            // Validate that we got back a valid services object
            if (!services) {
                throw new Error('Service initialization returned null or undefined');
            }

            // Validate the document processor specifically
            if (!services.documentProcessor) {
                throw new Error('DocumentProcessor not initialized in services');
            }

            // Make sure the required method exists
            if (typeof services.documentProcessor.processDocument !== 'function') {
                throw new Error('processDocument method not found in DocumentProcessor');
            }

            // Store the validated services
            servicesInstance = services;
            
            console.log('Services initialized successfully with components:', 
                Object.keys(services));
        }
        
        return servicesInstance;
    } catch (error) {
        // Clear the instance if initialization fails so we can try again
        console.error('Service initialization error:', error);
        servicesInstance = null;
        throw error;
    }
}

// The actual middleware function
const chatbotServiceMiddleware = async (req, res, next) => {
    try {
        console.log('Chatbot service middleware starting...');

        // Get or initialize services
        const services = await initializeServices();
        
        // Attach services to the request object
        req.services = services;

        // Validate services are properly attached
        if (!req.services || !req.services.documentProcessor) {
            throw new Error('Services not properly attached to request');
        }

        // Log successful service attachment
        console.log('Services successfully attached to request:', {
            availableServices: Object.keys(req.services),
            hasDocumentProcessor: !!req.services.documentProcessor,
            hasProcessDocument: typeof req.services.documentProcessor.processDocument === 'function'
        });

        // Continue to next middleware
        next();
    } catch (error) {
        // Enhanced error logging
        console.error('Chatbot Service Middleware Error:', {
            error: error.message,
            stack: error.stack,
            serviceStatus: servicesInstance ? 'initialized' : 'not initialized'
        });

        // Send error response
        res.status(500).json({ 
            success: false,
            message: 'Failed to initialize chatbot services',
            error: error.message,
            code: 'SERVICE_INITIALIZATION_FAILED'
        });
    }
};

// Export both the middleware and initialization function
module.exports = {
    chatbotServiceMiddleware,
    initializeServices
};