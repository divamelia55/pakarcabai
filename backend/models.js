// src/models.js
const db = require('./db'); // Mengimpor promise pool dari db.js

// --- FUNGSI UTAMA UNTUK API DIAGNOSIS ---

// 1. Mengambil semua data gejala
async function getAllGejala() {
    const [rows] = await db.query('SELECT code, name FROM gejala ORDER BY code');
    return rows;
}

// 2. Mengambil semua data aturan (rules)
async function getAllRules() {
    // Mengambil rule, termasuk CF, kode penyakit, dan kode gejala
    const [rows] = await db.query('SELECT disease_code, symptom_code, cf FROM rules');
    return rows;
}

// 3. Mengambil semua detail penyakit (untuk mengetahui total gejala)
async function getAllDiseases() {
    const [rows] = await db.query('SELECT code, name, description, solution FROM penyakit');
    return rows;
}

// 4. Mengambil gejala yang terkait dengan suatu penyakit (untuk menghitung total gejala di CF)
async function getSymptomsByDisease(disease_code) {
    const [rows] = await db.query('SELECT symptom_code FROM rules WHERE disease_code = ?', [disease_code]);
    return rows;
}

// --- FUNGSI LAIN UNTUK ADMIN (Opsional) ---

// Contoh fungsi untuk membuat data baru
async function createPenyakit(code, name, description, solution) {
    const [result] = await db.query(
        'INSERT INTO penyakit (code, name, description, solution) VALUES (?, ?, ?, ?)',
        [code, name, description, solution]
    );
    return { id: result.insertId, code, name };
}

module.exports = {
    getAllGejala,
    getAllRules,
    getAllDiseases,
    getSymptomsByDisease,
    createPenyakit,
    // ... tambahkan fungsi CRUD lain yang dibutuhkan admin
};