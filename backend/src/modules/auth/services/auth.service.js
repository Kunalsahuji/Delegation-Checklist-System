const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../../../config');

class AuthService {
  generateToken(user) {
    return jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiresIn }
    );
  }

  async login(email, password) {
    const user = await User.findOne({ email, status: 'active' })
      .select('+password')
      .populate('department', 'name key');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    const userObj = user.toObject();
    delete userObj.password;

    return { token, user: userObj };
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId).populate('department', 'name key');
    if (!user) throw new Error('User not found');
    return user;
  }
}

module.exports = new AuthService();
