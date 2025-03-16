// utils/dbHelper.js
const db = require('../config/db');

function queryAsync(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

module.exports = { queryAsync };
