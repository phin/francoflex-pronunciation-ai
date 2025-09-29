# Francoflex Project Structure

## 📁 Complete Project Organization

```
pronunciation-voice-ai/
├── backend/                    # 🐍 Python Backend
│   ├── api/                   # FastAPI Application
│   │   ├── __init__.py
│   │   ├── main.py           # Main API endpoints
│   │   └── uploads/          # Temporary file storage
│   ├── core/                 # Core AI Modules
│   │   ├── __init__.py
│   │   ├── conversational_ai/ # ElevenLabs & conversation logic
│   │   │   ├── __init__.py
│   │   │   ├── client.py     # ElevenLabs client
│   │   │   ├── scenarios.py  # Pharmaceutical scenarios
│   │   │   └── ui.py         # UI components
│   │   └── pronunciation_ai/ # SpeechAce & pronunciation analysis
│   │       ├── __init__.py
│   │       ├── core/         # Core functionality
│   │       ├── analysis/     # Analysis modules
│   │       └── utils/        # Utility functions
│   ├── utils/                # Shared Utilities
│   │   ├── __init__.py
│   │   └── pronunciation_analyzer.py # Main analysis functions
│   ├── config/               # Configuration
│   │   ├── __init__.py
│   │   └── settings.py       # App settings & constants
│   ├── data/                 # Data Storage
│   │   └── recordings/       # Audio recordings
│   ├── main.py              # Backend entry point
│   ├── requirements.txt     # Python dependencies
│   ├── voice_chat.py        # Legacy Streamlit app
│   └── README.md           # Backend documentation
├── web-client/              # ⚛️ React Frontend
│   ├── public/             # Static assets
│   │   ├── francoflex_logo.svg
│   │   └── ...
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   │   ├── ui/         # Shadcn UI components
│   │   │   ├── OnboardingComponent.tsx
│   │   │   ├── VoiceChatComponent.tsx
│   │   │   └── PronunciationAnalysisComponent.tsx
│   │   ├── lib/            # Utility functions
│   │   ├── types.ts        # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   └── index.tsx       # Entry point
│   ├── package.json        # Node.js dependencies
│   ├── tailwind.config.js  # Tailwind configuration
│   ├── tsconfig.json       # TypeScript configuration
│   └── README.md          # Frontend documentation
├── venv/                   # Python virtual environment
├── start_api.py           # API startup script
├── start_dev.sh           # Development startup script
├── setup.sh              # Setup script
├── README_WEBAPP.md      # Main project documentation
└── PROJECT_STRUCTURE.md  # This file
```

## 🎯 Key Directories

### Backend (`/backend/`)
- **`api/`**: FastAPI application with all REST endpoints
- **`core/`**: Core AI modules (ElevenLabs, SpeechAce, OpenAI)
- **`utils/`**: Shared utility functions for data processing
- **`config/`**: Centralized configuration management
- **`data/`**: Data storage including audio recordings

### Frontend (`/web-client/`)
- **`src/components/`**: React components with neobrutalism styling
- **`src/lib/`**: Utility functions and helpers
- **`public/`**: Static assets including the logo
- **Configuration files**: Tailwind, TypeScript, package.json

## 🚀 Quick Start Commands

### Backend
```bash
cd backend
python main.py
# or
uvicorn api.main:app --reload
```

### Frontend
```bash
cd web-client
npm start
```

### Full Development Environment
```bash
./start_dev.sh
```

## 📦 Dependencies

### Backend Dependencies
- FastAPI, Uvicorn (Web framework)
- OpenAI, ElevenLabs, SpeechAce (AI services)
- Pandas, Requests (Data processing)

### Frontend Dependencies
- React, TypeScript (Core framework)
- Tailwind CSS (Styling)
- Shadcn/ui (UI components)
- Axios (HTTP client)

## 🔧 Development Workflow

1. **Backend Development**: Work in `/backend/` directory
2. **Frontend Development**: Work in `/web-client/` directory
3. **API Integration**: Backend serves on port 8000, frontend on port 3000
4. **Testing**: Use the provided startup scripts for full environment

## 📚 Documentation

- **Main Project**: `README_WEBAPP.md`
- **Backend**: `backend/README.md`
- **Frontend**: `web-client/README.md`
- **Logo Replacement**: `web-client/LOGO_REPLACEMENT.md`
- **Project Structure**: This file

## 🎨 Design System

- **Colors**: Background #AFD8FF, Accent #181632
- **Style**: Neobrutalism with bold borders and shadows
- **Components**: Shadcn/ui with custom neobrutalism variants
- **Typography**: Bold, chunky fonts with high contrast
