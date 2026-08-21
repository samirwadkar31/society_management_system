const express = require('express');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { auth, allowRoles } = require('../middleware/auth');
const { TRADE, staffJobFilter, canTake } = require('../utils/staffJobs');

const router = express.Router();

const populate = [
  { path: 'raisedBy', select: 'name email flatNo block phone' },
  { path: 'assignedTo', select: 'name email staffType phone' },
  { path: 'comments.user', select: 'name role' }
];

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'resident') filter.raisedBy = req.user._id;
    if (req.user.role === 'staff') Object.assign(filter, staffJobFilter(req.user));
    if (req.query.status) filter.status = req.query.status;
    const list = await Complaint.find(filter).populate(populate).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, allowRoles('resident', 'admin'), async (req, res) => {
  try {
    const payload = {
      title: req.body.title,
      category: req.body.category,
      priority: req.body.priority,
      description: req.body.description,
      media: req.body.media || [],
      raisedBy: req.user.role === 'admin' && req.body.raisedBy ? req.body.raisedBy : req.user._id
    };
    const trade = TRADE[req.body.category];
    if (trade) {
      const worker = await User.findOne({ role: 'staff', status: 'approved', staffType: trade });
      if (worker) {
        payload.assignedTo = worker._id;
        payload.status = 'assigned';
      }
    }
    const complaint = await Complaint.create(payload);
    res.status(201).json(await complaint.populate(populate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id).populate(populate);
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/assign', auth, allowRoles('admin'), async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    c.assignedTo = req.body.staffId;
    c.status = 'assigned';
    await c.save();
    res.json(await c.populate(populate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/status', auth, async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    if (req.user.role === 'staff' && !canTake(req.user, c)) {
      return res.status(403).json({ message: 'Not your job' });
    }
    if (req.user.role === 'staff' && !c.assignedTo) {
      c.assignedTo = req.user._id;
      if (c.status === 'open') c.status = 'assigned';
    }
    c.status = req.body.status;
    if (req.body.proofMedia) c.proofMedia = req.body.proofMedia;
    await c.save();
    res.json(await c.populate(populate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/comment', auth, async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    c.comments.push({ user: req.user._id, text: req.body.text });
    await c.save();
    res.json(await c.populate(populate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/escalate', auth, allowRoles('resident', 'admin'), async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    c.status = 'escalated';
    c.priority = 'high';
    await c.save();
    res.json(await c.populate(populate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/rate', auth, allowRoles('resident'), async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    if (String(c.raisedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your complaint' });
    }
    if (c.status !== 'resolved') {
      return res.status(400).json({ message: 'Rate only after it is resolved' });
    }
    c.rating = req.body.rating;
    c.ratingComment = req.body.ratingComment;
    await c.save();
    res.json(await c.populate(populate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
