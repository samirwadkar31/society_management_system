const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: String,
    purpose: { type: String, enum: ['guest', 'delivery'], default: 'guest' },
    visitingUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleNo: String,
    status: {
      type: String,
      enum: ['pre-approved', 'entered', 'exited', 'expired'],
      default: 'pre-approved'
    },
    passCode: String,
    entryAt: Date,
    exitAt: Date,
    note: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visitor', visitorSchema);
