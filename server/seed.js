require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Bill = require('./models/Bill');
const Facility = require('./models/Facility');
const Booking = require('./models/Booking');
const Notice = require('./models/Notice');
const Visitor = require('./models/Visitor');
const Emergency = require('./models/Emergency');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('connected, seeding...');

  await Promise.all([
    User.deleteMany({}),
    Complaint.deleteMany({}),
    Bill.deleteMany({}),
    Facility.deleteMany({}),
    Booking.deleteMany({}),
    Notice.deleteMany({}),
    Visitor.deleteMany({}),
    Emergency.deleteMany({})
  ]);

  const pass = async (p) => bcrypt.hash(p, 10);

  const admin = await User.create({
    name: 'Meera Joshi',
    email: 'admin@kutumb.local',
    password: await pass('Admin@123'),
    role: 'admin',
    phone: '9876500001',
    status: 'approved'
  });

  const resident = await User.create({
    name: 'Arjun Shah',
    email: 'resident@kutumb.local',
    password: await pass('Resident@123'),
    role: 'resident',
    phone: '9876500002',
    block: 'A',
    flatNo: '1204',
    residentType: 'owner',
    status: 'approved',
    familyMembers: [
      { name: 'Nisha Shah', relation: 'Spouse', age: 32, phone: '9876500012' },
      { name: 'Aarav Shah', relation: 'Son', age: 6 }
    ],
    vehicles: [{ type: 'four-wheeler', number: 'MH12 AB 4411', model: 'Nexon' }],
    pets: [{ name: 'Milo', type: 'Dog', notes: 'Friendly labrador' }],
    emergencyContacts: [{ name: 'Rakesh Shah', relation: 'Father', phone: '9876500099' }]
  });

  const resident2 = await User.create({
    name: 'Priya Kulkarni',
    email: 'priya@kutumb.local',
    password: await pass('Resident@123'),
    role: 'resident',
    phone: '9876500003',
    block: 'B',
    flatNo: '503',
    residentType: 'tenant',
    status: 'approved',
    familyMembers: [{ name: 'Rohan Kulkarni', relation: 'Spouse', age: 29 }]
  });

  await User.create({
    name: 'Sneha Patil',
    email: 'pending@kutumb.local',
    password: await pass('Resident@123'),
    role: 'resident',
    phone: '9876500008',
    block: 'C',
    flatNo: '210',
    residentType: 'owner',
    status: 'pending'
  });

  const staff = await User.create({
    name: 'Ramesh Pawar',
    email: 'staff@kutumb.local',
    password: await pass('Staff@123'),
    role: 'staff',
    phone: '9876500004',
    staffType: 'plumber',
    status: 'approved'
  });

  const staff2 = await User.create({
    name: 'Imran Shaikh',
    email: 'electric@kutumb.local',
    password: await pass('Staff@123'),
    role: 'staff',
    phone: '9876500005',
    staffType: 'electrician',
    status: 'approved'
  });

  const house = await User.create({
    name: 'Lata More',
    email: 'housekeeping@kutumb.local',
    password: await pass('Staff@123'),
    role: 'staff',
    phone: '9876500007',
    staffType: 'housekeeping',
    status: 'approved'
  });

  const liftStaff = await User.create({
    name: 'Nitin Kale',
    email: 'lift@kutumb.local',
    password: await pass('Staff@123'),
    role: 'staff',
    phone: '9876500009',
    staffType: 'lift',
    status: 'approved'
  });

  const general = await User.create({
    name: 'Vikram Naik',
    email: 'general@kutumb.local',
    password: await pass('Staff@123'),
    role: 'staff',
    phone: '9876500010',
    staffType: 'general',
    status: 'approved'
  });

  const security = await User.create({
    name: 'Suresh Yadav',
    email: 'security@kutumb.local',
    password: await pass('Security@123'),
    role: 'security',
    phone: '9876500006',
    status: 'approved'
  });

  const gym = await Facility.create({
    name: 'Gym',
    description: 'Ground floor gym, 6am to 10pm'
  });
  const hall = await Facility.create({
    name: 'Clubhouse Hall',
    description: 'For birthdays and society meetings'
  });
  await Facility.create({ name: 'Swimming Pool', description: 'Morning and evening slots' });
  await Facility.create({ name: 'Garden Lawn', description: 'Kids play and evening walk' });
  await Facility.create({ name: 'Guest Room', description: 'One room, overnight stay' });

  await Complaint.create({
    title: 'Kitchen tap leaking',
    category: 'plumbing',
    priority: 'medium',
    description: 'Constant drip under the sink since yesterday.',
    raisedBy: resident._id,
    assignedTo: staff._id,
    status: 'in-progress',
    comments: [{ user: staff._id, text: 'Will visit between 5-6 pm' }]
  });

  await Complaint.create({
    title: 'Lift B making noise',
    category: 'lift',
    priority: 'high',
    description: 'Grinding sound on 8th floor.',
    raisedBy: resident2._id,
    assignedTo: liftStaff._id,
    status: 'assigned'
  });

  await Complaint.create({
    title: 'Staircase not swept',
    category: 'housekeeping',
    priority: 'low',
    description: 'A-wing 11th to 12th.',
    raisedBy: resident._id,
    assignedTo: house._id,
    status: 'assigned'
  });

  await Complaint.create({
    title: 'Notice board glass cracked',
    category: 'other',
    priority: 'low',
    description: 'Lobby board near the lifts.',
    raisedBy: resident2._id,
    assignedTo: general._id,
    status: 'open'
  });

  await Complaint.create({
    title: 'Corridor light fused',
    category: 'electrical',
    priority: 'low',
    description: 'A-wing 12th floor.',
    raisedBy: resident._id,
    assignedTo: staff2._id,
    status: 'resolved',
    proofMedia: [],
    rating: 4,
    ratingComment: 'Fixed same day'
  });

  const now = new Date();
  await Bill.create({
    resident: resident._id,
    type: 'maintenance',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    amount: 4500,
    dueDate: new Date(now.getFullYear(), now.getMonth(), 12),
    status: 'pending'
  });
  await Bill.create({
    resident: resident._id,
    type: 'vargani',
    title: 'Ganesh Chaturthi',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    amount: 501,
    dueDate: new Date(now.getFullYear(), now.getMonth(), 20),
    status: 'pending'
  });
  await Bill.create({
    resident: resident2._id,
    type: 'maintenance',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    amount: 4200,
    dueDate: new Date(now.getFullYear(), now.getMonth(), 12),
    status: 'paid',
    paidAt: new Date(),
    razorpayPaymentId: 'demo_seed'
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);
  await Booking.create({
    facility: hall._id,
    user: resident._id,
    date: dateStr,
    start: '18:00',
    end: '21:00',
    status: 'pending',
    note: 'Aarav birthday'
  });
  await Booking.create({
    facility: gym._id,
    user: resident2._id,
    date: dateStr,
    start: '07:00',
    end: '08:00',
    status: 'approved'
  });

  await Notice.create({
    title: 'Water tank cleaning on Sunday',
    body: 'Supply will be off from 9am to 1pm. Please store water.',
    type: 'water',
    pinned: true,
    createdBy: admin._id
  });
  await Notice.create({
    title: 'AGM — 28th, Clubhouse 6pm',
    body: 'Annual general meeting. Maintenance budget will be discussed.',
    type: 'meeting',
    pinned: false,
    createdBy: admin._id
  });
  await Notice.create({
    title: 'Ganesh utsav in courtyard',
    body: 'Society Ganesh from 31st. Volunteers needed for decoration.',
    type: 'event',
    createdBy: admin._id
  });

  await Visitor.create({
    name: 'Amazon delivery',
    phone: '9000011122',
    purpose: 'delivery',
    visitingUser: resident._id,
    status: 'pre-approved',
    passCode: '482190'
  });
  await Visitor.create({
    name: 'Neha Desai',
    phone: '9822012345',
    purpose: 'guest',
    visitingUser: resident._id,
    vehicleNo: 'MH14 CD 2290',
    status: 'entered',
    passCode: '119355',
    entryAt: new Date()
  });

  await Emergency.create({
    type: 'water',
    message: 'Overflow in A-1204 bathroom',
    raisedBy: resident._id,
    flatNo: '1204',
    block: 'A',
    status: 'handled'
  });

  console.log('Seed done. Demo logins:');
  console.log('admin@kutumb.local / Admin@123');
  console.log('resident@kutumb.local / Resident@123');
  console.log('staff@kutumb.local / Staff@123  (plumber)');
  console.log('electric@kutumb.local / Staff@123  (electrician)');
  console.log('housekeeping@kutumb.local / Staff@123');
  console.log('lift@kutumb.local / Staff@123');
  console.log('general@kutumb.local / Staff@123  (other / security jobs)');
  console.log('security@kutumb.local / Security@123');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.log(err);
  process.exit(1);
});
