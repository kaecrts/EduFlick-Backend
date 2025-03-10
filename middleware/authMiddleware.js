const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');
  console.log("[token]", token);
  
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[verified]", verified);
    
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ status: 401, message: 'Unauthorized User.' });
  }
};
