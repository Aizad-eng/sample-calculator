# 🛍️ Daraz Flash Sale Scraper

A powerful web-based scraper for Daraz flash sales with data storage, analytics, and CSV export capabilities.

## Features

✅ **Simple Web Interface** - Paste cookies and run scraper with one click
✅ **PostgreSQL Storage** - All data stored permanently in database
✅ **CSV Export** - Download daily CSVs or master file with all data
✅ **Analytics Dashboard** - View trends, top sellers, and statistics
✅ **History Tracking** - See all previous scraping runs
✅ **Manual Execution** - Run whenever you want, no 24/7 required

## How It Works

1. **Paste Cookies** → Get fresh cookies from your browser
2. **Run Scraper** → Click button to start scraping (2-5 minutes)
3. **View Data** → See results, analytics, and history
4. **Download CSV** → Get daily or master CSV file

## Deployment on Render

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → Select **"PostgreSQL"**
3. Configure:
   - **Name**: `daraz-scraper-db`
   - **Plan**: **Free**
4. Click **"Create Database"**
5. **Copy the "Internal Database URL"** (starts with `postgresql://`)

### Step 2: Deploy Web Service

1. Upload these files to your GitHub repository:
   - `scraper-server.js`
   - `scraper.html`
   - `package.json`
   - `README.md`
2. In Render, click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `daraz-scraper`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

### Step 3: Add Environment Variable

1. In the web service settings, go to **"Environment"**
2. Click **"Add Environment Variable"**
3. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the database URL from Step 1
4. **Save Changes**

### Step 4: Deploy and Use

- Wait 2-3 minutes for deployment
- Visit: `https://your-app-name.onrender.com`
- Start scraping!

## How to Get Cookies

1. Open Chrome and go to [https://pages.daraz.pk](https://pages.daraz.pk)
2. Press **F12** to open Developer Tools
3. Go to **Application** tab → **Cookies** → `https://pages.daraz.pk`
4. Copy ALL cookies in this format:
   ```
   cookie1=value1; cookie2=value2; cookie3=value3;
   ```
5. Paste in the scraper interface

### Essential Cookies Required:
- `_m_h5_tk`
- `_m_h5_tk_enc`
- `lzd_sid`
- `_tb_token_`
- `isg`

## Your Workflow (Daily Use)

```
1. Open: https://your-scraper.onrender.com
2. Get fresh cookies from Daraz
3. Paste cookies in text box
4. Click "Run Scraper"
5. Wait 2-5 minutes
6. View results / Download CSV
7. Done! Come back tomorrow and repeat
```

## Database Schema

### scraping_runs table
Tracks each scraping session:
- `id` - Run ID
- `run_date` - When the scrape happened
- `product_count` - Number of products scraped
- `pages_scraped` - Number of pages processed
- `time_taken` - Time in seconds

### flash_sale_products table
Stores all product data:
- Product details (title, prices, discounts)
- Metrics (rating, reviews, sales)
- Stock information
- Seller and category data
- Timestamps for sale period

## API Endpoints

### POST /api/scrape
Run the scraper with cookies
```json
{
  "cookies": "your_cookie_string_here"
}
```

### GET /api/history
Get list of all scraping runs

### GET /api/analytics
Get analytics (totals, averages, top sellers)

### GET /api/download/latest
Download CSV of most recent scrape

### GET /api/download/master
Download CSV of all scraped data

## Features Breakdown

### 🚀 Run Scraper Tab
- Paste cookies
- Run scraper
- See real-time progress
- View results and download

### 📊 View Data Tab
- See all scraping runs
- Download individual CSVs
- Track history over time

### 📈 Analytics Tab
- Total products scraped
- Average prices and discounts
- Top 10 best sellers
- Statistics and trends

## Data You Get

The scraper collects:
- **Pricing**: Original price, discount price, percentage off
- **Sales Data**: Total sales, items sold, stock levels
- **Ratings**: Product ratings and review counts
- **Seller Info**: Seller ID, DazMall status
- **Categories**: Product category IDs
- **Timing**: Sale start and end timestamps

Perfect for analyzing:
- Which products sell best
- Optimal discount percentages
- Category performance
- Price trends over time
- Stock movement patterns

## Important Notes

⚠️ **Cookie Expiration**: Cookies expire after a few hours/days. Update them when scraper fails.

💡 **Free Tier Perfect**: Render free tier is perfect for this. Service sleeps when inactive but wakes up instantly when you use it.

📊 **Data Storage**: Each scrape adds ~200-400 products. Free PostgreSQL (256MB) can store 100,000+ products easily.

🔄 **Manual Control**: Run scraper whenever you want - daily, weekly, or when flash sales update.

⏰ **No 24/7 Needed**: Unlike the webhook cron job, this doesn't need to stay awake. Just run it when you need it!

## Troubleshooting

### "Missing essential cookie" error
→ Update your cookies from browser

### "API Error: FAIL_SYS_TOKEN_ERROR"
→ Cookies expired, get fresh ones

### Scraper times out or takes long
→ Normal for 20 pages (2-5 minutes). Be patient!

### No data in analytics
→ Run scraper first to populate database

### Database connection error
→ Make sure DATABASE_URL environment variable is set correctly

## Local Testing (Optional)

```bash
# Install dependencies
npm install

# Set database URL
export DATABASE_URL="your_postgresql_url"

# Run server
npm start

# Visit http://localhost:3000
```

## Files Included

- `scraper-server.js` - Main server with scraper logic
- `scraper.html` - Web interface  
- `package.json` - Dependencies
- `README.md` - This file

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Frontend**: Vanilla JavaScript
- **HTTP Client**: Axios
- **Hosting**: Render (Free tier!)

## Cost Breakdown

| Service | Cost | What You Get |
|---------|------|--------------|
| Web Service (Render) | **FREE** | Unlimited runs, sleeps when inactive |
| PostgreSQL (Render) | **FREE** | 256MB storage (~100k products) |
| **Total** | **$0/month** | Perfect for daily scraping! |

## Quick Start Checklist

- [ ] Create PostgreSQL database on Render
- [ ] Copy database URL
- [ ] Upload code to GitHub
- [ ] Create Web Service on Render
- [ ] Add DATABASE_URL environment variable
- [ ] Wait for deployment
- [ ] Get cookies from Daraz
- [ ] Run your first scrape!

---

**You're all set! Happy scraping! 🚀**

Questions? Check Render logs or update your cookies and try again!
