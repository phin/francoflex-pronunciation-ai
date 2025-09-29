"""ElevenLabs client for French speech synthesis in pharmaceutical workplace scenarios."""

import os
import requests
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ElevenLabsClient:
    """Client for ElevenLabs text-to-speech API with French voice support."""
    
    def __init__(self):
        """Initialize ElevenLabs client with environment variables."""
        self.api_key = os.getenv('ELEVENLABS_API_KEY')
        self.base_url = "https://api.elevenlabs.io/v1"
        
        # French voice IDs (you can customize these based on available voices)
        self.french_voices = {
            'professional_female': 'pNInz6obpgDQGcFmaJgB',  # Adam voice (can be changed)
            'professional_male': 'EXAVITQu4vr4xnSDxMaL',   # Bella voice (can be changed)
            'friendly_female': 'VR6AewLTigWG4xSOukaG',     # Arnold voice (can be changed)
        }
    
    def text_to_speech(self, text: str, voice_type: str = 'professional_female', 
                      model_id: str = 'eleven_multilingual_v2') -> Optional[bytes]:
        """
        Convert text to speech using ElevenLabs API.
        
        Args:
            text: Text to convert to speech
            voice_type: Type of voice to use ('professional_female', 'professional_male', 'friendly_female')
            model_id: Model to use for synthesis
            
        Returns:
            Audio data as bytes, or None if error
        """
        if not self.api_key:
            print("Error: ELEVENLABS_API_KEY not found in environment variables")
            return None
        
        if voice_type not in self.french_voices:
            print(f"Error: Unknown voice type '{voice_type}'")
            return None
        
        voice_id = self.french_voices[voice_type]
        url = f"{self.base_url}/text-to-speech/{voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        
        data = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        try:
            response = requests.post(url, json=data, headers=headers)
            response.raise_for_status()
            return response.content
            
        except requests.exceptions.RequestException as e:
            print(f"Error making ElevenLabs API request: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None
    
    def save_audio(self, audio_data: bytes, filename: str) -> bool:
        """
        Save audio data to file.
        
        Args:
            audio_data: Audio data as bytes
            filename: Name of the file to save
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with open(filename, 'wb') as f:
                f.write(audio_data)
            return True
        except Exception as e:
            print(f"Error saving audio file: {e}")
            return False
    
    def is_configured(self) -> bool:
        """
        Check if ElevenLabs API is properly configured.
        
        Returns:
            True if API key is available, False otherwise
        """
        return self.api_key is not None and self.api_key.strip() != ""
    
    def get_available_voices(self) -> Dict[str, str]:
        """
        Get available French voice types.
        
        Returns:
            Dictionary of voice types and their descriptions
        """
        return {
            'professional_female': 'Professional female voice for formal workplace scenarios',
            'professional_male': 'Professional male voice for formal workplace scenarios', 
            'friendly_female': 'Friendly female voice for casual workplace interactions'
        }
