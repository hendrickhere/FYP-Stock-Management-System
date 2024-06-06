const Customer = require('./customer');
const User = require('./user');
const SalesOrder = require('./salesOrder');
const Inventory = require("./inventory");
const Organization = require("./organization");
const SalesOrderInventory = require("./salesOrderInventory");



//association between customer and sales order (one to many)
SalesOrder.belongsTo(Customer, { foreignKey: "customer_id" });
Customer.hasMany(SalesOrder, { foreignKey: "customer_id" });

//sales order and user (one to many)
SalesOrder.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });
User.hasMany(SalesOrder, { foreignKey: "user_id", onDelete: "CASCADE" }); 

//sales order and organization (one to many)
SalesOrder.belongsTo(Organization, {
  foreignKey: "organization_id",
  onDelete: "CASCADE",
});
Organization.hasMany(SalesOrder, {
    foreignKey: "organization_id",
    onDelete: "CASCADE",
  })

//sales order and inventory (many to many)
SalesOrder.belongsToMany(Inventory, {
  through: SalesOrderInventory,
  foreignKey: "sales_order_id",
});
Inventory.belongsToMany(SalesOrder, {
  through: SalesOrderInventory,
  foreignKey: "inventory_id",
});

//association between user and customer
User.hasMany(Customer, {foreignKey: 'user_id', onDelete: 'CASCADE'}); 
Customer.belongsTo(User, {foreignKey : 'user_id', onDelete: 'CASCADE'});

//association between organization and inventory
Organization.hasMany(Inventory, {foreignKey: 'organization_id', onDelete: 'CASCADE'});
Inventory.belongsTo(Organization, {foreignKey: 'organization_id', onDelete: 'CASCADE'});

//association between user and inventory
Inventory.belongsTo(User, {foreignKey: "user_id"});
User.hasMany(Inventory, {foreignKey: "user_id"}); 

//association between user and organization
User.belongsTo(Organization, {foreignKey: 'organization_id', onDelete: 'CASCADE'});
Organization.hasMany(User, {foreignKey: 'organization_id', onDelete: 'CASCADE'});

module.exports = {Customer, User, SalesOrder, Inventory, Organization, SalesOrderInventory}