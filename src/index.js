require("dotenv").config();
const { initDB, getDB } = require("./db");

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const csv = require('csv-parser');
const fs = require('fs');

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
  res.sendFile(path.join(__dirname, "../public/admin.html"));
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

// Test route for XAI
app.get("/test-xai", async (req, res) => {
  try {
    const OpenAI = require('openai');
    
    const client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });

    const completion = await client.chat.completions.create({
      model: "grok-3-beta",
      messages: [
        { role: "user", content: "What is the meaning of life?" }
      ]
    });

    res.json({
      success: true,
      response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error("❌ XAI Test Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data || error 
    });
  }
});

// Import XAI service
const xai = require('./xai');

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI question answering endpoint
app.post('/api/answer', async (req, res) => {
  try {
    console.log('Received question:', req.body.question);
    const { question } = req.body;
    if (!question) {
      console.error('No question provided');
      return res.status(400).json({ error: "Question is required" });
    }
    
    console.log('Generating response...');
    const answer = await xai.generateResponse(question);
    console.log('Response generated:', answer.substring(0, 50) + '...');
    res.json({ answer });
  } catch (error) {
    console.error('Error generating answer:', error);
    res.status(500).json({ error: "Failed to generate answer" });
  }
});

// Chatbot route with XAI integration
app.post("/chat", async (req, res) => {
  const db = getDB();
  const { question, useGrok } = req.body;

  if (!question) {
    return res.status(400).json({ message: "Missing question." });
  }

  try {
    // First, try to find matches in the database
    const result = await db.query(
      `SELECT *, similarity(question, $1) as match_score
       FROM qna_library
       WHERE similarity(question, $1) > 0.15
       ORDER BY similarity(question, $1) DESC
       LIMIT 5`,
      [question]
    );

    if (result.rows.length > 0 && result.rows[0].match_score > 0.25) {
      // If found good match in database, return the best match
      const dbMatch = result.rows[0];
      res.json({
        match: dbMatch,
        source: "database",
        similarity: Math.round(dbMatch.match_score * 100) + "%",
        message: "Match found in database"
      });
    } else {
      // If no database match and useGrok is not set, ask user if they want to use Grok
      if (!useGrok) {
        res.json({
          match: null,
          source: null,
          askForGrok: true,
          message: "No matching answer found in database. Would you like to get an answer from Grok?"
        });
      } else {
        // User has opted to use Grok
        try {
          // Build context from similar questions if available
          let context = '';
          if (result.rows.length > 0) {
            context = 'Here are some similar Q&As from our database that might be relevant:\n\n';
            result.rows.forEach((row, index) => {
              context += `Q${index + 1}: ${row.question}\nA${index + 1}: ${row.answer}\n\n`;
            });
            context += '\nUsing this information as context, please provide a comprehensive answer to the following question.';
          }

          const xaiResponse = await xai.generateResponse(question, context);
          res.json({
            match: {
              question: question,
              answer: xaiResponse
            },
            source: "grok",
            message: "Response generated by Grok using available context"
          });
        } catch (xaiError) {
          console.error("❌ Grok API error:", xaiError);
          res.status(500).json({ 
            message: "Failed to get response from Grok",
            error: xaiError.message 
          });
        }
      }
    }
  } catch (err) {
    console.error("❌ Chat route error:", err);
    res.status(500).json({ message: "Error processing request", error: err.message });
  }
});

// CSV Processing endpoint
app.post('/process-csv', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const db = getDB();
    const results = [];
    let processedCount = 0;

    // Create a promise to handle CSV processing
    const processCSV = new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
          // Check if Question column exists
          if (data.Question || data.question) {
            results.push(data.Question || data.question);
          }
        })
        .on('end', () => resolve())
        .on('error', reject);
    });

    await processCSV;

    // Process each question
    for (const question of results) {
      try {
        // Generate answer using XAI
        const answer = await xai.generateResponse(question);
        
        // Insert into database
        await db.query(
          'INSERT INTO qna_library (question, answer, category) VALUES ($1, $2, $3)',
          [question, answer, 'CSV Upload']
        );
        
        processedCount++;
      } catch (error) {
        console.error(`Error processing question: ${question}`, error);
        // Continue with next question even if one fails
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ 
      message: 'CSV processed successfully', 
      questionsProcessed: processedCount 
    });
  } catch (error) {
    console.error('Error processing CSV:', error);
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      message: 'Error processing CSV file',
      error: error.message 
    });
  }
});

// Delete Q&A entry
app.delete("/qna/:id", async (req, res) => {
  const db = getDB();
  const id = req.params.id;

  try {
    await db.query("DELETE FROM qna_library WHERE id = $1", [id]);
    res.json({ message: "Entry deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Error deleting entry", error: err.message });
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
