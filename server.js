// server.js (root folder CABAI)

const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./backend/db');
const apiRouter = require('./backend/api');

const app = express();
const port = 3000;

// ----------------------
// Middleware
// ----------------------
app.use(cors());
app.use(express.json());

// ----------------------
// AUTH LOGIN ADMIN
// ----------------------
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

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        const admin = rows[0];

        // (Plain text – sesuai tugas kuliah)
        if (password !== admin.password) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        res.json({
            success: true,
            message: 'Login berhasil',
            admin: {
                id: admin.id,
                username: admin.username
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ----------------------
// API lama
// ----------------------
app.use('/api', apiRouter);

// ----------------------
// Frontend static
// ----------------------
app.use(express.static(path.join(__dirname, 'frontend')));

// ----------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// ----------------------
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
    console.log('✅ KONEKSI DATABASE BERHASIL!');
});
