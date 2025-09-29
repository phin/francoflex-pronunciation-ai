import os
import requests
import uuid
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from fastapi import UploadFile, File, Form, HTTPException

# Load environment variables
load_dotenv()

# Import existing functions (these should be available from the utils module)
try:
    from utils.pronunciation_analyzer import analyze_pronunciation, generate_word_feedback, convert_speechace_to_custom_response
except ImportError:
    # Fallback if utils module is not available
    def analyze_pronunciation(audio_path, target_text):
        return None, "analyze_pronunciation function not available"
    
    def generate_word_feedback(word_data, overall_score):
        return "AI feedback not available"
    
    def convert_speechace_to_custom_response(speechace_response):
        """
        Convert SpeechAce API response to custom Francoflex response format.
        
        Args:
            speechace_response: Raw SpeechAce API response (dict or JSON string)
        
        Returns:
            dict: Custom response format with overall_score, word_analysis, and metadata
        """
        import json
        
        if isinstance(speechace_response, str):
            data = json.loads(speechace_response)
        else:
            data = speechace_response
        
        # Extract overall pronunciation score from the correct nested location
        overall_score = None
        if 'text_score' in data and 'speechace_score' in data['text_score']:
            speechace_data = data['text_score']['speechace_score']
            if 'pronunciation' in speechace_data:
                overall_score = round(speechace_data['pronunciation'])  # This is an int from 0-100
        elif 'speechace_score' in data and 'pronunciation' in data['speechace_score']:
            overall_score = round(data['speechace_score']['pronunciation'])
        elif 'text_score' in data and 'quality_score' in data['text_score']:
            overall_score = round(data['text_score']['quality_score'])
        
        # Extract CEFR score from the correct nested location
        cefr_score = {}
        if 'text_score' in data and 'cefr_score' in data['text_score']:
            cefr_data = data['text_score']['cefr_score']
            if 'pronunciation' in cefr_data:
                cefr_score['level'] = cefr_data['pronunciation']  # This is a string like "B1", "B2", etc.
        
        # Process word analysis
        word_analysis = []
        if 'text_score' in data and 'word_score_list' in data['text_score']:
            for word_data in data['text_score']['word_score_list']:
                word_info = {
                    'word': word_data['word'],
                    'quality_score': round(word_data['quality_score']),
                    'phones': {}
                }
                
                # Process phones for this word
                for phone in word_data['phone_score_list']:
                    phone_key = phone['phone']
                    word_info['phones'][phone_key] = {
                        'quality_score': round(phone['quality_score']),
                        'sound_most_like': phone.get('sound_most_like')
                    }
                
                word_analysis.append(word_info)
        
        # Create custom response format
        custom_response = {
            'overall_score': overall_score,
            'speechace_score': data.get('speechace_score', {}),
            'cefr_score': cefr_score,
            'word_analysis': word_analysis,
            'metadata': {
                'status': data.get('status', 'unknown'),
                'api_version': 'v9',
                'raw_api_response': data  # Include the complete raw API response
            }
        }
        
        return custom_response

def get_ai_feedback_for_words(word_analysis: list, overall_score: int, native_language: str = "en") -> list:
    """
    Get AI feedback for all words in a single ChatGPT request.
    
    Args:
        word_analysis: List of word analysis data
        overall_score: Overall pronunciation score
        native_language: User's native language for feedback (default: "en")
    
    Returns:
        List of words with AI feedback
    """
    try:
        import openai
        from dotenv import load_dotenv
        
        # Load environment variables
        load_dotenv()
        
        # Check if OpenAI API key is available
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            print("❌ OpenAI API key not configured")
            return []
        
        # Prepare word list for ChatGPT with phone-level data
        word_list = []
        for word_data in word_analysis:
            word_info = {
                "word": word_data.get('word', ''),
                "quality_score": word_data.get('quality_score', 0)
            }
            
            # Add phone-level data if available
            if 'phone_analysis' in word_data and word_data['phone_analysis']:
                phone_issues = []
                for phone in word_data['phone_analysis']:
                    phone_score = phone.get('quality_score', 0)
                    phone_symbol = phone.get('phone', '')
                    if phone_score < 70:  # Highlight problematic phones
                        phone_issues.append({
                            "phone": phone_symbol,
                            "score": phone_score,
                            "issue": "needs improvement"
                        })
                
                if phone_issues:
                    word_info["problematic_phones"] = phone_issues
            
            word_list.append(word_info)
        
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
        
        # Create prompt for ChatGPT
        prompt = f"""
You are a French pronunciation expert. Analyze the following words and their pronunciation quality scores (0-100) and provide actionable feedback for each word.

Overall pronunciation score: {overall_score}/100

Word analysis with phone-level data:
{json.dumps(word_list, indent=2, ensure_ascii=False)}

For each word, provide:
1. A brief assessment of the pronunciation quality
2. If the word has "problematic_phones", focus on those specific sounds that need improvement
3. Give specific, actionable advice on how to improve pronunciation
4. If the score is good (80+), provide encouragement and reinforcement

IMPORTANT: When a word has "problematic_phones", focus your feedback on those specific sounds. For example:
- If "problematic_phones" shows "n" with low score, suggest: "Focus on the 'n' sound - place your tongue against the roof of your mouth"
- If "problematic_phones" shows "ou" with low score, suggest: "Work on the 'ou' sound - round your lips more"

Return ONLY a valid JSON array with this exact structure:
[
  {{
    "word": "word_here",
    "quality_score": score_here,
    "ai_feedback": "Your actionable feedback here in {native_lang_name}"
  }}
]

Make sure the feedback is:
- In {native_lang_name}
- Actionable and specific (tell them HOW to improve)
- Focus on problematic phones when available
- Constructive and encouraging
- Brief but helpful (1-2 sentences max)
"""
        
        print("🤖 Sending word analysis to ChatGPT for AI feedback...")
        
        # Make ChatGPT request
        client = openai.OpenAI(api_key=openai_api_key)
        
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a French pronunciation expert specializing in actionable feedback. Focus on specific sounds (phones) that need improvement and provide clear instructions on how to fix them. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            # Parse ChatGPT response
            if response.choices and len(response.choices) > 0:
                ai_response = response.choices[0].message.content.strip()
                print("✅ ChatGPT response received")
                
                # Parse JSON response
                try:
                    ai_feedback_data = json.loads(ai_response)
                    print(f"📝 AI feedback generated for {len(ai_feedback_data)} words")
                    return ai_feedback_data
                except json.JSONDecodeError as e:
                    print(f"❌ Error parsing ChatGPT JSON response: {e}")
                    print(f"Raw response: {ai_response}")
                    return []
            else:
                print("❌ No response choices received from ChatGPT")
                return []
                
        except Exception as e:
            print(f"❌ Error making ChatGPT request: {str(e)}")
            return []
            
    except Exception as e:
        print(f"❌ Error getting AI feedback: {str(e)}")
        return []

def create_simplified_analysis(analysis_result: Dict[str, Any], native_language: str = "en") -> Dict[str, Any]:
    """
    Create a simplified analysis with only essential data and AI feedback.
    
    Args:
        analysis_result: Full analysis result from convert_speechace_to_custom_response
        native_language: User's native language for feedback (default: "en")
    
    Returns:
        Simplified analysis with overall_score, cefr_score, and word list with AI feedback
    """
    try:
        print("🔄 Creating simplified analysis with AI feedback...")
        
        # Extract basic data
        overall_score = analysis_result.get('overall_score', 0)
        cefr_score = analysis_result.get('cefr_score', {})
        word_analysis = analysis_result.get('word_analysis', [])
        
        # Get AI feedback for all words - wait for completion
        print("⏳ Waiting for AI feedback generation...")
        ai_feedback_data = get_ai_feedback_for_words(word_analysis, overall_score, native_language)
        
        # Check if AI feedback was successfully generated
        if not ai_feedback_data:
            print("⚠️ AI feedback generation failed, using fallback feedback")
        
        # Create simplified word list
        simplified_words = []
        for word_data in word_analysis:
            word = word_data.get('word', '')
            quality_score = word_data.get('quality_score', 0)
            
            # Find corresponding AI feedback
            ai_feedback = "Feedback non disponible"
            if ai_feedback_data:
                for ai_word in ai_feedback_data:
                    if ai_word.get('word') == word:
                        ai_feedback = ai_word.get('ai_feedback', 'Feedback non disponible')
                        break
            
            # If still no feedback found, provide basic feedback based on score
            if ai_feedback == "Feedback non disponible":
                if quality_score >= 80:
                    ai_feedback = "Excellent pronunciation! Keep up the good work."
                elif quality_score >= 60:
                    ai_feedback = "Good pronunciation. Try to focus on clarity."
                else:
                    ai_feedback = "Practice more to improve your pronunciation."
            
            simplified_words.append({
                "word": word,
                "quality_score": quality_score,
                "ai_feedback": ai_feedback
            })
        
        # Create simplified response
        simplified_result = {
            "overall_score": overall_score,
            "cefr_score": cefr_score,
            "word_analysis": simplified_words
        }
        
        print("✅ Simplified analysis created successfully")
        return simplified_result
        
    except Exception as e:
        print(f"❌ Error creating simplified analysis: {str(e)}")
        return {
            "overall_score": 0,
            "cefr_score": {},
            "word_analysis": [],
            "error": str(e)
        }

def analyze_pronunciation_from_url(audio_url: str, target_text: str, analysis_language: str = "fr-fr", native_language: str = "en") -> Optional[Dict[str, Any]]:
    """
    Analyze pronunciation using SpeechAce API with audio from URL.
    
    Args:
        audio_url (str): URL of the audio file to analyze
        target_text (str): The text that should be pronounced
        analysis_language (str): Language/dialect for analysis (default: "fr-fr")
        native_language (str): User's native language for AI feedback (default: "en")
    
    Returns:
        Dict containing pronunciation analysis results, or None if error
    """
    try:
        import openai
        from dotenv import load_dotenv
        
        # Load environment variables
        load_dotenv()
        
        # Check if API key is available
        api_key = os.getenv('SPEECHACE_API_KEY')
        if not api_key:
            print("❌ SpeechAce API key not configured")
            return None
        
        print(f"🎯 Analyzing pronunciation for: '{target_text}'")
        print(f"🔗 Audio URL: {audio_url}")
        print(f"🌍 Analysis language: {analysis_language}")
        
        # Download audio file from URL
        print("📥 Downloading audio file...")
        audio_response = requests.get(audio_url, timeout=30)
        audio_response.raise_for_status()
        
        # Prepare SpeechAce API request
        api_url = f"https://api.speechace.co/api/scoring/text/v9/json?key={api_key}&dialect={analysis_language}"
        
        data = {
            'text': target_text
        }
        
        files = {
            'user_audio_file': ('audio.wav', audio_response.content, 'audio/wav')
        }
        
        print("🚀 Sending request to SpeechAce API...")
        api_response = requests.post(api_url, data=data, files=files, timeout=60)
        api_response.raise_for_status()
        
        result = api_response.json()
        print(f"✅ SpeechAce API response received")
        
        # Check if API request was successful
        if not result or result.get("status") != "success":
            print(f"❌ SpeechAce API returned error: {result}")
            return None
        
        # Parse and format the response using existing function
        analysis_result = convert_speechace_to_custom_response(result)
        print(f"📊 Analysis completed successfully")
        
        return analysis_result
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {str(e)}")
        return None
    except Exception as e:
        print(f"❌ Analysis error: {str(e)}")
        return None


def analyze_pronunciation_endpoint(
    audio_file: UploadFile = File(...),
    target_text: str = Form(...)
):
    """Analyze pronunciation of uploaded audio against target text."""
    
    # Check if API key is available
    api_key = os.getenv('SPEECHACE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="SpeechAce API key not configured")
    
    # Save uploaded audio file
    file_id = str(uuid.uuid4())
    audio_path = UPLOAD_DIR / f"{file_id}.wav"
    
    try:
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
        
        # Analyze pronunciation
        custom_response, error_message = analyze_pronunciation(str(audio_path), target_text)
        
        if error_message:
            raise HTTPException(status_code=500, detail=error_message)
        
        if not custom_response:
            raise HTTPException(status_code=500, detail="Failed to analyze pronunciation")
        
        # Generate AI feedback for each word
        overall_score = custom_response.get('overall_score', 0)
        for word_data in custom_response.get('word_analysis', []):
            ai_feedback = generate_word_feedback(word_data, overall_score)
            word_data['ai_feedback'] = ai_feedback
        
        return custom_response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")
    finally:
        # Clean up uploaded file
        if audio_path.exists():
            audio_path.unlink()

# Test section
if __name__ == "__main__":
    # Test the new function
    test_audio_url = "https://xwcuvekkgfxpjxemhwcp.supabase.co/storage/v1/object/public/Audio_file/025b6a0c-5b54-4b9a-bae2-f71f1603bc25.mp3"  # Replace with actual audio URL
    test_text = "Nous devons mettre à jour notre logiciel de gestion e la relation client CRM pour améliorer le suivi des ventes"
    test_language = "fr-fr"
    test_native_language = "en"  # Change this to test different languages
    
    print("🧪 Testing analyze_pronunciation_from_url function...")
    print(f"Audio URL: {test_audio_url}")
    print(f"Target text: {test_text}")
    print(f"Analysis language: {test_language}")
    print(f"Native language: {test_native_language}")
    print("-" * 50)
    
    try:
        result = analyze_pronunciation_from_url(test_audio_url, test_text, test_language, test_native_language)
        
        if result:
            print("✅ Analysis completed successfully!")
            print(f"Overall score: {result.get('overall_score', 'N/A')}")
            print(f"Word analysis count: {len(result.get('word_analysis', []))}")
            print(f"Status: {result.get('status', 'N/A')}")
            
            # Create simplified analysis with AI feedback
            simplified_result = create_simplified_analysis(result, test_native_language)
            
            if simplified_result.get('word_analysis'):
                print("\nFirst few words with AI feedback:")
                for i, word in enumerate(simplified_result['word_analysis'][:3]):
                    print(f"  {i+1}. {word.get('word', 'N/A')} - Score: {word.get('quality_score', 'N/A')}")
                    print(f"     AI Feedback: {word.get('ai_feedback', 'N/A')}")
            
            # Print simplified response
            print("\n" + "="*60)
            print("🔄 SIMPLIFIED ANALYSIS WITH AI FEEDBACK:")
            print("="*60)
            import json
            print(json.dumps(simplified_result, indent=2, ensure_ascii=False))
            print("="*60)
            
            # Save simplified response to JSON file
            import datetime
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"simplified_analysis_{timestamp}.json"
            
            try:
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(simplified_result, f, indent=2, ensure_ascii=False)
                print(f"💾 Simplified analysis saved to: {filename}")
            except Exception as e:
                print(f"❌ Error saving file: {str(e)}")
        else:
            print("❌ Analysis failed - no result returned")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
