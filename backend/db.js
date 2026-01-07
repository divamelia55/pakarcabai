// backend/db.js
const mysql = require('mysql2/promise');

// ======================
// AMBIL DATA DARI ENV
// ======================
const dbUrl = process.env.MYSQL_PUBLIC_URL;

// Jika variabel kosong, kasih peringatan keras
if (!dbUrl) {
    console.log('--------------------------------------------------');
    console.error('❌ ERROR: MYSQL_PUBLIC_URL TIDAK TERBACA!');
    console.log('Pastikan file .env ada di folder ROOT (CABAI), bukan di dalam folder backend.');
    console.log('--------------------------------------------------');
}

// Buat pool (wadah koneksi)
const pool = dbUrl ? mysql.createPool(dbUrl) : null;

// ======================
// TEST KONEKSI KE RAILWAY
// ======================
(async () => {
    if (!pool) return;
    try {
        const conn = await pool.getConnection();
        console.log('✅ DATABASE RAILWAY TERHUBUNG (PUBLIC)');
        conn.release();
    } catch (err) {
        console.error('❌ GAGAL KONEK KE DATABASE RAILWAY');
        console.error('Pesan: ', err.message);
    }
})();

// ======================
// FUNGSI-FUNGSI DATABASE
// ======================
async function getAllGejalaForFrontend() {
    if (!pool) return [];
    const [rows] = await pool.query(
        'SELECT code AS id, name AS text, category FROM symptoms ORDER BY category, code'
    );
    return rows;
}

async function getAllRules() {
    if (!pool) return [];
    const [rows] = await pool.query(
        'SELECT symptom_code AS id_gejala, disease_code AS id_penyakit FROM rules'
    );
    return rows;
}

async function getDiseaseDetailsByCodes(codes) {
    if (!pool || !codes.length) return [];
    const placeholders = codes.map(() => '?').join(',');
    const [rows] = await pool.query(
        `SELECT code, name, description, solution 
         FROM penyakit 
         WHERE code IN (${placeholders})`,
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