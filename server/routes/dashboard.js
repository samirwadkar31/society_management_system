const express = require('express');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Bill = require('../models/Bill');
const Visitor = require('../models/Visitor');
const Emergency = require('../models/Emergency');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');
const { staffJobFilter } = require('../utils/staffJobs');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const [
        residents,
        pendingResidents,
        openComplaints,
        resolvedComplaints,
        pendingBills,
        paidBills,
        todayVisitors,
        activeSos,
        upcoming
      ] = await Promise.all([
        User.countDocuments({ role: 'resident', status: 'approved' }),
        User.countDocuments({ role: 'resident', status: 'pending' }),
        Complaint.countDocuments({ status: { $in: ['open', 'assigned', 'in-progress', 'escalated'] } }),
        Complaint.countDocuments({ status: 'resolved' }),
        Bill.countDocuments({ status: { $in: ['pending', 'overdue'] } }),
        Bill.find({ status: 'paid' }),
        Visitor.countDocuments({
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        Emergency.countDocuments({ status: 'active' }),
        Booking.countDocuments({
          status: { $in: ['pending', 'approved'] },
          date: { $gte: new Date().toISOString().slice(0, 10) }
        })
      ]);
      const collected = paidBills.reduce((s, b) => s + b.amount + (b.lateFee || 0), 0);
      res.json({
        residents,
        pendingResidents,
        openComplaints,
        resolvedComplaints,
        pendingBills,
        collected,
        todayVisitors,
        activeSos,
        upcoming
      });
      return;
    }

    if (req.user.role === 'resident') {
      const [myOpen, myBills, myBookings, myVisitors] = await Promise.all([
        Complaint.countDocuments({
          raisedBy: req.user._id,
          status: { $ne: 'resolved' }
        }),
        Bill.countDocuments({
          resident: req.user._id,
          status: { $in: ['pending', 'overdue'] }
        }),
        Booking.countDocuments({
          user: req.user._id,
          status: { $in: ['pending', 'approved'] }
        }),
        Visitor.countDocuments({
          visitingUser: req.user._id,
          status: { $in: ['pre-approved', 'entered'] }
        })
      ]);
      res.json({ myOpen, myBills, myBookings, myVisitors });
      return;
    }

    if (req.user.role === 'staff') {
      const mine = staffJobFilter(req.user);
      const assigned = await Complaint.countDocuments({
        ...mine,
        status: { $in: ['open', 'assigned', 'in-progress', 'escalated'] }
      });
      const done = await Complaint.countDocuments({
        assignedTo: req.user._id,
        status: 'resolved'
      });
      res.json({ assigned, done });
      return;
    }

    const expected = await Visitor.countDocuments({
      status: { $in: ['pre-approved', 'entered'] }
    });
    const sos = await Emergency.countDocuments({ status: 'active' });
    res.json({ expected, sos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
