const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }
});

function cloudinaryReady() {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

if (cloudinaryReady()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

function uploadBuffer(buffer, folder, mimetype) {
  return new Promise((resolve, reject) => {
    if (!cloudinaryReady()) {
      const base64 = buffer.toString('base64');
      resolve(`data:${mimetype};base64,${base64}`);
      return;
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder || 'kutumb', resource_type: 'auto' },
      (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

module.exports = { upload, uploadBuffer, cloudinaryReady };
