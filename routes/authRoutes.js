
const express = require('express');
const { register, login, getUserInfo, updateUserInfo } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/userInfo', authMiddleware, getUserInfo)
router.post('/userInfo', authMiddleware, updateUserInfo);
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Protected route accessed!' });
});

module.exports = router;
