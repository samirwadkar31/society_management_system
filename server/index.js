require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const origins = [CLIENT_URL, 'http://localhost:5173'];

app.use(cors({ origin: origins }));
app.use(express.json({ limit: '15mb' }));

app.get('/', (req, res) => {
  res.json({ ok: true, name: 'Kutumb API' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/emergencies', require('./routes/emergencies'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/upload', require('./routes/upload'));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await require('./utils/demoStaff').ensureDemoStaff();
    app.listen(PORT, () => console.log('Kutumb server running on ' + PORT));
  })
  .catch((err) => {
    console.log('DB error', err.message);
    process.exit(1);
  });
