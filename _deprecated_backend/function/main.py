from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os



# Import required functions
try:
    from sb_pref import save_preference, get_preferences
    from sb_session import create_session, get_all_sessions, update_question_status, get_next_question
    from sb_add_audio import save_audio_file
    from sb_message import save_message, get_all_messages_from_session
    from sa_analysis import analyze_pronunciation_from_url, create_simplified_analysis
    from oa_generate_pronunciation_summary import generate_pronunciation_summary
    from sb_pronunciation import save_pronunciation_analysis, get_pronunciation_analyses, get_latest_pronunciation_analysis
    from oa_generate_greeting import generate_greeting_message
    from el_stt import speech_to_text
    from oa_conversational import generate_conversational_response
except ImportError as e:
    print(f"❌ Import error: {e}")
    exit(1)

# Create FastAPI app
app = FastAPI(
    title="FrancoFlex API",
    description="Language Learning API with pronunciation and session management",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class UserPreferenceRequest(BaseModel):
    learning: str
    native: str
    industry: str
    job: str
    name: str
    user_id: str

class CreateSessionRequest(BaseModel):
    user_id: str
    level: str
    mode: str = "repeat"

class SessionResponse(BaseModel):
    questions: List[Dict[str, str]]

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "FrancoFlex API is running!"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "API is operational"
    }

# Save user preferences endpoint
@app.post("/api/save_preferences")
async def save_user_preferences(request: UserPreferenceRequest):
    """
    Save or update user preferences.
    """
    try:
        result = save_preference(
            learning=request.learning,
            native=request.native,
            industry=request.industry,
            job=request.job,
            name=request.name,
            user_id=request.user_id
        )
        
        if result:
            return {
                "success": True,
                "message": "Preferences saved successfully",
                "data": result
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save preferences")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving preferences: {str(e)}")

# Create session endpoint
@app.post("/api/create_session", response_model=SessionResponse)
async def create_learning_session(request: CreateSessionRequest):
    """
    Create a new learning session with questions and audio.
    """
    try:
        # Validate level
        valid_levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
        if request.level not in valid_levels:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid level. Must be one of: {valid_levels}"
            )
        
        # Check if user has preferences
        preferences = get_preferences(request.user_id)
        if not preferences:
            raise HTTPException(
                status_code=404,
                detail=f"No preferences found for user {request.user_id}. Please save preferences first."
            )
        
        # Create session
        questions = create_session(request.user_id, request.level, request.mode)
        
        return SessionResponse(questions=questions)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

# Get user preferences endpoint
@app.get("/api/preferences/{user_id}")
async def get_user_preferences(user_id: str):
    """
    Get user preferences by user_id.
    """
    try:
        preferences = get_preferences(user_id)
        
        if not preferences:
            raise HTTPException(
                status_code=404,
                detail=f"No preferences found for user {user_id}"
            )
        
        return {
            "success": True,
            "data": preferences[0]  # Return first (and should be only) preference
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving preferences: {str(e)}")

# Get session endpoint
@app.get("/api/session/{user_id}")
async def get_user_session(user_id: str):
    """
    Get the most recent session for a user.
    """
    try:
        sessions = get_session(user_id)
        
        if not sessions:
            raise HTTPException(
                status_code=404,
                detail=f"No sessions found for user {user_id}"
            )
        
        # Return the most recent session (first in the list)
        latest_session = sessions[0]
        
        return {
            "success": True,
            "data": latest_session
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving session: {str(e)}")

# Get all sessions endpoint
@app.get("/api/sessions/{user_id}")
async def get_user_all_sessions(user_id: str):
    """
    Get all sessions for a user.
    """
    try:
        sessions = get_all_sessions(user_id)
        
        return {
            "success": True,
            "data": sessions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving sessions: {str(e)}")

# Get specific session by ID endpoint
@app.get("/api/session/{user_id}/{session_id}")
async def get_specific_session(user_id: str, session_id: str):
    """
    Get a specific session by ID for a user.
    """
    try:
        sessions = get_all_sessions(user_id)
        
        # Find the specific session
        session = next((s for s in sessions if s['id'] == session_id), None)
        
        if not session:
            raise HTTPException(
                status_code=404,
                detail=f"Session {session_id} not found for user {user_id}"
            )
        
        return {
            "success": True,
            "data": session
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving session: {str(e)}")

# Upload audio endpoint
@app.post("/api/upload_audio")
async def upload_audio(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    session_id: Optional[str] = Form(None)
):
    """
    Upload audio file to Supabase storage.
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an audio file"
            )
        
        # Read file content
        audio_data = await file.read()
        
        # Determine file extension from content type or filename
        if file.content_type:
            if 'wav' in file.content_type:
                file_extension = 'wav'
            elif 'mp3' in file.content_type:
                file_extension = 'mp3'
            elif 'mpeg' in file.content_type:
                file_extension = 'mp3'
            else:
                # Fallback to filename extension
                file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'mp3'
        else:
            file_extension = 'mp3'
        
        print(f"Uploading audio file: {file.filename} ({file.content_type})")
        print(f"File size: {len(audio_data)} bytes")
        print(f"User ID: {user_id}")
        print(f"Session ID: {session_id}")
        
        # Save to Supabase storage
        public_url = save_audio_file(audio_data, file_extension)
        
        if not public_url:
            raise HTTPException(
                status_code=500,
                detail="Failed to upload audio file to storage"
            )
        
        return {
            "success": True,
            "message": "Audio uploaded successfully",
            "data": {
                "audio_url": public_url,
                "filename": file.filename,
                "file_size": len(audio_data),
                "content_type": file.content_type,
                "user_id": user_id,
                "session_id": session_id
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading audio: {str(e)}")


# Message Management Endpoints

class MessageRequest(BaseModel):
    author: str
    session_id: str
    content: str
    audio_url: Optional[str] = None

class PronunciationAnalysisRequest(BaseModel):
    audio_url: str
    target_text: str
    session_id: str
    analysis_language: str = "fr-fr"
    native_language: str = "en"

class SavePronunciationAnalysisRequest(BaseModel):
    user_id: str
    level: str
    analysis_content: Dict[str, Any]
    analysis_type: str = "repeat"

class GenerateGreetingRequest(BaseModel):
    user_name: str
    learning_language: str
    session_content: list
    level: str

class SpeechToTextRequest(BaseModel):
    audio_url: str
    language: str = "fr"

class ConversationalRequest(BaseModel):
    user_message: str
    session_id: str
    learning_language: str
    level: str
    user_id: str

@app.post("/api/save_message")
async def save_message_endpoint(message: MessageRequest):
    """
    Save a new message to the database.
    """
    try:
        # Validate author parameter
        if message.author not in ["system", "user"]:
            raise HTTPException(
                status_code=400,
                detail="Author must be either 'system' or 'user'"
            )
        
        result = save_message(
            author=message.author,
            session_id=message.session_id,
            content=message.content,
            audio_url=message.audio_url
        )
        
        if result:
            return {
                "success": True,
                "message": "Message saved successfully",
                "data": result
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to save message"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving message: {str(e)}")


@app.get("/api/messages/{session_id}")
async def get_messages_from_session(session_id: str):
    """
    Get all messages from a specific session.
    """
    try:
        messages = get_all_messages_from_session(session_id)
        
        return {
            "success": True,
            "data": messages,
            "count": len(messages)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving messages: {str(e)}")


@app.post("/api/analyze_pronunciation")
async def analyze_pronunciation_endpoint(request: PronunciationAnalysisRequest):
    """
    Analyze pronunciation and generate summary with next question prompt.
    """
    try:
        print(f"🎯 Analyzing pronunciation for session: {request.session_id}")
        print(f"Audio URL: {request.audio_url}")
        print(f"Target text: {request.target_text}")
        
        # Perform pronunciation analysis
        analysis_result = analyze_pronunciation_from_url(
            audio_url=request.audio_url,
            target_text=request.target_text,
            analysis_language=request.analysis_language,
            native_language=request.native_language
        )
        
        if not analysis_result:
            raise HTTPException(
                status_code=500,
                detail="Failed to analyze pronunciation"
            )
        
        # Create simplified analysis with AI feedback
        simplified_analysis = create_simplified_analysis(analysis_result, request.native_language)
        
        # Generate pronunciation summary and next question prompt
        summary_data = generate_pronunciation_summary(simplified_analysis, request.native_language)
        
        return {
            "success": True,
            "message": "Pronunciation analysis completed",
            "data": {
                "analysis": simplified_analysis,
                "summary": summary_data.get("summary", "Great job! Let's continue with the next question."),
                "next_question_prompt": summary_data.get("next_question_prompt", "Please provide the next question for the user to practice.")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing pronunciation: {str(e)}")


@app.post("/api/update_question_status")
async def update_question_status_endpoint(request: dict):
    """
    Update the status of a question in a session.
    """
    try:
        session_id = request.get('session_id')
        question_index = request.get('question_index')
        status = request.get('status', 'done')
        
        if not session_id or question_index is None:
            raise HTTPException(
                status_code=400,
                detail="session_id and question_index are required"
            )
        
        success = update_question_status(session_id, question_index, status)
        
        if success:
            return {
                "success": True,
                "message": f"Question {question_index} status updated to '{status}'"
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to update question status"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating question status: {str(e)}")


@app.get("/api/next_question/{session_id}")
async def get_next_question_endpoint(session_id: str):
    """
    Get the next question that is not done in a session.
    """
    try:
        next_question_data = get_next_question(session_id)
        
        if next_question_data:
            return {
                "success": True,
                "data": next_question_data
            }
        else:
            return {
                "success": True,
                "data": None,
                "message": "All questions are completed"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting next question: {str(e)}")


@app.post("/api/save_pronunciation_analysis")
async def save_pronunciation_analysis_endpoint(request: SavePronunciationAnalysisRequest):
    """
    Save pronunciation analysis to the database.
    """
    try:
        result = save_pronunciation_analysis(
            user_id=request.user_id,
            level=request.level,
            analysis_content=request.analysis_content,
            analysis_type=request.analysis_type
        )
        
        if result:
            return {
                "success": True,
                "message": "Pronunciation analysis saved successfully",
                "data": result
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to save pronunciation analysis"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving pronunciation analysis: {str(e)}")


@app.get("/api/pronunciation_analyses/{user_id}")
async def get_pronunciation_analyses_endpoint(user_id: str, level: Optional[str] = None):
    """
    Get pronunciation analyses for a user.
    """
    try:
        analyses = get_pronunciation_analyses(user_id=user_id, level=level)
        
        return {
            "success": True,
            "data": analyses,
            "count": len(analyses)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving pronunciation analyses: {str(e)}")


@app.get("/api/latest_pronunciation_analysis/{user_id}")
async def get_latest_pronunciation_analysis_endpoint(user_id: str):
    """
    Get the latest pronunciation analysis for a user.
    """
    try:
        analysis = get_latest_pronunciation_analysis(user_id)
        
        if analysis:
            return {
                "success": True,
                "data": analysis
            }
        else:
            return {
                "success": True,
                "data": None,
                "message": "No pronunciation analyses found"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving latest pronunciation analysis: {str(e)}")


@app.post("/api/generate_greeting")
async def generate_greeting_endpoint(request: GenerateGreetingRequest):
    """
    Generate a personalized greeting message for the learning session.
    """
    try:
        greeting_message = generate_greeting_message(
            user_name=request.user_name,
            learning_language=request.learning_language,
            session_content=request.session_content,
            level=request.level
        )
        
        return {
            "success": True,
            "message": "Greeting generated successfully",
            "data": {
                "greeting": greeting_message
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating greeting: {str(e)}")


@app.post("/api/speech_to_text")
async def speech_to_text_endpoint(request: SpeechToTextRequest):
    """
    Convert speech to text using ElevenLabs.
    """
    try:
        transcribed_text = speech_to_text(
            audio_url=request.audio_url,
            language=request.language
        )
        
        if transcribed_text:
            return {
                "success": True,
                "message": "Speech transcribed successfully",
                "data": {
                    "text": transcribed_text
                }
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to transcribe speech"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error transcribing speech: {str(e)}")


@app.post("/api/conversational_response")
async def conversational_response_endpoint(request: ConversationalRequest):
    """
    Generate a conversational response using ChatGPT.
    """
    try:
        # Get user preferences
        user_prefs = get_preferences(request.user_id)
        if not user_prefs or len(user_prefs) == 0:
            raise HTTPException(
                status_code=404,
                detail="User preferences not found"
            )
        
        user_pref = user_prefs[0]
        
        # Get conversation history
        messages = get_all_messages_from_session(request.session_id)
        
        # Generate response
        response = generate_conversational_response(
            user_message=request.user_message,
            conversation_history=messages,
            learning_language=request.learning_language,
            level=request.level,
            user_preferences=user_pref
        )
        
        return {
            "success": True,
            "message": "Conversational response generated",
            "data": response
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating conversational response: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
