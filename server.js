const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const cardsRoutes = require('./routes/cardsRoutes');
const db = require('./config/db');

dotenv.config();

const app = express();

// ✅ Allow CORS only from frontend in production
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000", // Set frontend URL
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true
}));

app.use(express.json()); // ✅ Replaces body-parser.json()

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
