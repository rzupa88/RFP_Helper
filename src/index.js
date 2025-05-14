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

// Serve static files from /public folder
app.use(express.static(path.join(__dirname, "../public")));

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

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/upload.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
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

// ✅ Correct route for frontend fetch
app.get("/qna", async (req, res) => {
  const db = getDB();

  try {
    const result = await db.query("SELECT * FROM qna_library ORDER BY id DESC");
    console.log(`📦 Returning ${result.rows.length} Q&A entries`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Failed to fetch questions:", err);
    res.status(500).json({ message: "Database fetch error", error: err.message });
  }
});

// Temporary Test Route
app.get("/test-insert", async (req, res) => {
  const db = getDB();

  const sampleData = {
    question: "What is your implementation timeline?",
    answer: "Our typical implementation takes 4–6 weeks.",
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

// Start the app after DB is ready
initDB()
  .then(() => {
    const db = getDB();

    db.query("SELECT NOW()")
      .then(res => console.log("✅ Database connected:", res.rows[0]))
      .catch(err => console.error("❌ DB query error:", err));

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Failed to initialize DB:", err);
  });

  // Chatbot route - Phase 1
app.post("/chat", async (req, res) => {
  const db = getDB();
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ message: "Missing question." });
  }

  try {
   const result = await db.query(
  `SELECT * FROM qna_library
   WHERE similarity(question, $1) > 0.25
   ORDER BY similarity(question, $1) DESC
   LIMIT 1`,
  [question]
);


    if (result.rows.length > 0) {
      res.json({
        match: result.rows[0],
        message: "Match found"
      });
    } else {
      res.status(404).json({ message: "No close match found." });
    }
  } catch (err) {
    console.error("❌ Chat route error:", err);
    res.status(500).json({ message: "Error searching Q&A library", error: err.message });
  }
});
