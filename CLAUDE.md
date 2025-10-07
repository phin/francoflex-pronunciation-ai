# Development TODOs for Claude Code

This file tracks improvement tasks and technical debt for the Francoflex pronunciation AI project.

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
