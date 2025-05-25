const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();
app.use(cors({ origin: true }));

app.post("/convert", (req, res) => {
  res.status(200).send("PDF to Image logic goes here.");
});

exports.api = functions.https.onRequest(app);
