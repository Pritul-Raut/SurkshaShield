const express = require("express");
const multer = require("multer");
const {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
} = require("../../helpers/cloudinary");

const router = express.Router();

//for serverful computing multer can be used as below
// const upload = multer({ dest: "uploads/" });


//for serverless computing on vercel
// Use memoryStorage so the file is stored in RAM, not on the read-only disk
const upload = multer({ storage: multer.memoryStorage() });



router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    //for serverful computing multer can be used as below
    
    // const result = await uploadMediaToCloudinary(req.file.path);

    //for serverless computing on vercel

    // 1. Convert the file buffer to a Base64 string
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    
    // 2. Create the data URI that Cloudinary understands
    const url = "data:" + req.file.mimetype + ";base64," + b64;
    
    // 3. Upload that URL string instead of a file path
    const result = await uploadMediaToCloudinary(url);
    //for serverless computing on vercel End

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (e) {
    console.log(e);
    
    res.status(500).json({ success: false, message: "Error uploading file" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assest Id is required",
      });
    }

    await deleteMediaFromCloudinary(id);

    res.status(200).json({
      success: true,
      message: "Assest deleted successfully from cloudinary",
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({ success: false, message: "Error deleting file" });
  }
});

router.post("/bulk-upload", upload.array("files", 10), async (req, res) => {
  try {
    //for serverful computing multer can be used as below
    // const uploadPromises = req.files.map((fileItem) =>
    //   uploadMediaToCloudinary(fileItem.path)

    const uploadPromises = req.files.map((fileItem) => {
      // 1. Convert each file buffer to Base64
      const b64 = Buffer.from(fileItem.buffer).toString("base64");
      
      // 2. Create the data URI
      const url = "data:" + fileItem.mimetype + ";base64," + b64;
      
      // 3. Return the promise to upload this specific file
      return uploadMediaToCloudinary(url);}
    );

    const results = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (event) {
    console.log(event);

    res
      .status(500)
      .json({ success: false, message: "Error in bulk uploading files" });
  }
});

module.exports = router;
