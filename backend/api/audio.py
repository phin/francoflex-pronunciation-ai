"""
Audio generation module for Francoflex API.
"""

import uuid
from pathlib import Path
from fastapi import HTTPException
from fastapi.responses import FileResponse
from core.conversational_ai import ElevenLabsClient

# Storage directories
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def generate_audio(text: str, voice_type: str = "professional_female"):
    """Generate AI voice from text using ElevenLabs."""
    
    elevenlabs_client = ElevenLabsClient()
    
    if not elevenlabs_client.is_configured():
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    
    try:
        audio_data = elevenlabs_client.text_to_speech(text, voice_type=voice_type)
        
        if not audio_data:
            raise HTTPException(status_code=500, detail="Failed to generate audio")
        
        # Save audio to temporary file
        file_id = str(uuid.uuid4())
        audio_path = UPLOAD_DIR / f"{file_id}.mp3"
        
        with open(audio_path, "wb") as f:
            f.write(audio_data)
        
        return FileResponse(
            path=str(audio_path),
            media_type="audio/mpeg",
            filename=f"generated_audio_{file_id}.mp3"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio generation error: {str(e)}")
