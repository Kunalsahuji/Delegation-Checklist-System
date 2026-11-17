const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../modules/auth/models/user.model');

const auth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.taskflow_token) {
      token = req.cookies.taskflow_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret);
    const user = await User.findById(decoded.id).populate('department', 'name key');

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or has been deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

module.exports = auth;
module.exports.auth = auth;
module.exports.protect = auth;
