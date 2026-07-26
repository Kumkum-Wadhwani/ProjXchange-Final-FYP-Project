import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, 'proposal-' + uniqueSuffix + '-' + cleanName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  console.log('📁 File upload attempt:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  if (file.mimetype === 'application/pdf' || fileExt === '.pdf') {
    cb(null, true);
  } else {
    console.log('❌ Invalid file type:', file.mimetype);
    cb(new Error('Only PDF files are allowed for project proposals.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1000 * 1024 * 1024 // 1000MB limit
  }
});

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum size is 1000MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_TYPE') {
      return res.status(400).json({ 
        message: 'Only PDF files are allowed.' 
      });
    }
  }
  next(err);
};

export default upload;
export { handleUploadError };