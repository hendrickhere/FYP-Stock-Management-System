const Customer = require('./customer');
const User = require('./user');
const SalesOrder = require('./salesOrder');
const Product = require("./inventory");
const Organization = require("./organization");
const SalesOrderProduct = require("./salesOrderInventory");
const Appointments = require("./appointment");


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

//#region SalesOrder and Product 
//(many to many)
SalesOrder.belongsToMany(Product, {
  through: SalesOrderProduct,
  foreignKey: "sales_order_id",
});
Product.belongsToMany(SalesOrder, {
  through: SalesOrderProduct,
  foreignKey: "product_id",
});
//#endregion

//#region User and Customer
User.hasMany(Customer, {foreignKey: 'user_id', onDelete: 'CASCADE'}); 
Customer.belongsTo(User, {foreignKey : 'user_id', onDelete: 'CASCADE'});
//#endregion

//#region Organization and Product
Organization.hasMany(Product, {foreignKey: 'organization_id', onDelete: 'CASCADE'});
Product.belongsTo(Organization, {foreignKey: 'organization_id', onDelete: 'CASCADE'});
//#endregion

//#region User and Product
Product.belongsTo(User, {foreignKey: "user_id"});
User.hasMany(Product, {foreignKey: "user_id"}); 
//#endregion

//#region User and Organization
User.belongsTo(Organization, {foreignKey: 'organization_id', onDelete: 'CASCADE'});
Organization.hasMany(User, {foreignKey: 'organization_id', onDelete: 'CASCADE'});
//#endregion

Appointments.belongsTo(Customer, {foreignKey: 'customer_id', onDelete: "CASCAD"});
Customer.hasMany(Appointments, {foreignKey: 'customer_id', onDelete: "CASCADE"});


module.exports = {Customer, User, SalesOrder, Product, Organization, SalesOrderProduct, Appointments}