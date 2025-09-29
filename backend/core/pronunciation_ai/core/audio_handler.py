"""Audio handling functionality for voice recordings."""

import os
import uuid
from pathlib import Path
from typing import List, Optional

class AudioHandler:
    """Handles audio recording operations including saving, listing, and deleting recordings."""
    
    def __init__(self):
        """Initialize AudioHandler with default paths."""
        # Get the absolute path to the project root
        current_dir = Path(__file__).parent.parent.parent  # pronunciation-voice-ai directory
        self.recordings_dir = current_dir / "data" / "recordings"
        
        # Ensure directories exist
        self.recordings_dir.mkdir(parents=True, exist_ok=True)
    
    def save_recording(self, audio_data, file_extension: Optional[str] = None) -> str:
        """
        Save voice recording to recordings directory with a UUID filename.
        
        Args:
            audio_data: The audio data from Streamlit's st.audio_input (UploadedFile object)
            file_extension: File extension for the audio file (auto-detected if None)
        
        Returns:
            str: The filepath where the audio was saved
            
        Raises:
            Exception: If file saving fails or file is empty
        """
        # Get file extension from the uploaded file if not provided
        if file_extension is None:
            original_name = audio_data.name
            if original_name and '.' in original_name:
                file_extension = original_name.split('.')[-1]
            else:
                file_extension = "wav"  # default fallback
        
        # Generate a unique filename using UUID
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        filepath = self.recordings_dir / unique_filename
        
        # Save the audio data to file
        try:
            with open(filepath, "wb") as f:
                f.write(audio_data.read())
            
            # Reset the file pointer for potential future reads
            audio_data.seek(0)
            
            # Verify the file was actually created and has content
            if filepath.exists() and filepath.stat().st_size > 0:
                return str(filepath)
            else:
                raise Exception("File was not created or is empty")
                
        except Exception as e:
            print(f"Error saving file: {e}")
            raise e
    
    def get_recordings(self) -> List[str]:
        """
        Get list of all voice recordings in the recordings directory.
        
        Returns:
            List[str]: List of filepaths to voice recordings
        """
        if not self.recordings_dir.exists():
            return []
        
        # Get all audio files in the recordings directory
        audio_extensions = [".wav", ".mp3", ".m4a", ".ogg", ".webm"]
        recordings = []
        
        for file_path in self.recordings_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in audio_extensions:
                recordings.append(str(file_path))
        
        return recordings
    
    def delete_recording(self, filepath: str) -> bool:
        """
        Delete a voice recording file.
        
        Args:
            filepath: Path to the file to delete
        
        Returns:
            bool: True if file was deleted successfully, False otherwise
        """
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {filepath}: {e}")
            return False
    
    def get_recording_info(self, filepath: str) -> dict:
        """
        Get information about a recording file.
        
        Args:
            filepath: Path to the recording file
            
        Returns:
            dict: File information including size, name, etc.
        """
        file_path = Path(filepath)
        if not file_path.exists():
            return {"error": "File not found"}
        
        return {
            "name": file_path.name,
            "size": file_path.stat().st_size,
            "extension": file_path.suffix,
            "created": file_path.stat().st_ctime
        }
