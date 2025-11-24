# Deployment Guide for Render

This guide will help you deploy both the frontend and backend to Render.

## Prerequisites
- GitHub account with your code pushed
- Render account (free at https://render.com)

## Deployment Steps

### 1. Deploy Backend (Web Service)

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository: `Nazare-imam38/biodiversity-portal`
3. Configure the service:
   - **Name**: `biodiversity-portal-api`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave empty (root)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Click "Create Web Service"
5. Wait for deployment to complete
6. **Copy the service URL** (e.g., `https://biodiversity-portal-api.onrender.com`)

### 2. Deploy Frontend (Static Site)

1. Go to Render Dashboard → New → Static Site
2. Connect your GitHub repository: `Nazare-imam38/biodiversity-portal`
3. Configure the service:
   - **Name**: `biodiversity-portal-frontend`
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`

4. **Add Environment Variable**:
   - Key: `VITE_API_URL`
   - Value: Your backend URL from step 1 (e.g., `https://biodiversity-portal-api.onrender.com`)

5. Click "Create Static Site"
6. Wait for deployment to complete

### 3. Update Frontend Environment Variable (if needed)

If you need to update the backend URL later:
1. Go to your Static Site service
2. Go to "Environment" tab
3. Update `VITE_API_URL` with your backend URL
4. Redeploy

## Important Notes

- **Free Tier**: Backend will spin down after 15 minutes of inactivity (takes ~50 seconds to wake up)
- **CORS**: The backend already has CORS enabled, so it should work with the frontend
- **Environment Variables**: Make sure `VITE_API_URL` in frontend matches your backend URL

## Troubleshooting

- If backend fails: Check logs in Render dashboard
- If frontend can't connect: Verify `VITE_API_URL` is set correctly
- If build fails: Check that all dependencies are in package.json

## Alternative: Single Service Deployment

If you want to serve frontend from backend (not recommended for production):
1. Build frontend: `cd client && npm run build`
2. Serve `client/dist` as static files from Express
3. Deploy only the backend service

