const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const dbPool = mysql.createPool({
    host: 'TODO',
    user: 'TODO',
    password: 'TODO',
    database: 'TODO',
});

dbPool.getConnection()
    .then(connection => {
        console.log('✅ Db connected successfully.');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error loading db:', err.message);
    });

app.listen(PORT, () => {
    console.log(`🚀 Server running in port: ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});