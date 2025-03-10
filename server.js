const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const cardsRoutes = require('./routes/cardsRoutes');
const db = require('./config/db');

dotenv.config();

const app = express();
// app.use(cors({ origin: 'https://eduflick-client-one.vercel.app/' })); // Allows requests from any origin

// ✅ Enable CORS for all origins
app.use(cors({
    origin: "*", // Allow all origins (for development)
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: "X-Requested-With, Content-Type, Authorization"
}));

// ✅ Handle preflight requests
app.options("*", cors());
app.use(express.json());

app.use(bodyParser.json());

app.get("/api", (req, res) => {
    res.send("CORS fixed on Vercel!");
});
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
