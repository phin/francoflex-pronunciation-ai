"""
Pronunciation analysis module for Francoflex API.
"""

import os
import uuid
import shutil
from pathlib import Path
from fastapi import File, UploadFile, HTTPException, Form
from utils.pronunciation_analyzer import (
    analyze_pronunciation, 
    generate_word_feedback
)

# Storage directories
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def analyze_pronunciation_endpoint(
    audio_file: UploadFile = File(...),
    target_text: str = Form(...)
):
    """Analyze pronunciation of uploaded audio against target text."""
    
    # Check if API key is available
    api_key = os.getenv('SPEECHACE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="SpeechAce API key not configured")
    
    # Save uploaded audio file
    file_id = str(uuid.uuid4())
    audio_path = UPLOAD_DIR / f"{file_id}.wav"
    
    try:
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
        
        # Analyze pronunciation
        custom_response, error_message = analyze_pronunciation(str(audio_path), target_text)
        
        if error_message:
            raise HTTPException(status_code=500, detail=error_message)
        
        if not custom_response:
            raise HTTPException(status_code=500, detail="Failed to analyze pronunciation")
        
        # Generate AI feedback for each word
        overall_score = custom_response.get('overall_score', 0)
        for word_data in custom_response.get('word_analysis', []):
            ai_feedback = generate_word_feedback(word_data, overall_score)
            word_data['ai_feedback'] = ai_feedback
        
        return custom_response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")
    finally:
        # Clean up uploaded file
        if audio_path.exists():
            audio_path.unlink()
