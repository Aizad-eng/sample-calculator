# Simple Calculator App

A beautiful and simple calculator web application that you can host on Render.

## Features
- Clean, modern UI
- Basic operations: Addition, Subtraction, Multiplication, Division
- Responsive design
- Error handling (division by zero, invalid inputs)

## How to Deploy on Render

### Method 1: Using GitHub (Recommended)

1. **Create a GitHub repository**
   - Go to GitHub and create a new repository
   - Upload these files to your repository

2. **Deploy on Render**
   - Go to [Render.com](https://render.com)
   - Sign up or log in
   - Click "New +" and select "Web Service"
   - Connect your GitHub account
   - Select your repository
   - Configure:
     - **Name**: `my-calculator` (or any name you like)
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Select "Free"
   - Click "Create Web Service"

3. **Access your app**
   - Wait for deployment to complete (2-3 minutes)
   - Your app will be live at: `https://your-app-name.onrender.com`

### Method 2: Without GitHub

1. **Install Render CLI** (optional)
   - You can also deploy by pushing code directly via Git

2. **Or use Render Dashboard**
   - Go to Render dashboard
   - Use "Deploy from Git" option
   - Follow the same steps as Method 1

## Local Testing

To test locally before deploying:

```bash
# Install dependencies
npm install

# Run the server
npm start

# Visit http://localhost:3000 in your browser
```

## Files Included

- `index.html` - The calculator UI
- `server.js` - Express server to serve the app
- `package.json` - Node.js dependencies and scripts
- `README.md` - This file

## Notes

- The free tier on Render spins down after inactivity, so first load may take 30-60 seconds
- The app is fully functional and ready to deploy
- No database or complex backend needed

Enjoy your calculator! 🧮
