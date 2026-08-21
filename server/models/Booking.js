const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    start: { type: String, required: true }, // HH:mm
    end: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'cancelled', 'rejected'],
      default: 'pending'
    },
    note: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
