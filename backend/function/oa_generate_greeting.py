import os
import json
from typing import Dict, Any
import openai
from dotenv import load_dotenv

load_dotenv()

def generate_greeting_message(user_name: str, learning_language: str, session_content: list, level: str) -> str:
    """
    Generate a personalized greeting message for the learning session.
    
    Args:
        user_name (str): The user's name
        learning_language (str): The language being learned (e.g., "fr", "en", "es")
        session_content (list): List of questions/topics in the session
        level (str): The learning level (A1, A2, B1, B2, C1, C2)
        
    Returns:
        str: Personalized greeting message in the learning language
    """
    openai_api_key = os.getenv('OPENAI_API_KEY')
    if not openai_api_key:
        print("❌ OpenAI API key not configured for greeting generation")
        return f"Bonjour {user_name}! Je suis Madame AI, votre assistante Francoflex. Commençons cette session d'apprentissage!"
    
    client = openai.OpenAI(api_key=openai_api_key)
    
    
    
    # Extract topics from session content
    topics = []
    for item in session_content[:3]:  # Take first 3 topics
        if isinstance(item, dict) and 'learning' in item:
            # Extract key words from the learning sentence
            sentence = item['learning']
            # Simple word extraction (you can make this more sophisticated)
            words = sentence.split()[:5]  # Take first 5 words
            topics.append(' '.join(words))
    
    topics_text = ", ".join(topics) if topics else "various topics"
    
    prompt = f"""
    You are Madame AI, a friendly and encouraging French language learning assistant for Francoflex.
    Generate a personalized greeting message in {learning_language} for a language learning session.
    
    User details:
    - Name: {user_name}
    - Learning language: {learning_language}
    - Level: {level}
    - Session topics: {topics_text}
    
    The message should:
    1. Greet the user by name warmly
    2. Introduce yourself as "Madame AI, Francoflex assistant"
    3. Explain the activity goal (pronunciation practice)
    4. Mention the specific topics they'll work on today
    5. Be encouraging and supportive
    6. Be written entirely in {learning_lang_name}
    7. Be conversational and friendly
    8. Be approximately 2-3 sentences long
    
    Example structure:
    "Bonjour [Name]! Je suis Madame AI, votre assistante Francoflex. Aujourd'hui, nous allons nous concentrer sur la prononciation de [topics], en travaillant particulièrement sur [specific sounds]. Prêt(e) à commencer?"
    
    Generate the greeting message now in the learning language ({learning_language}):
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": f"You are Madame AI, a friendly French language learning assistant. Always respond in {learning_lang_name} only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        greeting_message = response.choices[0].message.content.strip()
        return greeting_message
        
    except Exception as e:
        print(f"❌ Error generating greeting message: {e}")
        # Fallback greeting
        return f"Bonjour {user_name}! Je suis Madame AI, votre assistante Francoflex. Commençons cette session d'apprentissage de la prononciation!"


# Test section
if __name__ == "__main__":
    # Test with dummy data
    test_user_name = "Matthieu"
    test_learning_language = "fr"
    test_session_content = [
        {"learning": "Bonjour, je suis nouveau dans l'apprentissage du français."},
        {"learning": "Comment allez-vous aujourd'hui?"},
        {"learning": "Je travaille dans une entreprise internationale."}
    ]
    test_level = "B1"
    
    print("Testing generate_greeting_message function...")
    
    try:
        greeting = generate_greeting_message(
            user_name=test_user_name,
            learning_language=test_learning_language,
            session_content=test_session_content,
            level=test_level
        )
        
        print(f"✅ Generated greeting: {greeting}")
        
    except Exception as e:
        print(f"❌ Error in main execution: {str(e)}")
