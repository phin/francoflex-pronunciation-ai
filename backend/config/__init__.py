"""
Configuration package for Francoflex backend.
"""

from .settings import *

__all__ = [
    "API_HOST",
    "API_PORT", 
    "API_TITLE",
    "API_VERSION",
    "CORS_ORIGINS",
    "UPLOAD_DIR",
    "RECORDINGS_DIR",
    "OPENAI_API_KEY",
    "SPEECHACE_API_KEY", 
    "ELEVENLABS_API_KEY",
    "OPENAI_MODEL",
    "ELEVENLABS_VOICE_TYPE",
    "SPEECHACE_DIALECT"
]
