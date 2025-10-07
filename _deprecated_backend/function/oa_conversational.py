import os
import json
from typing import Dict, Any, List
import openai
from dotenv import load_dotenv

load_dotenv()

def generate_conversational_response(
    user_message: str, 
    conversation_history: List[Dict[str, str]], 
    learning_language: str, 
    level: str,
    user_preferences: Dict[str, Any]
) -> Dict[str, str]:
    """
    Generate a conversational response using ChatGPT.
    
    Args:
        user_message (str): The user's transcribed message
        conversation_history (List[Dict[str, str]]): Previous conversation messages
        learning_language (str): The language being learned
        level (str): The learning level (A1, A2, B1, B2, C1, C2)
        user_preferences (Dict[str, Any]): User's preferences (industry, job, etc.)
        
    Returns:
        Dict[str, str]: Response with learning text, native translation, and context
    """
    openai_api_key = os.getenv('OPENAI_API_KEY')
    if not openai_api_key:
        print("❌ OpenAI API key not configured for conversational response")
        return {
            "learning": "Désolé, je ne peux pas répondre en ce moment.",
            "native": "Sorry, I can't respond right now.",
            "context": "system_error"
        }
    
    client = openai.OpenAI(api_key=openai_api_key)
    
    # Map language codes to full names
    language_map = {
        "fr": "French",
        "en": "English", 
        "es": "Spanish",
        "de": "German",
        "it": "Italian",
        "pt": "Portuguese",
        "nl": "Dutch",
        "pl": "Polish",
        "ru": "Russian",
        "ja": "Japanese",
        "ko": "Korean",
        "zh": "Chinese",
        "ar": "Arabic",
        "hi": "Hindi",
        "tr": "Turkish"
    }
    
    learning_lang_name = language_map.get(learning_language, learning_language)
    native_lang_name = language_map.get(user_preferences.get('native', 'en'), 'English')
    
    # Build conversation context
    conversation_context = ""
    for msg in conversation_history[-5:]:  # Last 5 messages for context
        role = "User" if msg.get('author') == 'user' else "Assistant"
        content = msg.get('content', '')
        conversation_context += f"{role}: {content}\n"
    
    prompt = f"""
    You are Madame AI, a friendly and encouraging French language learning assistant for Francoflex.
    You are having a natural conversation with a {level} level student learning {learning_lang_name}.
    
    Student Profile:
    - Learning Level: {level}
    - Learning Language: {learning_lang_name}
    - Native Language: {native_lang_name}
    - Industry: {user_preferences.get('industry', 'General')}
    - Job: {user_preferences.get('job', 'Professional')}
    
    Recent Conversation:
    {conversation_context}
    
    User's Latest Message: "{user_message}"
    
    Your task:
    1. Respond naturally in {learning_lang_name} at the {level} level
    2. Keep the conversation engaging and educational
    3. Use vocabulary and grammar appropriate for {level} level
    4. Incorporate topics related to their industry ({user_preferences.get('industry', 'General')}) when relevant
    5. Be encouraging and supportive
    6. Keep responses concise (1-2 sentences)
    
    Respond with a JSON object containing:
    {{
        "learning": "Your response in {learning_lang_name}",
        "native": "Translation in {native_lang_name}",
        "context": "conversational"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": f"You are Madame AI, a friendly French language learning assistant. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        ai_response_content = response.choices[0].message.content.strip()
        response_data = json.loads(ai_response_content)
        
        print(f"✅ Generated conversational response: {response_data.get('learning', '')}")
        return response_data
        
    except Exception as e:
        print(f"❌ Error generating conversational response: {e}")
        return {
            "learning": "Désolé, je ne peux pas répondre en ce moment. Pouvez-vous répéter?",
            "native": "Sorry, I can't respond right now. Can you repeat?",
            "context": "error"
        }


# Test section
if __name__ == "__main__":
    # Test with dummy data
    test_user_message = "Bonjour, comment allez-vous?"
    test_conversation_history = []
    test_learning_language = "fr"
    test_level = "B1"
    test_user_preferences = {
        "industry": "Technology",
        "job": "Software Developer",
        "native": "en"
    }
    
    print("Testing generate_conversational_response function...")
    
    try:
        result = generate_conversational_response(
            user_message=test_user_message,
            conversation_history=test_conversation_history,
            learning_language=test_learning_language,
            level=test_level,
            user_preferences=test_user_preferences
        )
        
        print(f"✅ Generated response: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
    except Exception as e:
        print(f"❌ Error in main execution: {str(e)}")
