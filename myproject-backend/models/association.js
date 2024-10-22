const Customer = require('./customer');
console.log('Customer model loaded:', Customer); // Debugging log
const User = require('./user');
console.log('User model loaded:', User); // Debugging log
const SalesOrder = require('./salesOrder');
console.log('SalesOrder model loaded:', SalesOrder); // Debugging log
const Inventory = require("./inventory");
console.log('Inventory model loaded:', Inventory); // Debugging log
const Organization = require("./organization");
console.log('Organization model loaded:', Organization); // Debugging log
const SalesOrderInventory = require("./salesOrderInventory");
console.log('SalesOrderInventory model loaded:', SalesOrderInventory); // Debugging log


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