from typing import Dict, Any, Optional, List
import json

# Handle both relative and absolute imports
try:
    from .sb_client import get_supabase_client
except ImportError:
    from sb_client import get_supabase_client


def save_pronunciation_analysis(user_id: str, level: str, analysis_content: Dict[str, Any], analysis_type: str = "repeat") -> Optional[Dict[str, Any]]:
    """
    Save pronunciation analysis to the database.
    
    Args:
        user_id (str): The user's unique identifier
        level (str): The session level (A1, A2, B1, B2, C1, C2)
        analysis_content (Dict[str, Any]): The analysis JSON content
        analysis_type (str): The type of analysis (default: "repeat")
        
    Returns:
        Optional[Dict[str, Any]]: The inserted row data if successful, None if failed
        
    Raises:
        Exception: If the database operation fails
    """
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Prepare analysis data
        analysis_data = {
            "user": user_id,
            "type": analysis_type,
            "level": level,
            "content": analysis_content
        }
        
        # Insert new analysis record
        result = supabase.table('pronunciation_analysis').insert(analysis_data).execute()
        
        if result.data:
            print(f"Successfully saved pronunciation analysis for user {user_id}: {result.data[0]}")
            return result.data[0]
        else:
            print("No data returned from insert operation")
            return None
            
    except Exception as e:
        print(f"Error saving pronunciation analysis: {str(e)}")
        raise e


def get_pronunciation_analyses(user_id: Optional[str] = None, level: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Retrieve pronunciation analyses from the database.
    
    Args:
        user_id (Optional[str]): Filter analyses by user_id if provided
        level (Optional[str]): Filter analyses by level if provided
        
    Returns:
        List[Dict[str, Any]]: List of analysis records
    """
    try:
        supabase = get_supabase_client()
        
        query = supabase.table('pronunciation_analysis').select('*')
        
        if user_id:
            query = query.eq('user', user_id)
            
        if level:
            query = query.eq('level', level)
            
        # Order by creation date (newest first)
        query = query.order('created_at', desc=True)
        
        result = query.execute()
        return result.data
        
    except Exception as e:
        print(f"Error retrieving pronunciation analyses: {str(e)}")
        raise e


def get_latest_pronunciation_analysis(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get the latest pronunciation analysis for a user.
    
    Args:
        user_id (str): The user's unique identifier
        
    Returns:
        Optional[Dict[str, Any]]: The latest analysis record or None
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table('pronunciation_analysis').select('*').eq('user', user_id).order('created_at', desc=True).limit(1).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        else:
            return None
            
    except Exception as e:
        print(f"Error retrieving latest pronunciation analysis: {str(e)}")
        raise e


# Test section
if __name__ == "__main__":
    # Test with dummy data
    test_user_id = "e3ed6ca8-62db-4d7b-b943-2aa8d7d84c00"
    test_level = "B1"
    test_analysis = {
        "overall_score": 78,
        "cefr_score": {"A1": 85, "A2": 78, "B1": 65},
        "word_analysis": [
            {"word": "Bonjour", "quality_score": 85, "ai_feedback": "Excellent pronunciation!"},
            {"word": "je", "quality_score": 90, "ai_feedback": "Perfect!"},
            {"word": "suis", "quality_score": 80, "ai_feedback": "Good pronunciation."}
        ],
        "summary": "Great job! You did particularly well with the 'n' and 'ou' sounds.",
        "next_question_prompt": "Excellent work! Let's move on to the next question."
    }
    
    try:
        print("Testing save_pronunciation_analysis function...")
        
        # Test saving analysis
        saved_analysis = save_pronunciation_analysis(
            user_id=test_user_id,
            level=test_level,
            analysis_content=test_analysis
        )
        
        if saved_analysis:
            print(f"✅ Successfully saved analysis: {saved_analysis}")
        else:
            print("❌ Failed to save analysis")
        
        # Test retrieving analyses
        print("\nTesting get_pronunciation_analyses function...")
        analyses = get_pronunciation_analyses(test_user_id)
        print(f"Retrieved {len(analyses)} analyses for user {test_user_id}")
        
        # Test getting latest analysis
        print("\nTesting get_latest_pronunciation_analysis function...")
        latest_analysis = get_latest_pronunciation_analysis(test_user_id)
        if latest_analysis:
            print(f"Latest analysis: {latest_analysis}")
        else:
            print("No analyses found")
        
    except Exception as e:
        print(f"❌ Error in main execution: {str(e)}")
