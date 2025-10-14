const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../db.js');          // koneksi MySQL
const bcrypt = require('bcrypt');
const { forwardChain } = require('./engine');

/* ======================
   Fungsi Load Rules JSON
====================== */
function loadRules() {
  try {
    const filePath = path.join(__dirname, 'rules.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
  } catch (err) {
    console.error('Gagal membaca rules.json:', err);
    return [];
  }
}

/* ======================
   Endpoint Diagnosa
====================== */
router.post('/diagnose', async (req, res) => {
  try {
    const { symptoms, userId } = req.body;
    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({ error: 'Field "symptoms" harus berupa array.' });
    }

    const rules = loadRules();
    if (!rules.length) return res.status(500).json({ error: 'Rules tidak ditemukan atau kosong.' });

    const inferences = forwardChain(symptoms, rules);

    const aggregated = {};
    inferences.forEach(i => {
      if (!aggregated[i.disease] || aggregated[i.disease].cf < i.cf) {
        aggregated[i.disease] = { disease: i.disease, cf: i.cf, ruleId: i.ruleId };
      }
    });

    const diagnoses = Object.values(aggregated).sort((a, b) => b.cf - a.cf);

    // Simpan history diagnosa jika ada userId
    if (userId) {
      try {
        await db.query('INSERT INTO diagnosis_history (user_id, symptoms, result) VALUES (?, ?, ?)', [
          userId,
          JSON.stringify(symptoms),
          JSON.stringify(diagnoses)
        ]);
      } catch (err) {
        console.error('Gagal menyimpan history diagnosa:', err);
      }
    }

    res.json({ input: symptoms, inferences, diagnoses });
  } catch (err) {
    console.error('Error pada endpoint /diagnose:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/* ======================
   CRUD Gejala
====================== */
// READ semua gejala
router.get('/symptoms', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM symptoms ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE gejala baru
router.post('/symptoms', async (req, res) => {
  const { code, name } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'Code & name required' });

  try {
    const [result] = await db.query('INSERT INTO symptoms (code, name) VALUES (?, ?)', [code, name]);
    res.json({ id: result.insertId, code, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE gejala
router.put('/symptoms/:id', async (req, res) => {
  const { id } = req.params;
  const { code, name } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'Code & name required' });

  try {
    await db.query('UPDATE symptoms SET code = ?, name = ? WHERE id = ?', [code, name, id]);
    res.json({ id, code, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE gejala
router.delete('/symptoms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM symptoms WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================
   USER AUTH
====================== */
// REGISTER USER
router.post('/user/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Semua field harus diisi' });

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ error: 'Email sudah terdaftar' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashed]);

    res.json({ user: { id: result.insertId, name, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN USER
router.post('/user/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email & password diperlukan' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(400).json({ error: 'Email tidak ditemukan' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Password salah' });

    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================
   ADMIN AUTH
====================== */
// LOGIN ADMIN
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email & password diperlukan' });

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (!rows.length) return res.status(400).json({ error: 'Email admin tidak ditemukan' });

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ error: 'Password salah' });

    res.json({ admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
