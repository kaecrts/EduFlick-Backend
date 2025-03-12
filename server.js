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

const allowedOrigins = ["https://eduflick-client-one.vercel.app"]; // ✅ Set your frontend URL

// Allow requests from your frontend
// app.use(cors({
//   origin: "https://eduflick-client-one.vercel.app", // Replace with your actual frontend URL
//   methods: "GET,POST,PUT,DELETE",
//   credentials: true
// }));
// ✅ Allow all origins and methods
app.use(cors({
origin: ["*"], // Change to frontend URL in production
methods: "GET,POST,PUT,DELETE,OPTIONS",
allowedHeaders: "Content-Type,Authorization",
credentials: true
}));

// ✅ Handle preflight requests for all routes
app.options("*", cors());

app.use(express.json());

app.use(bodyParser.json());


app.post("/api/auth/login", (req, res) => {
    res.json({ message: "CORS is working!" });
});

// app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
