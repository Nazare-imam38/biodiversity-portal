# Deployment Guide

## Vercel Deployment

This project is configured for deployment on Vercel. The frontend (React + Vite) will be deployed as a static site.

### Important Notes

⚠️ **Backend Server**: The Express.js backend server (`server/index.js`) needs to be deployed separately. Vercel can host serverless functions, but the current backend setup requires:

1. **Option 1: Deploy Backend Separately**
   - Deploy the backend to a service like:
     - Railway
     - Render
     - Heroku
     - DigitalOcean App Platform
     - AWS EC2 / Elastic Beanstalk
   - Update the API URL in the frontend code to point to your backend URL

2. **Option 2: Convert to Vercel Serverless Functions**
   - Convert the Express.js routes to Vercel serverless functions
   - Place API routes in `api/` directory
   - This requires refactoring the backend code

### Current Configuration

- **Build Command**: `npm run vercel-build`
- **Output Directory**: `client/dist`
- **Install Command**: Installs both root and client dependencies

### Environment Variables

If you need to set environment variables in Vercel:
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add any required variables (e.g., API URLs, API keys)

### Frontend API Configuration

The frontend currently expects the API at `http://localhost:3001`. For production:

1. Update `client/src/App.jsx` to use environment variables for API URL
2. Or update the fetch calls to use a relative path if backend is on same domain

Example:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
```

Then set `VITE_API_URL` in Vercel environment variables.

