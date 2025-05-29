const { onRequest } = require("firebase-functions/v2/https");
const pdfToImage = require("./tools/pdf_to_image/handler");

exports.pdfToImage = onRequest(pdfToImage);
