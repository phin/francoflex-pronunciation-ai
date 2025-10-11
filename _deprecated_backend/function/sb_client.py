import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """
    Create and return a Supabase client instance.
    
    Returns:
        Client: Supabase client instance
        
    Raises:
        ValueError: If required environment variables are missing
    """
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not supabase_url or not supabase_key:
        raise ValueError(
            "Missing required environment variables. Please set SUPABASE_URL and SUPABASE_KEY in your .env file."
        )
    
    return create_client(supabase_url, supabase_key)
