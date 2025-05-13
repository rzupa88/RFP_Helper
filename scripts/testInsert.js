require("dotenv").config();
const { getDB, initDB } = require("../src/db");

(async () => {
  await initDB();
  const db = getDB();

  const test = {
    question: "What services does WellNet provide?",
    answer: "WellNet offers self-funded health plan administration services.",
    category: "Services",
    subcategory: null
  };

  try {
    const result = await db.query(
      `INSERT INTO qna_library (question, answer, category, subcategory)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [test.question, test.answer, test.category, test.subcategory]
    );
    console.log("✅ Inserted:", result.rows[0]);
  } catch (err) {
    console.error("❌ Insert error:", err.message);
  }
})();
