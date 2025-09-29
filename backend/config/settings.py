"""
Configuration settings for Francoflex backend.
"""

import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent.parent

# API Configuration
API_HOST = "0.0.0.0"
API_PORT = 8000
API_TITLE = "Francoflex API"
API_VERSION = "1.0.0"

# CORS Configuration
CORS_ORIGINS = [
    "http://localhost:3000",  # React dev server
    "http://127.0.0.1:3000",
]

# File Storage
UPLOAD_DIR = BASE_DIR / "api" / "uploads"
RECORDINGS_DIR = BASE_DIR / "data" / "recordings"

# Ensure directories exist
UPLOAD_DIR.mkdir(exist_ok=True)
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)

# API Keys (from environment variables)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
SPEECHACE_API_KEY = os.getenv('SPEECHACE_API_KEY')
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')

# Model Configuration
OPENAI_MODEL = "gpt-3.5-turbo"
ELEVENLABS_VOICE_TYPE = "professional_female"
SPEECHACE_DIALECT = "fr-fr"
