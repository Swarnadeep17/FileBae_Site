const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { fromPath } = require("pdf2pic");
const Tesseract = require("tesseract.js");

const app = express();
app.use(cors());

const upload = multer({ dest: "/tmp" });

app.post("/api/pdf-to-image", upload.single("file"), async (req, res) => {
  const file = req.file;
  const { split, grayscale, ocr } = req.body;
  const options = {
    density: 200,
    saveFilename: "converted",
    savePath: "/tmp",
    format: "png",
    width: 1200,
    height: 1600,
    quality: 100,
  };

  const converter = fromPath(file.path, options);
  const numPages = await getPageCount(file.path);
  const images = [];
  const extractedText = [];

  for (let i = 1; i <= numPages; i++) {
    const output = await converter(i, true);
    const imgPath = output.path;
    const base64 = fs.readFileSync(imgPath).toString("base64");

    images.push({
      name: `page-${i}.png`,
      base64,
      type: "image/png",
    });

    if (ocr === "on") {
      const { data } = await Tesseract.recognize(imgPath, "eng");
      extractedText.push({ page: i, text: data.text.trim() });
    }
  }

  // Schedule deletion after 5 minutes
  setTimeout(() => {
    try {
      fs.unlinkSync(file.path);
      images.forEach((img, i) => {
        const imgPath = `/tmp/converted.${i + 1}.png`;
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });
    } catch (e) {
      console.error("Cleanup failed:", e);
    }
  }, 5 * 60 * 1000);

  res.json({
    images,
    extractedText,
    notice: "Files are auto-deleted from server in 5 minutes for your privacy.",
  });
});

async function getPageCount(filePath) {
  const pdfjsLib = require("pdfjs-dist");
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  return pdf.numPages;
}

module.exports = app;