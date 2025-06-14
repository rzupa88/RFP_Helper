require("dotenv").config(); // Load environment variables
const { Pool } = require("pg");
const dns = require("dns").promises;
const { URL } = require("url");

let pool = null;

async function initDB() {
  const dbUrl = new URL(process.env.DATABASE_URL);
  pool = new Pool({
    user: dbUrl.username,
    password: dbUrl.password,
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port),
    database: dbUrl.pathname.slice(1),
    ssl: {
      rejectUnauthorized: false
    },
    family: 4 // Force IPv4
  });

  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Connected to Supabase:", res.rows[0]);
  } catch (err) {
    console.error("❌ DB error:", err);
  }

  return pool;
}

module.exports = {
  initDB,
  getDB: () => pool,
};
