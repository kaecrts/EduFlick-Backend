const { queryAsync } = require('../config/dbHelper');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require("uuid");

exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Check if the email already exists
        const existingUser = await queryAsync('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email is already registered" });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const id = uuidv4(); // Generate a UUID

        await queryAsync('INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)', 
            [id, name, email, hashedPassword]);

        res.status(201).json({ message: 'User registered successfully' });

    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ message: 'Error registering user', error: err });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const results = await queryAsync('SELECT * FROM users WHERE email = ?', [email]);

        if (results.length === 0) {
            return res.status(401).json({ status: 401, message: 'Invalid credentials' });
        }

        const user = results[0];
        const isMatch = bcrypt.compareSync(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ status: 401, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ status: 200, message: 'Login Successfully', token });

    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ message: 'Error logging in', error: err });
    }
};
