# Calculator App with Webhook Automation 🚀

A calculator web application that automatically sends random email webhooks to Clay every minute using a cron job.

## Features
- **Automated Webhooks**: Sends random emails to Clay webhook every minute
- Email collection gate before calculator access
- Stores emails in PostgreSQL database
- Clean, modern dark UI
- Basic calculator operations
- Manual webhook trigger endpoint for testing

## What It Does

Every minute, the app automatically:
1. Generates a random email (e.g., `john.smith1234@gmail.com`)
2. Creates a JSON payload with email, timestamp, and metadata
3. Sends POST request to your Clay webhook
4. Logs the result in the console

**Webhook Payload Example:**
```json
{
  "email": "sarah.jones4521@yahoo.com",
  "timestamp": "2025-01-09T15:30:00.000Z",
  "source": "calculator_webhook",
  "random_id": "a7x9k2"
}
```

## How to Deploy on Render

### Step 1: Update Your Files on GitHub
1. Delete old files from your repository
2. Upload these new files (server.js, package.json, index.html, README.md)

### Step 2: Your Database (Already Set Up)
Your PostgreSQL database is already configured with:
- Database URL: `postgresql://calculator_emails_user:...`
- Environment variable: `DATABASE_URL` is set

### Step 3: Redeploy
- Render will automatically detect the changes
- It will redeploy with the new cron job
- Takes 2-3 minutes

### Step 4: Verify It's Working
Check the logs in Render:
1. Go to your web service in Render
2. Click "Logs" tab
3. You should see messages like:
```
🔄 Running cron job - sending webhook to Clay...
✅ Webhook sent successfully: john.doe123@gmail.com at 2025-01-09T...
```

## API Endpoints

### Check Cron Status
```
GET https://your-app.onrender.com/api/cron-status
```
Returns status of the cron job.

### Manually Trigger Webhook
```
POST https://your-app.onrender.com/api/trigger-webhook
```
Sends a webhook immediately without waiting for cron.

### View Collected Emails
```
GET https://your-app.onrender.com/api/emails
```
See all emails collected from the calculator form.

## Testing the Webhook

### Option 1: Wait 1 Minute
Just wait and check your Clay webhook - you should start receiving data every minute.

### Option 2: Manual Trigger
Use this URL to test immediately:
```bash
curl -X POST https://your-app.onrender.com/api/trigger-webhook
```

Or visit this in your browser and use browser console:
```javascript
fetch('https://your-app.onrender.com/api/trigger-webhook', {
    method: 'POST'
}).then(r => r.json()).then(console.log);
```

## Webhook Details

- **URL**: `https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-56d6b125-f179-48be-a79e-d44e2179da8c`
- **Method**: POST
- **Frequency**: Every 1 minute
- **Content-Type**: application/json

## How Cron Works

The cron expression `* * * * *` means:
- First `*` = Every minute (0-59)
- Second `*` = Every hour (0-23)
- Third `*` = Every day of month (1-31)
- Fourth `*` = Every month (1-12)
- Fifth `*` = Every day of week (0-6, Sunday-Saturday)

**Result**: Runs every single minute, 24/7!

## Random Email Generation

The app generates realistic fake emails using:
- 15 common first names
- 15 common last names
- 7 popular email domains (gmail, yahoo, outlook, etc.)
- Random numbers (0-9999)

Example outputs:
- `james.garcia3421@gmail.com`
- `emma.wilson782@outlook.com`
- `michael.brown5643@yahoo.com`

## Important Notes

⚠️ **Render Free Tier Limitation**: 
- Free tier services spin down after 15 minutes of inactivity
- When spun down, the cron job won't run
- It will resume when the service wakes up
- For 24/7 operation, upgrade to a paid plan ($7/month)

✅ **What Happens on Free Tier**:
- Cron runs while service is active
- Stops during sleep periods
- Resumes automatically when service wakes

## Files Included

- `server.js` - Express server with cron job
- `package.json` - Dependencies (Express + PostgreSQL + node-cron)
- `index.html` - Calculator UI with email gate
- `README.md` - This file

## Monitoring

Check logs in Render to see:
- ✅ Successful webhook sends
- ❌ Failed webhook sends (with error details)
- 🔄 Cron job executions

## Troubleshooting

**Webhooks not appearing in Clay?**
1. Check Render logs for error messages
2. Verify Clay webhook URL is correct
3. Test with manual trigger endpoint
4. Check if service is sleeping (free tier)

**Cron not running?**
1. Check logs for "Cron job active" message
2. Verify service is deployed successfully
3. Wait 1 full minute for first execution

Happy webhook automation! 🎉
