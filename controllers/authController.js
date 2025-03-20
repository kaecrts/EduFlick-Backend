const { queryAsync } = require('../config/dbHelper');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
            return res.status(200).json({ status: 400, message: "Email is already registered" });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const id = uuidv4(); // Generate a UUID

        await queryAsync('INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)', 
            [id, name, email, hashedPassword]);

        const token = jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ status: 200, message: 'User registered successfull', token });
        

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
            return res.status(200).json({ status: 401, message: 'Invalid credentials' });
        }

        const user = results[0];
        const isMatch = bcrypt.compareSync(password, user.password);

        if (!isMatch) {
            return res.status(200).json({ status: 401, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ status: 200, message: 'Login Successfully', token });

    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ message: 'Error logging in', error: err });
    }
};

exports.getUserInfo = async (req, res) => {
    const userId = req.user.id; // Assuming authentication middleware sets req.user

    try {
        const results = await queryAsync('SELECT id, username, email FROM users WHERE id = ?', [userId]);
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ status: 200, data: results[0] });
    } catch (err) {
        console.error("Error fetching user info:", err);
        res.status(500).json({ message: 'Error fetching user info', error: err });
    }
};

exports.updateUserInfo = async (req, res) => {
    const { username, password, profilePic } = req.body;
    const userId = req.user.id; // Assuming authentication middleware sets req.user

    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    try {
        let query = 'UPDATE users SET username = ?';
        let params = [username];
        
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }
        
        if (profilePic) {
            query += ', profile = ?';
            params.push(profilePic);
        }
        
        query += ' WHERE id = ?';
        params.push(userId);
        
        await queryAsync(query, params);

        res.json({ status: 200, message: 'User info updated successfully' });
    } catch (err) {
        console.error("Error updating user info:", err);
        res.status(500).json({ message: 'Error updating user info', error: err });
    }
};