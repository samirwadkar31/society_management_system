const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['fire', 'medical', 'security', 'electrical', 'water'],
      required: true
    },
    message: String,
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flatNo: String,
    block: String,
    status: { type: String, enum: ['active', 'handled'], default: 'active' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Emergency', emergencySchema);
