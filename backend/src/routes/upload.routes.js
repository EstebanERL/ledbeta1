import express from "express";
import upload from "../config/multer.js";

const router = express.Router();

router.post("/file", upload.single("file"), (req, res) => {
  try {
    console.log("FILE RECIBIDO:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No llegó archivo" });
    }

    res.json({
      url: req.file.path,          // ✔ URL REAL de Cloudinary
      public_id: req.file.public_id || req.file.filename,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error subiendo archivo" });
  }
});

export default router;