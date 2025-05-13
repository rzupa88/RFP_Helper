require("dotenv").config();
const { initDB, getDB } = require("./db");

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
    const allowedTypes = [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  }
});

// Upload HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../upload.html"));
});

// File Upload Endpoint
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

// Add Question to Q&A Library
app.post("/add-question", async (req, res) => {
  const db = getDB();
  const { question, answer, category, subcategory } = req.body;

  if (!question || !answer || !category) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const result = await db.query(
      `INSERT INTO qna_library (question, answer, category, subcategory)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [question, answer, category, subcategory || null]
    );

    res.status(201).json({
      message: "Question added successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("DB insert error:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// TEMP route to test DB insert locally
app.get("/test-insert", async (req, res) => {
  const db = getDB();

  const sampleData = {
    question: "What is your implementation timeline?",
    answer: "Our typical implementation takes 4-6 weeks.",
    category: "Implementation",
    subcategory: null
  };

  try {
    const result = await db.query(
      `INSERT INTO qna_library (question, answer, category, subcategory)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [sampleData.question, sampleData.answer, sampleData.category, sampleData.subcategory]
    );

    res.status(201).json({
      message: "Test insert successful",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Test insert error:", err);
    res.status(500).json({ message: "Test insert failed", error: err.message });
  }
});

// Initialize DB and start server
initDB().then(() => {
  const db = getDB();

  db.query("SELECT NOW()")
    .then(res => console.log("✅ Database connected:", res.rows[0]))
    .catch(err => console.error("❌ DB query error:", err));

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("❌ Failed to initialize DB:", err);
});
