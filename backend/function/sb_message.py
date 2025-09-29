from typing import Dict, Any, Optional, List
import json

# Handle both relative and absolute imports
try:
    from .sb_client import get_supabase_client
except ImportError:
    from sb_client import get_supabase_client



def save_message(author: str, session_id: str, content: str, audio_url: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Add a new row to the messages table in Supabase.
    
    Args:
        author (str): Either "system" or "user"
        session_id (str): The ID of the session this message belongs to
        content (str): The text content of the message
        audio_url (Optional[str]): URL of the audio file if available
        
    Returns:
        Optional[Dict[str, Any]]: The inserted row data if successful, None if failed
        
    Raises:
        Exception: If the database operation fails
    """
    try:
        # Validate author parameter
        if author not in ["system", "user"]:
            raise ValueError("Author must be either 'system' or 'user'")
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Prepare metadata
        metadata = {}
        if audio_url:
            metadata["audio_url"] = audio_url
        
        # Prepare message data
        message_data = {
            "author": author,
            "session": session_id,
            "content": content,
            "metadata": metadata
        }
        
        # Insert new message
        result = supabase.table('messages').insert(message_data).execute()
        
        if result.data:
            print(f"Successfully saved message for session {session_id}: {result.data[0]}")
            return result.data[0]
        else:
            print("No data returned from insert operation")
            return None
            
    except Exception as e:
        print(f"Error saving message: {str(e)}")
        raise e


def get_all_messages_from_session(session_id: str) -> List[Dict[str, Any]]:
    """
    Retrieve all messages from a specific session, ordered by creation time.
    
    Args:
        session_id (str): The ID of the session to get messages from
        
    Returns:
        List[Dict[str, Any]]: List of message records ordered by creation time
        
    Raises:
        Exception: If the database operation fails
    """
    try:
        supabase = get_supabase_client()
        
        # Query messages for the specific session, ordered by creation time
        result = supabase.table('messages').select('*').eq('session', session_id).order('created_at', desc=False).execute()
        
        print(f"Retrieved {len(result.data)} messages for session {session_id}")
        return result.data
        
    except Exception as e:
        print(f"Error retrieving messages: {str(e)}")
        raise e


# Example usage
if __name__ == "__main__":
    # Test with dummy user data
    test_user_id = "e3ed6ca8-62db-4d7b-b943-2aa8d7d84c00"
    test_session_id = "8de6cd8d-5965-4da0-b437-5d653dd3324c"
    
    try:
        print("Testing save_preference function...")
        
        
        # Test saving a system message with audio
        system_message = save_message(
            author="system",
            session_id=test_session_id,
            content="Bonjour! Comment allez-vous aujourd'hui?",
            audio_url="https://example.com/audio1.mp3"
        )
        
        if system_message:
            print(f"✅ Successfully saved system message: {system_message}")
        else:
            print("❌ Failed to save system message")
        
        # Test saving a user message without audio
        user_message = save_message(
            author="user",
            session_id=test_session_id,
            content="Je vais bien, merci!",
            audio_url=None
        )
        
        if user_message:
            print(f"✅ Successfully saved user message: {user_message}")
        else:
            print("❌ Failed to save user message")
        
        # Test retrieving all messages from session
        print("\nTesting get_all_messages_from_session function...")
        messages = get_all_messages_from_session(test_session_id)
        print(f"Retrieved {len(messages)} messages:")
        for i, msg in enumerate(messages, 1):
            print(f"  {i}. {msg['author']}: {msg['content']}")
            if msg['metadata'] and 'audio_url' in msg['metadata']:
                print(f"     Audio: {msg['metadata']['audio_url']}")
        
    except Exception as e:
        print(f"❌ Error in main execution: {str(e)}")

