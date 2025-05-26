// File: functions/tools/pdf_to_image/index.js

const functions = require("firebase-functions"); const { tmpdir } = require("os"); const path = require("path"); const fs = require("fs"); const { v4: uuidv4 } = require("uuid"); const Busboy = require("busboy"); const sharp = require("sharp"); const Tesseract = require("tesseract.js"); const pdf = require("pdf-parse"); const { fromPath } = require("pdf2pic");

exports.handler = functions.https.onRequest(async (req, res) => { if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

const busboy = new Busboy({ headers: req.headers }); const tmpFile = path.join(tmpdir(), ${uuidv4()}.pdf); const writeStream = fs.createWriteStream(tmpFile); let options = { split: false, grayscale: false, ocr: false };

let fileSaved = false;

busboy.on("file", (_, file) => file.pipe(writeStream));

busboy.on("field", (fieldname, val) => { if (fieldname in options) options[fieldname] = val === "on"; });

busboy.on("finish", async () => { writeStream.end();

writeStream.on("finish", async () => {
  try {
    const baseOptions = {
      density: 150,
      saveFilename: "page",
      savePath: tmpdir(),
      format: "png",
      width: 800,
      height: 1200,
    };

    const storeAsImage = fromPath(tmpFile, baseOptions);
    const numPages = (await pdf(fs.readFileSync(tmpFile))).numpages;

    const results = [];
    const extractedText = [];

    for (let i = 1; i <= numPages; i++) {
      const pagePath = await storeAsImage(i);
      let buffer = fs.readFileSync(pagePath.path);

      if (options.grayscale) buffer = await sharp(buffer).grayscale().toBuffer();

      if (options.ocr) {
        const ocr = await Tesseract.recognize(buffer, "eng");
        extractedText.push({ page: i, text: ocr.data.text });
      }

      results.push({
        name: `page-${i}.png`,
        base64: buffer.toString("base64"),
        type: "image/png",
      });

      // Cleanup image
      fs.unlinkSync(pagePath.path);
    }

    fs.unlinkSync(tmpFile); // Remove original PDF

    res.json({ images: results, extractedText });
  } catch (err) {
    console.error("Processing Error:", err);
    res.status(500).send("Conversion failed");
  }
});

});

req.pipe(busboy); });

        
