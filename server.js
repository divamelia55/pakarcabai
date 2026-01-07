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
// Menggunakan process.cwd() agar Vercel mencari folder di root project
const frontendPath = path.join(process.cwd(), 'frontend');
app.use(express.static(frontendPath));

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
  if (page.startsWith('api') || page.includes('.')) return next();

  const filePath = path.join(frontendPath, `${page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});

// ROUTE UTAMA: Catch-all untuk index.html
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Gagal menemukan file di path:", indexPath);
      res.status(404).send(`
        <div style="text-align:center; padding-top:50px; font-family:sans-serif;">
          <h2>⚠️ Folder 'frontend' Tidak Terdeteksi</h2>
          <p>Server mencari di: <b>${indexPath}</b></p>
          <hr style="width:50%">
          <p>Solusi: Pastikan nama folder di GitHub adalah <b>frontend</b> (kecil semua) dan berisi <b>index.html</b></p>
        </div>
      `);
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