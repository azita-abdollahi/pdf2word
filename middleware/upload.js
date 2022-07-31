const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const dbInstance= require('../models/db');

const storage = new GridFsStorage({
    db: dbInstance,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
          const filename = file.originalname;
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
      });
    }
  });
  
module.exports = multer({ storage})