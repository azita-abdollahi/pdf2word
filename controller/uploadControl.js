const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const fs = require('fs')
const pdf_extract = require('pdf-extract')
const pdfParse = require('pdf-parse')
const config= require('config')
const officegen = require("officegen");
const toArray = require('stream-to-array');
require('../models/db');

let gfs;

const conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'connection error'));
conn.once('open', () => {
  // Init stream
  console.log("connected")
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {bucketName: 'uploads'})
  gfs = Grid(conn.db, mongoose.mongo);  
  gfs.collection('uploads');
});
exports.fileUpload= async(req, res)=> {
    console.log("/upload/");
    res.status(200)
    let response = {}
    response.success = true;
    response.message = `upload file Success`;
    response.result = req.file.originalname
    res.send(response)
}
exports.getFile= async (req, res)=> {
    console.log("/file/");
    await gfs.files.find({filename: req.params.filename}).toArray(function (err, file) {
        if (!file || file.length == 0) {
            return res.status(404).json({
                responseCode: 404,
                responseMessage: req.params.filename + " FILE NOT FOUND"
            });
        }
        // create read stream
        res.status(200)
        let response = {}
        response.success = true;
        response.message = `read file Success`;
        response.result = file[0]
        res.send(response)
    })
}
exports.showFile= async (req, res)=> {
    console.log("/file/download");
    await gfs.files.find({filename: req.params.filename}).toArray(async function (err, file) {
        if (!file || file.length== 0) {
            return res.status(404).json({
                responseCode: 404,
                responseMessage: req.params.filename + " FILE NOT FOUND"
            });
        }
        // create read stream
        let readstream = await gridfsBucket.openDownloadStream(file[0]._id)
    
        // Return response
        return readstream.pipe(res);
    })
}
exports.deleteFile= async (req, res)=> {
    console.log("/delete/")
    await gfs.files.find({filename: req.params.filename}).toArray(async function (err, file) {
    if (!file || file.length == 0) {
      return res.status(404).json({
        responseCode: 404,
        responseMessage: req.params.filename + " FILE NOT FOUND"
      });
    }
    try {
      const obj_id = new mongoose.Types.ObjectId(file[0]._id);
      await gridfsBucket.delete( obj_id );
      res.status(200)
      let response = {}
      response.success = true;
      response.message = `Delete Success`;
      response.result = req.params.filename
      res.send(response)
    } catch (error) {
      console.log({ error })
      res.status(400)
      let response = {}
      response.success = false;
      response.message = `Delete Failed`;
      response.result = null
      response.error_code = error
      res.send(response)
    }
  })
}
let streamToBuffer = async function(Stream, temp_path) {
  console.log("stream => buffer")
  await toArray(Stream)
      .then(async function (parts) {
        var buffers = []
        for (var i = 0, l = parts.length; i < l ; ++i) {
          var part = parts[i]
          buffers.push((part instanceof Buffer) ? part : Buffer.from(part))
        }
        let b= Buffer.concat(buffers);
        fs.writeFileSync(temp_path, b)
      })

}
let extractPDF = async (filee) => {
  try {
    await gfs.files.find({filename: filee}).toArray(async function (err, file) {
      if (!file || file.length == 0) {
        throw new Error("file_not_found")
      }
      let fullfilename= file[0].filename.split(".pdf");
      let filename = fullfilename[0];
      let output_path = config.get("WORD_PATH") + filename + ".docx";
      let temp_path = config.get("WORD_PATH") + filename + ".pdf";
      console.log({output_path})
      let readstream = gridfsBucket.openDownloadStream(file[0]._id)
      await streamToBuffer(readstream, temp_path)
      let fileSync = await fs.readFileSync(temp_path, function(err, data){
        console.log("burdayim")
        if (err) {
          console.log({err})
          throw err
        }
      })
      let Parse = await pdfParse(fileSync)
      let docx = await officegen("docx");
		  await docx.on("finalize", function (written) {
			  console.log("Finish to create a Microsoft Word document.");
		  });
		  await docx.on("error", function (err) {
			  console.log(err);
        throw err
		  });
      let pObj = await docx.createP();
      pObj.options.rtl = true;
      pObj.options.align = "justify";
      pObj.addText(Parse.text);

      let out = await fs.createWriteStream(output_path);
      out.on("error", function (err) {
        console.log(err);
        throw err
      });
      await docx.generate(out);
      let wordname = filename + ".docx"
      await fs.createReadStream(output_path).pipe(gridfsBucket.openUploadStream(wordname));
      await fs.unlinkSync(temp_path)
  })
}catch (error){
  throw error
}
}
let extractPDFOcr= async (filee)=> {
  try {
    await gfs.files.find({filename: filee}).toArray(async function (err, file) {
      if (!file || file.length == 0) {
        throw new Error("file_not_found")
      }
      let fullfilename= file[0].filename.split(".pdf");
      let filename = fullfilename[0];
      let output_path = config.get("WORD_PATH") + filename + ".docx";
      let temp_path = config.get("WORD_PATH") + filename + ".pdf";
      console.log({output_path})
      let readstream = gridfsBucket.openDownloadStream(file[0]._id)
      await streamToBuffer(readstream, temp_path)
      await fs.readFileSync(temp_path)
      const options = {
        type: 'ocr',// (required), perform ocr to get the text within the scanned image
        ocr_flags: [
        '-psm 1',   // automatically detect page orientation
        '-l fas+eng'
      ]
        }
      const processor = pdf_extract(temp_path, options, async function (error){
        if (error) {
            console.log(error);
            throw error
          }
        })
      processor.on('complete', async function (data) {
        let docx = officegen("docx");
        docx.on("finalize", async function (written) {
            console.log("Finish to create a Microsoft Word document.");
        });
        docx.on("error", async function (err) {
            console.log(err);
            throw err
        });

        let pObj = await docx.createP();
        pObj.options.rtl = true;
        pObj.options.align = "justify";
        for (let index = 0; index < data.text_pages.length; index++) {
          pObj.addText(data.text_pages[index]);
        }
        

        let out = await fs.createWriteStream(output_path);

        out.on("error", async function (err) {
            console.log(err);
            throw err
        });
        await docx.generate(out);
        let wordname = filename + ".docx"
        console.log({wordname})
        await fs.createReadStream(output_path).pipe(gridfsBucket.openUploadStream(wordname));
        await fs.unlinkSync(temp_path)
    });
    processor.on('error', async function (error) {
        console.log(error);
        throw error
      });
    });
  } catch (error) {
      throw error
  }
}
exports.pdf2Word= async (req, res)=> {
    try {
        console.log("/textPdfToWord");
        await extractPDF(req.file.originalname)
        let response= {}
        response.success= true;
        response.message= "convert pdf to word successfully."
        res.send(response)
    } catch (error) {
        res.send(error)
    }
}

exports.ocr = async (req, res)=> {
  try {
    console.log("/ocr")
    await extractPDFOcr(req.file.originalname)
    let response= {}
    response.success= true;
    response.message= "convert  pdf to word successfully."
    res.send(response)
  } catch (error) {
    res.send(error)
  }
}
