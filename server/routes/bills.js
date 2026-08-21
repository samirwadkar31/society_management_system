const express = require('express');
const crypto = require('crypto');
const Bill = require('../models/Bill');
const User = require('../models/User');
const { auth, allowRoles } = require('../middleware/auth');

const router = express.Router();

function maybeLateFee(bill) {
  if (bill.status === 'paid') return bill;
  if (!bill.type) bill.type = 'maintenance';
  if (bill.dueDate) {
    const due = new Date(bill.dueDate);
    due.setHours(23, 59, 59, 999);
    if (new Date() > due) {
      bill.status = 'overdue';
      if ((bill.type || 'maintenance') === 'maintenance' && !bill.lateFee) bill.lateFee = 100;
    }
  }
  return bill;
}

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'resident') filter.resident = req.user._id;
    if (req.query.status) filter.status = req.query.status;
    const bills = await Bill.find(filter)
      .populate('resident', 'name email flatNo block phone residentType')
      .sort({ year: -1, month: -1 });
    const mapped = [];
    for (const b of bills) {
      maybeLateFee(b);
      if (b.isModified()) await b.save();
      mapped.push(b);
    }
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/generate', auth, allowRoles('admin'), async (req, res) => {
  try {
    const { month, year, amount, dueDate } = req.body;
    const type = Bill.TYPES.includes(req.body.type) ? req.body.type : 'maintenance';
    const title = String(req.body.title || '').trim();
    if ((type === 'vargani' || type === 'other') && !title) {
      return res.status(400).json({ message: 'Give this charge a name.' });
    }
    const residents = await User.find({ role: 'resident', status: 'approved' });
    const created = [];
    for (const r of residents) {
      const exists = await Bill.findOne({ resident: r._id, month, year, type, title });
      if (exists) continue;
      const bill = await Bill.create({
        resident: r._id,
        type,
        title,
        month,
        year,
        amount,
        dueDate: dueDate ? new Date(dueDate) : new Date(year, month - 1, 10)
      });
      created.push(bill);
    }
    const label = title || type.replace(/-/g, ' ');
    res.json({
      message: created.length
        ? `Created ${created.length} ${label} bills`
        : `Every approved flat already has this ${label} bill`,
      count: created.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/order', auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (req.user.role === 'resident' && String(bill.resident) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your bill' });
    }
    maybeLateFee(bill);
    const total = bill.amount + (bill.lateFee || 0);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.json({
        demo: true,
        amount: total,
        key: null,
        message: 'Razorpay keys not set. Use demo pay.'
      });
    }

    const Razorpay = require('razorpay');
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    const order = await rzp.orders.create({
      amount: total * 100,
      currency: 'INR',
      receipt: String(bill._id)
    });
    bill.razorpayOrderId = order.id;
    await bill.save();
    res.json({ demo: false, order, key: process.env.RAZORPAY_KEY_ID, amount: total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/verify', auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
      if (expected !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed' });
      }
    }

    bill.status = 'paid';
    bill.paidAt = new Date();
    bill.razorpayPaymentId = razorpay_payment_id || 'demo_pay';
    await bill.save();
    await bill.populate('resident', 'name email flatNo block phone residentType');
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate(
      'resident',
      'name email flatNo block phone residentType'
    );
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (req.user.role === 'resident' && String(bill.resident?._id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your bill' });
    }
    maybeLateFee(bill);
    if (bill.isModified()) await bill.save();
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
