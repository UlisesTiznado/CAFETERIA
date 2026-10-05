const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),

    // Supabase requiere conexión SSL
    ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
});

pool.on('connect', (client) => {
    client.query('SET client_encoding = "UTF8"');
});

pool.on('error', (err) => {
    console.error('Error inesperado en PostgreSQL:', err);
});

module.exports = pool;