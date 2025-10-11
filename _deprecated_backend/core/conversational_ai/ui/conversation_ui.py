"""Streamlit UI for conversational AI practice in pharmaceutical workplace scenarios."""

import streamlit as st
import os
import tempfile
from typing import Optional
from ..client.elevenlabs_client import ElevenLabsClient
from ..scenarios.pharma_scenarios import PharmaScenarios

class ConversationUI:
    """UI for conversational AI practice with pharmaceutical scenarios."""
    
    def __init__(self):
        """Initialize the conversation UI."""
        self.elevenlabs_client = ElevenLabsClient()
        self.pharma_scenarios = PharmaScenarios()
        
        # Initialize session state
        if 'conversation_history' not in st.session_state:
            st.session_state.conversation_history = []
        if 'current_scenario' not in st.session_state:
            st.session_state.current_scenario = None
        if 'current_question' not in st.session_state:
            st.session_state.current_question = None
    
    def render_main_interface(self):
        """Render the main conversational AI interface."""
        st.title("🗣️ Pratique Conversationnelle - Secteur Pharmaceutique")
        st.write("**Pratiquez votre français dans des scénarios professionnels du secteur pharmaceutique**")
        
        # Check API configuration
        if not self.elevenlabs_client.is_configured():
            st.error("❌ ELEVENLABS_API_KEY not found in environment variables")
            st.info("Please set up your ElevenLabs API key in the .env file")
            return
        
        # Scenario selection
        self._render_scenario_selection()
        
        # Current question display
        if st.session_state.current_question:
            self._render_current_question()
        
        # Audio recording and response
        self._render_audio_interface()
        
        # Conversation history
        self._render_conversation_history()
    
    def _render_scenario_selection(self):
        """Render scenario selection interface."""
        st.subheader("📋 Choisissez un Scénario")
        
        scenarios = self.pharma_scenarios.get_scenario_list()
        
        # Create columns for scenario cards
        cols = st.columns(2)
        
        for i, scenario in enumerate(scenarios):
            with cols[i % 2]:
                with st.container():
                    st.markdown(f"**{scenario['title']}**")
                    st.write(scenario['description'])
                    
                    if st.button(f"Commencer {scenario['title']}", key=f"scenario_{scenario['name']}"):
                        st.session_state.current_scenario = scenario['name']
                        st.session_state.current_question = self.pharma_scenarios.get_random_question(scenario['name'])
                        st.session_state.conversation_history = []
                        st.rerun()
    
    def _render_current_question(self):
        """Render the current question with audio playback."""
        st.subheader("🎯 Question Actuelle")
        
        scenario_data = self.pharma_scenarios.get_scenario(st.session_state.current_scenario)
        if scenario_data:
            st.info(f"**Scénario:** {scenario_data['title']}")
        
        # Display question
        st.write(f"**Question:** {st.session_state.current_question}")
        
        # Generate and play audio
        col1, col2 = st.columns([1, 1])
        
        with col1:
            if st.button("🔊 Écouter la Question", key="play_question"):
                self._play_question_audio()
        
        with col2:
            if st.button("🔄 Nouvelle Question", key="new_question"):
                st.session_state.current_question = self.pharma_scenarios.get_random_question(
                    st.session_state.current_scenario
                )
                st.rerun()
    
    def _play_question_audio(self):
        """Generate and play audio for the current question."""
        if not st.session_state.current_question:
            return
        
        scenario_data = self.pharma_scenarios.get_scenario(st.session_state.current_scenario)
        voice_type = scenario_data.get('voice_type', 'professional_female') if scenario_data else 'professional_female'
        
        with st.spinner("Génération de l'audio..."):
            audio_data = self.elevenlabs_client.text_to_speech(
                st.session_state.current_question, 
                voice_type=voice_type
            )
            
            if audio_data:
                # Create temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
                    tmp_file.write(audio_data)
                    tmp_file_path = tmp_file.name
                
                # Play audio
                st.audio(tmp_file_path, format='audio/mp3')
                
                # Clean up
                os.unlink(tmp_file_path)
            else:
                st.error("Erreur lors de la génération de l'audio")
    
    def _render_audio_interface(self):
        """Render audio recording interface."""
        st.subheader("🎤 Votre Réponse")
        
        if not st.session_state.current_question:
            st.info("Sélectionnez d'abord un scénario pour commencer")
            return
        
        # Audio input
        audio_value = st.audio_input("Enregistrez votre réponse en français")
        
        if audio_value:
            # Display the recorded audio
            st.audio(audio_value)
            
            # Save recording (you can integrate with your existing audio handler)
            st.success("✅ Réponse enregistrée!")
            
            # Add to conversation history
            st.session_state.conversation_history.append({
                'type': 'user_response',
                'content': 'Audio response recorded',
                'scenario': st.session_state.current_scenario,
                'question': st.session_state.current_question
            })
            
            # Provide feedback (you can integrate with SpeechAce here)
            self._provide_feedback()
    
    def _provide_feedback(self):
        """Provide feedback on the user's response."""
        st.subheader("📝 Commentaires")
        
        # Placeholder for feedback - you can integrate with SpeechAce here
        st.info("💡 **Conseil:** Votre réponse a été enregistrée. Intégrez SpeechAce pour l'analyse de prononciation.")
        
        # Example feedback structure
        feedback_cols = st.columns(3)
        
        with feedback_cols[0]:
            st.metric("Fluidité", "Bien", "📈")
        
        with feedback_cols[1]:
            st.metric("Prononciation", "À améliorer", "📊")
        
        with feedback_cols[2]:
            st.metric("Vocabulaire", "Excellent", "🎯")
    
    def _render_conversation_history(self):
        """Render conversation history."""
        if st.session_state.conversation_history:
            st.subheader("📚 Historique de la Conversation")
            
            for i, entry in enumerate(reversed(st.session_state.conversation_history[-5:])):  # Show last 5
                with st.expander(f"Interaction {len(st.session_state.conversation_history) - i}"):
                    st.write(f"**Scénario:** {entry.get('scenario', 'N/A')}")
                    st.write(f"**Question:** {entry.get('question', 'N/A')}")
                    st.write(f"**Type:** {entry.get('type', 'N/A')}")
                    st.write(f"**Contenu:** {entry.get('content', 'N/A')}")
    
    def render_voice_settings(self):
        """Render voice settings interface."""
        st.subheader("🎛️ Paramètres de Voix")
        
        available_voices = self.elevenlabs_client.get_available_voices()
        
        selected_voice = st.selectbox(
            "Choisissez le type de voix:",
            options=list(available_voices.keys()),
            format_func=lambda x: f"{x} - {available_voices[x]}"
        )
        
        # Test voice
        test_text = st.text_input("Texte de test:", value="Bonjour, comment allez-vous aujourd'hui ?")
        
        if st.button("🔊 Tester la Voix"):
            with st.spinner("Génération de l'audio de test..."):
                audio_data = self.elevenlabs_client.text_to_speech(test_text, voice_type=selected_voice)
                
                if audio_data:
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
                        tmp_file.write(audio_data)
                        tmp_file_path = tmp_file.name
                    
                    st.audio(tmp_file_path, format='audio/mp3')
                    os.unlink(tmp_file_path)
                else:
                    st.error("Erreur lors de la génération de l'audio de test")
