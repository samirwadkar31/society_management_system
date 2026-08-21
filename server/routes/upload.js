const express = require('express');
const { auth } = require('../middleware/auth');
const { upload, uploadBuffer } = require('../utils/upload');

const router = express.Router();

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file selected' });
    const url = await uploadBuffer(req.file.buffer, 'kutumb', req.file.mimetype);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
