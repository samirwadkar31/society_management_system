const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: String,
    type: {
      type: String,
      enum: ['general', 'water', 'power', 'meeting', 'event'],
      default: 'general'
    },
    pinned: { type: Boolean, default: false },
    attachments: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);
