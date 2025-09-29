from typing import Dict, Any, Optional

# Handle both relative and absolute imports
try:
    from .sb_client import get_supabase_client
except ImportError:
    from sb_client import get_supabase_client

def save_preference(learning: str, native: str, industry: str, job: str, name: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Add a new row to the preferences table in Supabase, or update if user already exists.
    
    Args:
        learning (str): The learning language preference
        native (str): The native language preference
        industry (str): The industry preference
        job (str): The job preference
        name (str): The user's name
        user_id (str): The user's unique identifier
        
    Returns:
        Optional[Dict[str, Any]]: The inserted/updated row data if successful, None if failed
        
    Raises:
        Exception: If the database operation fails
    """
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Prepare preference data
        preference_data = {
            "learning": learning,
            "native": native,
            "industry": industry,
            "job": job,
            "name": name,
            "user": user_id
        }
        
        # Check if user already exists
        existing_user = supabase.table('preferences').select('*').eq('user', user_id).execute()
        
        if existing_user.data:
            # User exists, update the row
            result = supabase.table('preferences').update(preference_data).eq('user', user_id).execute()
            if result.data:
                print(f"Successfully updated preference for user {user_id}: {result.data[0]}")
                return result.data[0]
            else:
                print("No data returned from update operation")
                return None
        else:
            # User doesn't exist, create new row
            result = supabase.table('preferences').insert(preference_data).execute()
            if result.data:
                print(f"Successfully created new preference for user {user_id}: {result.data[0]}")
                return result.data[0]
            else:
                print("No data returned from insert operation")
                return None
            
    except Exception as e:
        print(f"Error saving preference: {str(e)}")
        raise e

def get_preferences(user_id: Optional[str] = None) -> list:
    """
    Retrieve preferences from the preferences table.
    
    Args:
        user_id (Optional[str]): Filter preferences by user_id if provided
        
    Returns:
        list: List of preference records
    """
    try:
        supabase = get_supabase_client()
        
        query = supabase.table('preferences').select('*')
        
        if user_id:
            query = query.eq('user', user_id)
            
        result = query.execute()
        return result.data
        
    except Exception as e:
        print(f"Error retrieving preferences: {str(e)}")
        raise e



# Example usage
if __name__ == "__main__":
    # Test with dummy user data
    test_user_id = "e3ed6ca8-62db-4d7b-b943-2aa8d7d84c00"
    
    try:
        print("Testing save_preference function...")
        
        # Test saving preferences for the dummy user
        saved_preference = save_preference(
            learning="French",
            native="English", 
            industry="Technology",
            job="Sales",
            name="Test User",
            user_id=test_user_id
        )
        
        if saved_preference:
            print(f"✅ Successfully saved/updated preference: {saved_preference}")
        else:
            print("❌ Failed to save preference")
        
        # Test retrieving preferences for the dummy user
        print("\nTesting get_preferences function...")
        preferences = get_preferences(test_user_id)
        print(f"Retrieved preferences: {preferences}")
        
    except Exception as e:
        print(f"❌ Error in main execution: {str(e)}")

