const express = require('express');
const Visitor = require('../models/Visitor');
const { auth, allowRoles } = require('../middleware/auth');

const router = express.Router();

function makePass() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'resident') filter.visitingUser = req.user._id;
    if (req.query.status) filter.status = req.query.status;
    const list = await Visitor.find(filter)
      .populate('visitingUser', 'name flatNo block phone')
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, allowRoles('resident', 'admin'), async (req, res) => {
  try {
    const visitor = await Visitor.create({
      name: req.body.name,
      phone: req.body.phone,
      purpose: req.body.purpose || 'guest',
      visitingUser: req.user.role === 'admin' && req.body.visitingUser ? req.body.visitingUser : req.user._id,
      vehicleNo: req.body.vehicleNo,
      note: req.body.note,
      passCode: makePass()
    });
    res.status(201).json(await visitor.populate('visitingUser', 'name flatNo block phone'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/enter', auth, allowRoles('security', 'admin'), async (req, res) => {
  const v = await Visitor.findById(req.params.id);
  if (!v) return res.status(404).json({ message: 'Visitor not found' });
  v.status = 'entered';
  v.entryAt = new Date();
  await v.save();
  res.json(await v.populate('visitingUser', 'name flatNo block phone'));
});

router.post('/:id/exit', auth, allowRoles('security', 'admin'), async (req, res) => {
  const v = await Visitor.findById(req.params.id);
  if (!v) return res.status(404).json({ message: 'Visitor not found' });
  v.status = 'exited';
  v.exitAt = new Date();
  await v.save();
  res.json(await v.populate('visitingUser', 'name flatNo block phone'));
});

router.get('/pass/:code', auth, allowRoles('security', 'admin'), async (req, res) => {
  const v = await Visitor.findOne({ passCode: req.params.code }).populate(
    'visitingUser',
    'name flatNo block phone'
  );
  if (!v) return res.status(404).json({ message: 'Pass not found' });
  res.json(v);
});

module.exports = router;
