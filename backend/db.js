// backend/db.js

const mysql = require('mysql2/promise');

// ======================
// KONFIGURASI DATABASE (RAILWAY)
// ======================
const dbConfig = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// ======================
// BUAT CONNECTION POOL
// ======================
const pool = mysql.createPool(dbConfig);

// ======================
// TEST KONEKSI
// ======================
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ DATABASE RAILWAY TERHUBUNG');
    conn.release();
  } catch (err) {
    console.error('❌ GAGAL KONEK DATABASE');
    console.error(err.message);
  }
})();

// ======================
// FUNGSI DATABASE
// ======================
async function getAllGejalaForFrontend() {
  const [rows] = await pool.query(
    'SELECT code AS id, name AS text, category FROM symptoms ORDER BY category, code'
  );
  return rows;
}

async function getAllRules() {
  const [rows] = await pool.query(
    'SELECT symptom_code AS id_gejala, disease_code AS id_penyakit FROM rules'
  );
  return rows;
}

async function getDiseaseDetailsByCodes(codes) {
  if (!codes.length) return [];
  const placeholders = codes.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT code, name, description, solution FROM penyakit WHERE code IN (${placeholders})`,
    codes
  );
  return rows;
}

// ======================
// EXPORT
// ======================
module.exports = {
  pool,
  getAllGejalaForFrontend,
  getAllRules,
  getDiseaseDetailsByCodes
};
