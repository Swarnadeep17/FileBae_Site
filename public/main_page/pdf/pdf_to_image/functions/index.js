// File: public/main_page/pdf/pdf_to_image/functions/index.js

const express = require("express"); const cors = require("cors"); const Busboy = require("busboy"); const fs = require("fs"); const path = require("path"); const os = require("os"); const sharp = require("sharp"); const { fromPath } = require("pdf2pic"); const Tesseract = require("tesseract.js"); const app = express();

app.use(cors());

app.post("/pdf-to-image", async (req, res) => { const busboy = new Busboy({ headers: req.headers }); const tmpDir = os.tmpdir(); const fields = {}; let uploadedFilePath = "";

busboy.on("file", (fieldname, file, filename) => { if (!filename.endsWith(".pdf")) { return res.status(400).json({ error: "Only PDF files allowed" }); } uploadedFilePath = path.join(tmpDir, ${Date.now()}-${filename}); const writeStream = fs.createWriteStream(uploadedFilePath); file.pipe(writeStream); });

busboy.on("field", (fieldname, val) => { fields[fieldname] = val; });

busboy.on("finish", async () => { try { const format = fields.format || "jpg"; const split = fields.split === "on"; const grayscale = fields.grayscale === "on"; const ocr = fields.ocr === "on"; const resolution = parseInt(fields.resolution || "144"); const quality = parseInt(fields.quality || "80");

const outputDir = path.join(tmpDir, `converted-${Date.now()}`);
  fs.mkdirSync(outputDir);

  const options = {
    density: resolution,
    saveFilename: "page",
    savePath: outputDir,
    format,
    quality,
  };

  const convert = fromPath(uploadedFilePath, options);
  const info = await convert.bulk(-1);

  let results = [];
  let ocrText = "";

  for (let page of info) {
    let imgPath = page.path;
    const base64 = fs.readFileSync(imgPath, { encoding: "base64" });
    results.push({ name: path.basename(imgPath), base64 });

    if (ocr) {
      const { data } = await Tesseract.recognize(imgPath, "eng");
      ocrText += `\nPage ${results.length}:\n` + data.text + "\n";
    }
  }

  // Cleanup after 5 minutes
  setTimeout(() => {
    try {
      fs.rmSync(uploadedFilePath);
      fs.rmSync(outputDir, { recursive: true });
    } catch (e) {}
  }, 5 * 60 * 1000);

  res.json({ images: results, ocr: ocr ? ocrText : null });
} catch (err) {
  console.error(err);
  res.status(500).json({ error: "Conversion failed." });
}

});

req.pipe(busboy); });

app.get("/", (req, res) => { res.send("PDF to Image API is running."); });

const PORT = process.env.PORT || 8080; app.listen(PORT, () => console.log(Server running on port ${PORT}));

