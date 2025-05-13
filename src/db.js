const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL);

const { Pool } = require("pg");
const dns = require("dns").promises;
const { URL } = require("url");

let pool = null;

async function initDB() {
  const dbUrlString = process.env.DATABASE_URL;

  if (!dbUrlString) {
    throw new Error("DATABASE_URL is undefined. Make sure your .env file is loaded.");
  }

  const dbUrl = new URL(dbUrlString);
  const addresses = await dns.lookup(dbUrl.hostname, { family: 4 });
  const ipv4Host = addresses.address;

  pool = new Pool({
    user: dbUrl.username,
    password: dbUrl.password,
    host: ipv4Host,
    port: dbUrl.port,
    database: dbUrl.pathname.slice(1),
    ssl: {
      rejectUnauthorized: false,
    },
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
