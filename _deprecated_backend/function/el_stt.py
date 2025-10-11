import os
import requests
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

def speech_to_text(audio_url: str, language: str = "fr") -> Optional[str]:
    """
    Convert speech to text using ElevenLabs Speech-to-Text API.
    
    Args:
        audio_url (str): URL of the audio file to transcribe
        language (str): Language code for transcription (default: "fr")
        
    Returns:
        Optional[str]: Transcribed text if successful, None if failed
    """
    try:
        elevenlabs_api_key = os.getenv('ELEVENLABS_API_KEY')
        if not elevenlabs_api_key:
            print("❌ ElevenLabs API key not configured")
            return None
        
        # ElevenLabs Speech-to-Text API endpoint
        url = "https://api.elevenlabs.io/v1/speech-to-text"
        
        headers = {
            "xi-api-key": elevenlabs_api_key,
            "Content-Type": "application/json"
        }
        
        # Download audio from URL
        audio_response = requests.get(audio_url)
        if audio_response.status_code != 200:
            print(f"❌ Failed to download audio: {audio_response.status_code}")
            return None
        
        # Prepare the request data
        data = {
            "audio": audio_response.content,
            "model_id": "eleven_multilingual_v2",  # Use multilingual model
            "language": language
        }
        
        # Make the request
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            transcribed_text = result.get('text', '')
            print(f"✅ Speech transcribed successfully: {transcribed_text}")
            return transcribed_text
        else:
            print(f"❌ Speech-to-text failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error in speech-to-text: {str(e)}")
        return None


# Test section
if __name__ == "__main__":
    # Test with a dummy audio URL
    test_audio_url = "https://example.com/test-audio.wav"
    test_language = "fr"
    
    print("Testing speech_to_text function...")
    print(f"Audio URL: {test_audio_url}")
    print(f"Language: {test_language}")
    
    try:
        result = speech_to_text(test_audio_url, test_language)
        if result:
            print(f"✅ Transcription result: {result}")
        else:
            print("❌ Transcription failed")
    except Exception as e:
        print(f"❌ Error in main execution: {str(e)}")
