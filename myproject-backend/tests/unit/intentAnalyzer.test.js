const IntentAnalyzer = require('../../chatbot-api/intentAnalyzer');

// Mock OpenAI instance
const mockOpenAI = {
    chat: {
        completions: {
            create: jest.fn()
        }
    }
};

describe('IntentAnalyzer', () => {
    let intentAnalyzer;

    beforeEach(() => {
        intentAnalyzer = new IntentAnalyzer(mockOpenAI);
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('Intent Pattern Recognition', () => {
        test('should correctly identify INVENTORY intent patterns', () => {
            const patterns = intentAnalyzer.intentPatterns.INVENTORY.patterns;
            expect(patterns).toContain('stock');
            expect(patterns).toContain('inventory');
            expect(patterns).toContain('products');
        });

        test('should correctly identify SALES intent patterns', () => {
            const patterns = intentAnalyzer.intentPatterns.SALES.patterns;
            expect(patterns).toContain('sales');
            expect(patterns).toContain('revenue');
            expect(patterns).toContain('orders');
        });

        test('should have valid metrics for each intent', () => {
            expect(intentAnalyzer.intentPatterns.INVENTORY.metrics).toBeDefined();
            expect(intentAnalyzer.intentPatterns.SALES.metrics).toBeDefined();
            expect(intentAnalyzer.intentPatterns.APPOINTMENTS.metrics).toBeDefined();
        });
    });

    describe('Intent Cache', () => {
        test('should initialize with empty cache', () => {
            expect(intentAnalyzer.intentCache.size).toBe(0);
        });

        test('should have valid cache duration', () => {
            expect(intentAnalyzer.cacheDuration).toBe(5 * 60 * 1000); // 5 minutes
        });
    });

    describe('analyzeIntent', () => {
        const mockResponse = {
            choices: [{
                message: {
                    content: JSON.stringify({
                        intent: 'INVENTORY',
                        category: 'INVENTORY',
                        metrics: ['stock_levels', 'product_movement'],
                        parameters: {
                            filters: {},
                            timeRange: 'today',
                            specificItem: 'battery'
                        },
                        context: {
                            needsComparison: false,
                            requiresHistoricalData: false
                        }
                    })
                }
            }]
        };

        test('should analyze user message and return intent', async () => {
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
            const result = await intentAnalyzer.analyzeIntent('What is the current stock level?');
            
            // Test that OpenAI was called with correct parameters
            expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
            const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
            expect(callArgs.messages).toBeDefined();
            expect(callArgs.model).toBeDefined();
            
            // Test the returned result structure
            expect(result).toHaveProperty('intent', 'INVENTORY');
            expect(result).toHaveProperty('category', 'INVENTORY');
            expect(result).toHaveProperty('metrics');
            expect(result.metrics).toContain('stock_levels');
            expect(result).toHaveProperty('parameters');
            expect(result).toHaveProperty('context');
        });

        test('should use cache for repeated messages', async () => {
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
            const message = 'What is the current stock level?';
            
            // First call
            const firstResult = await intentAnalyzer.analyzeIntent(message);
            const firstCallCount = mockOpenAI.chat.completions.create.mock.calls.length;
            
            // Second call should use cache
            const secondResult = await intentAnalyzer.analyzeIntent(message);
            const secondCallCount = mockOpenAI.chat.completions.create.mock.calls.length;
            
            // The API should not be called again for the same message
            expect(secondCallCount).toBe(firstCallCount);
            expect(firstResult).toEqual(secondResult);
        });

        test('should handle API errors gracefully', async () => {
            mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));
            
            const result = await intentAnalyzer.analyzeIntent('test message');
            expect(result.intent).toBe('unknown');
            expect(result.category).toBe('GENERAL');
            expect(result.metrics).toEqual([]);
            expect(result.parameters).toBeDefined();
        });
    });

    describe('Intent Subcategories', () => {
        test('should have valid subcategories for INVENTORY intent', () => {
            const { subCategories } = intentAnalyzer.intentPatterns.INVENTORY;
            expect(subCategories).toBeDefined();
            expect(subCategories.unitAnalysis).toBeDefined();
            expect(subCategories.productIdentification).toBeDefined();
        });

        test('should have valid metrics for subcategories', () => {
            const { unitAnalysis, productIdentification } = intentAnalyzer.intentPatterns.INVENTORY.subCategories;
            
            expect(unitAnalysis.metrics).toContain('serial_tracking');
            expect(unitAnalysis.metrics).toContain('warranty_status');
            
            expect(productIdentification.metrics).toContain('alias_lookup');
            expect(productIdentification.metrics).toContain('confidence_scoring');
        });
    });

    describe('validateAndEnrichIntent', () => {
        test('should enrich INVENTORY intent with stock alerts', () => {
            const baseIntent = {
                category: 'INVENTORY',
                metrics: ['stock_levels'],
                parameters: {},
                context: {}
            };
            const enriched = intentAnalyzer.validateAndEnrichIntent(baseIntent);
            expect(enriched.parameters.requiresStockAlert).toBe(true);
            expect(enriched.metrics).toContain('low_stock');
        });

        test('should add historical data context for product movement', () => {
            const baseIntent = {
                category: 'INVENTORY',
                metrics: ['product_movement'],
                parameters: {},
                context: {}
            };
            const enriched = intentAnalyzer.validateAndEnrichIntent(baseIntent);
            expect(enriched.context.requiresHistoricalData).toBe(true);
        });

        test('should handle organization hierarchy', () => {
            const baseIntent = {
                category: 'INVENTORY',
                metrics: [],
                parameters: { organizationId: '123' },
                context: {}
            };
            const enriched = intentAnalyzer.validateAndEnrichIntent(baseIntent);
            expect(enriched.context.organizationScope).toBe('hierarchy');
            expect(enriched.metrics).toContain('org_structure');
        });

        test('should handle unit-level queries', () => {
            const baseIntent = {
                category: 'INVENTORY',
                metrics: [],
                parameters: { serialNumber: 'ABC123' },
                context: {}
            };
            const enriched = intentAnalyzer.validateAndEnrichIntent(baseIntent);
            expect(enriched.context.unitLevelDetail).toBe(true);
            expect(enriched.metrics).toContain('unit_tracking');
        });
    });

    describe('Intent Cache Expiration', () => {
        test('should expire cache after duration', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            category: 'INVENTORY',
                            intent: 'check_stock',
                            metrics: [],
                            parameters: {},
                            context: {}
                        })
                    }
                }]
            };
            
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
            const message = 'Check stock levels';
            
            // First call
            await intentAnalyzer.analyzeIntent(message);
            const firstCallCount = mockOpenAI.chat.completions.create.mock.calls.length;
            
            // Simulate cache expiration
            const cachedItem = intentAnalyzer.intentCache.get(message.toLowerCase().trim());
            cachedItem.timestamp = Date.now() - (intentAnalyzer.cacheDuration + 1000);
            intentAnalyzer.intentCache.set(message.toLowerCase().trim(), cachedItem);
            
            // Second call should not use expired cache
            await intentAnalyzer.analyzeIntent(message);
            const secondCallCount = mockOpenAI.chat.completions.create.mock.calls.length;
            
            expect(secondCallCount).toBe(firstCallCount + 1);
        });
    });

    describe('Message Normalization', () => {
        test('should normalize messages with different cases', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            category: 'INVENTORY',
                            intent: 'check_stock',
                            metrics: [],
                            parameters: {},
                            context: {}
                        })
                    }
                }]
            };
            
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
            
            // First call with lowercase
            await intentAnalyzer.analyzeIntent('check stock');
            const firstCallCount = mockOpenAI.chat.completions.create.mock.calls.length;
            
            // Second call with different case but same message
            await intentAnalyzer.analyzeIntent('CHECK STOCK');
            const secondCallCount = mockOpenAI.chat.completions.create.mock.calls.length;
            
            expect(secondCallCount).toBe(firstCallCount);
        });

        test('should normalize messages with extra whitespace', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            category: 'INVENTORY',
                            intent: 'check_stock',
                            metrics: [],
                            parameters: {},
                            context: {}
                        })
                    }
                }]
            };
            
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
            
            // First call with normal spacing
            await intentAnalyzer.analyzeIntent('check stock');
            const firstCallCount = mockOpenAI.chat.completions.create.mock.calls.length;
            
            // Second call with extra whitespace
            await intentAnalyzer.analyzeIntent('  check   stock  ');
            const secondCallCount = mockOpenAI.chat.completions.create.mock.calls.length;
            
            expect(secondCallCount).toBe(firstCallCount);
        });
    });

    describe('Response Format', () => {
        test('should return response in correct format', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            category: 'INVENTORY',
                            intent: 'check_stock',
                            metrics: ['stock_levels'],
                            parameters: {
                                timeRange: 'today',
                                specificItem: 'battery',
                                filters: {
                                    category: 'electronics',
                                    brand: 'duracell'
                                }
                            },
                            context: {
                                requiresHistoricalData: false,
                                needsComparison: false
                            }
                        })
                    }
                }]
            };
            
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
            const result = await intentAnalyzer.analyzeIntent('Check battery stock levels');
            
            expect(result).toHaveProperty('category');
            expect(result).toHaveProperty('intent');
            expect(result).toHaveProperty('metrics');
            expect(result).toHaveProperty('parameters');
            expect(result).toHaveProperty('parameters.filters');
            expect(result).toHaveProperty('context');
        });

        test('should handle malformed API responses', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: 'Invalid JSON'
                    }
                }]
            };
            
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
            const result = await intentAnalyzer.analyzeIntent('Check stock');
            
            expect(result.category).toBe('GENERAL');
            expect(result.intent).toBe('unknown');
        });
    });

    describe('Intent Categories', () => {
        test('should correctly identify SALES intent', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            category: 'SALES',
                            intent: 'check_revenue',
                            metrics: ['daily_sales', 'sales_trends'],
                            parameters: {
                                timeRange: 'today',
                                filters: {}
                            },
                            context: {
                                requiresHistoricalData: true,
                                needsComparison: false
                            }
                        })
                    }
                }]
            };
            
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
            const result = await intentAnalyzer.analyzeIntent('Show me today\'s sales');
            
            expect(result.category).toBe('SALES');
            expect(result.metrics).toContain('daily_sales');
            expect(result.context.requiresHistoricalData).toBe(true);
        });

        test('should correctly identify APPOINTMENTS intent', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            category: 'APPOINTMENTS',
                            intent: 'check_schedule',
                            metrics: ['upcoming_appointments', 'technician_schedule'],
                            parameters: {
                                timeRange: 'today',
                                filters: {}
                            },
                            context: {
                                requiresHistoricalData: false,
                                needsComparison: false
                            }
                        })
                    }
                }]
            };
            
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
            const result = await intentAnalyzer.analyzeIntent('Show me today\'s appointments');
            
            expect(result.category).toBe('APPOINTMENTS');
            expect(result.metrics).toContain('upcoming_appointments');
        });
    });

    describe('Metric Validation', () => {
        test('should validate and filter invalid metrics', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            category: 'INVENTORY',
                            intent: 'check_stock',
                            metrics: ['stock_levels', 'low_stock'],
                            parameters: {},
                            context: {}
                        })
                    }
                }]
            };
            
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
            const result = await intentAnalyzer.analyzeIntent('Check stock');
            
            expect(result.metrics).toContain('stock_levels');
            expect(result.metrics).toContain('low_stock');
            expect(result.metrics.length).toBe(2);
        });

        test('should handle empty metrics array', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            category: 'INVENTORY',
                            intent: 'check_stock',
                            metrics: ['stock_levels'],
                            parameters: {},
                            context: {}
                        })
                    }
                }]
            };
            
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
            const result = await intentAnalyzer.analyzeIntent('Check stock');
            
            expect(Array.isArray(result.metrics)).toBe(true);
            expect(result.metrics).toContain('stock_levels');
            expect(result.metrics.length).toBe(1);
        });
    });
});
