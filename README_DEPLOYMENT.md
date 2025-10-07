# Francoflex Netlify Deployment Guide

## Overview

This project is now configured for unified deployment on Netlify with:
- **Frontend**: Next.js application (web-client)
- **Backend**: Node.js serverless functions (api/)
- **Database**: Supabase (already configured)

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd web-client
npm install
cd ..
```

### 2. Configure Environment Variables

The `.env` file has been created with your Supabase credentials. Add your API keys:

```bash
# Edit .env and add:
OPENAI_API_KEY=your_openai_key
SPEECHACE_API_KEY=your_speechace_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### 3. Local Development

```bash
# Start Netlify dev server (runs both frontend and functions)
npm run dev
```

This will start:
- Frontend: http://localhost:8888
- Serverless functions: http://localhost:8888/.netlify/functions/*

### 4. Deploy to Netlify

#### Using Netlify CLI

```bash
# Login to Netlify
netlify login

# Initialize Netlify (first time only)
netlify init

# Deploy
netlify deploy --prod
```

#### Using Netlify UI

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" > "Import an existing project"
3. Connect your GitHub repository: `phin/francoflex-pronunciation-ai`
4. Netlify will auto-detect `netlify.toml` configuration
5. Add environment variables in Netlify UI:
   - `OPENAI_API_KEY`
   - `SPEECHACE_API_KEY`
   - `ELEVENLABS_API_KEY`
6. Deploy!

## Architecture

### Serverless Functions (api/)

- `api/health.js` - Health check endpoint
- `api/analyze-pronunciation.js` - SpeechAce + OpenAI pronunciation analysis
- `api/save-preferences.js` - Save user preferences to Supabase
- `api/get-preferences.js` - Get user preferences from Supabase
- `api/_utils/` - Shared utilities (Supabase, OpenAI clients)

### Environment Variables

**Already configured in `netlify.toml`:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Set in Netlify UI (Site settings > Environment variables):**
- `OPENAI_API_KEY` - Your OpenAI API key
- `SPEECHACE_API_KEY` - Your SpeechAce API key
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key

### API Configuration

- **Model**: Uses `gpt-4o-mini` for cost-effective AI responses
- **CORS**: Enabled for all origins (configure for production)
- **Functions directory**: `api/`

## Testing Functions Locally

```bash
# Start dev server
npm run dev

# Test health endpoint
curl http://localhost:8888/.netlify/functions/health

# Test get-preferences
curl "http://localhost:8888/.netlify/functions/get-preferences?user_id=test123"
```

## Python Backend (Reference)

The original Python/FastAPI backend is kept in `_deprecated_backend/` for reference. The Node.js serverless functions in `api/` replicate the core functionality.

## Deployment Checklist

- [ ] Install dependencies (`npm install` in root and `web-client/`)
- [ ] Configure `.env` with API keys
- [ ] Test locally with `npm run dev`
- [ ] Push code to GitHub
- [ ] Connect repository to Netlify
- [ ] Set environment variables in Netlify UI
- [ ] Deploy!

## Troubleshooting

### Build fails
- Check build logs in Netlify dashboard
- Verify all dependencies are in package.json files
- Ensure Node version matches (18)

### Functions not working
- Verify environment variables are set in Netlify
- Check function logs in Netlify dashboard
- Ensure API keys are valid

### Frontend can't connect to functions
- In production, functions are at `/.netlify/functions/*`
- In local dev, they're at `http://localhost:8888/.netlify/functions/*`
- Update your frontend API client accordingly

## Next Steps

1. Add remaining API endpoints as needed
2. Configure custom domain in Netlify
3. Set up continuous deployment from GitHub
4. Monitor function usage and performance

## Support

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
