import express from "express";
import upload from "../config/multer.js";

const router = express.Router();

router.post("/file", upload.single("file"), (req, res) => {
  try {
    res.json({
      url: req.file.path,
      public_id: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({ error: "Error subiendo archivo" });
  }
});

export default router;