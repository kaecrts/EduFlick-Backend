const mysql = require('mysql2');
require('dotenv').config();

let db;

function handleDisconnect() {
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  db.connect(err => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      setTimeout(handleDisconnect, 2000); // Retry after 2 seconds
    } else {
      console.log('Connected to MySQL');
    }
  });

  db.on('error', err => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Reconnecting to MySQL...');
      handleDisconnect(); // Reconnect on connection loss
    } else {
      throw err;
    }
  });
}

handleDisconnect();

module.exports = db;
