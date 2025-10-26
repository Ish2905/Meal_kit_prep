// src/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// This loads the variables from your .env file
dotenv.config();

// Create a "connection pool". This is an efficient way to manage database connections.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("MySQL Connection Pool created successfully.");

// We export the pool so other files can use it to make queries
module.exports = pool;

