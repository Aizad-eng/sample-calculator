const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Clay webhook URL
const CLAY_WEBHOOK_URL = 'https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-56d6b125-f179-48be-a79e-d44e2179da8c';

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

// Function to generate random email
function generateRandomEmail() {
    const firstNames = ['john', 'sarah', 'mike', 'emma', 'david', 'lisa', 'james', 'anna', 'robert', 'mary', 'chris', 'jessica', 'daniel', 'amy', 'michael'];
    const lastNames = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'martinez', 'wilson', 'anderson', 'taylor', 'thomas', 'moore', 'jackson'];
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'aol.com'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const randomNum = Math.floor(Math.random() * 9999);
    
    return `${firstName}.${lastName}${randomNum}@${domain}`;
}

// Function to send webhook to Clay
async function sendWebhookToClay() {
    const randomEmail = generateRandomEmail();
    const timestamp = new Date().toISOString();
    
    const webhookData = {
        email: randomEmail,
        timestamp: timestamp,
        source: 'calculator_webhook',
        random_id: Math.random().toString(36).substring(7)
    };
    
    try {
        const response = await fetch(CLAY_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookData)
        });
        
        if (response.ok) {
            console.log(`✅ Webhook sent successfully: ${randomEmail} at ${timestamp}`);
        } else {
            console.error(`❌ Webhook failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Error sending webhook:', error.message);
    }
}

// Set up cron job to run every minute
cron.schedule('* * * * *', () => {
    console.log('🔄 Running cron job - sending webhook to Clay...');
    sendWebhookToClay();
});

// Initial webhook on startup
console.log('🚀 Server starting - sending initial webhook...');
sendWebhookToClay();

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

// API endpoint to manually trigger webhook (for testing)
app.post('/api/trigger-webhook', async (req, res) => {
    try {
        await sendWebhookToClay();
        res.json({ success: true, message: 'Webhook sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send webhook' });
    }
});

// API endpoint to check cron status
app.get('/api/cron-status', (req, res) => {
    res.json({ 
        status: 'active',
        message: 'Cron job is running - sending webhooks every minute',
        webhook_url: CLAY_WEBHOOK_URL
    });
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Calculator app running on port ${PORT}`);
    console.log(`🔔 Cron job active - sending webhooks to Clay every minute`);
});
