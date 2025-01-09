const IntentAnalyzer = require('./intentAnalyzer');
const QueryBuilder = require('./queryBuilder');

class ChatIntegration {
    constructor(db, openai) {
        if (!db || !openai) {
            throw new Error('Database and OpenAI instances are required for ChatIntegration');
        }

        this.db = db;
        this.intentAnalyzer = new IntentAnalyzer(openai);
        this.queryBuilder = new QueryBuilder(db);
        this.requestLog = new Map();
    }

    async processUserQuery(message, username) {
        const requestId = Date.now().toString();
        try {
            // Log request start
            this.logRequest(requestId, 'start', { message, username });

            const intent = await this.intentAnalyzer.analyzeIntent(message);
            this.logRequest(requestId, 'intent_analyzed', { intent });

            const queryResults = await this.executeQueriesForIntent(intent, username);
            this.logRequest(requestId, 'queries_executed', { queryResults });

            const response = this.formatResponse(intent, queryResults);
            this.logRequest(requestId, 'complete', { response });

            return response;

        } catch (error) {
            this.logRequest(requestId, 'error', { error: error.message });
            
            // Attempt recovery for certain errors
            if (this.isRecoverableError(error)) {
                return await this.handleRecovery(message, username, error);
            }
            
            throw error;
        }
    }

    logRequest(requestId, stage, data) {
        if (!this.requestLog.has(requestId)) {
            this.requestLog.set(requestId, []);
        }
        this.requestLog.get(requestId).push({
            stage,
            timestamp: new Date(),
            data
        });
    }

    async executeQueriesForIntent(intent, username) {
        const queryParams = {
            userId: username,
            timeRange: intent.parameters?.timeRange || 'today',
            specificItem: intent.parameters?.specificItem || null
        };

        const results = {};
        
        // Execute each requested metric query
        for (const metric of intent.metrics) {
            try {
                const result = await this.queryBuilder.executeQuery(
                    intent.category,
                    metric,
                    queryParams
                );
                results[metric] = result;
            } catch (error) {
                console.error(`Error executing query for metric ${metric}:`, error);
                results[metric] = { error: error.message };
            }
        }

        return results;
    }

    formatResponse(intent, queryResults) {
        // Create a structured response based on the intent and query results
        return {
            message: this.generateResponseMessage(intent, queryResults),
            data: {
                metrics: queryResults,
                insights: this.generateInsights(queryResults, intent),
                recommendations: this.generateRecommendations(queryResults, intent)
            },
            suggestions: this.generateSuggestions(intent, queryResults)
        };
    }

    generateResponseMessage(intent, results) {
        // Generate a natural language response based on the intent and results
        let message = '';
        
        switch (intent.category) {
            case 'INVENTORY':
                message = this.formatInventoryResponse(results);
                break;
            case 'SALES':
                message = this.formatSalesResponse(results);
                break;
            default:
                message = 'I found some information that might help you.';
        }

        return message;
    }

    // Helper methods for formatting different types of responses
    formatInventoryResponse(results) {
        let response = '';
        
        if (results.stock_levels) {
            const totalProducts = results.stock_levels.length;
            const lowStockCount = results.low_stock?.length || 0;
            
            response += `I found ${totalProducts} products in your inventory. `;
            if (lowStockCount > 0) {
                response += `${lowStockCount} products are running low on stock. `;
            }
        }

        return response;
    }

}

module.exports = ChatIntegration;