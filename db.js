const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',       // ganti sesuai MySQL kamu
    password: '',       // ganti sesuai MySQL kamu
    database: 'cabai_db'
});

module.exports = pool.promise();
