# French Pronunciation Practice Tool

A comprehensive tool for practicing French pronunciation using SpeechAce API and OpenAI LLM analysis for detailed feedback.

## Features

- 🎤 **Voice Recording**: Record your pronunciation directly in the browser
- 🎯 **SpeechAce Analysis**: Professional pronunciation scoring using SpeechAce API
- 🤖 **AI-Powered Feedback**: Detailed syllable-focused feedback using OpenAI LLM
- 📊 **Syllable Breakdown**: Visual analysis of each syllable and phone
- 💾 **Recording Management**: Save and manage your practice recordings

## Project Structure

```
pronunciation-voice-ai/
├── README.md
├── requirements.txt
├── .env.example
├── app.py                    # Main Streamlit application
├── pronunciation_ai/         # Main package
│   ├── __init__.py
│   ├── core/                 # Core functionality
│   │   ├── __init__.py
│   │   ├── audio_handler.py  # Voice recording/saving
│   │   └── speechace_client.py # SpeechAce API client
│   ├── analysis/             # Analysis modules
│   │   ├── __init__.py
│   │   └── llm_analyzer.py   # LLM analysis
│   └── utils/                # Utilities
│       ├── __init__.py
│       └── config.py         # Configuration management
├── data/                     # Data storage
│   └── recordings/           # Voice recordings
└── tests/                    # Tests
    └── __init__.py
```

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd pronunciation-voice-ai
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

## Configuration

Create a `.env` file in the project root with the following variables:

```env
# SpeechAce API Key for pronunciation analysis
SPEECHACE_API_KEY=your_speechace_api_key_here

# OpenAI API Key for LLM analysis
OPENAI_API_KEY=your_openai_api_key_here
```

### Getting API Keys

1. **SpeechAce API**: Sign up at [SpeechAce](https://www.speechace.com/) and get your API key
2. **OpenAI API**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

## Usage

1. **Start the application**:
   ```bash
   streamlit run app.py
   ```

2. **Practice pronunciation**:
   - Click "Record a voice message" to record yourself saying "Bonjour"
   - The app will automatically analyze your pronunciation
   - Review the AI-powered feedback and syllable breakdown
   - Practice again to improve your score

## Features Explained

### SpeechAce Integration
- Uses French dialect (`fr-fr`) for accurate analysis
- Provides detailed syllable and phone-level scoring
- Returns comprehensive pronunciation assessment data

### LLM Analysis
- Analyzes SpeechAce JSON data using OpenAI
- Provides specific, actionable feedback
- Focuses on worst-performing syllables
- Gives pronunciation correction tips

### Audio Management
- Automatically saves recordings with UUID filenames
- Organizes recordings in `data/recordings/` directory
- Supports multiple audio formats (WAV, MP3, M4A, OGG, WebM)

## Development

### Running Tests
```bash
python -m pytest tests/
```

### Code Structure
- **Core**: Audio handling and SpeechAce API integration
- **Analysis**: LLM-based feedback generation
- **Utils**: Configuration and utility functions
- **App**: Streamlit user interface

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.
