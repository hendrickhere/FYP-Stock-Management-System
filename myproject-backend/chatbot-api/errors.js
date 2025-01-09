class ChatbotError extends Error {
    constructor(code, message, details = {}) {
        super(message);
        this.code = code;
        this.details = details;
    }
}

module.exports = {
    ChatbotError,
    // Add error types
    INTENT_ERROR: 'INTENT_ERROR',
    QUERY_ERROR: 'QUERY_ERROR',
    PROCESSING_ERROR: 'PROCESSING_ERROR'
};