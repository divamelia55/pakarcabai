const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Supaya form POST bisa terbaca

// Serve static files dari folder public
app.use(express.static(path.join(__dirname, 'public')));

// API Router
const apiRouter = require('./src/api'); // path sudah disesuaikan karena api.js ada langsung di src/
app.use('/api', apiRouter);

// Fallback: jika route tidak ditemukan, redirect ke index.html (opsional)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
