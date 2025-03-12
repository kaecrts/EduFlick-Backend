const mysql = require('mysql2');
require('dotenv').config();

const poolDB = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,  // ✅ Maintain 10 connections
  queueLimit: 0
});

// db.connect(err => {
//   if (err) {
//     console.error('Database connection failed:', err);
//   } else {
//     console.log('Connected to MySQL');
//   }
// });

module.exports = poolDB.promise();;
