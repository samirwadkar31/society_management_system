const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendMail } = require('../utils/mail');

const router = express.Router();

function makeToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
}

function safeUser(user) {
  const obj = user.toObject();
  delete obj.password;
  delete obj.resetToken;
  delete obj.resetExpires;
  return obj;
}

// register - only residents can self register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, block, flatNo, residentType } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hash,
      phone,
      block,
      flatNo,
      residentType: residentType || 'owner',
      role: 'resident',
      status: 'pending'
    });
    res.status(201).json({
      message: 'Registered. Admin will approve your flat access.',
      user: safeUser(user)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    if (user.role === 'resident' && user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is waiting for admin approval' });
    }
    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Account is inactive. Contact admin.' });
    }
    const token = makeToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    // don't tell if email exists
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link was sent.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
    const result = await sendMail(
      user.email,
      'Reset your Kutumb password',
      `<p>Hi ${user.name},</p><p>Reset your password using this link (valid 1 hour):</p><p><a href="${link}">${link}</a></p>`
    );

    // if email is not set up, send link back so student can still demo
    res.json({
      message: 'If that email is registered, a reset link was sent.',
      resetLink: result.skipped ? link : undefined
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetToken: hashed,
      resetExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or expired' });
    }
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();
    res.json({ message: 'Password updated. You can login now.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
