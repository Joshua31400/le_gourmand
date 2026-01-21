require('dotenv').config();
const mysql = require('mysql2/promise');

const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
dbPool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully.');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error connecting to database:', err.message);
    });

module.exports = dbPool;