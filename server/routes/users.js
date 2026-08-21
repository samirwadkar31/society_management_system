const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, allowRoles } = require('../middleware/auth');

const router = express.Router();

function safe(u) {
  const o = u.toObject ? u.toObject() : u;
  delete o.password;
  delete o.resetToken;
  delete o.resetExpires;
  return o;
}

router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

router.put('/me', auth, async (req, res) => {
  try {
    const allowed = [
      'name',
      'phone',
      'photo',
      'familyMembers',
      'vehicles',
      'pets',
      'emergencyContacts',
      'residentType'
    ];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) req.user[key] = req.body[key];
    });
    // resident can update block/flat only if admin hasn't locked... keep simple, admin updates those
    await req.user.save();
    res.json(safe(req.user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/me/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Current password is wrong' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', auth, allowRoles('admin'), async (req, res) => {
  try {
    const { role, status, q } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { flatNo: new RegExp(q, 'i') }
      ];
    }
    const users = await User.find(filter).select('-password -resetToken').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/staff', auth, allowRoles('admin'), async (req, res) => {
  const staff = await User.find({ role: 'staff', status: 'approved' }).select('-password');
  res.json(staff);
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -resetToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.user.role !== 'admin' && String(req.user._id) !== String(user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, allowRoles('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const fields = [
      'name',
      'phone',
      'block',
      'flatNo',
      'residentType',
      'status',
      'staffType',
      'role'
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });
    await user.save();
    res.json(safe(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, allowRoles('admin'), async (req, res) => {
  try {
    const { name, email, password, role, phone, block, flatNo, staffType } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already used' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hash,
      role,
      phone,
      block,
      flatNo,
      staffType,
      status: 'approved'
    });
    res.status(201).json(safe(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
