const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['plumbing', 'electrical', 'housekeeping', 'lift', 'security', 'other'],
      default: 'other'
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    description: String,
    media: [String],
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in-progress', 'resolved', 'escalated'],
      default: 'open'
    },
    comments: [commentSchema],
    proofMedia: [String],
    rating: Number,
    ratingComment: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
