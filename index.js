const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// Serve all files from the current directory (including index.html, CSS, JS)
app.use(express.static(__dirname));

// Fallback to index.html for any route (for SPAs)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`FileBae is running on port ${PORT}`);
});
