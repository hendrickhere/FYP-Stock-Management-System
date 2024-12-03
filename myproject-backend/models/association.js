module.exports = (db) => {
    console.log('\n=== Starting Model Associations ===\n');

    const { 
        Customer, 
        User, 
        SalesOrder, 
        Product, 
        Organization, 
        SalesOrderInventory,
        SalesOrderTax,
        SalesOrderDiscount,
        Discount, 
        Appointment,
        PurchaseOrder,
        PurchaseOrderItem,
        PurchaseOrderTax,
        Vendor,
        Tax, 
        Warranty,
        WarrantyClaim,
        WarrantyNotification, 
        ProductUnit, 
        WarrantyUnit, 
    } = db;

    console.log('Models loaded successfully:', Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize'));

    // Sales Order Associations
    console.log('\n--- Setting up Sales Order Associations ---');
    SalesOrder.belongsTo(Customer, { foreignKey: "customer_id" });
    Customer.hasMany(SalesOrder, { foreignKey: "customer_id" });
    console.log('✓ Customer <-> SalesOrder associations established');

    SalesOrder.hasMany(SalesOrderInventory, {
        foreignKey: 'sales_order_id',
        as: 'items'
    });
    SalesOrderInventory.belongsTo(SalesOrder, {
        foreignKey: 'sales_order_id'
    });
    console.log('✓ SalesOrder <-> SalesOrderInventory associations established');

    SalesOrder.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });
    User.hasMany(SalesOrder, { foreignKey: "user_id", onDelete: "CASCADE" });
    console.log('✓ User <-> SalesOrder associations established');

    SalesOrder.belongsTo(Organization, {
        foreignKey: "organization_id",
        onDelete: "CASCADE",
    });
    Organization.hasMany(SalesOrder, {
        foreignKey: "organization_id",
        onDelete: "CASCADE",
    });
    console.log('✓ Organization <-> SalesOrder associations established');

    SalesOrder.belongsToMany(Tax, {
        through: SalesOrderTax,
        foreignKey: "sales_order_id",
    });
    Tax.belongsToMany(SalesOrder, {
        through: SalesOrderTax,
        foreignKey: "tax_id",
    });
    console.log('✓ Tax <-> SalesOrder associations established');

    SalesOrder.belongsToMany(Discount, {
        through: SalesOrderDiscount,
        foreignKey: "sales_order_id",
    });
    Discount.belongsToMany(SalesOrder, {
        through: SalesOrderDiscount,
        foreignKey: "discount_id",
    });
    console.log('✓ Discount <-> SalesOrder associations established');
 
    // Product Associations
    console.log('\n--- Setting up Product Associations ---');
    SalesOrder.belongsToMany(Product, {
        through: SalesOrderInventory,
        foreignKey: "sales_order_id",
    });
    Product.belongsToMany(SalesOrder, {
        through: SalesOrderInventory,
        foreignKey: "product_id",
    });
    console.log('✓ Product <-> SalesOrder many-to-many association established');

    Product.belongsTo(Organization, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
    Organization.hasMany(Product, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
    console.log('✓ Organization <-> Product associations established');

    Tax.belongsTo(Organization, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
    Organization.hasMany(Tax, { foreignKey: 'organization_id', onDelete: 'CASCADE' });
    console.log('✓ Tax <-> Organization one-to-many association established');

    Product.belongsTo(User, { foreignKey: "user_id" });
    User.hasMany(Product, { foreignKey: "user_id" });
    console.log('✓ User <-> Product associations established');


    ProductUnit.belongsTo(Product, {
      foreignKey: "product_id",
    });
    Product.hasMany(ProductUnit, {
      foreignKey: "product_id",
    });
    console.log("✓ ProductUnit <-> Product associations established");

    ProductUnit.belongsTo(Warranty, {
      foreignKey: "warranty_id",
    });
    Warranty.hasMany(ProductUnit, {
      foreignKey: "warranty_id",
    });
    console.log("✓ ProductUnit <-> Warranty associations established");

    ProductUnit.hasMany(WarrantyUnit, {
      foreignKey: "product_unit_id",
    });
    console.log("✓ ProductUnit <-> WarrantyUnit associations established");

    WarrantyUnit.belongsTo(ProductUnit, {
      foreignKey: "product_unit_id",
    });
    console.log("✓ WarrantyUnit <-> ProductUnit associations established");

    WarrantyUnit.belongsTo(Warranty, {
      foreignKey: "warranty_id",
    });
    Warranty.hasMany(WarrantyUnit, {
      foreignKey: "warranty_id",
    });
    console.log("✓ WarrantyUnit <-> Warranty associations established");

    
    // Purchase Order Associations
    console.log('\n--- Setting up Purchase Order Associations ---');
    // PurchaseOrder.belongsToMany(Product, {
    //     through: PurchaseOrderItem,
    //     foreignKey: "purchase_order_id",
    //     otherKey: "product_id",
    // });
    // Product.belongsToMany(PurchaseOrder, {
    //     through: PurchaseOrderItem,
    //     foreignKey: "product_id",
    //     otherKey: "purchase_order_id",
    // });
    // console.log('✓ Product <-> PurchaseOrder many-to-many association established');

    PurchaseOrder.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
    User.hasMany(PurchaseOrder, { foreignKey: 'user_id' });
    console.log('✓ User <-> PurchaseOrder associations established');

    PurchaseOrderItem.belongsTo(Product, {
        foreignKey: 'product_id',
        as: 'Product'
    });

    PurchaseOrderItem.belongsTo(PurchaseOrder, {
        foreignKey: 'purchase_order_id'
    });

    // Then establish the reverse associations
    Product.hasMany(PurchaseOrderItem, {
        foreignKey: 'product_id',
        as: 'PurchaseOrderItems'
    });

    PurchaseOrder.hasMany(PurchaseOrderItem, {
        foreignKey: 'purchase_order_id',
        as: 'PurchaseOrderItems'
    });

    PurchaseOrder.belongsToMany(Tax, {
        through: PurchaseOrderTax,
        foreignKey: "purchase_order_id",
    });
    Tax.belongsToMany(PurchaseOrder, {
        through: PurchaseOrderTax,
        foreignKey: "tax_id",
    });
    console.log('✓ Tax <-> PurchaseOrder associations established');

    // User Associations
    console.log('\n--- Setting up User Associations ---');
    User.hasMany(Customer, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    Customer.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    console.log('✓ User <-> Customer associations established');

    User.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });
    Organization.hasMany(User, { foreignKey: 'organization_id' });
    console.log('✓ Organization <-> User associations established');

    // Appointment Associations
    console.log('\n--- Setting up Appointment Associations ---');
    Appointment.belongsTo(Customer, { foreignKey: 'customer_id', onDelete: "CASCADE" });
    Customer.hasMany(Appointment, { foreignKey: 'customer_id', onDelete: "CASCADE" });
    console.log('✓ Customer <-> Appointment associations established');

    Appointment.belongsTo(User, {foreignKey: "user_id"});
    User.hasMany(Appointment, {foreignKey: "user_id"});
    console.log('✓ User <-> Appointment associations established');

    // Vendor Associations
    console.log('\n--- Setting up Vendor Associations ---');
    Vendor.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    User.hasMany(Vendor, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    console.log('✓ User <-> Vendor associations established');

    Vendor.hasMany(PurchaseOrder, { foreignKey: 'vendor_id', onDelete: 'CASCADE' });
    PurchaseOrder.belongsTo(Vendor, { foreignKey: 'vendor_id', onDelete: 'CASCADE' });
    console.log('✓ Vendor <-> PurchaseOrder associations established');

    // Warranty Associations
    console.log('\n--- Setting up Warranty Associations ---');
    Warranty.belongsTo(Product, { foreignKey: 'product_id', as: 'product', onDelete: 'CASCADE' });
    Product.hasMany(Warranty, { foreignKey: 'product_id', as: 'warranties', onDelete: 'CASCADE' });
    console.log('✓ Product <-> Warranty associations established');

    Warranty.belongsTo(User, { foreignKey: 'created_by', as: 'creator', onDelete: 'SET NULL' });
    Warranty.belongsTo(User, { foreignKey: 'last_modified_by', as: 'modifier', onDelete: 'SET NULL' });
    console.log('✓ User <-> Warranty associations established');

    Warranty.belongsTo(Organization, { 
    foreignKey: 'organization_id', 
    as: 'organization',
    onDelete: 'CASCADE'
    });
    Organization.hasMany(Warranty, { 
    foreignKey: 'organization_id',
    onDelete: 'CASCADE'
    });
    console.log('✓ Organization <-> Warranty associations established');

    // Warranty Claim Associations
    console.log('\n--- Setting up Warranty Claim Associations ---');
    WarrantyClaim.belongsTo(Warranty, { foreignKey: 'warranty_id', as: 'warranty', onDelete: 'CASCADE' });
    Warranty.hasMany(WarrantyClaim, { foreignKey: 'warranty_id', as: 'claims', onDelete: 'CASCADE' });
    console.log('✓ Warranty <-> WarrantyClaim associations established');

    WarrantyClaim.belongsTo(User, { foreignKey: 'created_by', as: 'creator', onDelete: 'SET NULL' });
    WarrantyClaim.belongsTo(User, { foreignKey: 'last_modified_by', as: 'modifier', onDelete: 'SET NULL' });
    console.log('✓ User <-> WarrantyClaim associations established');

    WarrantyClaim.belongsTo(Customer, { 
    foreignKey: 'customer_id', 
    as: 'customer',
    onDelete: 'SET NULL'
    });
    Customer.hasMany(WarrantyClaim, { 
    foreignKey: 'customer_id',
    as: 'claims',
    onDelete: 'SET NULL'
    });
    console.log('✓ Customer <-> WarrantyClaim associations established');

    // Warranty Notification Associations
    WarrantyNotification.belongsTo(Warranty, { 
        foreignKey: 'warranty_id',
        as: 'warranty',
        onDelete: 'CASCADE'
    });
    Warranty.hasMany(WarrantyNotification, {
        foreignKey: 'warranty_id',
        as: 'notifications',
        onDelete: 'CASCADE'
    });
    console.log('✓ Warranty Notification <-> Warranty associations established');

    console.log('\n=== All Associations Completed Successfully ===\n');

    return db;
};