# Netlify Deployment Guide

This guide will help you deploy the Francoflex Pronunciation AI application to Netlify.

## Architecture Overview

Since this project has both a Next.js frontend and a FastAPI backend, the deployment strategy is:

1. **Frontend (Next.js)**: Deploy to Netlify
2. **Backend (FastAPI)**: Deploy to a separate service (Railway, Render, AWS Lambda, etc.)

Netlify is optimized for static sites and Node.js functions, while your FastAPI backend requires a Python runtime. It's recommended to deploy them separately.

## Frontend Deployment (Netlify)

### Step 1: Prepare Your Repository

Ensure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

### Step 2: Connect to Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" > "Import an existing project"
3. Choose your Git provider and select your repository
4. Netlify should auto-detect the configuration from `netlify.toml`

### Step 3: Configure Build Settings

The `netlify.toml` file is already configured with:
- Base directory: `web-client`
- Build command: `npm run build`
- Publish directory: `web-client/.next`

### Step 4: Set Environment Variables

In the Netlify dashboard, go to Site settings > Environment variables and add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=your_backend_api_url
```

### Step 5: Deploy

Click "Deploy site" and Netlify will build and deploy your frontend.

## Backend Deployment Options

### Option 1: Railway (Recommended for simplicity)

1. Go to [Railway](https://railway.app/)
2. Create a new project from your GitHub repository
3. Select the `backend` directory as the root
4. Railway will auto-detect Python and use `requirements.txt`
5. Set environment variables:
   ```
   OPENAI_API_KEY=your_key
   SPEECHACE_API_KEY=your_key
   ELEVENLABS_API_KEY=your_key
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
6. Deploy and get your backend URL

### Option 2: Render

1. Go to [Render](https://render.com/)
2. Create a new "Web Service"
3. Connect your repository
4. Configure:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy

### Option 3: AWS Lambda with Mangum

For serverless FastAPI deployment:

1. Install Mangum: `pip install mangum`
2. Wrap your FastAPI app:
   ```python
   from mangum import Mangum
   from main import app

   handler = Mangum(app)
   ```
3. Deploy using AWS Lambda or Serverless Framework

### Option 4: Vercel (Alternative to Netlify)

Vercel supports both Next.js and Python APIs:
1. Deploy the entire monorepo to Vercel
2. It will auto-detect Next.js and can run Python serverless functions
3. This might be simpler than splitting deployments

## Connecting Frontend to Backend

After deploying both:

1. Get your backend API URL (e.g., `https://your-app.railway.app`)
2. Update the frontend environment variable in Netlify:
   ```
   NEXT_PUBLIC_API_URL=https://your-app.railway.app
   ```
3. Update your frontend API client to use this URL

## CORS Configuration

Ensure your FastAPI backend allows requests from your Netlify domain:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-netlify-site.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Custom Domain (Optional)

1. In Netlify: Site settings > Domain management > Add custom domain
2. Follow the instructions to configure DNS
3. Netlify provides free HTTPS certificates

## Continuous Deployment

Once connected:
- Push to your main branch → Netlify auto-deploys
- Preview deployments for pull requests
- Backend services (Railway/Render) also support auto-deploy from Git

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Verify Node version matches your local environment
- Ensure all dependencies are in `package.json`

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS configuration in backend
- Ensure backend is running and accessible

### Environment Variables Not Working
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Other variables are only available during build time
- Redeploy after changing environment variables

## Cost Considerations

- **Netlify**: Free tier includes 100GB bandwidth, 300 build minutes/month
- **Railway**: $5/month credit on free tier
- **Render**: Free tier available with limitations
- **Vercel**: Free tier for personal projects

## Alternative: All-in-One Deployment

If you prefer a single deployment:

1. Use **Vercel** (supports both Next.js and Python)
2. Use **DigitalOcean App Platform** (supports monorepos)
3. Use **Heroku** (supports multiple buildpacks)

Each of these can handle both frontend and backend in one deployment.
