// backend/db.js

const mysql = require('mysql2/promise');

// ======================
// KONFIGURASI DATABASE
// (PAKAI ENV, AMAN UNTUK VERCEL)
// ======================
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cabai_db',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// ======================
// BUAT CONNECTION POOL
// ======================
const pool = mysql.createPool(dbConfig);

// ======================
// TEST KONEKSI (AMAN DI VERCEL)
// ======================
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ KONEKSI DATABASE BERHASIL');
    connection.release();
  } catch (error) {
    console.error('⚠️ DATABASE BELUM TERHUBUNG');
    console.error(error.message);
  }
})();

// ======================
// FUNGSI DATABASE
// ======================

// Ambil semua gejala
async function getAllGejalaForFrontend() {
  const [rows] = await pool.query(
    'SELECT code AS id, name AS text, category FROM symptoms ORDER BY category, code'
  );
  return rows;
}

// Ambil semua rules
async function getAllRules() {
  const [rows] = await pool.query(
    'SELECT symptom_code AS id_gejala, disease_code AS id_penyakit FROM rules'
  );
  return rows;
}

// Ambil detail penyakit
async function getDiseaseDetailsByCodes(codes) {
  if (!codes.length) return [];

  const placeholders = codes.map(() => '?').join(',');
  const query = `
    SELECT code, name, description, solution
    FROM penyakit
    WHERE code IN (${placeholders})
  `;
  const [rows] = await pool.query(query, codes);
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
