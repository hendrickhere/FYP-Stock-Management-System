const logger = {
    info: (message, context = {}) => {
        console.log(JSON.stringify({
            level: 'info',
            message,
            context,
            timestamp: new Date()
        }));
    },
    error: (message, error, context = {}) => {
        console.error(JSON.stringify({
            level: 'error',
            message,
            error: error.message,
            stack: error.stack,
            context,
            timestamp: new Date()
        }));
    }
};

module.exports = logger;