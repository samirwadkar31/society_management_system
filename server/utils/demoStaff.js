const bcrypt = require('bcryptjs');
const User = require('../models/User');

const EXTRA_STAFF = [
  {
    name: 'Lata More',
    email: 'housekeeping@kutumb.local',
    staffType: 'housekeeping',
    phone: '9876500007'
  },
  {
    name: 'Nitin Kale',
    email: 'lift@kutumb.local',
    staffType: 'lift',
    phone: '9876500009'
  },
  {
    name: 'Vikram Naik',
    email: 'general@kutumb.local',
    staffType: 'general',
    phone: '9876500010'
  }
];

async function ensureDemoStaff() {
  const password = await bcrypt.hash('Staff@123', 10);
  for (const s of EXTRA_STAFF) {
    const exists = await User.findOne({ email: s.email });
    if (exists) continue;
    await User.create({
      ...s,
      password,
      role: 'staff',
      status: 'approved'
    });
    console.log('Added demo staff', s.email);
  }
}

module.exports = { ensureDemoStaff };
