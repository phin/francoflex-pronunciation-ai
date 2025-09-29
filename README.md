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
- **Styling**: Tailwind CSS with Radix UI components
- **Database**: Supabase (PostgreSQL)
- **AI Services**: OpenAI GPT, SpeechAce API, ElevenLabs TTS

## 📁 Project Structure

```
francoflex-pronunciation-ai/
├── backend/                    # FastAPI backend
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
pip install -r backend/requirements.txt
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

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Get API Keys

1. **OpenAI API**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **SpeechAce API**: Sign up at [SpeechAce](https://www.speechace.com/) and get your API key
3. **ElevenLabs API**: Get your API key from [ElevenLabs](https://elevenlabs.io/)
4. **Supabase**: Set up a project at [Supabase](https://supabase.com/)

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

### Backend Development

```bash
# Start FastAPI with auto-reload
cd backend
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
# Backend tests
cd backend
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
- [Supabase](https://supabase.com/) for backend services