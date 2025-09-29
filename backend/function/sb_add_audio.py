import uuid
import os
from typing import Optional

try:
    from .sb_client import get_supabase_client
except ImportError:
    from sb_client import get_supabase_client


def save_audio_file(audio_data: bytes, file_extension: str = "mp3") -> Optional[str]:
    """Save audio file to Supabase storage and return public URL."""
    try:
        supabase = get_supabase_client()
        
        # Generate filename
        file_uuid = str(uuid.uuid4())
        filename = f"{file_uuid}.{file_extension}"
        
        print(f"Uploading {filename} to Audio_file bucket...")
        
        # Upload to storage bucket
        result = supabase.storage.from_("Audio_file").upload(
            path=filename,
            file=audio_data,
            file_options={"content-type": f"audio/{file_extension}"}
        )
        
        print(f"Upload result: {result}")
        
        # Get public URL
        public_url = supabase.storage.from_("Audio_file").get_public_url(filename)
        print(f"✅ Successfully uploaded: {filename}")
        print(f"Public URL: {public_url}")
        return public_url
            
    except Exception as e:
        print(f"❌ Error saving audio: {e}")
        return None


def save_audio_file_from_path(file_path: str, file_extension: str = "mp3") -> Optional[str]:
    """Save audio file from local path to Supabase storage."""
    try:
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            return None
            
        with open(file_path, "rb") as audio_file:
            audio_data = audio_file.read()
        
        return save_audio_file(audio_data, file_extension)
        
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return None


# Test it
if __name__ == "__main__":
    test_audio_path = "../data/recordings/058c17c7-f8b1-48bb-a9b0-7fdbe279d258.wav"
    
    public_url = save_audio_file_from_path(test_audio_path, "wav")
    
    if public_url:
        print(f"🎵 File URL: {public_url}")
    else:
        print("💀 Upload failed - check your bucket policies")