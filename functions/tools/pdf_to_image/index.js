// functions/tools/pdf_to_image/index.js

const functions = require("firebase-functions");
const Busboy    = require("busboy");
const { tmpdir }= require("os");
const path      = require("path");
const fs        = require("fs");
const { v4: uuidv4 } = require("uuid");
const pdf       = require("pdf-parse");
const { fromPath } = require("pdf2pic");
const sharp     = require("sharp");
const Tesseract= require("tesseract.js");

exports.pdfToImage = functions
  .runWith({ memory: "1GB", timeoutSeconds: 300 })
  .https.onRequest((req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const busboy = new Busboy({ headers: req.headers });
    const tmpPdf = path.join(tmpdir(), `${uuidv4()}.pdf`);
    const writeStream = fs.createWriteStream(tmpPdf);

    // Default options
    let opts = { format: "png", quality: 80, dpi: 150, ocr: false };
    busboy.on("file", (_, file) => file.pipe(writeStream));
    busboy.on("field", (name, val) => {
      if (name === "format")   opts.format = val;
      if (name === "quality")  opts.quality = parseInt(val,10);
      if (name === "dpi")      opts.dpi = parseInt(val,10);
      if (name === "ocr")      opts.ocr = val === "on";
    });

    busboy.on("finish", () => writeStream.end());
    writeStream.on("finish", async () => {
      try {
        // Read number of pages
        const dataBuffer = fs.readFileSync(tmpPdf);
        const meta = await pdf(dataBuffer);
        const numPages = meta.numpages;

        // Setup pdf2pic
        const convert = fromPath(tmpPdf, {
          density: opts.dpi,
          saveFilename: "page",
          savePath: tmpdir(),
          format: opts.format,
          width: null,
          height: null,
          quality: opts.quality
        });

        const images = [];
        const extractedText = [];

        for (let i = 1; i <= numPages; i++) {
          const pageResult = await convert(i, { returnPromise: true });
          let imgBuf = fs.readFileSync(pageResult.path);

          // Optionally OCR
          if (opts.ocr) {
            const { data: { text }} = await Tesseract.recognize(imgBuf, "eng");
            extractedText.push({ page: i, text: text.trim() });
          }

          images.push({
            name: `page-${i}.${opts.format}`,
            type: `image/${opts.format}`,
            base64: imgBuf.toString("base64")
          });

          fs.unlinkSync(pageResult.path);
        }

        fs.unlinkSync(tmpPdf);

        return res.json({ images, extractedText });
      } catch (err) {
        console.error("Error converting PDF:", err);
        return res.status(500).send("Conversion failed");
      }
    });

    busboy.end(req.rawBody);
  });
