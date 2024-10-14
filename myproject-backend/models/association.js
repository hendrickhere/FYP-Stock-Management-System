const Customer = require('./customer');
const User = require('./user');
const SalesOrder = require('./salesOrder');
const Inventory = require("./inventory");
const Organization = require("./organization");
const SalesOrderInventory = require("./salesOrderInventory");


//#region Customer and SalesOrder
//(one to many)
SalesOrder.belongsTo(Customer, { foreignKey: "customer_id" });
Customer.hasMany(SalesOrder, { foreignKey: "customer_id" });
//#endregion 

//#region Order and User 
//(one to many)
SalesOrder.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });
User.hasMany(SalesOrder, { foreignKey: "user_id", onDelete: "CASCADE" }); 
//#endregion 

//#region SalesOrder and Organization 
//(one to many)
SalesOrder.belongsTo(Organization, {
  foreignKey: "organization_id",
  onDelete: "CASCADE",
});
Organization.hasMany(SalesOrder, {
    foreignKey: "organization_id",
    onDelete: "CASCADE",
  })
//#endregion

//#region SalesOrder and Inventory 
//(many to many)
SalesOrder.belongsToMany(Inventory, {
  through: SalesOrderInventory,
  foreignKey: "sales_order_id",
});
Inventory.belongsToMany(SalesOrder, {
  through: SalesOrderInventory,
  foreignKey: "inventory_id",
});
//#endregion

//#region User and Customer
User.hasMany(Customer, {foreignKey: 'user_id', onDelete: 'CASCADE'}); 
Customer.belongsTo(User, {foreignKey : 'user_id', onDelete: 'CASCADE'});
//#endregion

//#region Organization and Inventory
Organization.hasMany(Inventory, {foreignKey: 'organization_id', onDelete: 'CASCADE'});
Inventory.belongsTo(Organization, {foreignKey: 'organization_id', onDelete: 'CASCADE'});
//#endregion

//#region User and Inventory
Inventory.belongsTo(User, {foreignKey: "user_id"});
User.hasMany(Inventory, {foreignKey: "user_id"}); 
//#endregion

//#region User and Organization
User.belongsTo(Organization, {foreignKey: 'organization_id', onDelete: 'CASCADE'});
Organization.hasMany(User, {foreignKey: 'organization_id', onDelete: 'CASCADE'});
//#endregion

module.exports = {Customer, User, SalesOrder, Inventory, Organization, SalesOrderInventory}