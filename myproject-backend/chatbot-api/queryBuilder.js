class QueryBuilder {
    constructor(db) {
        if (!db) {
            throw new Error('Database instance is required for QueryBuilder');
        }
        this.db = db;
        
        // Initialize query templates object to store our predefined queries
        this.queryTemplates = {
            INVENTORY: {},
            SALES: {},
            APPOINTMENTS: {},
            ORGANIZATION: {},      
            PURCHASE_ORDERS: {},   
            SALES_ANALYSIS: {},
            FULFILLMENT_TRACKING: {},
            TAX_MANAGEMENT: {},
            USER_MANAGEMENT: {},
            WARRANTY_MANAGEMENT: {}
        };
        
        // Now we define our query templates for each category
        this.initializeQueryTemplates();
        this.validateQueryTemplates();
        this.queryTimeout = 30000;
    }

    initializeQueryTemplates() {
        this.queryTemplates.INVENTORY.product_movement = `
            WITH daily_movement AS (
                SELECT 
                    p.product_id,
                    p.product_name,
                    p.sku_number,
                    DATE_TRUNC('day', soi.created_at) as movement_date,
                    SUM(soi.quantity) as quantity_sold,
                    COUNT(DISTINCT so.sales_order_id) as order_count,
                    p.product_stock as current_stock,
                    COALESCE(poi.incoming_quantity, 0) as incoming_stock
                FROM products p
                LEFT JOIN sales_order_inventories soi ON p.product_id = soi.product_id
                LEFT JOIN sales_orders so ON soi.sales_order_id = so.sales_order_id
                LEFT JOIN (
                    SELECT 
                        product_id,
                        SUM(unregistered_quantity) as incoming_quantity
                    FROM purchase_order_items
                    WHERE status_id = 1
                    GROUP BY product_id
                ) poi ON p.product_id = poi.product_id
                WHERE p.user_id = :userId
                AND p.status_id = 1
                AND soi.created_at >= CURRENT_DATE - INTERVAL ':days days'
                GROUP BY 
                    p.product_id,
                    p.product_name,
                    p.sku_number,
                    DATE_TRUNC('day', soi.created_at)
            )
            SELECT 
                product_id,
                product_name,
                sku_number,
                current_stock,
                incoming_stock,
                ARRAY_AGG(json_build_object(
                    'date', movement_date,
                    'sold', quantity_sold,
                    'orders', order_count
                )) as daily_stats
            FROM daily_movement
            GROUP BY 
                product_id,
                product_name,
                sku_number,
                current_stock,
                incoming_stock
        `;

        this.queryTemplates.INVENTORY.unit_tracking = `
            SELECT 
                pu.*,
                p.product_name,
                p.sku_number,
                w.warranty_start,
                w.warranty_end,
                CASE 
                    WHEN pu.is_sold THEN soi.price
                    ELSE NULL 
                END as sale_price,
                CASE 
                    WHEN pu.source_type = 'PURCHASE_ORDER' THEN poi.total_price / poi.quantity
                    ELSE p.cost 
                END as unit_cost
            FROM product_units pu
            JOIN products p ON pu.product_id = p.product_id
            LEFT JOIN warranties w ON pu.warranty_id = w.warranty_id
            LEFT JOIN sales_order_inventories soi ON pu.sales_order_item_id = soi.sales_order_item_id
            LEFT JOIN purchase_order_items poi ON pu.purchase_order_item_id = poi.purchase_order_item_id
            WHERE p.user_id = :userId
            ${this.getSerialNumberFilter()}
            ${this.getDateRangeFilter('pu.created_at')}
        `;

        this.queryTemplates.INVENTORY.alias_matching = `
            SELECT 
                p.*,
                pa.alias_name,
                pa.confidence,
                pa.source,
                pa.is_verified
            FROM products p
            JOIN product_aliases pa ON p.product_uuid = pa.product_uuid
            WHERE p.user_id = :userId
            AND (
                LOWER(pa.alias_name) LIKE LOWER(:searchTerm)
                OR pa.confidence >= :minConfidence
            )
            ORDER BY pa.confidence DESC, pa.is_verified DESC
        `;

        this.queryTemplates.ORGANIZATION.discount_programs = `
            SELECT 
                d.*,
                COUNT(DISTINCT sd.sales_order_id) as usage_count,
                SUM(so.grand_total) as total_discounted_sales
            FROM discounts d
            LEFT JOIN sales_order_discounts sd ON d.discount_id = sd.discount_id
            LEFT JOIN sales_orders so ON sd.sales_order_id = so.sales_order_id
            WHERE d.organization_id = :organizationId
            AND d.discount_status = 1
            AND (
                d.discount_end IS NULL 
                OR d.discount_end >= CURRENT_DATE
            )
            GROUP BY d.discount_id
            ORDER BY d.created_at DESC
        `;

        this.queryTemplates.APPOINTMENTS.service_analytics = `
            SELECT 
                a.service_type,
                COUNT(*) as total_appointments,
                COUNT(DISTINCT a.customer_id) as unique_customers,
                AVG(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) * 100 as completion_rate
            FROM appointments a
            WHERE a.user_id = :userId
            AND a.appointment_date >= CURRENT_DATE - INTERVAL ':days days'
            GROUP BY a.service_type
        `;

        this.queryTemplates.SALES.customer_insights = `
            SELECT 
                c.customer_id,
                c.customer_name,
                COUNT(DISTINCT so.sales_order_id) as total_orders,
                SUM(so.grand_total) as total_spent,
                MAX(so.created_at) as last_purchase,
                ARRAY_AGG(DISTINCT p.product_name) as purchased_products
            FROM customers c
            JOIN sales_orders so ON c.customer_id = so.customer_id
            JOIN sales_order_inventories soi ON so.sales_order_id = soi.sales_order_id
            JOIN products p ON soi.product_id = p.product_id
            WHERE c.user_id = :userId
            AND so.created_at >= CURRENT_DATE - INTERVAL ':days days'
            GROUP BY c.customer_id, c.customer_name
        `;

        this.queryTemplates.PURCHASE_ORDERS = {
            // Track overall purchase order status
            po_status: `
                SELECT 
                    po.purchase_order_id,
                    po.order_date,
                    po.status_id,
                    po.delivered_date,
                    po.delivery_method,
                    po.payment_terms,
                    v.vendor_name,
                    po.subtotal,
                    po.total_tax,
                    po.grand_total,
                    SUM(poi.quantity) as total_items,
                    SUM(poi.unregistered_quantity) as pending_registration,
                    JSONB_AGG(DISTINCT t.tax_name) as applied_taxes
                FROM purchase_orders po
                JOIN vendors v ON po.vendor_id = v.vendor_id
                LEFT JOIN purchase_order_items poi ON po.purchase_order_id = poi.purchase_order_id
                LEFT JOIN purchase_order_taxes pot ON po.purchase_order_id = pot.purchase_order_id
                LEFT JOIN taxes t ON pot.tax_id = t.tax_id
                WHERE po.user_id = :userId
                ${this.getDateRangeFilter('po.order_date')}
                GROUP BY 
                    po.purchase_order_id,
                    po.order_date,
                    po.status_id,
                    po.delivered_date,
                    po.delivery_method,
                    po.payment_terms,
                    v.vendor_name
                ORDER BY po.order_date DESC
            `,

            // Track unregistered units
            unregistered_units: `
                SELECT 
                    p.product_name,
                    p.sku_number,
                    poi.purchase_order_id,
                    poi.quantity as ordered_quantity,
                    poi.unregistered_quantity,
                    pu.serial_number,
                    po.order_date,
                    po.delivered_date
                FROM purchase_order_items poi
                JOIN products p ON poi.product_id = p.product_id
                JOIN purchase_orders po ON poi.purchase_order_id = po.purchase_order_id
                LEFT JOIN product_units pu ON poi.purchase_order_item_id = pu.purchase_order_item_id
                WHERE po.user_id = :userId
                AND poi.unregistered_quantity > 0
                ORDER BY po.order_date DESC, p.product_name
            `,

            // Analyze vendor performance
            vendor_performance: `
                WITH delivery_metrics AS (
                    SELECT 
                        v.vendor_id,
                        v.vendor_name,
                        COUNT(po.purchase_order_id) as total_orders,
                        AVG(EXTRACT(EPOCH FROM (po.delivered_date - po.order_date))/86400) as avg_delivery_days,
                        SUM(CASE WHEN po.delivered_date <= po.order_date + INTERVAL '7 days' 
                            THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as on_time_delivery_rate,
                        SUM(po.grand_total) as total_purchase_value
                    FROM vendors v
                    JOIN purchase_orders po ON v.vendor_id = po.vendor_id
                    WHERE po.user_id = :userId
                    AND po.status_id = 1  -- Consider only completed orders
                    GROUP BY v.vendor_id, v.vendor_name
                )
                SELECT 
                    dm.*,
                    COUNT(DISTINCT p.product_id) as unique_products_supplied,
                    AVG(poi.total_price/poi.quantity) as average_unit_price
                FROM delivery_metrics dm
                JOIN purchase_orders po ON po.vendor_id = dm.vendor_id
                JOIN purchase_order_items poi ON po.purchase_order_id = poi.purchase_order_id
                JOIN products p ON poi.product_id = p.product_id
                GROUP BY 
                    dm.vendor_id, 
                    dm.vendor_name, 
                    dm.total_orders, 
                    dm.avg_delivery_days,
                    dm.on_time_delivery_rate,
                    dm.total_purchase_value
                ORDER BY dm.total_purchase_value DESC
            `
        };

        this.queryTemplates.SALES_ANALYSIS = {
                // Comprehensive sales overview with tax and discount analysis
                sales_overview: `
                    WITH sales_metrics AS (
                        SELECT 
                            DATE_TRUNC(:timeGroup, so.order_date_time) as period,
                            COUNT(DISTINCT so.sales_order_id) as order_count,
                            SUM(so.subtotal) as total_revenue,
                            SUM(so.total_tax) as total_tax,
                            SUM(so.discount_amount) as total_discounts,
                            SUM(so.grand_total) as grand_total,
                            COUNT(DISTINCT so.customer_id) as unique_customers
                        FROM sales_orders so
                        WHERE so.user_id = :userId
                        AND so.order_date_time >= :startDate
                        GROUP BY DATE_TRUNC(:timeGroup, so.order_date_time)
                    ),
                    tax_metrics AS (
                        SELECT 
                            t.tax_name,
                            COUNT(DISTINCT sot.sales_order_id) as applied_count,
                            SUM(sot.tax_amount) as total_tax_collected,
                            AVG(sot.applied_tax_rate) as avg_tax_rate
                        FROM sales_order_taxes sot
                        JOIN taxes t ON sot.tax_id = t.tax_id
                        JOIN sales_orders so ON sot.sales_order_id = so.sales_order_id
                        WHERE so.user_id = :userId
                        AND so.order_date_time >= :startDate
                        GROUP BY t.tax_name
                    )
                    SELECT 
                        sm.*,
                        tm.tax_breakdown,
                        JSONB_AGG(DISTINCT delivery_stats.*) as delivery_metrics
                    FROM sales_metrics sm
                    CROSS JOIN (
                        SELECT JSONB_AGG(tax_metrics.*) as tax_breakdown 
                        FROM tax_metrics
                    ) tm
                    CROSS JOIN (
                        SELECT 
                            delivery_method,
                            COUNT(*) as usage_count,
                            AVG(CASE WHEN status_id = 4 THEN 1 ELSE 0 END) * 100 as completion_rate
                        FROM sales_orders
                        WHERE user_id = :userId
                        AND order_date_time >= :startDate
                        GROUP BY delivery_method
                    ) delivery_stats
                    GROUP BY 
                        sm.period,
                        sm.order_count,
                        sm.total_revenue,
                        sm.total_tax,
                        sm.total_discounts,
                        sm.grand_total,
                        sm.unique_customers,
                        tm.tax_breakdown
                    ORDER BY sm.period DESC
                `,

                // Detailed discount impact analysis
                discount_impact: `
                    WITH discount_metrics AS (
                        SELECT 
                            d.discount_id,
                            d.discount_name,
                            d.discount_rate,
                            COUNT(DISTINCT sod.sales_order_id) as usage_count,
                            SUM(so.grand_total) as total_sales_value,
                            SUM(so.discount_amount) as total_discount_amount,
                            AVG(so.discount_amount / so.subtotal) * 100 as avg_discount_percentage
                        FROM discounts d
                        JOIN sales_order_discounts sod ON d.discount_id = sod.discount_id
                        JOIN sales_orders so ON sod.sales_order_id = so.sales_order_id
                        WHERE so.user_id = :userId
                        AND so.order_date_time >= :startDate
                        GROUP BY d.discount_id, d.discount_name, d.discount_rate
                    )
                    SELECT 
                        dm.*,
                        COUNT(DISTINCT c.customer_id) as unique_customers,
                        AVG(soi.quantity) as avg_order_size,
                        SUM(CASE WHEN c.customer_id IN (
                            SELECT customer_id 
                            FROM sales_orders 
                            GROUP BY customer_id 
                            HAVING COUNT(*) > 1
                        ) THEN 1 ELSE 0 END) as repeat_customers
                    FROM discount_metrics dm
                    JOIN sales_order_discounts sod ON dm.discount_id = sod.discount_id
                    JOIN sales_orders so ON sod.sales_order_id = so.sales_order_id
                    JOIN customers c ON so.customer_id = c.customer_id
                    JOIN sales_order_inventories soi ON so.sales_order_id = soi.sales_order_id
                    GROUP BY 
                        dm.discount_id,
                        dm.discount_name,
                        dm.discount_rate,
                        dm.usage_count,
                        dm.total_sales_value,
                        dm.total_discount_amount,
                        dm.avg_discount_percentage
                    ORDER BY dm.total_sales_value DESC
                `,

                // Payment and delivery analysis
                order_fulfillment: `
                    SELECT 
                        so.payment_terms,
                        so.delivery_method,
                        COUNT(*) as total_orders,
                        AVG(EXTRACT(EPOCH FROM (so.expected_shipment_date - so.order_date_time))/3600) as avg_processing_hours,
                        SUM(so.grand_total) as total_value,
                        COUNT(DISTINCT so.customer_id) as unique_customers,
                        SUM(CASE WHEN so.status_id = 4 THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as completion_rate
                    FROM sales_orders so
                    WHERE so.user_id = :userId
                    AND so.order_date_time >= :startDate
                    GROUP BY 
                        so.payment_terms,
                        so.delivery_method
                    ORDER BY total_value DESC
                `
        };

        this.queryTemplates.FULFILLMENT_TRACKING = {
            // Document status tracking
            document_status: `
                WITH order_documents AS (
                    -- Track receipts
                    SELECT 
                        so.sales_order_id,
                        so.order_date_time,
                        r.receipt_id,
                        r.date_issued as receipt_date,
                        r.payment_method,
                        i.invoice_id,
                        i.date_issued as invoice_date,
                        s.shipment_id,
                        s.tracking_number,
                        s.status as shipment_status
                    FROM sales_orders so
                    LEFT JOIN receipts r ON so.sales_order_id = r.sales_order_id
                    LEFT JOIN invoices i ON so.sales_order_id = i.sales_order_id
                    LEFT JOIN shipments s ON so.sales_order_id = s.sales_order_id
                    WHERE so.user_id = :userId
                    AND so.order_date_time >= :startDate
                )
                SELECT 
                    od.*,
                    c.customer_name,
                    so.grand_total,
                    so.payment_terms,
                    so.delivery_method,
                    JSONB_AGG(DISTINCT soi.*) as order_items
                FROM order_documents od
                JOIN sales_orders so ON od.sales_order_id = so.sales_order_id
                JOIN customers c ON so.customer_id = c.customer_id
                JOIN sales_order_inventories soi ON so.sales_order_id = soi.sales_order_id
                GROUP BY 
                    od.sales_order_id,
                    od.order_date_time,
                    od.receipt_id,
                    od.receipt_date,
                    od.payment_method,
                    od.invoice_id,
                    od.invoice_date,
                    od.shipment_id,
                    od.tracking_number,
                    od.shipment_status,
                    c.customer_name,
                    so.grand_total,
                    so.payment_terms,
                    so.delivery_method
                ORDER BY od.order_date_time DESC
            `,

            // Shipping performance analytics
            shipping_analytics: `
                WITH shipping_metrics AS (
                    SELECT 
                        s.status,
                        COUNT(*) as shipment_count,
                        AVG(EXTRACT(EPOCH FROM (s.updated_at - so.order_date_time))/3600) as avg_processing_hours,
                        so.delivery_method,
                        COUNT(DISTINCT so.customer_id) as unique_customers
                    FROM shipments s
                    JOIN sales_orders so ON s.sales_order_id = so.sales_order_id
                    WHERE so.user_id = :userId
                    AND so.order_date_time >= :startDate
                    GROUP BY s.status, so.delivery_method
                ),
                delivery_performance AS (
                    SELECT 
                        delivery_method,
                        COUNT(*) as total_deliveries,
                        SUM(CASE WHEN s.status = 4 THEN 1 ELSE 0 END) as successful_deliveries,
                        AVG(CASE WHEN s.status = 4 
                            THEN EXTRACT(EPOCH FROM (s.updated_at - so.order_date_time))/86400 
                            ELSE NULL END) as avg_delivery_days
                    FROM sales_orders so
                    LEFT JOIN shipments s ON so.sales_order_id = s.sales_order_id
                    WHERE so.user_id = :userId
                    GROUP BY delivery_method
                )
                SELECT 
                    sm.*,
                    dp.total_deliveries,
                    dp.successful_deliveries,
                    dp.avg_delivery_days,
                    COUNT(DISTINCT s.tracking_number) as tracked_shipments,
                    AVG(CASE WHEN s.status = 4 
                        THEN EXTRACT(EPOCH FROM (s.updated_at - so.order_date_time))/3600 
                        ELSE NULL END) as avg_completion_hours
                FROM shipping_metrics sm
                JOIN delivery_performance dp ON sm.delivery_method = dp.delivery_method
                LEFT JOIN shipments s ON s.status = sm.status
                GROUP BY 
                    sm.status,
                    sm.shipment_count,
                    sm.avg_processing_hours,
                    sm.delivery_method,
                    sm.unique_customers,
                    dp.total_deliveries,
                    dp.successful_deliveries,
                    dp.avg_delivery_days
                ORDER BY sm.shipment_count DESC
            `,

            // Payment verification analysis
            payment_verification: `
                SELECT 
                    r.payment_method,
                    COUNT(*) as payment_count,
                    SUM(so.grand_total) as total_amount,
                    COUNT(DISTINCT so.customer_id) as unique_customers,
                    AVG(EXTRACT(EPOCH FROM (r.date_issued - so.order_date_time))/3600) as avg_receipt_time,
                    COUNT(DISTINCT CASE WHEN sod.discount_id IS NOT NULL THEN so.sales_order_id END) as discounted_orders,
                    JSONB_AGG(DISTINCT sot.tax_name) as applied_taxes
                FROM receipts r
                JOIN sales_orders so ON r.sales_order_id = so.sales_order_id
                LEFT JOIN sales_order_discounts sod ON so.sales_order_id = sod.sales_order_id
                LEFT JOIN sales_order_taxes sot ON so.sales_order_id = sot.sales_order_id
                WHERE so.user_id = :userId
                AND so.order_date_time >= :startDate
                GROUP BY r.payment_method
                ORDER BY total_amount DESC
            `
        };

        this.queryTemplates.TAX_MANAGEMENT = {
            // Comprehensive tax analysis
            tax_overview: `
                WITH tax_usage AS (
                    SELECT 
                        t.tax_id,
                        t.tax_name,
                        t.tax_rate,
                        t.tax_status,
                        COUNT(DISTINCT sot.sales_order_id) as usage_count,
                        SUM(sot.tax_amount) as total_collected,
                        AVG(sot.applied_tax_rate) as avg_applied_rate,
                        COUNT(DISTINCT o.organization_id) as org_count
                    FROM taxes t
                    LEFT JOIN sales_order_taxes sot ON t.tax_id = sot.tax_id
                    LEFT JOIN sales_orders so ON sot.sales_order_id = so.sales_order_id
                    LEFT JOIN organizations o ON t.organization_id = o.organization_id
                    WHERE t.organization_id IN (
                        SELECT organization_id FROM users WHERE user_id = :userId
                    )
                    GROUP BY t.tax_id, t.tax_name, t.tax_rate, t.tax_status
                )
                SELECT 
                    tu.*,
                    COUNT(DISTINCT pot.purchase_order_id) as purchase_applications,
                    JSONB_AGG(DISTINCT jsonb_build_object(
                        'org_id', o.organization_id,
                        'org_name', o.organization_name,
                        'usage_count', COUNT(DISTINCT sot.sales_order_id)
                    )) as org_distribution
                FROM tax_usage tu
                LEFT JOIN purchase_order_taxes pot ON tu.tax_id = pot.tax_id
                LEFT JOIN organizations o ON tu.organization_id = o.organization_id
                LEFT JOIN sales_order_taxes sot ON tu.tax_id = sot.tax_id
                GROUP BY 
                    tu.tax_id, tu.tax_name, tu.tax_rate, tu.tax_status,
                    tu.usage_count, tu.total_collected, tu.avg_applied_rate,
                    tu.org_count
                ORDER BY tu.usage_count DESC
            `,

            // Tax compliance tracking
            tax_compliance: `
                    WITH daily_collection AS (
                        SELECT 
                            DATE_TRUNC('day', so.order_date_time) as collection_date,
                            t.tax_id,
                            t.tax_name,
                            COUNT(DISTINCT so.sales_order_id) as order_count,
                            SUM(sot.tax_amount) as collected_amount,
                            AVG(sot.applied_tax_rate) as avg_rate
                        FROM taxes t
                        JOIN sales_order_taxes sot ON t.tax_id = sot.tax_id
                        JOIN sales_orders so ON sot.sales_order_id = so.sales_order_id
                        WHERE t.organization_id IN (
                            SELECT organization_id FROM users WHERE user_id = :userId
                        )
                        AND so.order_date_time >= :startDate
                        GROUP BY DATE_TRUNC('day', so.order_date_time), t.tax_id, t.tax_name
                    )
                    SELECT 
                        t.tax_id,
                        t.tax_name,
                        t.tax_rate as configured_rate,
                        COUNT(DISTINCT dc.collection_date) as collection_days,
                        SUM(dc.collected_amount) as total_collected,
                        AVG(dc.avg_rate) as average_applied_rate,
                        MIN(dc.avg_rate) as min_applied_rate,
                        MAX(dc.avg_rate) as max_applied_rate,
                        COUNT(DISTINCT CASE 
                            WHEN dc.avg_rate != t.tax_rate 
                            THEN dc.collection_date 
                        END) as rate_mismatch_days,
                        JSONB_AGG(DISTINCT jsonb_build_object(
                            'date', dc.collection_date,
                            'amount', dc.collected_amount,
                            'rate', dc.avg_rate
                        ) ORDER BY dc.collection_date) as daily_details
                    FROM taxes t
                    LEFT JOIN daily_collection dc ON t.tax_id = dc.tax_id
                    WHERE t.organization_id IN (
                        SELECT organization_id FROM users WHERE user_id = :userId
                    )
                    GROUP BY t.tax_id, t.tax_name, t.tax_rate
                    ORDER BY total_collected DESC
                `
        };

        this.queryTemplates.USER_MANAGEMENT = {
            // User activity analysis
            user_activity: `
                WITH user_actions AS (
                    SELECT 
                        u.user_id,
                        u.username,
                        u.role,
                        COUNT(DISTINCT so.sales_order_id) as sales_orders,
                        COUNT(DISTINCT po.purchase_order_id) as purchase_orders,
                        COUNT(DISTINCT p.product_id) as products_managed,
                        COUNT(DISTINCT c.customer_id) as customers_managed
                    FROM users u
                    LEFT JOIN sales_orders so ON u.user_id = so.user_id
                    LEFT JOIN purchase_orders po ON u.user_id = po.user_id
                    LEFT JOIN products p ON u.user_id = p.user_id
                    LEFT JOIN customers c ON u.user_id = c.user_id
                    WHERE u.organization_id = (
                        SELECT organization_id FROM users WHERE user_id = :userId
                    )
                    GROUP BY u.user_id, u.username, u.role
                )
                SELECT 
                    ua.*,
                    o.organization_name,
                    COUNT(DISTINCT v.vendor_id) as vendors_managed,
                    JSONB_AGG(DISTINCT jsonb_build_object(
                        'action_type', 'sales_order',
                        'count', sales_orders,
                        'last_action', MAX(so.order_date_time)
                    )) as activity_summary
                FROM user_actions ua
                JOIN organizations o ON ua.organization_id = o.organization_id
                LEFT JOIN vendors v ON ua.user_id = v.user_id
                LEFT JOIN sales_orders so ON ua.user_id = so.user_id
                GROUP BY 
                    ua.user_id, ua.username, ua.role,
                    ua.sales_orders, ua.purchase_orders,
                    ua.products_managed, ua.customers_managed,
                    o.organization_name
                ORDER BY ua.username
            `
        };

        this.queryTemplates.WARRANTY_MANAGEMENT = {
            // Comprehensive warranty analysis
            warranty_overview: `
                WITH warranty_metrics AS (
                    SELECT 
                        w.warranty_id,
                        w.warranty_type,
                        w.duration,
                        p.product_name,
                        COUNT(DISTINCT wu.product_unit_id) as covered_units,
                        COUNT(DISTINCT wc.claim_id) as total_claims,
                        SUM(CASE WHEN wc.claim_status = 2 THEN 1 ELSE 0 END) as approved_claims,
                        SUM(CASE WHEN wc.claim_status = 3 THEN 1 ELSE 0 END) as rejected_claims
                    FROM warranties w
                    JOIN products p ON w.product_id = p.product_id
                    LEFT JOIN warranty_units wu ON w.warranty_id = wu.warranty_id
                    LEFT JOIN warranty_claims wc ON w.warranty_id = wc.warranty_id
                    WHERE w.organization_id IN (
                        SELECT organization_id FROM users WHERE user_id = :userId
                    )
                    GROUP BY 
                        w.warranty_id,
                        w.warranty_type,
                        w.duration,
                        p.product_name
                )
                SELECT 
                    wm.*,
                    JSONB_AGG(DISTINCT jsonb_build_object(
                        'unit_id', wu.product_unit_id,
                        'start_date', wu.warranty_start,
                        'end_date', wu.warranty_end,
                        'status', wu.status,
                        'notification_status', wu.notification_sent
                    )) as unit_details,
                    JSONB_AGG(DISTINCT jsonb_build_object(
                        'claim_id', wc.claim_id,
                        'claim_date', wc.date_of_claim,
                        'status', wc.claim_status,
                        'resolution', wc.resolution_details
                    )) as claim_history
                FROM warranty_metrics wm
                LEFT JOIN warranty_units wu ON wm.warranty_id = wu.warranty_id
                LEFT JOIN warranty_claims wc ON wm.warranty_id = wc.warranty_id
                GROUP BY 
                    wm.warranty_id,
                    wm.warranty_type,
                    wm.duration,
                    wm.product_name,
                    wm.covered_units,
                    wm.total_claims,
                    wm.approved_claims,
                    wm.rejected_claims
                ORDER BY wm.covered_units DESC
            `,

            // Claim analysis and tracking
            claim_analytics: `
                WITH claim_metrics AS (
                    SELECT 
                        wc.warranty_id,
                        wc.claim_status,
                        AVG(EXTRACT(EPOCH FROM (
                            CASE WHEN wc.claim_status IN (2, 3, 4) 
                            THEN wc.updated_at - wc.date_of_claim
                            ELSE NOW() - wc.date_of_claim 
                            END
                        ))/3600) as avg_resolution_hours,
                        COUNT(*) as claim_count,
                        COUNT(DISTINCT wc.customer_id) as unique_customers
                    FROM warranty_claims wc
                    JOIN warranties w ON wc.warranty_id = w.warranty_id
                    WHERE w.organization_id IN (
                        SELECT organization_id FROM users WHERE user_id = :userId
                    )
                    GROUP BY wc.warranty_id, wc.claim_status
                )
                SELECT 
                    cm.*,
                    w.warranty_type,
                    w.duration,
                    p.product_name,
                    JSONB_AGG(DISTINCT jsonb_build_object(
                        'claim_type', wc.claim_type,
                        'priority', wc.priority,
                        'resolution', wc.resolution_details,
                        'customer', c.customer_name
                    )) as claim_details
                FROM claim_metrics cm
                JOIN warranties w ON cm.warranty_id = w.warranty_id
                JOIN products p ON w.product_id = p.product_id
                JOIN warranty_claims wc ON cm.warranty_id = wc.warranty_id
                JOIN customers c ON wc.customer_id = c.customer_id
                GROUP BY 
                    cm.warranty_id,
                    cm.claim_status,
                    cm.avg_resolution_hours,
                    cm.claim_count,
                    cm.unique_customers,
                    w.warranty_type,
                    w.duration,
                    p.product_name
                ORDER BY cm.claim_count DESC
            `,

            // Unit-level warranty tracking
            unit_coverage: `
                SELECT 
                    wu.product_unit_id,
                    wu.warranty_start,
                    wu.warranty_end,
                    wu.status,
                    wu.notification_sent,
                    pu.serial_number,
                    p.product_name,
                    w.warranty_type,
                    w.duration,
                    CASE 
                        WHEN NOW() < wu.warranty_start THEN 'PENDING'
                        WHEN NOW() BETWEEN wu.warranty_start AND wu.warranty_end THEN 'ACTIVE'
                        ELSE 'EXPIRED'
                    END as coverage_status,
                    EXTRACT(DAY FROM (wu.warranty_end - NOW())) as days_remaining,
                    COUNT(DISTINCT wc.claim_id) as claim_count,
                    JSONB_AGG(DISTINCT jsonb_build_object(
                        'claim_id', wc.claim_id,
                        'claim_date', wc.date_of_claim,
                        'status', wc.claim_status,
                        'resolution', wc.resolution_details
                    )) as claims
                FROM warranty_units wu
                JOIN product_units pu ON wu.product_unit_id = pu.product_unit_id
                JOIN products p ON pu.product_id = p.product_id
                JOIN warranties w ON wu.warranty_id = w.warranty_id
                LEFT JOIN warranty_claims wc ON w.warranty_id = wc.warranty_id
                WHERE w.organization_id IN (
                    SELECT organization_id FROM users WHERE user_id = :userId
                )
                GROUP BY 
                    wu.product_unit_id,
                    wu.warranty_start,
                    wu.warranty_end,
                    wu.status,
                    wu.notification_sent,
                    pu.serial_number,
                    p.product_name,
                    w.warranty_type,
                    w.duration
                ORDER BY days_remaining ASC
            `,

            notification_analytics: `
                WITH notification_metrics AS (
                    SELECT 
                        wn.notification_type,
                        w.warranty_type,
                        COUNT(*) as total_notifications,
                        SUM(CASE WHEN wn.is_read THEN 1 ELSE 0 END) as read_notifications,
                        AVG(CASE WHEN wn.is_read 
                            THEN EXTRACT(EPOCH FROM (wn.updated_at - wn.notification_date))/3600 
                            ELSE NULL 
                        END) as avg_read_time_hours
                    FROM warranty_notifications wn
                    JOIN warranties w ON wn.warranty_id = w.warranty_id
                    WHERE w.organization_id IN (
                        SELECT organization_id FROM users WHERE user_id = :userId
                    )
                    AND wn.notification_date >= :startDate
                    GROUP BY wn.notification_type, w.warranty_type
                ),
                expiry_tracking AS (
                    SELECT 
                        w.warranty_id,
                        p.product_name,
                        wu.warranty_end,
                        wn.notification_date,
                        wn.is_read,
                        EXTRACT(DAY FROM (wu.warranty_end - wn.notification_date)) as days_before_expiry
                    FROM warranty_notifications wn
                    JOIN warranties w ON wn.warranty_id = w.warranty_id
                    JOIN warranty_units wu ON w.warranty_id = wu.warranty_id
                    JOIN products p ON w.product_id = p.product_id
                    WHERE wn.notification_type = 'EXPIRY_ALERT'
                    AND w.organization_id IN (
                        SELECT organization_id FROM users WHERE user_id = :userId
                    )
                )
                SELECT 
                    nm.*,
                    COUNT(DISTINCT w.warranty_id) as affected_warranties,
                    JSONB_AGG(DISTINCT jsonb_build_object(
                        'product', p.product_name,
                        'notification_type', wn.notification_type,
                        'notification_date', wn.notification_date,
                        'status', wn.is_read,
                        'warranty_type', w.warranty_type
                    )) as notification_details,
                    (
                        SELECT JSONB_AGG(expiry_data.*)
                        FROM expiry_tracking expiry_data
                        WHERE expiry_data.days_before_expiry <= 30
                    ) as upcoming_expiries,
                    JSONB_AGG(DISTINCT jsonb_build_object(
                        'claim_id', wc.claim_id,
                        'notification_count', COUNT(wn.notification_id),
                        'last_notification', MAX(wn.notification_date)
                    )) as claim_notifications
                FROM notification_metrics nm
                JOIN warranty_notifications wn ON nm.notification_type = wn.notification_type
                JOIN warranties w ON wn.warranty_id = w.warranty_id
                JOIN products p ON w.product_id = p.product_id
                LEFT JOIN warranty_claims wc ON w.warranty_id = wc.warranty_id
                GROUP BY 
                    nm.notification_type,
                    nm.warranty_type,
                    nm.total_notifications,
                    nm.read_notifications,
                    nm.avg_read_time_hours
                ORDER BY nm.total_notifications DESC
            `,

            notification_timeline: `
                WITH claim_notifications AS (
                    SELECT 
                        wc.claim_id,
                        wc.warranty_id,
                        wc.claim_status,
                        wc.date_of_claim,
                        ARRAY_AGG(wn.notification_id ORDER BY wn.notification_date) as notification_sequence,
                        COUNT(*) as notification_count,
                        BOOL_OR(NOT wn.is_read) as has_unread
                    FROM warranty_claims wc
                    JOIN warranty_notifications wn ON wc.warranty_id = wn.warranty_id
                    WHERE wc.claim_status != 4  -- Not resolved
                    GROUP BY wc.claim_id, wc.warranty_id, wc.claim_status, wc.date_of_claim
                )
                SELECT 
                    cn.*,
                    w.warranty_type,
                    p.product_name,
                    c.customer_name,
                    wu.warranty_end,
                    JSONB_AGG(DISTINCT jsonb_build_object(
                        'notification_id', wn.notification_id,
                        'type', wn.notification_type,
                        'date', wn.notification_date,
                        'is_read', wn.is_read,
                        'notification_sequence', cn.notification_sequence
                    ) ORDER BY wn.notification_date) as notification_history
                FROM claim_notifications cn
                JOIN warranties w ON cn.warranty_id = w.warranty_id
                JOIN products p ON w.product_id = p.product_id
                JOIN warranty_claims wc ON cn.claim_id = wc.claim_id
                JOIN customers c ON wc.customer_id = c.customer_id
                JOIN warranty_units wu ON w.warranty_id = wu.warranty_id
                JOIN warranty_notifications wn ON cn.warranty_id = wn.warranty_id
                WHERE w.organization_id IN (
                    SELECT organization_id FROM users WHERE user_id = :userId
                )
                GROUP BY 
                    cn.claim_id,
                    cn.warranty_id,
                    cn.claim_status,
                    cn.date_of_claim,
                    cn.notification_sequence,
                    cn.notification_count,
                    cn.has_unread,
                    w.warranty_type,
                    p.product_name,
                    c.customer_name,
                    wu.warranty_end
                ORDER BY cn.date_of_claim DESC
            `
        };
    }

    validateQueryTemplates() {
        Object.entries(this.queryTemplates).forEach(([category, templates]) => {
            if (typeof templates !== 'object') {
                throw new Error(`Invalid query templates for category: ${category}`);
            }
        });
    }

    getDateRangeFilter(dateField) {
        return `
            AND ${dateField} >= :startDate
            AND ${dateField} <= :endDate
        `;
    }

    calculateStartDate(timeRange) {
        const now = new Date();
        switch (timeRange.toLowerCase()) {
            case 'today':
                return new Date(now.setHours(0, 0, 0, 0));
            case 'week':
                now.setDate(now.getDate() - 7);
                return now;
            case 'month':
                now.setMonth(now.getMonth() - 1);
                return now;
            case 'quarter':
                now.setMonth(now.getMonth() - 3);
                return now;
            case 'year':
                now.setFullYear(now.getFullYear() - 1);
                return now;
            default:
                // Default to last 30 days if timeRange is not recognized
                now.setDate(now.getDate() - 30);
                return now;
        }
    }

    async executeQuery(category, queryName, params) {
        // Add timeout handling
        const query = this.queryTemplates[category][queryName];
        return Promise.race([
            this.db.sequelize.query(query, {
                replacements: this.prepareQueryParams(params),
                type: this.db.Sequelize.QueryTypes.SELECT
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Query timeout')), this.queryTimeout)
            )
        ]);
    }

    prepareQueryParams(params) {
        return {
            userId: params.userId,
            startDate: params.timeRange ? this.calculateStartDate(params.timeRange) : null,
            endDate: new Date()
        };
    }

    getSerialNumberFilter() {
        return `
            AND CASE 
                WHEN :serialNumber IS NOT NULL 
                THEN pu.serial_number = :serialNumber
                ELSE TRUE
            END
        `;
    }

    async executeAggregatedQuery(category, metrics, params) {
        const results = {};
        for (const metric of metrics) {
            const data = await this.executeQuery(category, metric, params);
            results[metric] = this.postProcessResults(data, params.aggregation);
        }
        return results;
    }

    preparePurchaseOrderParams(params) {
        const baseParams = this.prepareQueryParams(params);
        return {
            ...baseParams,
            vendorId: params.vendorId,
            orderStatus: params.orderStatus || 1,
            deliveryDateStart: params.deliveryDateRange?.start,
            deliveryDateEnd: params.deliveryDateRange?.end,
            minOrderValue: params.minOrderValue,
            includeUnregisteredOnly: params.includeUnregisteredOnly || false
        };
    }

    validatePurchaseOrderQuery(params) {
        if (params.vendorId && !Number.isInteger(params.vendorId)) {
            throw new Error('Invalid vendor ID provided');
        }

        if (params.orderStatus && ![1, 2, 3, 4].includes(params.orderStatus)) {
            throw new Error('Invalid order status provided');
        }

        if (params.minOrderValue && isNaN(parseFloat(params.minOrderValue))) {
            throw new Error('Invalid minimum order value provided');
        }

        return true;
    }

    postProcessResults(data, aggregationType) {
        switch (aggregationType) {
            case 'daily':
                return this.aggregateByDay(data);
            case 'weekly':
                return this.aggregateByWeek(data);
            case 'monthly':
                return this.aggregateByMonth(data);
            default:
                return data;
        }
    }
}

module.exports = QueryBuilder;