// server.js (ROOT FOLDER)

const express = require('express');
const cors = require('cors');
const path = require('path');

const apiRouter = require('./backend/api');
const db = require('./backend/db');

const app = express();

// PORT untuk lokal / hosting
const port = process.env.PORT || 3000;

// ======================
// Middleware
// ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// AUTH LOGIN ADMIN
// ======================
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username dan password wajib diisi'
    });
  }

  try {
    const [rows] = await db.pool.query(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );

    if (rows.length === 0 || rows[0].password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    res.json({
      success: true,
      message: 'Login berhasil',
      admin: {
        id: rows[0].id,
        username: rows[0].username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ======================
// API ROUTES
// ======================
app.use('/api', apiRouter);

// ======================
// FRONTEND STATIC
// ======================
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ======================
// START SERVER
// ======================
// ⚠️ LISTEN HANYA UNTUK LOCAL
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
}

// ⚠️ WAJIB untuk Vercel
module.exports = app;
