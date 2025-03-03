const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const db = require('./config/db');

dotenv.config();

const app = express();
app.use(cors({ origin: ['https://eduflick-client-one.vercel.app/'] })); // Allows requests from any origin
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.get('/api', (req, res) => {
    res.json({ message: 'Online' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
