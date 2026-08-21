const express = require('express');
const Emergency = require('../models/Emergency');
const { auth, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === 'resident') filter.raisedBy = req.user._id;
  const list = await Emergency.find(filter)
    .populate('raisedBy', 'name flatNo block phone')
    .sort({ createdAt: -1 });
  res.json(list);
});

router.post('/', auth, allowRoles('resident', 'admin', 'security'), async (req, res) => {
  try {
    const item = await Emergency.create({
      type: req.body.type,
      message: req.body.message,
      raisedBy: req.user._id,
      flatNo: req.user.flatNo,
      block: req.user.block
    });
    res.status(201).json(await item.populate('raisedBy', 'name flatNo block phone'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/handle', auth, allowRoles('admin', 'security', 'staff'), async (req, res) => {
  const item = await Emergency.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  item.status = 'handled';
  await item.save();
  res.json(await item.populate('raisedBy', 'name flatNo block phone'));
});

module.exports = router;
