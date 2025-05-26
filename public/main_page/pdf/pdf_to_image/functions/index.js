const functions = require("firebase-functions");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { fromPath } = require("pdf2pic");
const sharp = require("sharp");
const Tesseract = require("tesseract.js");
const tmp = require("tmp");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({ origin: true }));

const upload = multer({
  dest: tmp.tmpdir,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

app.post("/pdf-to-image", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { split, grayscale, ocr, resolution, format, quality } = req.body;

    if (!file) return res.status(400).send("No PDF file provided.");

    const outputImages = [];
    const extractedText = [];

    const options = {
      density: parseInt(resolution) || 150,
      saveFilename: "page",
      savePath: tmp.tmpdir,
      format: format || "png",
      quality: parseInt(quality) || 80,
    };

    const convert = fromPath(file.path, options);
    const totalPages = await convert(1, true).then(info => info.pages);

    for (let page = 1; page <= totalPages; page++) {
      const output = await convert(page);

      let imagePath = output.path;
      if (grayscale === "on") {
        const grayPath = path.join(tmp.tmpdir, `gray_${Date.now()}_${page}.${options.format}`);
        await sharp(imagePath).grayscale().toFile(grayPath);
        fs.unlinkSync(imagePath);
        imagePath = grayPath;
      }

      const buffer = fs.readFileSync(imagePath);
      const base64 = buffer.toString("base64");
      outputImages.push({
        name: `page-${page}.${options.format}`,
        type: `image/${options.format}`,
        base64,
      });

      if (ocr === "on") {
        const { data } = await Tesseract.recognize(buffer, "eng", { logger: m => console.log(m) });
        extractedText.push({ page, text: data.text.trim() });
      }

      // Delete each image after processing
      fs.unlinkSync(imagePath);
    }

    // Clean up uploaded PDF
    fs.unlinkSync(file.path);

    res.json({
      images: outputImages,
      extractedText,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("An error occurred while processing the PDF.");
  }
});

exports.api = functions.runWith({ timeoutSeconds: 60, memory: "1GB" }).https.onRequest(app);