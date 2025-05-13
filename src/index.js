require("dotenv").config();
// src/index.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (like upload.html)
app.use(express.static(path.join(__dirname, "..")));

// File storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads/"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      ".pdf",
      ".docx",
      ".doc",
      ".xlsx",
      ".xls",
      ".csv",
      ".txt"
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  }
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../upload.html"));
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.json({
    message: "File uploaded successfully",
    filename: req.file.filename,
    originalname: req.file.originalname
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const db = require("./db");

db.query("SELECT NOW()")
  .then(res => console.log("Database connected:", res.rows[0]))
  .catch(err => console.error("DB error:", err));

