const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  openTime: { type: String, default: '06:00' },
  closeTime: { type: String, default: '22:00' },
  slotMinutes: { type: Number, default: 60 }
});

module.exports = mongoose.model('Facility', facilitySchema);
