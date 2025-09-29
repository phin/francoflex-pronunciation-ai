"""Voice chat functionality for Francoflex Pronunciation Practice."""

import streamlit as st
import os
import tempfile
import uuid
import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import plotly.figure_factory as ff
import plotly.graph_objects as go
from datetime import datetime
from conversational_ai import ElevenLabsClient, PharmaScenarios
from pronunciation_ai import LLMAnalyzer
from pronunciation_analyzer import analyze_pronunciation_data, analyze_pronunciation, convert_speechace_to_custom_response, add_ai_feedback_to_response, generate_word_feedback

def _old_analyze_pronunciation_data(json_data):
    """
    Parse pronunciation API response and extract structured feedback data
    
    Returns:
    - overall_score: Main pronunciation score
    - cefr_level: Language proficiency level  
    - word_analysis: Detailed breakdown by word with syllables and phones
    """
    
    if isinstance(json_data, str):
        data = json.loads(json_data)
    else:
        data = json_data
    
    # Extract overall metrics - handle different response structures
    overall_score = None
    cefr_level = None
    
    # Try different possible structures
    if 'speechace_score' in data and 'pronunciation' in data['speechace_score']:
        overall_score = data['speechace_score']['pronunciation']
    elif 'text_score' in data and 'quality_score' in data['text_score']:
        overall_score = data['text_score']['quality_score']
    elif 'text_score' in data and 'word_score_list' in data['text_score']:
        # Calculate average from word scores
        word_scores = [word['quality_score'] for word in data['text_score']['word_score_list']]
        overall_score = sum(word_scores) / len(word_scores) if word_scores else 0
    
    
    
    # Process each word
    word_analysis = []
    
    for word_data in data['text_score']['word_score_list']:
        word_info = {
            'word': word_data['word'],
            'quality_score': word_data['quality_score'],
            'syllables': [],
            'phones': []
        }
        
        # Extract syllable data
        for syll in word_data['syllable_score_list']:
            syllable_info = {
                'letters': syll['letters'],
                'quality_score': syll['quality_score'],
                'phone_count': syll['phone_count']
            }
            word_info['syllables'].append(syllable_info)
        
        # Extract phone data with pronunciation issues
        for phone in word_data['phone_score_list']:
            phone_info = {
                'target_phone': phone['phone'],
                'quality_score': phone['quality_score'],
                'sound_most_like': phone.get('sound_most_like'),
                'needs_work': phone['quality_score'] < 70
            }
            word_info['phones'].append(phone_info)
        
        word_analysis.append(word_info)
    
    return {
        'overall_score': overall_score,
        
        'word_analysis': word_analysis
    }

def generate_feedback_summary(analysis):
    """
    Generate concise feedback focusing on problem areas
    """
    feedback = {
        'overall': f"Score: {analysis['overall_score']}/100",
        'problem_words': [],
        'problem_sounds': []
    }
    
    for word in analysis['word_analysis']:
        if word['quality_score'] < 80:
            issues = []
            for phone in word['phones']:
                if phone['needs_work'] and phone['sound_most_like']:
                    issues.append({
                        'target': phone['target_phone'],
                        'sounds_like': phone['sound_most_like'],
                        'score': phone['quality_score']
                    })
            
            if issues:
                feedback['problem_words'].append({
                    'word': word['word'],
                    'score': word['quality_score'],
                    'sound_issues': issues
                })
    
    return feedback

def create_word_phone_distribution_plot(raw_api_response):
    """Create a plotly distribution plot grouping phone scores by word."""
    try:
        # Extract word and phone data from raw API response
        if 'text_score' not in raw_api_response or 'word_score_list' not in raw_api_response['text_score']:
            return None
        
        word_score_list = raw_api_response['text_score']['word_score_list']
        
        # Prepare data for distribution plot
        hist_data = []
        group_labels = []
        bin_sizes = []
        
        for word_data in word_score_list:
            word = word_data.get('word', 'Unknown')
            phone_scores = []
            
            # Extract phone scores for this word
            if 'phone_score_list' in word_data:
                for phone in word_data['phone_score_list']:
                    quality_score = phone.get('quality_score', 0)
                    phone_scores.append(quality_score)
            
            # Only add words that have phone data
            if phone_scores:
                hist_data.append(phone_scores)
                group_labels.append(f"{word} ({len(phone_scores)} phones)")
                # Use different bin sizes based on word length/complexity
                if len(phone_scores) <= 2:
                    bin_sizes.append(2.0)  # Smaller bins for short words
                elif len(phone_scores) <= 4:
                    bin_sizes.append(3.0)  # Medium bins for medium words
                else:
                    bin_sizes.append(5.0)  # Larger bins for long words
        
        if not hist_data:
            return None
        
        # Create distribution plot using the exact format from the sample
        fig = ff.create_distplot(
            hist_data, 
            group_labels, 
            bin_size=bin_sizes
        )
        
        # Customize the plot
        fig.update_layout(
            title={
                'text': 'Phone Quality Score Distribution by Word',
                'x': 0.5,
                'xanchor': 'center',
                'font': {'size': 16}
            },
            xaxis_title='Phone Quality Score (0-100)',
            yaxis_title='Density',
            height=500,
            showlegend=True,
            legend=dict(
                orientation="v",
                yanchor="top",
                y=1,
                xanchor="left",
                x=1.02
            )
        )
        
        # Add vertical line at quality threshold
        fig.add_vline(x=70, line_dash="dash", line_color="red", 
                     annotation_text="Quality Threshold (70)", 
                     annotation_position="top")
        
        return fig
        
    except Exception as e:
        print(f"Error creating distribution plot: {e}")
        return None

def create_phone_scatter_plot(phone_data):
    """Create a scatter plot for phone analysis with hover information."""
    if not phone_data:
        return None
    
    # Create figure and axis
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Prepare data for plotting
    phones = []
    qualities = []
    colors = []
    hover_texts = []
    
    for phone, phone_info in phone_data.items():
        quality = phone_info['quality_score']
        sound_like = phone_info.get('sound_most_like', 'N/A')
        
        phones.append(phone)
        qualities.append(quality)
        
        # Color based on quality (red for poor, green for good)
        if quality < 70:
            colors.append('red')
        else:
            colors.append('green')
        
        # Create hover text
        status = "❌" if quality < 70 else "✅"
        hover_text = f"{status} {phone}: {quality}/100"
        if sound_like != 'N/A':
            hover_text += f"\n(sounds like '{sound_like}')"
        hover_texts.append(hover_text)
    
    # Create scatter plot
    scatter = ax.scatter(range(len(phones)), qualities, c=colors, s=100, alpha=0.7, edgecolors='black', linewidth=1)
    
    # Customize the plot
    ax.set_xlabel('Phone Index', fontsize=12)
    ax.set_ylabel('Quality Score', fontsize=12)
    ax.set_title('Phone Pronunciation Analysis', fontsize=14, fontweight='bold')
    ax.set_ylim(0, 105)
    ax.grid(True, alpha=0.3)
    
    # Set x-axis labels to phone symbols
    ax.set_xticks(range(len(phones)))
    ax.set_xticklabels(phones, rotation=45, ha='right')
    
    # Add quality score labels on each point
    for i, (phone, quality) in enumerate(zip(phones, qualities)):
        ax.annotate(f'{quality}', (i, quality), textcoords="offset points", xytext=(0,10), ha='center', fontsize=10, fontweight='bold')
    
    # Add legend
    red_patch = patches.Patch(color='red', label='Needs Work (< 70)')
    green_patch = patches.Patch(color='green', label='Good (≥ 70)')
    ax.legend(handles=[red_patch, green_patch], loc='upper right')
    
    plt.tight_layout()
    return fig, hover_texts

def save_voice_note(audio_data):
    """Save voice note and return file path."""
    recordings_dir = "data/recordings"
    os.makedirs(recordings_dir, exist_ok=True)
    
    filename = f"{uuid.uuid4()}.wav"
    filepath = os.path.join(recordings_dir, filename)
    
    with open(filepath, "wb") as f:
        f.write(audio_data.read())
    
    return filepath

def generate_ai_voice(text, voice_type="professional_female"):
    """Generate AI voice response."""
    elevenlabs_client = ElevenLabsClient()
    
    if not elevenlabs_client.is_configured():
        return None
    
    audio_data = elevenlabs_client.text_to_speech(text, voice_type=voice_type)
    return audio_data

def generate_questions(industry, job_title):
    """Generate French learning questions for specific industry and job title."""
    import openai
    import os
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        st.error("❌ OPENAI_API_KEY not found in environment variables")
        return None
    
    client = openai.OpenAI(api_key=api_key)
    
    prompt = f"""Generate 10 highly specific French learning questions for a {job_title} working in {industry}.

Requirements:
- Use authentic workplace scenarios they actually encounter
- Include technical vocabulary specific to their role
- Focus on realistic client/colleague interactions
- Avoid generic service phrases
- Each question should be situational and context-rich

Format exactly as:
{{
  "content": [
    {{"fr": "french question here", "en": "english translation here"}},
    {{"fr": "french question here", "en": "english translation here"}}
  ]
}}

DO NOT put French and English versions adjacent in the same object.

Industry: {industry}
Job Title: {job_title}"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a French language learning assistant. Generate exactly 10 professional French questions in JSON format."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        # Parse the JSON response
        print(response)
        response_content = response.choices[0].message.content
        questions_data = json.loads(response_content)
        
        # Extract questions from the response
        questions = questions_data.get('content', [])
        if questions and len(questions) > 0:
            return questions
        else:
            st.error("No questions found in response")
            return None
            
    except Exception as e:
        st.error(f"Error generating questions: {e}")
        # Fallback to default questions
        st.warning("Using fallback questions...")
        return get_fallback_questions(industry, job_title)

def analyze_pronunciation(audio_path, target_text):
    """Analyze pronunciation using enhanced SpeechAce API call with AI feedback."""
    import requests
    
    try:
        # Check if API key is available
        api_key = os.getenv('SPEECHACE_API_KEY')
        if not api_key:
            return None, "SpeechAce API key not configured"
        
        # Make direct API call to SpeechAce
        url = f"https://api.speechace.co/api/scoring/text/v9/json?key={api_key}&dialect=fr-fr"
        
        data = {
            'text': target_text
        }
        
        with open(audio_path, 'rb') as audio_file:
            files = {
                'user_audio_file': audio_file
            }
            
            response = requests.post(url, data=data, files=files)
            response.raise_for_status()
            score_result = response.json()
        
        if not score_result or score_result.get("status") != "success":
            return None, "Failed to get pronunciation score"
        
        # Convert to custom response format (without AI feedback for now)
        custom_response = convert_speechace_to_custom_response(score_result)
        
        # Don't add AI feedback here - we'll do it lazily when user clicks on word
        return custom_response, None
        
    except Exception as e:
        return None, f"Analysis error: {str(e)}"

def get_fallback_questions(industry, job_title):
    """Fallback questions when LLM generation fails."""
    fallback_questions = {
        "Pharmaceutical": [
            "Comment présentez-vous un nouveau médicament à votre équipe ?",
            "Quels sont les défis de la réglementation pharmaceutique ?",
            "Comment gérez-vous les relations avec les autorités de santé ?",
            "Décrivez votre processus de contrôle qualité.",
            "Comment communiquez-vous les résultats d'essais cliniques ?"
        ],
        "Technology": [
            "Comment expliquez-vous un concept technique à un client ?",
            "Quels sont les défis de sécurité dans vos projets ?",
            "Comment gérez-vous les délais de développement ?",
            "Décrivez votre méthodologie de développement.",
            "Comment formez-vous votre équipe sur les nouvelles technologies ?"
        ],
        "Finance": [
            "Comment présentez-vous un rapport financier ?",
            "Quels sont les risques que vous surveillez ?",
            "Comment gérez-vous les relations avec les investisseurs ?",
            "Décrivez votre processus d'audit.",
            "Comment communiquez-vous les résultats financiers ?"
        ],
        "Healthcare": [
            "Comment expliquez-vous un diagnostic à un patient ?",
            "Quels sont les défis de la gestion des soins ?",
            "Comment gérez-vous les relations avec les familles ?",
            "Décrivez votre protocole de traitement.",
            "Comment formez-vous votre équipe médicale ?"
        ],
        "Education": [
            "Comment adaptez-vous votre enseignement aux différents niveaux ?",
            "Quels sont les défis de la gestion de classe ?",
            "Comment gérez-vous les relations avec les parents ?",
            "Décrivez votre méthode d'évaluation.",
            "Comment intégrez-vous les nouvelles technologies en classe ?"
        ]
    }
    
    # Get questions for the industry, or use general questions
    questions = fallback_questions.get(industry, [
        "Comment présentez-vous votre travail à un nouveau collègue ?",
        "Quels sont les défis principaux de votre secteur ?",
        "Comment gérez-vous les relations avec vos clients ?",
        "Décrivez votre processus de travail quotidien.",
        "Comment communiquez-vous avec votre équipe ?"
    ])
    
    return questions

def generate_ai_answer(question):
    """Generate an AI answer to a French question."""
    import openai
    import os
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return "Désolé, je ne peux pas générer de réponse pour le moment."
    
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
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        return f"Désolé, une erreur s'est produite: {str(e)}"

def get_ai_response():
    """Get next AI response from generated questions in order or pharmaceutical scenarios."""
    # Check if we have generated questions
    if 'generated_questions' in st.session_state and st.session_state.generated_questions:
        # Initialize question index if not exists
        if 'current_question_index' not in st.session_state:
            st.session_state.current_question_index = 0
        
        questions = st.session_state.generated_questions
        current_index = st.session_state.current_question_index
        
        # Get the current question
        if current_index < len(questions):
            question = questions[current_index]
            # Move to next question for next time
            st.session_state.current_question_index += 1
            
            # Return in the format expected by the chat display
            if isinstance(question, dict) and 'fr' in question:
                return {
                    "content": question['fr'],
                    "translation": question.get('en', '')
                }
            else:
                return {
                    "content": question,
                    "translation": ""
                }
        else:
            # All questions asked, restart from beginning
            st.session_state.current_question_index = 0
            first_question = questions[0]
            if isinstance(first_question, dict) and 'fr' in first_question:
                return {
                    "content": first_question['fr'],
                    "translation": first_question.get('en', '')
                }
            else:
                return {
                    "content": first_question,
                    "translation": ""
                }

    # Fallback to pharmaceutical scenarios
    pharma_scenarios = PharmaScenarios()
    scenarios = pharma_scenarios.get_all_scenarios()
    scenario_names = list(scenarios.keys())

    # Get random question from random scenario
    random_scenario = scenario_names[0]  # Use first scenario for simplicity
    return {
        "content": pharma_scenarios.get_random_question(random_scenario),
        "translation": ""
    }

def render_onboarding():
    """Onboarding interface to collect industry and job title."""
    st.title("🎤 Francoflex Pronunciation Practice")
    st.markdown("---")
    
    st.markdown("### Welcome! Let's personalize your French learning experience")
    st.markdown("Tell us about your professional background so we can create relevant questions for you.")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### 🏢 Your Industry")
        industries = [
            "Pharmaceutical",
            "Technology", 
            "Finance",
            "Healthcare",
            "Education",
            "Marketing",
            "Sales",
            "Engineering",
            "Consulting",
            "Manufacturing"
        ]
        industry = st.selectbox("Select your industry:", industries, key="onboarding_industry")
    
    with col2:
        st.markdown("#### 💼 Your Job Title")
        job_title = st.text_input(
            "Enter your job title:", 
            placeholder="e.g., Sales Manager, Software Engineer, Doctor...",
            key="onboarding_job_title"
        )
    
    st.markdown("---")
    
    # Generate questions button
    if st.button("🎯 Generate My Questions", disabled=not job_title.strip(), type="primary"):
        with st.spinner("Generating personalized questions for your role..."):
            questions = generate_questions(industry, job_title)
            if questions:
                st.session_state.generated_questions = questions
                st.session_state.voice_messages = []  # Clear chat history
                st.session_state.current_question_index = 0  # Reset question index
                st.session_state.onboarding_complete = True  # Mark onboarding as complete
                
                # Add the first question as an assistant message
                first_question = questions[0]
                if isinstance(first_question, dict) and 'fr' in first_question:
                    # New format with French and English
                    st.session_state.voice_messages.append({
                        "role": "assistant",
                        "content": first_question['fr'],
                        "translation": first_question.get('en', ''),
                        "timestamp": datetime.now()
                    })
                else:
                    # Fallback for old format
                    st.session_state.voice_messages.append({
                        "role": "assistant",
                        "content": first_question,
                        "timestamp": datetime.now()
                    })
                
                # Increment the question index since we've shown the first question
                st.session_state.current_question_index = 1
                
                st.success(f"✅ Generated {len(questions)} personalized questions for {job_title} in {industry}!")
                st.info("🎉 Ready to start your French practice session!")
                st.rerun()
            else:
                st.error("❌ Failed to generate questions. Please try again.")

def render_voice_chat():
    """Voice chat interface with progress tracking."""
    
    # Check ElevenLabs configuration
    elevenlabs_client = ElevenLabsClient()
    if not elevenlabs_client.is_configured():
        st.error("❌ ELEVENLABS_API_KEY not found in environment variables")
        st.info("Please set up your ElevenLabs API key in the .env file")
        return

    # Sidebar with progress and controls
    with st.sidebar:
        st.subheader("📊 Session Progress")
        
        if 'generated_questions' in st.session_state and st.session_state.generated_questions:
            total_questions = len(st.session_state.generated_questions)
            current_index = st.session_state.get('current_question_index', 0)
            
            st.write(f"📈 **Progress:** {current_index + 1} of {total_questions} questions")
            
            # Progress bar
            progress = (current_index + 1) / total_questions
            st.progress(progress)
            
            # Restart session button
            if st.button("🔄 Start New Session"):
                st.session_state.onboarding_complete = False
                st.session_state.generated_questions = []
                st.session_state.voice_messages = []
                st.session_state.current_question_index = 0
                st.rerun()
        else:
            st.info("No active session")
    
    # Initialize with assistant message if no messages exist and no questions generated
    if not st.session_state.voice_messages and not st.session_state.get('generated_questions'):
        # Add initial assistant message
        initial_message = "Bonjour ! Je suis votre assistant pour la pratique du français professionnel. Comment puis-je vous aider aujourd'hui ?"
        st.session_state.voice_messages.append({
            "role": "assistant",
            "content": initial_message,
            "timestamp": datetime.now()
        })
    
    # Display chat messages
    for message in st.session_state.voice_messages:
        with st.chat_message(message["role"]):
            if message["role"] == "user":
                # User message - voice note with pronunciation analysis
                if "audio_path" in message:
                    st.audio(message["audio_path"], format='audio/wav')
                    
                    # Show pronunciation analysis if available
                    if "pronunciation_analysis" in message and message["pronunciation_analysis"]:
                        parsed_data = message["pronunciation_analysis"]
                        
                        # Check if parsed_data is a dictionary (success) or string (error)
                        if isinstance(parsed_data, dict) and 'overall_score' in parsed_data:
                            # Display CEFR level as main metric
                            cefr_score = parsed_data.get('cefr_score', {})
                            cefr_level = cefr_score.get('level', 'N/A')
                            
                            col1, col2 = st.columns(2)
                            with col1:
                                st.metric("CEFR Level", cefr_level)
                            with col2:
                                st.metric("Overall Score", f"{parsed_data['overall_score']}%")
                            
                            # Debug dropdowns for raw and parsed responses
                            col1, col2 = st.columns(2)
                            with col1:
                                with st.expander("🔍 Raw SpeechAce API Response"):
                                    if 'raw_api_response' in parsed_data.get('metadata', {}):
                                        st.json(parsed_data['metadata']['raw_api_response'])
                                    else:
                                        st.write("Raw API response not available")
                            
                            with col2:
                                with st.expander("📋 Parsed Response Structure"):
                                    st.json(parsed_data)
                            
                            # Word and Phone Analysis with Distribution Chart
                            st.subheader("📊 Word & Phone Analysis")
                            
                            # Get raw API response for the distribution plot
                            raw_api_response = parsed_data.get('metadata', {}).get('raw_api_response', {})
                            
                            # Create distribution plot
                            dist_fig = create_word_phone_distribution_plot(raw_api_response)
                            if dist_fig:
                                st.plotly_chart(dist_fig, use_container_width=True)
                            else:
                                st.warning("Could not create distribution plot from API response")
                            
                            # Word AI Feedback table
                            st.subheader("💬 AI Feedback by Word")
                            word_analysis = parsed_data.get('word_analysis', [])
                            if word_analysis:
                                # Generate AI feedback for all words
                                with st.spinner("Generating AI feedback for all words..."):
                                    feedback_data = []
                                    overall_score = parsed_data.get('overall_score', 0)
                                    
                                    for word_data in word_analysis:
                                        word_name = word_data.get('word', 'Unknown')
                                        quality_score = word_data.get('quality_score', 0)
                                        
                                        # Generate AI feedback for this word
                                        ai_feedback = generate_word_feedback(word_data, overall_score)
                                        
                                        feedback_data.append({
                                            'Word': word_name,
                                            'Score': f"{quality_score}/100",
                                            'Cheering Message': ai_feedback.get('cheering_message', 'Keep practicing!'),
                                            'Improvement Tips': ai_feedback.get('feedback', 'Continue working on your pronunciation.')
                                        })
                                
                                # Display feedback table
                                feedback_df = pd.DataFrame(feedback_data)
                                st.dataframe(feedback_df, use_container_width=True, hide_index=True)
                            else:
                                st.warning("No word analysis data available")
                        else:
                            # Show error message
                            st.error(f"❌ Pronunciation analysis failed: {parsed_data}")

            elif message["role"] == "assistant":
                # Assistant message - voice note with text
                st.write(message["content"])
                
                # Show translation dropdown if available
                if "translation" in message and message["translation"]:
                    with st.expander("🇬🇧 English Translation"):
                        st.write(message["translation"])
                
                # Show pronunciation feedback if available
                if "pronunciation_feedback" in message and message["pronunciation_feedback"]:
                    with st.expander("🎤 Pronunciation Feedback"):
                        st.write(message["pronunciation_feedback"])

                # Generate and play AI voice automatically
                audio_data = generate_ai_voice(message["content"])

                if audio_data:
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
                        tmp_file.write(audio_data)
                        tmp_file_path = tmp_file.name

                    st.audio(tmp_file_path, format='audio/mp3')
                    os.unlink(tmp_file_path)
                else:
                    st.error("Error generating AI voice")
    
    # Audio input at the bottom for new messages
    audio_input = st.audio_input("Record your voice message", key="voice_input")
    
    # Handle sending voice message when audio is recorded
    if audio_input:
        # Check if this is a new audio input (not already processed)
        if "last_audio_input" not in st.session_state or st.session_state.last_audio_input != audio_input:
            # Update the last processed audio input
            st.session_state.last_audio_input = audio_input
            
            # Save user voice message
            audio_path = save_voice_note(audio_input)

            # Get the current question for pronunciation analysis from the previous assistant message
            current_question = None
            if st.session_state.get('voice_messages'):
                # Find the last assistant message (the question the user was answering)
                for message in reversed(st.session_state.voice_messages):
                    if message.get('role') == 'assistant':
                        current_question = message.get('content', '')
                        break

            # Debug: Print what we're analyzing
            print("\n" + "=" * 80)
            print("🔍 DEBUG - PRONUNCIATION ANALYSIS INPUTS:")
            print("=" * 80)
            print(f"📁 Audio Path: {audio_path}")
            print(f"📝 Current Question: {current_question}")
            print(f"📋 Total Messages: {len(st.session_state.get('voice_messages', []))}")
            print("=" * 80)

            # Analyze pronunciation if we have a target question
            pronunciation_analysis = None
            if current_question:
                with st.spinner("Analyzing pronunciation..."):
                    pronunciation_analysis, _ = analyze_pronunciation(audio_path, current_question)
                    
                    # Debug: Print the formatted function response
                    print("\n" + "=" * 80)
                    print("🎯 DEBUG - PRONUNCIATION ANALYSIS RESPONSE:")
                    print("=" * 80)
                    if pronunciation_analysis:
                        print(json.dumps(pronunciation_analysis, indent=2, ensure_ascii=False))
                    else:
                        print("❌ No pronunciation analysis data returned")
                    print("=" * 80)
            else:
                print("❌ No current question found for pronunciation analysis")

            # Add user message to chat with analysis
            user_message = {
                "role": "user",
                "content": "Voice message recorded",
                "audio_path": audio_path,
                "timestamp": datetime.now()
            }
            
            if pronunciation_analysis:
                user_message["pronunciation_analysis"] = pronunciation_analysis
                
            st.session_state.voice_messages.append(user_message)
            
            # Automatically generate AI response
            with st.spinner("AI is responding..."):
                # Get the next question (this will increment the index)
                ai_response = get_ai_response()
                
                # Add AI response to chat
                if isinstance(ai_response, dict):
                    st.session_state.voice_messages.append({
                        "role": "assistant",
                        "content": ai_response["content"],
                        "translation": ai_response.get("translation", ""),
                        "timestamp": datetime.now()
                    })
                else:
                    # Fallback for old format
                    st.session_state.voice_messages.append({
                        "role": "assistant",
                        "content": ai_response,
                        "timestamp": datetime.now()
                    })
            
            st.rerun()
    
    # TODO: Add speech analysis functionality
    # - Integrate SpeechAce for pronunciation analysis
    # - Add LLM feedback on pronunciation
    # - Display pronunciation scores and feedback
    # - Add progress tracking for user improvement

def main():
    """Main function to handle onboarding and voice chat flow."""
    # Check if onboarding is complete
    if not st.session_state.get('onboarding_complete', False):
        render_onboarding()
    else:
        render_voice_chat()
