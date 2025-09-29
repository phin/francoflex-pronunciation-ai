import os
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def generate_pronunciation_summary(analysis_result: Dict[str, Any], native_language: str = "en") -> Dict[str, Any]:
    """
    Generate a supportive pronunciation summary and next question prompt.
    
    Args:
        analysis_result: The pronunciation analysis result from SpeechAce
        native_language: User's native language for feedback (default: "en")
    
    Returns:
        Dict containing summary feedback and next question prompt
    """
    try:
        import openai
        
        # Check if OpenAI API key is available
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            print("❌ OpenAI API key not configured")
            return {
                "summary": "Great job! Let's continue with the next question.",
                "next_question_prompt": "Please provide the next question for the user to practice."
            }
        
        # Map language codes to full names for better prompting
        language_map = {
            "en": "English",
            "fr": "French", 
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
        
        native_lang_name = language_map.get(native_language, native_language)
        
        # Extract key information from analysis
        overall_score = analysis_result.get('overall_score', 0)
        word_analysis = analysis_result.get('word_analysis', [])
        
        # Count words with good scores (80+)
        good_words = [word for word in word_analysis if word.get('quality_score', 0) >= 80]
        improvement_words = [word for word in word_analysis if word.get('quality_score', 0) < 80]
        
        # Create prompt for ChatGPT
        prompt = f"""
You are a supportive French pronunciation coach. Based on the pronunciation analysis, provide encouraging feedback and prepare for the next question.

Analysis Results:
- Overall Score: {overall_score}/100
- Words with good pronunciation (80+): {len(good_words)}/{len(word_analysis)}
- Words needing improvement: {len(improvement_words)}

Word Analysis:
{json.dumps(word_analysis[:5], indent=2, ensure_ascii=False)}  # Show first 5 words

Please provide:

1. A supportive summary (2-3 sentences) in {native_lang_name} that:
   - Acknowledges their effort
   - Highlights what they did well
   - Gives gentle encouragement for improvement
   - Is positive and motivating

2. A transition message to the next question in {native_lang_name} that:
   - Congratulates them on completing this question
   - Indicates we're moving to the next practice question
   - Maintains enthusiasm

Return ONLY a valid JSON object with this exact structure:
{{
  "summary": "Your supportive summary here in {native_lang_name}",
  "next_question_prompt": "Your transition message here in {native_lang_name}"
}}

Make sure both messages are:
- In {native_lang_name}
- Supportive and encouraging
- Brief but meaningful
- Professional but warm
"""
        
        print("🤖 Generating pronunciation summary...")
        
        # Make ChatGPT request
        client = openai.OpenAI(api_key=openai_api_key)
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a supportive French pronunciation coach. Always respond with valid JSON only. Be encouraging and positive."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        # Parse ChatGPT response
        if response.choices and len(response.choices) > 0:
            ai_response = response.choices[0].message.content.strip()
            print("✅ ChatGPT response received")
            
            # Parse JSON response
            try:
                summary_data = json.loads(ai_response)
                print("📝 Pronunciation summary generated successfully")
                return summary_data
            except json.JSONDecodeError as e:
                print(f"❌ Error parsing ChatGPT JSON response: {e}")
                print(f"Raw response: {ai_response}")
                return {
                    "summary": "Great job! Let's continue with the next question.",
                    "next_question_prompt": "Please provide the next question for the user to practice."
                }
        else:
            print("❌ No response choices received from ChatGPT")
            return {
                "summary": "Great job! Let's continue with the next question.",
                "next_question_prompt": "Please provide the next question for the user to practice."
            }
            
    except Exception as e:
        print(f"❌ Error generating pronunciation summary: {str(e)}")
        return {
            "summary": "Great job! Let's continue with the next question.",
            "next_question_prompt": "Please provide the next question for the user to practice."
        }


# Test section
if __name__ == "__main__":
    # Test with sample analysis data
    test_analysis = {
        "overall_score": 78,
        "word_analysis": [
            {"word": "Bonjour", "quality_score": 85, "ai_feedback": "Excellent pronunciation!"},
            {"word": "je", "quality_score": 90, "ai_feedback": "Perfect!"},
            {"word": "suis", "quality_score": 80, "ai_feedback": "Good pronunciation."},
            {"word": "nouveau", "quality_score": 75, "ai_feedback": "Needs improvement."},
            {"word": "dans", "quality_score": 88, "ai_feedback": "Very good!"}
        ]
    }
    
    test_native_language = "en"
    
    print("🧪 Testing generate_pronunciation_summary function...")
    print(f"Analysis score: {test_analysis['overall_score']}")
    print(f"Native language: {test_native_language}")
    print("-" * 50)
    
    try:
        result = generate_pronunciation_summary(test_analysis, test_native_language)
        
        print("✅ Summary generated successfully!")
        print(f"Summary: {result.get('summary', 'N/A')}")
        print(f"Next question prompt: {result.get('next_question_prompt', 'N/A')}")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
