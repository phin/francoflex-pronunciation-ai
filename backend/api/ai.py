"""
AI answer generation module for Francoflex API.
"""

import os
from typing import Dict
from fastapi import HTTPException
import openai


def generate_ai_answer(question: str) -> Dict[str, str]:
    """Generate an AI answer to a French question."""
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    client = openai.OpenAI(api_key=api_key)
    
    prompt = f"""You are a French language learning assistant. Provide a helpful, professional answer to this French question in French. Keep it concise but informative.

Question: {question}

Answer in French:"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful French language learning assistant. Answer questions professionally in French."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        answer = response.choices[0].message.content.strip()
        return {"answer": answer}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI answer generation error: {str(e)}")
