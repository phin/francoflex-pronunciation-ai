# Francoflex Backend

A FastAPI-based backend for French pronunciation practice with AI-powered analysis.

## 📁 Project Structure

```
backend/
├── api/                    # FastAPI application
│   ├── __init__.py
│   ├── main.py            # Main API application
│   └── uploads/           # Temporary file storage
├── core/                  # Core AI modules
│   ├── __init__.py
│   ├── conversational_ai/ # ElevenLabs and conversation logic
│   └── pronunciation_ai/  # SpeechAce and pronunciation analysis
├── utils/                 # Utility functions
│   ├── __init__.py
│   └── pronunciation_analyzer.py
├── config/                # Configuration
│   ├── __init__.py
│   └── settings.py
├── data/                  # Data storage
│   └── recordings/        # Audio recordings
├── main.py               # Backend entry point
├── requirements.txt      # Python dependencies
├── voice_chat.py         # Legacy Streamlit app
└── README.md            # This file
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
SPEECHACE_API_KEY=your_speechace_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### 3. Run the Backend

```bash
# Option 1: Using the main entry point
python main.py

# Option 2: Direct uvicorn command
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **Main API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## 📚 API Endpoints

### Core Endpoints

- `POST /api/generate-questions` - Generate personalized French questions
- `POST /api/analyze-pronunciation` - Analyze voice recordings
- `POST /api/generate-audio` - Text-to-speech generation
- `POST /api/generate-ai-answer` - AI-powered question responses
- `GET /api/health` - Health check and API key status

### Request/Response Examples

#### Generate Questions
```bash
curl -X POST "http://localhost:8000/api/generate-questions" \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "Pharmaceutical",
    "job_title": "Sales Manager"
  }'
```

#### Analyze Pronunciation
```bash
curl -X POST "http://localhost:8000/api/analyze-pronunciation" \
  -F "audio_file=@recording.wav" \
  -F "target_text=Bonjour, comment allez-vous?"
```

## 🏗️ Architecture

### Core Modules

- **`core/conversational_ai/`**: ElevenLabs integration and conversation scenarios
- **`core/pronunciation_ai/`**: SpeechAce integration and pronunciation analysis
- **`utils/`**: Shared utility functions for data processing
- **`config/`**: Centralized configuration management

### Key Features

- **AI-Powered Question Generation**: Personalized French questions based on industry/job
- **Real-time Pronunciation Analysis**: SpeechAce API integration for detailed feedback
- **Text-to-Speech**: ElevenLabs integration for AI voice responses
- **File Upload Handling**: Secure audio file processing
- **CORS Support**: Frontend integration ready

## 🔧 Development

### Adding New Endpoints

1. Add new route functions in `api/main.py`
2. Update Pydantic models for request/response validation
3. Add error handling and logging
4. Update API documentation

### Testing

```bash
# Run tests (when implemented)
pytest

# Test specific endpoint
curl -X GET "http://localhost:8000/api/health"
```

### Code Style

- Follow PEP 8 guidelines
- Use type hints for all functions
- Document all public functions and classes
- Use meaningful variable and function names

## 📦 Dependencies

### Core Dependencies
- **FastAPI**: Modern web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI
- **OpenAI**: GPT integration for question generation
- **ElevenLabs**: Text-to-speech API
- **SpeechAce**: Pronunciation analysis API

### Development Dependencies
- **pytest**: Testing framework
- **python-dotenv**: Environment variable management

## 🚨 Troubleshooting

### Common Issues

1. **Import Errors**: Ensure you're running from the backend directory
2. **API Key Issues**: Check that all environment variables are set
3. **File Upload Errors**: Verify upload directory permissions
4. **CORS Issues**: Check that frontend URL is in CORS_ORIGINS

### Logs

Check the console output for detailed error messages and API logs.

## 📄 License

MIT License - see the main project license for details.
