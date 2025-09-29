"""
User preferences module for Francoflex API.
"""

from fastapi import HTTPException
from supabase.save_pref import save_preference


def save_user_pref(learning: str, native: str, industry: str, job: str, name: str, user_id: str):
    """Save or update user preferences in Supabase."""
    try:
        result = save_preference(
            learning=learning,
            native=native,
            industry=industry,
            job=job,
            name=name,
            user_id=user_id
        )
        
        if result:
            return {
                "success": True,
                "message": "User preferences saved successfully",
                "data": result
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save user preferences")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving preferences: {str(e)}")
