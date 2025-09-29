"""SpeechAce API client for pronunciation scoring."""

import os
import requests
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SpeechAceClient:
    """Client for interacting with SpeechAce API for pronunciation scoring."""
    
    def __init__(self):
        """Initialize SpeechAce client with environment variables."""
        self.api_key = os.getenv('SPEECHACE_API_KEY')
        self.base_url = "https://api.speechace.co/api/scoring/text/v9/json"
    
    def score_pronunciation(self, filepath: str, word: str = "Bonjour", dialect: str = "fr-fr") -> Optional[Dict[str, Any]]:
        """
        Score pronunciation using SpeechAce API.
        
        Args:
            filepath: Path to the user's voice audio file
            word: The desired word to be pronounced (default: "Bonjour")
            dialect: Language dialect (default: "fr-fr" for French)
        
        Returns:
            Dict containing API response with pronunciation score, or None if error
        """
        if not self.api_key:
            print("Error: SPEECHACE_API_KEY not found in environment variables")
            return None
            
        # Build the API URL
        url = f"{self.base_url}?key={self.api_key}&dialect={dialect}"
        
        # Prepare the request data
        data = {
            'text': word
        }
        
        # Prepare the file
        try:
            with open(filepath, 'rb') as audio_file:
                files = {
                    'user_audio_file': audio_file
                }
                
                # Make the API request
                response = requests.post(url, data=data, files=files)
                
                # Check if request was successful
                response.raise_for_status()
                
                # Return the JSON response
                return response.json()
                
        except requests.exceptions.RequestException as e:
            print(f"Error making SpeechAce API request: {e}")
            return None
        except FileNotFoundError:
            print(f"Audio file not found: {filepath}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None
    
    def get_pronunciation_score(self, filepath: str, word: str = "Bonjour") -> Optional[float]:
        """
        Get just the overall pronunciation score from SpeechAce API.
        
        Args:
            filepath: Path to the user's voice audio file
            word: The desired word to be pronounced
            
        Returns:
            Overall pronunciation score (0-100) or None if error
        """
        result = self.score_pronunciation(filepath, word)
        
        if result and 'text_score' in result:
            return result['text_score'].get('quality_score', 0)
        
        return None
    
    def is_api_configured(self) -> bool:
        """
        Check if SpeechAce API is properly configured.
        
        Returns:
            True if API key is available, False otherwise
        """
        return self.api_key is not None and self.api_key.strip() != ""
