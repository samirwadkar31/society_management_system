const mongoose = require('mongoose');

const TYPES = ['maintenance', 'vargani', 'sinking-fund', 'other'];

const billSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TYPES, default: 'maintenance' },
    title: { type: String, default: '' },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    amount: { type: Number, required: true },
    lateFee: { type: Number, default: 0 },
    dueDate: Date,
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    paidAt: Date
  },
  { timestamps: true }
);

billSchema.statics.TYPES = TYPES;

module.exports = mongoose.model('Bill', billSchema);
