// backend/db.js (FULL CODE - MEMASTIKAN KONEKSI DATABASE DIEKSPOR DENGAN BENAR)

const mysql = require('mysql2/promise');

// 1. Konfigurasi Database (GANTI DENGAN KREDENSIAL ANDA)
const dbConfig = {
    host: 'localhost',
    user: 'root', // Pastikan ini benar
    password: '', // Pastikan ini benar
    database: 'cabai_db', // Pastikan nama database benar
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// 2. Membuat Koneksi Pool
const pool = mysql.createPool(dbConfig);

// 3. Uji Koneksi
pool.getConnection()
    .then(connection => {
        console.log('✅ KONEKSI DATABASE BERHASIL!');
        connection.release(); // Lepaskan koneksi kembali ke pool
    })
    .catch(error => {
        console.error('❌ KONEKSI DATABASE GAGAL! Periksa db.js dan status MySQL Anda.');
        console.error('Error:', error.message);
    });

// 4. Fungsi-fungsi pembantu untuk diagnosis dan admin

// Ambil semua gejala untuk frontend (termasuk kategori)
async function getAllGejalaForFrontend() {
    const [rows] = await pool.query(
        'SELECT code AS id, name AS text, category FROM symptoms ORDER BY category, code'
    );
    return rows;
}

// Ambil semua rules (dipakai oleh /api/diagnosis)
async function getAllRules() {
    const [rows] = await pool.query(
        'SELECT symptom_code AS id_gejala, disease_code AS id_penyakit FROM rules'
    );
    return rows;
}

// Ambil detail penyakit berdasarkan kode
async function getDiseaseDetailsByCodes(codes) {
    const placeholders = codes.map(() => '?').join(',');
    const query = `SELECT code, name, description, solution FROM penyakit WHERE code IN (${placeholders})`;
    const [rows] = await pool.query(query, codes);
    return rows;
}

// 5. EKSPOR
module.exports = {
    pool,
    getAllGejalaForFrontend,
    getAllRules,
    getDiseaseDetailsByCodes
};
