"""
Text-to-Speech module using ElevenLabs API directly.
"""

import os
import sys
import uuid
import requests
from typing import Optional
from dotenv import load_dotenv



# Try the import
try:
    from sb_add_audio import save_audio_file
    print("✅ Import successful!")
except ImportError as e:
    print(f"❌ Import failed: {e}")
    # Try alternative import
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("add_audio", os.path.join(backend_path, "supabase", "add_audio.py"))
        add_audio_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(add_audio_module)
        save_audio_file = add_audio_module.save_audio_file
        print("✅ Alternative import successful!")
    except Exception as e2:
        print(f"❌ Alternative import also failed: {e2}")
        exit(1)

# Load environment variables
load_dotenv()


def text_to_audio(text_input: str, voice_id: str = "pNInz6obpgDQGcFmaJgB") -> Optional[str]:
    """
    Convert text to audio file using ElevenLabs API and upload to Supabase.
    
    Args:
        text_input (str): Text to convert to speech
        voice_id (str): ElevenLabs voice ID (default: "pNInz6obpgDQGcFmaJgB" - Adam)
        
    Returns:
        Optional[str]: Public URL of the uploaded audio file, or None if failed
    """
    try:
        # Check if API key is configured
        api_key = os.getenv('ELEVENLABS_API_KEY')
        if not api_key:
            print("❌ ELEVENLABS_API_KEY not found in environment variables")
            return None
        
        print(f"🎤 Converting text to speech: '{text_input[:50]}...'")
        
        # ElevenLabs API endpoint
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": api_key
        }
        
        data = {
            "text": text_input,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        # Make API request
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        
        # Upload audio to Supabase and get URL
        audio_url = save_audio_file(response.content, "mp3")
        
        if audio_url:
            print(f"✅ Audio uploaded to Supabase: {audio_url}")
            return audio_url
        else:
            print("❌ Failed to upload audio to Supabase")
            return None
            
    except Exception as e:
        print(f"❌ Error in text-to-speech conversion: {str(e)}")
        return None


# Example usage
if __name__ == "__main__":
    # Test the function
    test_text = "Bonjour, comment allez-vous aujourd'hui?"
    
    print("Testing text-to-speech conversion...")
    
    # Test: Generate and upload to Supabase
    audio_url = text_to_audio(test_text, "pNInz6obpgDQGcFmaJgB")  # Adam voice
    
    if audio_url:
        print(f"🎵 Audio URL: {audio_url}")
    else:
        print("❌ Failed to create and upload audio")
