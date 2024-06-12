//change ur dbconfig here
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("stocksavvy", "postgres", "CKlim@98305751", {
  host: "localhost",
  dialect: "postgres",
});

module.exports = sequelize;
