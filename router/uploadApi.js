const upload= require("../middleware/upload");
const fileUploading = require("../controller/uploadControl");
const express = require("express");
const router = express.Router();

router.post("/upload", upload.single("file"), fileUploading.fileUpload);
router.get("/file/:filename", fileUploading.getFile);
router.get("/file/download/:filename", fileUploading.showFile);
router.post("/delete/file/:filename", fileUploading.deleteFile);
router.post("/textPdfToWord", upload.single("file"), fileUploading.pdf2Word);
router.post("/ocr", upload.single("file"), fileUploading.ocr);

module.exports = router;