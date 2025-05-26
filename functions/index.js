const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const pdfToImageHandler = require("./tools/pdf_to_image/handler");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/pdf-to-image", pdfToImageHandler);

exports.api = functions.https.onRequest(app);
