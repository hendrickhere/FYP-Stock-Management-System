class IntentAnalyzer {
    constructor(openai) {
        this.openai = openai;
        this.intentCache = new Map();
        this.cacheDuration = 5 * 60 * 1000;
        
        this.intentPatterns = {
            INVENTORY: {
                patterns: [
                    'stock', 'inventory', 'products', 'items', 'levels', 
                    'battery', 'batteries', 'expiring', 'low stock',
                    'serial number', 'unit', 'product units', 'aliases'
                ],

                metrics: [
                    'stock_levels',           // Overall stock status
                    'low_stock',              // Items below threshold
                    'expiring_soon',          // Items nearing expiry
                    'stock_value',            // Inventory valuation
                    'product_movement',       // Stock movement trends
                    'unit_tracking',          // Individual unit tracking
                    'alias_matching',         // Product alias analysis
                    'warranty_coverage'       // Warranty status for units
                ],

                subCategories: {
                    unitAnalysis: {
                        metrics: [
                            'serial_tracking',     // Track specific serial numbers
                            'warranty_status',     // Unit warranty information
                            'sales_history'        // Unit sales tracking
                        ],
                        patterns: [
                            'serial', 'unit details', 'warranty check',
                            'unit history', 'tracking'
                        ]
                    },
                    productIdentification: {
                        metrics: [
                            'alias_lookup',        // Find products by alternate names
                            'confidence_scoring',   // Alias matching confidence
                            'source_verification'   // Verify alias sources
                        ],
                        patterns: [
                            'find product', 'search', 'lookup',
                            'similar names', 'alternates'
                        ]
                    }
                }
            },

            SALES: {
                patterns: [
                    'sales', 'revenue', 'orders', 'transactions',
                    'customer purchases', 'sales performance'
                ],
                metrics: [
                    'daily_sales',          // Today's sales
                    'sales_trends',         // Historical trends
                    'product_performance',  // Product-wise analysis
                    'customer_insights'     // Customer buying patterns
                ]
            },

            APPOINTMENTS: {
                patterns: [
                    'appointments', 'schedule', 'bookings', 'service',
                    'technician', 'upcoming'
                ],
                metrics: [
                    'upcoming_appointments',    // Future appointments
                    'appointment_status',       // Status tracking
                    'technician_schedule',      // Technician availability
                    'service_analytics'         // Service type analysis
                ]
            },

            ORGANIZATION: {
                patterns: [
                    'organization', 'company', 'business unit',
                    'department', 'branch', 'structure'
                ],
                metrics: [
                    'org_inventory',          // Organization-wide inventory
                    'org_performance',        // Organization performance
                    'discount_programs',      // Active discount programs
                    'org_structure'           // Organization hierarchy
                ]
            },

            DISCOUNTS: {
                patterns: [
                    'discount', 'promotion', 'offer', 'sale',
                    'special price', 'markdown'
                ],
                metrics: [
                    'active_discounts',       // Currently active discounts
                    'discount_performance',   // Discount program performance
                    'discount_planning',      // Future discount planning
                    'discount_impact'         // Impact on sales
                ]
            },

            PURCHASE_ORDERS: {
                patterns: [
                    'purchase order', 'PO', 'vendor orders', 'buying', 'procurement',
                    'incoming stock', 'deliveries', 'supplier orders', 'inventory purchase'
                ],
                metrics: [
                    'po_status',              // Track purchase order status
                    'pending_deliveries',     // Monitor upcoming deliveries
                    'unregistered_units',     // Track unregistered quantities
                    'vendor_performance',     // Analyze vendor delivery performance
                    'purchase_analytics'      // Overall purchasing analytics
                ],
                subCategories: {
                    orderTracking: {
                        metrics: [
                            'delivery_status',     // Track delivery status
                            'item_registration',   // Monitor item registration progress
                            'tax_summary'          // Tax calculations and summary
                        ],
                        patterns: [
                            'delivery tracking', 'registration status',
                            'pending items', 'tax calculation'
                        ]
                    },
                    vendorAnalysis: {
                        metrics: [
                            'delivery_time',       // Vendor delivery performance
                            'price_trends',        // Price analysis over time
                            'quality_metrics'      // Product quality metrics
                        ],
                        patterns: [
                            'vendor performance', 'delivery times',
                            'pricing analysis', 'quality review'
                        ]
                    }
                }
            },

            SALES_ANALYSIS: {
                    patterns: [
                        'sales performance', 'revenue analysis', 'order trends',
                        'tax analysis', 'profit margins', 'discount impact',
                        'sales metrics', 'order statistics'
                    ],
                    metrics: [
                        'sales_overview',         // High-level sales metrics
                        'tax_analysis',          // Tax application patterns
                        'discount_impact',       // Discount effectiveness
                        'payment_patterns',      // Payment terms analysis
                        'delivery_metrics'       // Delivery method effectiveness
                    ],
                    subCategories: {
                        orderAnalysis: {
                            metrics: [
                                'order_progression',    // Order status flow analysis
                                'fulfillment_time',     // Order processing time
                                'payment_compliance',   // Payment terms adherence
                                'delivery_performance'  // Delivery success rates
                            ],
                            patterns: [
                                'order tracking', 'processing time',
                                'payment tracking', 'delivery stats'
                            ]
                        },
                        financialMetrics: {
                            metrics: [
                                'revenue_breakdown',    // Revenue by product/category
                                'tax_distribution',     // Tax application patterns
                                'discount_efficiency',  // Discount ROI analysis
                                'margin_analysis'       // Profit margin tracking
                            ],
                            patterns: [
                                'revenue reports', 'tax breakdown',
                                'discount effectiveness', 'profit analysis'
                            ]
                        },
                        customerBehavior: {
                            metrics: [
                                'purchase_patterns',    // Buying behavior analysis
                                'payment_preferences',  // Preferred payment terms
                                'delivery_choices',     // Delivery method preferences
                                'discount_response'     // Response to promotions
                            ],
                            patterns: [
                                'customer trends', 'buying patterns',
                                'payment choices', 'promotion response'
                            ]
                        }
                    }
            },

            FULFILLMENT_TRACKING: {
                    patterns: [
                        'receipt', 'shipping status', 'delivery tracking',
                        'order documents', 'invoice status', 'payment confirmation',
                        'shipment updates', 'delivery confirmation'
                    ],
                    metrics: [
                        'document_status',        // Track all order-related documents
                        'shipping_analytics',     // Shipping performance metrics
                        'payment_verification',   // Payment and receipt tracking
                        'fulfillment_status'     // Overall fulfillment tracking
                    ],
                    subCategories: {
                        documentTracking: {
                            metrics: [
                                'receipt_status',      // Track receipt generation and sending
                                'invoice_tracking',    // Monitor invoice status
                                'payment_proof',       // Payment verification documents
                                'shipping_docs'        // Shipping-related documentation
                            ],
                            patterns: [
                                'find receipt', 'check invoice',
                                'payment documents', 'shipping papers'
                            ]
                        },
                        deliveryAnalysis: {
                            metrics: [
                                'delivery_success',    // Successful delivery rates
                                'transit_time',        // Time in transit analysis
                                'carrier_performance', // Shipping carrier analysis
                                'address_accuracy'     // Delivery address validation
                            ],
                            patterns: [
                                'delivery status', 'shipping time',
                                'carrier tracking', 'address verification'
                            ]
                        },
                        paymentVerification: {
                            metrics: [
                                'payment_matching',    // Match payments to orders
                                'receipt_validation',  // Validate receipt details
                                'refund_tracking',     // Track refund status
                                'payment_methods'      // Payment method analysis
                            ],
                            patterns: [
                                'verify payment', 'check receipt',
                                'refund status', 'payment method'
                            ]
                        }
                    }
            },

            TAX_MANAGEMENT: {
                        patterns: [
                            'tax rates', 'tax status', 'tax calculations',
                            'tax reports', 'tax summary', 'tax analysis',
                            'tax compliance', 'tax settings'
                        ],
                        metrics: [
                            'tax_overview',          // Overview of tax configurations
                            'tax_application',       // How taxes are being applied
                            'tax_collection',        // Tax collection analysis
                            'tax_reporting'          // Tax reporting metrics
                        ],
                        subCategories: {
                            taxConfiguration: {
                                metrics: [
                                    'active_tax_rates',    // Currently active tax rates
                                    'tax_changes',         // Historical tax rate changes
                                    'tax_categories',      // Tax categorization
                                    'tax_rules'           // Tax application rules
                                ],
                                patterns: [
                                    'tax setup', 'rate configuration',
                                    'tax rules', 'tax categories'
                                ]
                            },
                            taxCompliance: {
                                metrics: [
                                    'collection_status',   // Tax collection status
                                    'filing_deadlines',    // Tax filing deadlines
                                    'compliance_checks',   // Tax compliance checks
                                    'audit_trails'        // Tax audit history
                                ],
                                patterns: [
                                    'tax compliance', 'filing status',
                                    'tax audit', 'compliance check'
                                ]
                            }
                        }
            },

            USER_MANAGEMENT: {
                    patterns: [
                        'user access', 'permissions', 'roles',
                        'user activity', 'login history', 'user settings'
                    ],
                    metrics: [
                        'user_activity',         // User activity tracking
                        'access_patterns',       // Access pattern analysis
                        'role_distribution',     // Role distribution stats
                        'permission_usage'       // Permission usage patterns
                    ],
                    subCategories: {
                        accessControl: {
                            metrics: [
                                'permission_audit',    // Permission audit trails
                                'role_changes',        // Role change history
                                'access_violations',   // Access violation attempts
                                'security_checks'      // Security compliance checks
                            ],
                            patterns: [
                                'check permissions', 'role audit',
                                'security check', 'access review'
                            ]
                        },
                        organizationHierarchy: {
                            metrics: [
                                'org_structure',       // Organization structure
                                'user_distribution',   // User distribution
                                'role_hierarchy',      // Role hierarchy analysis
                                'access_levels'        // Access level distribution
                            ],
                            patterns: [
                                'org chart', 'user roles',
                                'hierarchy', 'structure review'
                            ]
                        }
                    }
            },

            WARRANTY_MANAGEMENT: {
                        patterns: [
                            'warranty status', 'warranty claims', 'warranty coverage',
                            'warranty expiry', 'warranty tracking', 'warranty analysis',
                            'claim status', 'warranty registration', 'warranty units'
                        ],
                        metrics: [
                            'warranty_overview',       // Overall warranty status and metrics
                            'claim_analytics',         // Warranty claim analysis
                            'coverage_tracking',       // Active warranty coverage tracking
                            'expiry_monitoring'       // Warranty expiration monitoring
                        ],
                        subCategories: {
                            claimProcessing: {
                                metrics: [
                                    'claim_status_tracking',    // Track claim progression
                                    'resolution_metrics',       // Claim resolution analysis
                                    'response_times',          // Claim response time tracking
                                    'approval_rates'           // Claim approval analytics
                                ],
                                patterns: [
                                    'claim status', 'claim resolution',
                                    'claim approval', 'claim processing'
                                ]
                            },
                            unitWarranties: {
                                metrics: [
                                    'unit_coverage',           // Unit-level warranty tracking
                                    'activation_status',       // Warranty activation tracking
                                    'coverage_periods',        // Coverage period analysis
                                    'notification_status'      // Warranty notification tracking
                                ],
                                patterns: [
                                    'warranty units', 'coverage check',
                                    'activation status', 'warranty period'
                                ]
                            },
                            warrantyCompliance: {
                                metrics: [
                                    'term_compliance',         // Warranty terms compliance
                                    'notification_tracking',   // Customer notification tracking
                                    'expiry_management',      // Expiry management
                                    'coverage_verification'   // Coverage verification
                                ],
                                patterns: [
                                    'warranty compliance', 'term verification',
                                    'expiry check', 'notification status'
                                ]
                            },
                            notificationManagement: {
                                metrics: [
                                    'notification_status',      // Track notification delivery status
                                    'notification_timing',      // Analyze notification timing patterns
                                    'expiry_alerts',           // Monitor warranty expiration alerts
                                    'claim_notifications'      // Track claim-related notifications
                                ],
                                patterns: [
                                    'notification status', 'warranty alerts',
                                    'expiry notices', 'claim updates',
                                    'warranty reminders', 'notification history'
                                ],
                                contextTypes: {
                                    // Defines different notification contexts for better understanding
                                    warranty: {
                                        expiry: ['expiring soon', 'expired', 'renewal needed'],
                                        activation: ['activated', 'pending activation', 'registration confirmed'],
                                        status: ['active', 'suspended', 'terminated']
                                    },
                                    claim: {
                                        updates: ['received', 'processing', 'approved', 'rejected'],
                                        resolution: ['in progress', 'completed', 'requires attention'],
                                        followup: ['feedback needed', 'documentation required', 'resolution confirmed']
                                    }
                                }
                            }
                        }
            }
        };
    }

    async analyzeIntent(message) {
        const normalizedMessage = message.toLowerCase().trim().replace(/\s+/g, ' ');
        const cachedIntent = this.intentCache.get(normalizedMessage);
        if (cachedIntent && Date.now() - cachedIntent.timestamp < this.cacheDuration) {
            return cachedIntent.intent;
        }
        
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `As a stock management assistant, analyze this query and return a JSON object with:
                        {
                            "category": "INVENTORY|SALES|APPOINTMENTS",
                            "intent": "specific_action",
                            "metrics": ["required_metrics"],
                            "parameters": {
                                "timeRange": "string",
                                "specificItem": "string",
                                "filters": {
                                    "category": "string",
                                    "brand": "string",
                                    "manufacturer": "string"
                                },
                                "aggregation": "none|daily|weekly|monthly"
                            },
                            "context": {
                                "requiresHistoricalData": boolean,
                                "needsComparison": boolean
                            }
                        }`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.3
            });

            let intent = JSON.parse(completion.choices[0].message.content);
            intent = this.validateAndEnrichIntent(intent);
            
            // Store in cache with timestamp
            this.intentCache.set(normalizedMessage, {
                intent,
                timestamp: Date.now()
            });
            
            return intent;

        } catch (error) {
            console.error('Intent analysis error:', error);
            return this.getFallbackIntent();
        }
    }

    validateAndEnrichIntent(intent) {
        // Get valid metrics for the category
        const validMetrics = this.intentPatterns[intent.category]?.metrics || [];
        const validSubCategoryMetrics = Object.values(this.intentPatterns[intent.category]?.subCategories || {})
            .flatMap(subCategory => subCategory.metrics || []);
        
        // Filter out invalid metrics and keep only unique ones
        intent.metrics = [...new Set(intent.metrics)].filter(metric => 
            validMetrics.includes(metric) || validSubCategoryMetrics.includes(metric)
        );

        // Add business logic validation
        if (intent.category === 'INVENTORY' && intent.metrics.includes('stock_levels')) {
            intent.parameters.requiresStockAlert = true;
            intent.metrics.push('low_stock'); // Always check for low stock
        }

        if (intent.metrics.includes('product_movement')) {
            intent.context.requiresHistoricalData = true;
        }

        if (intent.parameters.organizationId) {
            intent.context.organizationScope = 'hierarchy';
            intent.metrics.push('org_structure');
        }

        // Handle unit-level queries
        if (intent.parameters.serialNumber) {
            intent.context.unitLevelDetail = true;
            intent.metrics.push('unit_tracking');
        }

        // Handle product identification
        if (intent.parameters.specificItem && intent.category === 'INVENTORY') {
            intent.metrics.push('alias_matching');
            intent.parameters.confidence = 0.8; // Default confidence threshold
        }

        return intent;
    }

    getFallbackIntent() {
        return {
            category: 'GENERAL',
            intent: 'unknown',
            metrics: [],
            parameters: {
                timeRange: 'today',
                filters: {}
            },
            context: {
                requiresHistoricalData: false,
                needsComparison: false
            }
        };
    }
}

module.exports = IntentAnalyzer;