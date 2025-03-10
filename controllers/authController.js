const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require("uuid");

exports.register = (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = uuidv4(); // Generate a UUID

  const query = 'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)';
  db.query(query, [id,name, email, hashedPassword], (err, result) => {
    if (err) {
        console.log("[err]", err);
        
        return res.status(500).json({ message: 'Error registering user' });
    }
    res.status(201).json({ message: 'User registered successfully' });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err || results.length === 0) return res.status(200).json({ status: 401, message: 'Invalid credentials' });

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(200).json({ status: 401, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ status: 200, message: 'Login Succesfully', token });
  });
};
