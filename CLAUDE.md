# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Francoflex is an AI-powered French pronunciation training application with a **dual architecture**:

1. **Netlify Serverless** (Current/Production): Next.js frontend + Netlify Functions backend
2. **FastAPI** (Legacy): Python backend with FastAPI (being phased out)

**Key Technologies:**
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI
- Backend: Netlify Functions (JavaScript/Node.js)
- Database: Supabase (PostgreSQL with Row Level Security)
- Storage: Supabase Storage (audio files)
- AI Services: OpenAI GPT-4, SpeechAce API, ElevenLabs TTS
- Deployment: Netlify (frontend + serverless functions)

---

## Development Commands

### Frontend Development
```bash
cd web-client
npm install --legacy-peer-deps  # Use legacy peer deps for compatibility
npm run dev                      # Start Next.js dev server on localhost:3000
npm run build                    # Build for production
npm run lint                     # Run ESLint
```

### API Functions Development
```bash
# Install root dependencies (for Netlify functions)
npm install --legacy-peer-deps

# Run Netlify dev server (runs both frontend + functions)
netlify dev  # Starts on localhost:8888
```

### Full Stack Development (Recommended)
```bash
# Terminal 1: Run Netlify dev (handles everything)
netlify dev

# OR Terminal 1: Frontend only
cd web-client && npm run dev

# Terminal 2: Netlify functions only (if needed separately)
netlify functions:serve
```

### Database
```bash
# Run Supabase schema (one-time setup)
# Copy contents of supabase_schema.sql and run in Supabase SQL Editor
# URL: https://supabase.com/dashboard/project/pznzykwfboqryuibelqs/editor
```

---

## Architecture

### 1. Serverless Architecture (Current)

**API Functions** (`/api/`):
- Each `.js` file = one Netlify serverless function
- Deployed to `/.netlify/functions/{function-name}`
- All use ES modules (`import`/`export`)

**Key Pattern:**
```javascript
// api/{function-name}.js
export async function handler(event, context) {
  // CORS handling
  if (event.httpMethod === 'OPTIONS') { /* ... */ }

  // Business logic
  const supabase = getSupabaseClient(); // Uses service role key server-side

  // Return response with CORS headers
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ success: true, data: result })
  };
}
```

**Shared Utilities** (`/api/_utils/`):
- `supabase.js`: Supabase client (uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS)
- `openai.js`: OpenAI client for AI feedback
- `speechace.js`: SpeechAce API client for pronunciation scoring
- `pronunciation/`: Modular pronunciation analysis system (see `api/API.md`)

**Critical: Service Role Key vs Anon Key**
- Netlify functions use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS for server operations)
- Frontend uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (enforces RLS)
- This is intentional - server can create sessions for users, but enforces security via user_id validation

### 2. Frontend Architecture

**App Router Structure** (`/web-client/src/app/`):
- `dashboard/`: Main dashboard with session selection
- `voice_chat_activity/`: Pronunciation practice with repeat mode
- `voice_chat_conversational/`: Conversational AI practice
- `preferences/`: User preferences (learning language, native language, industry, job)

**Key Files:**
- `src/lib/api.ts`: Centralized API client for all backend calls
- `src/lib/supabase.ts`: Frontend Supabase client (uses anon key)
- `src/contexts/AuthContext.tsx`: Authentication context (Supabase Auth)

**API Client Pattern:**
```typescript
// All backend calls go through ApiClient
import { api } from '@/lib/api';

const result = await api.getSession(user.id);
const upload = await api.uploadAudio(file, user.id, sessionId);
```

### 3. Database Schema (Supabase)

**Tables:**
- `preferences`: User preferences (1:1 with user, UUID "user" column)
- `sessions`: Practice sessions (N:1 with user)
  - Contains: user, level, type, content (JSONB with questions/phrases)
- `messages`: Chat messages (N:1 with session)
  - Contains: author ('user'|'system'), session FK, content, metadata (JSONB)
  - Audio URLs stored in `metadata.audio_url` (not a direct column!)
- `pronunciation_analysis`: Historical pronunciation scores

**Row Level Security (RLS):**
- Enabled on all tables
- Policies: Users can only access their own data (`auth.uid() = "user"`)
- Server functions bypass RLS using service role key

**Important Schema Details:**
- User ID column is named `"user"` (quoted) not `user_id`
- Messages store audio_url in `metadata` JSONB field, not as direct column
- Sessions store questions/phrases in `content` JSONB field

---

## Critical Patterns & Gotchas

### 1. Session Management

**Auto-Creation Pattern:**
- `get-session.js` auto-creates a beginner session if user has none
- Frontend can rely on always getting a session back (never null after first call)

```javascript
// api/get-session.js auto-creates if missing
if (!data) {
  const newSession = await supabase.from('sessions').insert({
    user: user_id,
    level: 'beginner',
    type: 'repeat',
    content: [/* beginner phrases */]
  });
  return newSession;
}
```

**Session ID Resolution:**
- Frontend checks URL params first: `searchParams.get('sessionId')`
- Falls back to session state: `sessionData?.id`
- This allows sessions to work without URL param (auto-created sessions)

### 2. Audio Upload & Storage

**Flow:**
1. Frontend records audio → Blob
2. Convert to File: `new File([blob], 'recording.wav', { type: 'audio/wav' })`
3. Upload via `api.uploadAudio(file, userId, sessionId)`
4. `upload-audio.js` uploads to Supabase Storage bucket: `audio/{userId}/{sessionId}/{timestamp}-{filename}`
5. Returns public URL
6. Save message with audio_url in metadata

**Storage Bucket:**
- Name: `audio`
- Must be **public** for playback
- Organized: `audio/{user_id}/{session_id}/timestamp-filename.wav`

### 3. Pronunciation Analysis Flow

**Complete Flow:**
```
1. User records audio
2. upload-audio → Supabase Storage → returns audio_url
3. save-message → stores user message with audio_url in metadata
4. analyze-pronunciation (called separately):
   - Downloads audio from URL
   - Sends to SpeechAce API
   - Gets pronunciation score
   - Sends to OpenAI for feedback
   - Returns: score, category, feedback, word analysis
```

**Reusable Module:**
- Core logic in `api/_utils/pronunciation/` (see `api/API.md`)
- Can be imported directly or used via HTTP endpoint
- Modular design: audio-processor, speechace client, feedback generator

### 4. Environment Variables

**Build Time** (set in `netlify.toml` or Netlify UI):
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key (client-side)

**Runtime** (Netlify Functions - **must be set in Netlify UI**):
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (bypasses RLS) ⚠️
- `OPENAI_API_KEY`: OpenAI API key
- `SPEECHACE_API_KEY`: SpeechAce API key
- `ELEVENLABS_API_KEY`: ElevenLabs TTS key (optional)

**Local Development:**
Create `.env` in root:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
SPEECHACE_API_KEY=your_speechace_key
```

### 5. CORS Headers

**Current State:** All functions use `'Access-Control-Allow-Origin': '*'`
**Pattern in every function:**
```javascript
// CORS preflight
if (event.httpMethod === 'OPTIONS') {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: ''
  };
}

// All responses include CORS header
headers: {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
}
```

---

## Common Tasks

### Adding a New Netlify Function

1. Create `api/{function-name}.js`
2. Export `handler(event, context)` function
3. Add CORS handling (OPTIONS method)
4. Use `getSupabaseClient()` from `api/_utils/supabase.js`
5. Return proper response with CORS headers
6. Deploy triggers automatic rebuild

**Template:**
```javascript
import { getSupabaseClient } from './_utils/supabase.js';

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { param1, param2 } = JSON.parse(event.body);
    const supabase = getSupabaseClient();

    // Your logic here

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed', details: error.message })
    };
  }
}
```

### Adding Frontend API Method

1. Add method to `web-client/src/lib/api.ts`:
```typescript
async functionName(params) {
  return this.request('/function-name', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}
```

2. Use in component:
```typescript
import { api } from '@/lib/api';

const result = await api.functionName({ param1, param2 });
```

### Modifying Database Schema

1. Write SQL in `supabase_schema.sql`
2. Run in Supabase SQL Editor (https://supabase.com/dashboard/project/pznzykwfboqryuibelqs/editor)
3. Update RLS policies if needed
4. If adding columns to existing tables, check if functions need updates

### Debugging Netlify Functions

**Local:**
```bash
netlify dev
# Functions available at http://localhost:8888/.netlify/functions/{name}
```

**Production:**
- Check Netlify Functions logs: https://app.netlify.com/sites/francoflex-pronunciation-ai/functions
- Logs show: console.log, errors, timing
- Enable: `console.log('Debug:', variable);` in functions

**Common Issues:**
- Missing environment variables → Check Netlify UI env vars
- CORS errors → Verify `Access-Control-Allow-Origin` header in response
- Database errors → Check RLS policies, verify service role key is set
- "Column not found" → Check if using correct column names (e.g., `"user"` not `user_id`)

---

## Testing

### Frontend
```bash
cd web-client
npm test  # Run tests (if configured)
```

### API Functions
- No test suite currently
- Test manually via:
  - Browser DevTools Network tab
  - `curl` commands
  - Netlify Functions logs

---

## Deployment

**Automatic (recommended):**
```bash
git push origin main  # or any branch
# Netlify auto-builds and deploys
# Preview: deploy-preview-{PR#}--francoflex-pronunciuation-ai.netlify.app
# Production: francoflex-pronunciation-ai.netlify.app
```

**Manual:**
```bash
netlify deploy --prod
```

**Build Process** (see `netlify.toml`):
1. `npm install` (root - for API functions)
2. `cd web-client && npm install`
3. `cd web-client && npm run build` (Next.js build)
4. Netlify bundles functions from `/api/` directory

---

## Key Files Reference

**Configuration:**
- `netlify.toml`: Netlify build settings, functions directory, env vars
- `supabase_schema.sql`: Database schema (run once in Supabase)
- `package.json` (root): API function dependencies
- `web-client/package.json`: Frontend dependencies

**Documentation:**
- `api/API.md`: Complete pronunciation analysis API documentation
- `README.md`: Project overview, setup instructions
- `SUPABASE_SETUP.md`: Supabase configuration guide (if exists)
- `NETLIFY_SETUP.md`: Netlify deployment guide (if exists)

**Core Backend:**
- `api/_utils/supabase.js`: Supabase client (service role)
- `api/_utils/pronunciation/index.js`: Main pronunciation analysis orchestrator
- `api/analyze-pronunciation.js`: HTTP wrapper for pronunciation analysis

**Core Frontend:**
- `web-client/src/lib/api.ts`: Centralized API client
- `web-client/src/contexts/AuthContext.tsx`: Auth management
- `web-client/src/app/voice_chat_activity/page.tsx`: Main practice UI

---

## Known Issues & TODOs

See the dedicated sections at the end of this file for:
- Security improvements (CORS policy, Firebase Auth migration)
- Missing API functions
- Technical debt items

---

## 🔒 Security Improvements

### TODO: Stricter CORS Policy
**Priority**: High
**Status**: Not Started
**Current State**: All 8 API functions use `'Access-Control-Allow-Origin': '*'` which allows requests from any domain.

**Why This Matters**:
- Open CORS exposes APIs to potential abuse from unauthorized domains
- Production apps should only allow requests from trusted origins
- Prevents CSRF attacks and unauthorized API usage

**Work Needed**:

1. **Create CORS Helper Module** (30 min)
   - File: `api/_utils/cors.js`
   - Function to validate origin against allowed list
   - Return appropriate CORS headers based on environment
   ```javascript
   export function getCorsHeaders(origin) {
     const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
     const isAllowed = allowedOrigins.includes(origin);
     return {
       'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
       'Access-Control-Allow-Credentials': 'true'
     };
   }
   ```

2. **Update Environment Configuration** (15 min)
   - Add to `netlify.toml`:
   ```toml
   [context.production.environment]
     ALLOWED_ORIGINS = "https://francoflex.netlify.app,https://francoflex-pronunciation-ai.netlify.app"

   [context.deploy-preview.environment]
     ALLOWED_ORIGINS = "https://deploy-preview-*--francoflex-pronunciuation-ai.netlify.app"

   [context.branch-deploy.environment]
     ALLOWED_ORIGINS = "*"  # More permissive for branch deploys
   ```
   - Add to local `.env`: `ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8888`

3. **Update All API Functions** (1-1.5 hours)
   - Files to update (8 total):
     - `api/analyze-pronunciation.js`
     - `api/create-session.js` (if it exists)
     - `api/get-preferences.js`
     - `api/get-session.js`
     - `api/health.js`
     - `api/save-message.js`
     - `api/save-preferences.js`
     - `api/upload-audio.js`

   - Replace pattern:
     ```javascript
     // OLD:
     'Access-Control-Allow-Origin': '*'

     // NEW:
     import { getCorsHeaders } from './_utils/cors.js';
     const origin = event.headers.origin || event.headers.Origin;
     ...getCorsHeaders(origin)
     ```

4. **Testing** (30 min)
   - Test from production domain
   - Test from deploy preview
   - Test from unauthorized domain (should fail)
   - Verify localhost works in development

**Estimated Effort**: 2-3 hours
**Risk Level**: Low (can rollback if issues)

---

### TODO: Migrate to Firebase Authentication
**Priority**: Medium
**Status**: Not Started
**Current State**: Using Supabase Auth with Row Level Security policies

**Why This Matters**:
- Firebase offers better OAuth provider support (Google, Apple, Twitter, etc.)
- More flexible authentication rules and custom claims
- Better integration with other Google Cloud services
- Simpler token validation in serverless functions
- Better developer experience with Firebase Console

**Considerations**:
- Keep Supabase for database and storage (only replace auth)
- User migration may require email verification
- Potential short downtime during migration

**Work Needed**:

#### Phase 1: Firebase Setup (1-2 hours)

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Create new project: "francoflex-pronunciation-ai"
   - Enable Google Analytics (optional)

2. **Enable Authentication Methods**
   - Enable Email/Password authentication
   - Enable Google OAuth provider
   - (Optional) Enable other providers: Apple, Facebook, Twitter

3. **Install Dependencies**
   ```bash
   # Root package.json (for API functions)
   npm install firebase-admin

   # web-client/package.json (for frontend)
   cd web-client
   npm install firebase
   ```

4. **Add Firebase Configuration**
   - Download service account key from Firebase Console
   - Add to Netlify environment variables:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY`
   - Add web config to `web-client/.env.local`:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

#### Phase 2: Backend Changes (3-4 hours)

1. **Create Firebase Admin Helper**
   - File: `api/_utils/firebase-admin.js`
   ```javascript
   import admin from 'firebase-admin';

   let firebaseApp = null;

   export function getFirebaseAdmin() {
     if (!firebaseApp) {
       firebaseApp = admin.initializeApp({
         credential: admin.credential.cert({
           projectId: process.env.FIREBASE_PROJECT_ID,
           clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
           privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
         })
       });
     }
     return firebaseApp;
   }

   export async function verifyIdToken(idToken) {
     const admin = getFirebaseAdmin();
     return await admin.auth().verifyIdToken(idToken);
   }
   ```

2. **Create Auth Middleware**
   - File: `api/_utils/auth-middleware.js`
   ```javascript
   import { verifyIdToken } from './firebase-admin.js';

   export async function requireAuth(event) {
     const authHeader = event.headers.authorization || event.headers.Authorization;
     if (!authHeader?.startsWith('Bearer ')) {
       throw new Error('No authentication token provided');
     }

     const token = authHeader.split('Bearer ')[1];
     const decodedToken = await verifyIdToken(token);
     return decodedToken.uid; // Returns Firebase UID
   }
   ```

3. **Update API Functions to Use Firebase Auth**
   - Add auth check to protected endpoints
   - Example for `get-session.js`:
   ```javascript
   import { requireAuth } from './_utils/auth-middleware.js';

   export async function handler(event, context) {
     try {
       const userId = await requireAuth(event);
       // ... rest of function
     } catch (authError) {
       return {
         statusCode: 401,
         body: JSON.stringify({ error: 'Unauthorized' })
       };
     }
   }
   ```

4. **Update Supabase RLS Policies**
   - Modify policies to use Firebase UID from request
   - Option A: Store Firebase UID in user column
   - Option B: Create mapping table between Firebase UID and Supabase user ID

#### Phase 3: Frontend Changes (4-5 hours)

1. **Create Firebase Config**
   - File: `web-client/src/lib/firebase.ts`
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';

   const firebaseConfig = {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
   };

   export const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   ```

2. **Update AuthContext**
   - File: `web-client/src/contexts/AuthContext.tsx`
   - Replace Supabase auth with Firebase auth
   - Use `onAuthStateChanged` for session management
   - Store and refresh Firebase ID tokens

3. **Update API Client**
   - File: `web-client/src/lib/api.ts`
   - Add Firebase ID token to all API requests:
   ```typescript
   async request(endpoint: string, options: RequestInit = {}) {
     const user = auth.currentUser;
     const token = user ? await user.getIdToken() : null;

     return fetch(`${this.baseUrl}${endpoint}`, {
       ...options,
       headers: {
         'Authorization': token ? `Bearer ${token}` : '',
         ...options.headers,
       },
     });
   }
   ```

4. **Update Auth Pages**
   - Sign in: Use `signInWithEmailAndPassword(auth, email, password)`
   - Sign up: Use `createUserWithEmailAndPassword(auth, email, password)`
   - Sign out: Use `signOut(auth)`
   - Password reset: Use `sendPasswordResetEmail(auth, email)`
   - OAuth: Use `signInWithPopup(auth, new GoogleAuthProvider())`

#### Phase 4: Data Migration (2-3 hours)

1. **Export Existing Users**
   - Query Supabase for all users
   - Export to CSV/JSON

2. **Migration Strategy Decision**
   - Option A: Automatic migration
     - Create Firebase users programmatically
     - Send password reset emails
   - Option B: Manual re-registration
     - Users re-register with Firebase
     - Simpler but requires user action

3. **Update User References**
   - If Firebase UIDs differ from Supabase UIDs:
     - Create UID mapping table
     - OR update all foreign keys to Firebase UID

#### Phase 5: Testing (2-3 hours)

1. **Auth Flow Testing**
   - Sign up with email/password
   - Sign in with email/password
   - Sign in with Google OAuth
   - Password reset flow
   - Sign out

2. **API Integration Testing**
   - Test authenticated endpoints
   - Test token refresh
   - Test unauthorized access (should return 401)

3. **Database Access Testing**
   - Verify RLS policies work with Firebase tokens
   - Test that users can only access their own data

4. **Cross-Browser Testing**
   - Chrome, Safari, Firefox
   - Mobile browsers

**Estimated Effort**: 12-17 hours total
**Risk Level**: Medium (user migration complexity)

**Rollback Plan**:
- Keep Supabase auth enabled during migration
- Use feature flag to switch between auth providers
- Can revert to Supabase auth if issues arise

---

## 📝 Other Technical Debt

### TODO: Add Missing API Functions
**Status**: In Progress

Still need to create:
- `get-messages.js` - Retrieve messages for a session
- `get-all-sessions.js` - List all sessions for a user
- `get-specific-session.js` - Get session by ID
- `speech-to-text.js` - Convert audio to text
- `conversational-response.js` - Generate AI responses
- `text-to-audio.js` - TTS conversion
- `get-next-question.js` - Get next question in session
- `update-question-status.js` - Mark questions as done
- `save-pronunciation-analysis.js` - Save analysis results
- `get-pronunciation-analyses.js` - Retrieve past analyses
- `get-latest-pronunciation-analysis.js` - Get most recent analysis
- `generate-greeting.js` - Generate session greeting

### TODO: Add API Documentation
**Priority**: Medium

Create OpenAPI/Swagger documentation for all endpoints.

### TODO: Add Error Monitoring
**Priority**: Medium

Integrate Sentry or similar for error tracking in production.

### TODO: Add Rate Limiting
**Priority**: Medium

Prevent API abuse by limiting requests per user/IP.

---

**Last Updated**: 2025-10-06
**Maintained By**: Development Team
