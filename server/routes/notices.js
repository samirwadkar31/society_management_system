const express = require('express');
const Notice = require('../models/Notice');
const { auth, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const list = await Notice.find()
    .populate('createdBy', 'name')
    .sort({ pinned: -1, createdAt: -1 });
  res.json(list);
});

router.post('/', auth, allowRoles('admin'), async (req, res) => {
  try {
    const notice = await Notice.create({
      title: req.body.title,
      body: req.body.body,
      type: req.body.type,
      pinned: req.body.pinned || false,
      attachments: req.body.attachments || [],
      createdBy: req.user._id
    });
    res.status(201).json(await notice.populate('createdBy', 'name'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, allowRoles('admin'), async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(notice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, allowRoles('admin'), async (req, res) => {
  await Notice.findByIdAndDelete(req.params.id);
  res.json({ message: 'Notice removed' });
});

module.exports = router;
