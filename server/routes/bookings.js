const express = require('express');
const Facility = require('../models/Facility');
const Booking = require('../models/Booking');
const { auth, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/facilities', auth, async (req, res) => {
  const list = await Facility.find().sort({ name: 1 });
  res.json(list);
});

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'resident') filter.user = req.user._id;
    if (req.query.date) filter.date = req.query.date;
    if (req.query.facility) filter.facility = req.query.facility;
    const list = await Booking.find(filter)
      .populate('facility')
      .populate('user', 'name flatNo block')
      .sort({ date: 1, start: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

router.post('/', auth, allowRoles('resident', 'admin'), async (req, res) => {
  try {
    const { facility, date, start, end, note } = req.body;
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (!date || date < todayIso) {
      return res.status(400).json({ message: 'Bookings are only for today or later.' });
    }
    const existing = await Booking.find({
      facility,
      date,
      status: { $in: ['pending', 'approved'] }
    });
    const clash = existing.find((b) => overlaps(start, end, b.start, b.end));
    if (clash) {
      return res.status(400).json({ message: 'That slot is already booked' });
    }
    const booking = await Booking.create({
      facility,
      user: req.user._id,
      date,
      start,
      end,
      note,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    });
    const full = await booking.populate(['facility', { path: 'user', select: 'name flatNo' }]);
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/status', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const { status } = req.body;
    if (status === 'cancelled' && String(booking.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (['approved', 'rejected'].includes(status) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can approve' });
    }
    booking.status = status;
    await booking.save();
    res.json(await booking.populate(['facility', { path: 'user', select: 'name flatNo' }]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
