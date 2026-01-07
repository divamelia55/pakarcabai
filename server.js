require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import router dan database
const apiRouter = require('./backend/api');
const db = require('./backend/db');

const app = express();

// PORT (Vercel / Lokal)
const port = process.env.PORT || 3000;

// ======================
// 1. Middleware
// ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// 2. Akses Folder Frontend (Statik)
// ======================
// Baris ini harus di atas agar file CSS/JS bisa langsung terbaca
app.use(express.static(path.join(__dirname, 'frontend')));

// ======================
// 3. API Routes
// ======================

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Pakar Cabai berjalan dengan baik'
  });
});

// Auth Login Admin
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
  }

  try {
    const [rows] = await db.pool.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0 || rows[0].password !== password) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }
    res.json({
      success: true,
      message: 'Login berhasil',
      admin: { id: rows[0].id, username: rows[0].username }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Gunakan API Router luar
app.use('/api', apiRouter);

// ======================
// 4. Routing Halaman (Frontend)
// ======================

// Handle halaman spesifik tanpa .html (misal: /admin_login)
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (page.startsWith('api')) return next();

  const filePath = path.join(__dirname, 'frontend', `${page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      next(); // Jika file tidak ada, lanjut ke route '*'
    }
  });
});

// ROUTE UTAMA: Mengarahkan semua akses sisa ke index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'), (err) => {
    if (err) {
      res.status(404).send("Folder 'frontend' atau file 'index.html' tidak ditemukan.");
    }
  });
});

// ======================
// 5. Jalankan Server (Local Only)
// ======================
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
}

// Export untuk Vercel
module.exports = app;