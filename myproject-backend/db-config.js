//change ur dbconfig here
const { Sequelize } = require("sequelize");
const { database_name, username, password } = require("./env.js");

const sequelize = new Sequelize(
  `${database_name}`,
  `${username}`,
  `${password}`,
  {
    host: "localhost",
    dialect: "postgres",
  }
);

module.exports = sequelize;
