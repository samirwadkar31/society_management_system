const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  name: String,
  relation: String,
  age: Number,
  phone: String
});

const vehicleSchema = new mongoose.Schema({
  type: String, // two-wheeler / four-wheeler
  number: String,
  model: String
});

const petSchema = new mongoose.Schema({
  name: String,
  type: String,
  notes: String
});

const emergencyContactSchema = new mongoose.Schema({
  name: String,
  relation: String,
  phone: String
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'resident', 'staff', 'security'],
      default: 'resident'
    },
    phone: String,
    block: String,
    flatNo: String,
    residentType: { type: String, enum: ['owner', 'tenant', ''], default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'inactive'],
      default: 'pending'
    },
    photo: String,
    staffType: String, // plumber, electrician, general
    familyMembers: [familyMemberSchema],
    vehicles: [vehicleSchema],
    pets: [petSchema],
    emergencyContacts: [emergencyContactSchema],
    resetToken: String,
    resetExpires: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
