from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid

# Handle both relative and absolute imports
try:
    from .sb_client import get_supabase_client
except ImportError:
    from sb_client import get_supabase_client

from sb_pref import get_preferences  # Use the new get_pref function
from oa_generate_question import generate_questions
from el_tts import text_to_audio


def create_session(user_id: str, level: str, mode: str = "repeat") -> List[Dict[str, str]]:
    """
    Create a new learning session by combining user preferences, generating questions, and creating audio.
    
    Args:
        user_id (str): The user's unique identifier
        level (str): The language learning level (A1, A2, B1, B2, C1, C2)
        mode (str): The session mode ("repeat" or "conversational")
        
    Returns:
        List[Dict[str, str]]: List of questions with learning text, native translation, and audio URL
    """
    try:
        print(f"🎯 Creating session for user {user_id} at level {level}")
        
        # Step 1: Get user preferences
        print("📋 Getting user preferences...")
        user_pref = get_preferences(user_id)[0] # Changed from get_pref to get_preferences
        
        if not user_pref:
            raise Exception(f"No preferences found for user {user_id}")
        
        print(f"✅ Found preferences: {user_pref}")
        
        if mode == "conversational":
            # For conversational mode, create a simple greeting message
            print("💬 Creating conversational session...")
            questions = [{
                "learning": f"Bonjour! Je suis Madame AI, votre assistante Francoflex. Comment puis-je vous aider aujourd'hui?",
                "native": f"Hello! I am Madame AI, your Francoflex assistant. How can I help you today?",
                "status": "not_done"
            }]
            print(f"✅ Created conversational greeting")
        else:
            # Step 2: Generate questions using preferences for repeat mode
            print(" Generating questions...")
            questions_data = generate_questions(
                industry=user_pref['industry'],
                job_title=user_pref['job'],
                language=user_pref['learning'],
                level=level,
                native=user_pref['native']
            )
            
            questions = questions_data.get('content', [])
            if not questions:
                raise Exception("No questions generated")
            
            print(f"✅ Generated {len(questions)} questions")
        
        # Step 3: Generate audio for each question
        print("🎵 Generating audio for questions...")
        session_questions = []
        
        for i, question in enumerate(questions):
            print(f"Processing question {i+1}/{len(questions)}")
            
            # Generate audio for the learning language sentence
            audio_url = text_to_audio(question['learning'])
            
            session_question = {
                "learning": question['learning'],
                "native": question['native'],
                "audio_url": audio_url,
                "status": "not_done"  # Add status field
            }
            session_questions.append(session_question)
            
            if audio_url:
                print(f"✅ Audio generated for question {i+1}")
            else:
                print(f"❌ Failed to generate audio for question {i+1}")
        
        # Step 4: Save session to database
        print("💾 Saving session to database...")
        supabase = get_supabase_client()
        
        # Generate a unique session ID
        session_id = str(uuid.uuid4())
        
        session_record = {
            "id": session_id,
            "user": user_id,
            "level": level,
            "type": mode,
            "content": session_questions,
            
        }
        
        result = supabase.table('sessions').insert(session_record).execute()
        
        if result.data:
            print(f"✅ Session saved to database: {session_id}")
        else:
            print("⚠️ Failed to save session to database, but continuing...")
        
        print(f"🎉 Session created successfully with {len(session_questions)} questions")
        return session_questions
        
    except Exception as e:
        print(f"❌ Error creating session: {str(e)}")
        raise e


def get_all_sessions(user_id: str) -> List[Dict[str, Any]]:
    """
    Get all sessions for a user with their complete content.
    
    Args:
        user_id (str): The user's unique identifier
        
    Returns:
        List[Dict[str, Any]]: List of all sessions with their content
    """
    try:
        print(f"📋 Getting all sessions for user {user_id}")
        
        supabase = get_supabase_client()
        
        # Get all sessions for the user, ordered by creation date (newest first)
        result = supabase.table('sessions').select('*').eq('user', user_id).order('created_at', desc=True).execute()
        
        if not result.data:
            print(f"ℹ️ No sessions found for user {user_id}")
            return []
        
        sessions = result.data
        print(f"✅ Found {len(sessions)} sessions for user {user_id}")
        
        # Return sessions with their content
        return sessions
        
    except Exception as e:
        print(f"❌ Error getting all sessions: {str(e)}")
        raise e


def update_question_status(session_id: str, question_index: int, status: str = "done") -> bool:
    """
    Update the status of a specific question in a session.
    
    Args:
        session_id (str): The session ID
        question_index (int): The index of the question to update (0-based)
        status (str): The new status ("done" or "not_done")
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        supabase = get_supabase_client()
        
        # Get the current session
        result = supabase.table('sessions').select('content').eq('id', session_id).execute()
        
        if not result.data:
            print(f"❌ Session {session_id} not found")
            return False
        
        session = result.data[0]
        content = session['content']
        
        # Check if question index is valid
        if question_index >= len(content) or question_index < 0:
            print(f"❌ Invalid question index: {question_index}")
            return False
        
        # Update the question status
        content[question_index]['status'] = status
        
        # Update the session in database
        update_result = supabase.table('sessions').update({
            'content': content
        }).eq('id', session_id).execute()
        
        if update_result.data:
            print(f"✅ Updated question {question_index} status to '{status}' in session {session_id}")
            return True
        else:
            print(f"❌ Failed to update question status")
            return False
            
    except Exception as e:
        print(f"❌ Error updating question status: {str(e)}")
        return False


def get_next_question(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get the next question that is not done in a session.
    
    Args:
        session_id (str): The session ID
        
    Returns:
        Optional[Dict[str, Any]]: The next question data with index, or None if all questions are done
    """
    try:
        supabase = get_supabase_client()
        
        # Get the current session
        result = supabase.table('sessions').select('content').eq('id', session_id).execute()
        
        if not result.data:
            print(f"❌ Session {session_id} not found")
            return None
        
        session = result.data[0]
        content = session['content']
        
        # Find the first question that is not done
        for i, question in enumerate(content):
            if question.get('status', 'not_done') == 'not_done':
                print(f"✅ Found next question at index {i}")
                return {
                    'index': i,
                    'question': question,
                    'total_questions': len(content),
                    'completed_questions': sum(1 for q in content if q.get('status') == 'done')
                }
        
        print("✅ All questions are completed")
        return None
        
    except Exception as e:
        print(f"❌ Error getting next question: {str(e)}")
        return None

# Test section
if __name__ == "__main__":
    # Test parameters
    test_user_id = "e3ed6ca8-62db-4d7b-b943-2aa8d7d84c00"
    test_level = "B1"
    
    print("🧪 Testing create_session function...")
    print(f"User ID: {test_user_id}")
    print(f"Level: {test_level}")
    print("-" * 50)
    
    try:
        # Test creating a session
        session_questions = create_session(test_user_id, test_level)
        
        print("✅ Session created successfully!")
        print(f"Total Questions: {len(session_questions)}")
        print("\nFirst few questions:")
        
        for i, question in enumerate(session_questions[:3]):
            print(f"{i+1}. {question['learning']}")
            print(f"   Translation: {question['native']}")
            print(f"   Audio URL: {question['audio_url']}")
            print()
        
        # Test getting all sessions
        print("\n" + "="*50)
        print("🧪 Testing get_all_sessions function...")
        
        all_sessions = get_all_sessions(test_user_id)
        
        print(f"✅ Found {len(all_sessions)} total sessions")
        
        for i, session in enumerate(all_sessions):
            print(f"\nSession {i+1}:")
            print(f"  ID: {session.get('id', 'N/A')}")
            print(f"  Level: {session.get('level', 'N/A')}")
            print(f"  Type: {session.get('type', 'N/A')}")
            print(f"  Created: {session.get('created_at', 'N/A')}")
            print(f"  Questions: {len(session.get('content', []))}")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")

