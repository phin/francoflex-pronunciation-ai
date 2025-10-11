# Francoflex - AI-Powered Pronunciation Training

A comprehensive web application for practicing French pronunciation using SpeechAce API and OpenAI LLM analysis for detailed feedback. Built with FastAPI backend and Next.js frontend.

## 🚀 Features

- 🎤 **Voice Recording**: Record your pronunciation directly in the browser
- 🎯 **SpeechAce Analysis**: Professional pronunciation scoring using SpeechAce API
- 🤖 **AI-Powered Feedback**: Detailed syllable-focused feedback using OpenAI LLM
- 📊 **Syllable Breakdown**: Visual analysis of each syllable and phone
- 💾 **Recording Management**: Save and manage your practice recordings
- 🎨 **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- 🔄 **Real-time Analysis**: Instant feedback on pronunciation quality

## 🏗️ Architecture

- **Backend**: FastAPI with Python
- **Frontend**: Next.js with React and TypeScript
- **Authentication**: Firebase Authentication (email/password, custom tokens)
- **Styling**: Tailwind CSS with Radix UI components
- **Database**: Firebase (Firestore + Realtime Database)
- **AI Services**: OpenAI GPT, SpeechAce API, ElevenLabs TTS

## 📁 Project Structure

```
francoflex-pronunciation-ai/
├── _deprecated_backend/        # FastAPI backend (legacy)
│   ├── api/                    # API endpoints
│   │   ├── ai.py              # AI/LLM endpoints
│   │   ├── audio.py           # Audio processing
│   │   ├── pronunciation.py   # Pronunciation analysis
│   │   └── ...
│   ├── core/                   # Core functionality
│   │   ├── conversational_ai/ # Conversational AI features
│   │   └── pronunciation_ai/   # Pronunciation analysis
│   ├── function/              # Serverless functions
│   ├── main.py                # FastAPI app entry point
│   └── requirements.txt       # Python dependencies
├── web-client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/               # Next.js app router pages
│   │   ├── components/        # React components
│   │   ├── lib/              # Utilities and API client
│   │   └── contexts/         # React contexts
│   ├── public/                # Static assets
│   └── package.json           # Node.js dependencies
├── start_api.py               # FastAPI server startup script
├── start_dev.sh              # Development environment script
└── setup.sh                  # Project setup script
```

## 🛠️ Installation & Setup

### Prerequisites

- Python 3.8+ 
- Node.js 18+
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/mattdullapNW10/francoflex-pronunciation-ai.git
cd francoflex-pronunciation-ai
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r _deprecated_backend/requirements.txt
```

### 3. Frontend Setup

```bash
# Install Node.js dependencies
cd web-client
npm install
cd ..
```

### 4. Environment Configuration

Create a `.env` file in the project root:

```env
# OpenAI API Key for LLM analysis
OPENAI_API_KEY=your_openai_api_key_here

# SpeechAce API Key for pronunciation analysis
SPEECHACE_API_KEY=your_speechace_api_key_here

# ElevenLabs API Key for text-to-speech
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Firebase Authentication / Database
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC123...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_firebase_database_url
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=optional_measurement_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
```

> 🛠 **Local development defaults**
>
> If the `NEXT_PUBLIC_FIREBASE_*` variables above are omitted, the app falls back to the `madameai-dev` Firebase project when running locally:
>
> ```env
> NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDBczhS0XYJCVhM3-WemvSFaWliSkjLRIM
> NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=madameai-dev.firebaseapp.com
> NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://madameai-dev-default-rtdb.firebaseio.com
> NEXT_PUBLIC_FIREBASE_PROJECT_ID=madameai-dev
> NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=madameai-dev.firebasestorage.app
> NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=115515011999
> NEXT_PUBLIC_FIREBASE_APP_ID=1:115515011999:web:26f6328246216339b283aa
> ```

Add the production (`madameai`) values in Netlify, along with `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `FIREBASE_STORAGE_BUCKET`.

### 5. Get API Keys

1. **OpenAI API**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **SpeechAce API**: Sign up at [SpeechAce](https://www.speechace.com/) and get your API key
3. **ElevenLabs API**: Get your API key from [ElevenLabs](https://elevenlabs.io/)
4. **Firebase**: Project created earlier in the console (no extra action needed here)

## 🚀 Running the Application

### Development Mode (Recommended)

Start both backend and frontend in development mode:

```bash
# Make the script executable
chmod +x start_dev.sh

# Start both services
./start_dev.sh
```

This will start:
- **FastAPI Server**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Next.js App**: http://localhost:3000

> ℹ️ **Single Sign-On Tokens**  
> Supply a Firebase custom token in the URL (e.g. `http://localhost:3000/voice_chat_activity?token=YOUR_TOKEN`) to automatically authenticate the user. If no token is present, the standard email/password flow is shown.

#### Token-Based Authentication Flow

1. Generate a Firebase custom token on your backend (e.g. `auth.createCustomToken(uid, claims)` in Firebase Admin).
2. Redirect or link the learner to the desired Francoflex route with `?token=<CUSTOM_TOKEN>` appended.
3. The frontend signs in with `signInWithCustomToken`, removes the query parameter, and continues the session. If a user is already authenticated, the token is ignored after cleanup.

Invalid or expired tokens are logged to the console and fall back to the standard email/password sign-in screen.

### Firebase Security Rules

- Firestore rules (`firestore.rules`) restrict access so that only `request.auth.uid` matching the owner can read/write their profile document (`/users/{uid}`), sessions, messages, and pronunciation analysis records.
- Storage rules (`storage.rules`) limit reads/writes under `<bucket>/<userId>/…` to the authenticated owner.

Deploy the rules with the Firebase CLI:

```bash
npm install -g firebase-tools   # once
firebase login
firebase use madameai           # or madameai-dev locally

firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

Netlify functions use the Firebase Admin SDK, so they bypass these rules while end-user clients remain sandboxed.

### Production Mode

#### Start Backend Only

```bash
python start_api.py
```

#### Start Frontend Only

```bash
cd web-client
npm run dev
```

## 🎯 Usage

1. **Open the application** at http://localhost:3000
2. **Record pronunciation**: Use the voice recording feature to practice French words
3. **Get instant feedback**: The AI analyzes your pronunciation and provides detailed feedback
4. **Track progress**: View your pronunciation history and improvement over time
5. **Practice conversations**: Engage in AI-powered conversational practice

## 🔧 Development

### Legacy Backend Development (optional)

```bash
# Start FastAPI with auto-reload
cd _deprecated_backend
source ../venv/bin/activate
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
# Start Next.js development server
cd web-client
npm run dev
```

### Running Tests

```bash
# Legacy backend tests
cd _deprecated_backend
python -m pytest tests/

# Frontend tests
cd web-client
npm test
```

## 📊 API Documentation

When the backend is running, visit:
- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## 🏗️ Architecture Details

### Backend (FastAPI)
- **RESTful API** with automatic OpenAPI documentation
- **Modular structure** with separate modules for different features
- **Async support** for high-performance audio processing
- **WebSocket support** for real-time communication

### Frontend (Next.js)
- **App Router** with React Server Components
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Responsive design** for all devices

### AI Integration
- **SpeechAce API**: Professional pronunciation scoring
- **OpenAI GPT**: Intelligent feedback generation
- **ElevenLabs**: High-quality text-to-speech
- **Real-time analysis**: Instant pronunciation feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/mattdullapNW10/francoflex-pronunciation-ai/issues)
- Check the [API documentation](http://localhost:8000/docs) when running locally

## 🙏 Acknowledgments

- [SpeechAce](https://www.speechace.com/) for pronunciation analysis
- [OpenAI](https://openai.com/) for AI-powered feedback
- [ElevenLabs](https://elevenlabs.io/) for text-to-speech
- [Firebase Docs](https://firebase.google.com/docs) for backend services
