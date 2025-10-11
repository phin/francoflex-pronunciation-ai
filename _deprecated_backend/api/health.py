"""
Health check module for Francoflex API.
"""

import os
from datetime import datetime


def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "api_keys_configured": {
            "openai": bool(os.getenv('OPENAI_API_KEY')),
            "speechace": bool(os.getenv('SPEECHACE_API_KEY')),
            "elevenlabs": bool(os.getenv('ELEVENLABS_API_KEY')),
            "supabase": bool(os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_KEY'))
        }
    }
