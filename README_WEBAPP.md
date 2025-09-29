# Francoflex Web Application

A modern React + FastAPI implementation of the Francoflex pronunciation practice tool, featuring neobrutalism design from [neobrutalism.dev](https://www.neobrutalism.dev/).

## Architecture

- **Frontend**: React + TypeScript with Shadcn/ui and neobrutalism styling
- **Backend**: FastAPI with Python
- **Features**: 
  - Voice recording and pronunciation analysis
  - AI-generated personalized questions
  - Text-to-speech with ElevenLabs
  - Real-time pronunciation feedback with SpeechAce API

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key
SPEECHACE_API_KEY=your_speechace_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Setup Instructions

### 1. Backend Setup (FastAPI)

```bash
# Navigate to the project directory
cd pronunciation-voice-ai

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
cd api
pip install -r requirements.txt
```

### 2. Frontend Setup (React)

```bash
# Navigate to web client directory
cd ../web-client

# Install dependencies
npm install

# Note: If you encounter peer dependency issues, use:
# npm install --legacy-peer-deps
```

## Running the Application

### Start the Backend API

```bash
# Option 1: Use the start script
cd pronunciation-voice-ai
python start_api.py

# Option 2: Manual start
cd api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- Main API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health

### Start the Frontend

```bash
# In a new terminal
cd pronunciation-voice-ai/web-client
npm start
```

The React app will be available at: http://localhost:3000

## Features

### 🎨 Neobrutalism Design
- Bold, black borders and shadows
- Bright, contrasting colors
- Playful, chunky UI elements
- Based on the neobrutalism.dev component library

### 🎤 Voice Recording
- Browser-based audio recording
- Real-time pronunciation analysis
- Visual feedback with scores and recommendations

### 🤖 AI-Powered Learning
- Personalized questions based on industry and job role
- AI-generated pronunciation feedback
- Text-to-speech for question playback

### 📊 Detailed Analytics
- Overall pronunciation scores
- CEFR level assessment
- Word-by-word and phone-by-phone analysis
- Improvement recommendations

## API Endpoints

- `POST /api/generate-questions` - Generate personalized questions
- `POST /api/analyze-pronunciation` - Analyze voice recordings
- `POST /api/generate-audio` - Text-to-speech generation
- `POST /api/generate-ai-answer` - AI-powered question responses
- `GET /api/health` - Health check and API key status

## Project Structure

```
pronunciation-voice-ai/
├── api/                          # FastAPI backend
│   ├── main.py                   # API main application
│   ├── requirements.txt          # Python dependencies
│   └── uploads/                  # Temporary file storage
├── web-client/                   # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── ui/              # Shadcn UI components
│   │   │   ├── OnboardingComponent.tsx
│   │   │   ├── VoiceChatComponent.tsx
│   │   │   └── PronunciationAnalysisComponent.tsx
│   │   ├── lib/                 # Utility functions
│   │   ├── App.tsx              # Main App component
│   │   └── index.css            # Tailwind + neobrutalism styles
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── conversational_ai/           # Original AI modules
├── pronunciation_ai/            # Original pronunciation modules
├── pronunciation_analyzer.py    # Core analysis functions
├── start_api.py                 # API startup script
└── README_WEBAPP.md             # This file
```

## Troubleshooting

### API Connection Issues
- Ensure the FastAPI server is running on port 8000
- Check that CORS is properly configured
- Verify API keys are set in environment variables

### Audio Recording Issues
- Grant microphone permissions in your browser
- Ensure you're accessing the app via HTTPS or localhost
- Check browser compatibility (Chrome/Firefox recommended)

### Dependency Issues
- Use `--legacy-peer-deps` flag when installing npm packages
- Ensure Python virtual environment is activated
- Check that all API keys are properly configured

## Development

### Adding New Components
- Follow the neobrutalism design system
- Use the provided CSS classes: `neobrutalism-button`, `neobrutalism-card`, etc.
- Maintain bold borders, shadows, and bright colors

### API Development
- Add new endpoints in `api/main.py`
- Follow FastAPI conventions
- Update API documentation with proper Pydantic models

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Test your changes thoroughly
5. Submit a pull request

## License

MIT License - see the original project license for details.
