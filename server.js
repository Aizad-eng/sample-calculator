const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Create emails table if it doesn't exist
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS emails (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initDatabase();

// API endpoint to submit email
app.post('/api/submit-email', async (req, res) => {
    const { email } = req.body;

    // Validate email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    try {
        // Insert email into database
        await pool.query(
            'INSERT INTO emails (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
            [email.toLowerCase()]
        );
        
        res.json({ success: true, message: 'Email saved successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to save email' });
    }
});

// API endpoint to get all emails (for you to check later)
app.get('/api/emails', async (req, res) => {
    try {
        const result = await pool.query('SELECT email, created_at FROM emails ORDER BY created_at DESC');
        res.json({ emails: result.rows });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Calculator app running on port ${PORT}`);
});
