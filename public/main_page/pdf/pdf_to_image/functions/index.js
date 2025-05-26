const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const Tesseract = require("tesseract.js");

const app = express();
app.use(cors({ origin: true }));

const upload = multer({ dest: "/tmp" });

app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileName = req.file.originalname.replace(/\.[^/.]+$/, "");
    const split = req.body.split === "on";
    const grayscale = req.body.grayscale === "on";
    const ocr = req.body.ocr === "on";

    const outputDir = `/tmp/${Date.now()}_${fileName}`;
    fs.mkdirSync(outputDir);

    const flags = grayscale ? "-gray" : "";
    const cmd = `pdftoppm ${flags} -jpeg "${filePath}" "${outputDir}/page"`;

    exec(cmd, async (error) => {
      if (error) return res.status(500).send("Conversion failed.");

      const files = fs.readdirSync(outputDir).filter(f => f.endsWith(".jpg"));
      const responses = [];

      for (const file of files) {
        const fullPath = path.join(outputDir, file);
        const image = fs.readFileSync(fullPath, { encoding: "base64" });

        if (ocr) {
          const { data: { text } } = await Tesseract.recognize(fullPath, "eng");
          responses.push({ filename: file, image, text });
        } else {
          responses.push({ filename: file, image });
        }
      }

      res.status(200).json({ success: true, files: responses });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

exports.api = functions.https.onRequest(app);
