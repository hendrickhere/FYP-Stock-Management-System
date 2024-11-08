const { database_name, username, password } = require("./env.js");

const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET: 'secretkey123',
  REFRESH_TOKEN_SECRET: 'refreshSecretKey123',
  ACCESS_TOKEN_EXPIRY: '1h',
  REFRESH_TOKEN_EXPIRY: '7d'
};

const DB_CONFIG = {
  "development": {
    "username": username,
    "password": password,
    "database": database_name,
    "host": "localhost",
    "dialect": "postgres"
  },
  "test": {
    "username": username,
    "password": password,
    "database": database_name + "_test",
    "host": "localhost",
    "dialect": "postgres"
  },
  "production": {
    "username": username,
    "password": password,
    "database": database_name,
    "host": "localhost",
    "dialect": "postgres"
  }
};

module.exports = {
  JWT_CONFIG,
  DB_CONFIG
};