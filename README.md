# Simple Calculator App with Email Collection

A beautiful calculator web application that collects user emails before granting access. Built with Node.js, Express, and PostgreSQL.

## Features
- Email collection gate before calculator access
- Stores emails in PostgreSQL database
- Clean, modern dark UI
- Basic operations: Addition, Subtraction, Multiplication, Division
- Responsive design
- Error handling (division by zero, invalid inputs, duplicate emails)

## How to Deploy on Render

### Step 1: Create a GitHub repository
1. Go to GitHub and create a new repository
2. Upload all files to your repository (index.html, server.js, package.json, README.md)

### Step 2: Create PostgreSQL Database on Render
1. Go to [Render.com](https://render.com) and sign in
2. Click "New +" and select **"PostgreSQL"**
3. Configure database:
   - **Name**: `calculator-db` (or any name)
   - **Database**: Leave default or name it `emails`
   - **User**: Leave default
   - **Region**: Choose closest to you
   - **Plan**: Select **"Free"**
4. Click "Create Database"
5. Wait for it to provision (1-2 minutes)
6. **IMPORTANT**: Copy the **"Internal Database URL"** - you'll need this!

### Step 3: Deploy Web Service
1. Click "New +" and select **"Web Service"**
2. Connect your GitHub account and select your calculator repository
3. Configure:
   - **Name**: `my-calculator` (or any name you like)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select **"Free"**

### Step 4: Add Environment Variable
1. Scroll down to **"Environment Variables"**
2. Click "Add Environment Variable"
3. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the Internal Database URL you copied from Step 2
4. Click "Create Web Service"

### Step 5: Access Your App
- Wait for deployment to complete (2-3 minutes)
- Your app will be live at: `https://your-app-name.onrender.com`
- Users must enter email before accessing calculator
- Emails are stored in your PostgreSQL database

## Viewing Collected Emails

You can view all collected emails by visiting:
```
https://your-app-name.onrender.com/api/emails
```

This will show a JSON list of all emails and when they were submitted.

## Local Testing

To test locally:

```bash
# Install dependencies
npm install

# Set up local database URL (optional - or use a test database)
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Run the server
npm start

# Visit http://localhost:3000 in your browser
```

## How It Works

1. User visits the calculator
2. Email collection screen appears first
3. User enters email and clicks "Get Access"
4. Email is validated and saved to PostgreSQL database
5. Calculator becomes accessible
6. Session storage prevents re-asking for email during same session

## Files Included

- `index.html` - The calculator UI with email gate
- `server.js` - Express server with database integration
- `package.json` - Node.js dependencies (Express + PostgreSQL)
- `README.md` - This file

## Database Schema

The app automatically creates this table:
```sql
CREATE TABLE emails (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Notes

- Free tier on Render: Database has 256MB storage (plenty for emails!)
- Web service spins down after inactivity (first load may take 30-60 seconds)
- Duplicate emails are automatically handled (won't create duplicates)
- Session storage means users won't be asked for email again in same browser session

## Security Notes

- Emails are stored securely in PostgreSQL
- Basic validation on both client and server side
- No passwords or sensitive data collected
- Database URL should be kept private (never commit to GitHub)

Enjoy your email-collecting calculator! 📧🧮
