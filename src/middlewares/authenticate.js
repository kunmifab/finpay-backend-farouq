const jwt = require('jsonwebtoken');

const tokenBlacklist = [];

// Authentication middleware
const authenticate = (req, res, next) => {
    const token = req.header('x-auth-token');
    // Check if the token is in the blacklist
    if (tokenBlacklist.includes(token)) {
      return res.status(401).json({ message: 'Token revoked or invalid' });
    }
  
    // Verify and decode the token
    jwt.verify(token, process.env.JWT_SECRET , (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Token verification failed' });
      }
  
      // If the token is valid, proceed to the next middleware
      req.user = decoded;
      next();
    });
};

module.exports = authenticate;