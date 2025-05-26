const functions = require('firebase-functions');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
app.use(cors());
const upload = multer({ dest: '/tmp/' });

app.post('/pdf-to-image', upload.single('file'), (req, res) => {
  const file = req.file;
  const options = req.body;
  const fileId = uuidv4();
  const outputPath = `/tmp/${fileId}`;

  const grayscale = options.grayscale ? '-colorspace Gray' : '';
  const density = 200;

  const convertCommand = `convert -density ${density} ${grayscale} "${file.path}" "${outputPath}-%03d.jpg"`;

  exec(convertCommand, async (error, stdout, stderr) => {
    if (error) {
      console.error('Conversion error:', error);
      return res.status(500).send('Conversion failed');
    }

    const images = fs.readdirSync('/tmp')
      .filter(f => f.startsWith(fileId) && f.endsWith('.jpg'))
      .map(f => path.resolve('/tmp', f));

    res.setHeader('Content-Type', 'application/json');
    res.send({ images: images.map(img => `/download/${path.basename(img)}`) });
  });
});

exports.api = functions.https.onRequest(app);
