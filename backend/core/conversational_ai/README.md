# 🗣️ Conversational AI - Pharmaceutical French Practice

A comprehensive conversational AI system for practicing French in pharmaceutical workplace scenarios using ElevenLabs speech synthesis.

## 🎯 Features

### 🏥 Pharmaceutical Scenarios
- **Présentation en Réunion**: Practice presenting clinical trial data
- **Consultation Patient**: Simulate patient consultations and medication counseling
- **Réunion Réglementaire**: Practice regulatory compliance discussions
- **Discussion Laboratoire**: Technical laboratory and research conversations
- **Réunion Commerciale**: Sales and marketing discussions

### 🎤 Voice Features
- **French Speech Synthesis**: High-quality French voice generation using ElevenLabs
- **Multiple Voice Types**: Professional male/female and friendly voices
- **Audio Playback**: Listen to questions before responding
- **Voice Testing**: Test different voice types with custom text

### 🎯 Practice Features
- **Random Questions**: Get different questions each time
- **Audio Recording**: Record your responses for practice
- **Conversation History**: Track your practice sessions
- **Scenario Selection**: Choose appropriate difficulty level

## 🏗️ Architecture

```
conversational_ai/
├── client/
│   ├── __init__.py
│   └── elevenlabs_client.py      # ElevenLabs API integration
├── scenarios/
│   ├── __init__.py
│   └── pharma_scenarios.py       # Pharmaceutical workplace scenarios
├── ui/
│   ├── __init__.py
│   └── conversation_ui.py        # Streamlit UI components
├── __init__.py
└── README.md
```

## 🚀 Usage

### 1. Run the Conversational AI App
```bash
streamlit run conversational_ai_app.py
```

### 2. Select a Scenario
Choose from 5 pharmaceutical workplace scenarios:
- Meeting presentations
- Patient consultations
- Regulatory meetings
- Laboratory discussions
- Sales meetings

### 3. Practice Conversation
1. **Listen** to the AI-generated question in French
2. **Record** your response using the audio input
3. **Review** feedback and conversation history
4. **Repeat** with new questions

## 🔧 Configuration

### Environment Variables
Add to your `.env` file:
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### Voice Settings
- **Professional Female**: Formal workplace scenarios
- **Professional Male**: Formal workplace scenarios
- **Friendly Female**: Casual workplace interactions

## 📊 Scenarios Details

### 📊 Présentation en Réunion
**Questions include:**
- "Bonjour, pouvez-vous nous présenter les résultats de l'étude clinique de phase III ?"
- "Quels sont les effets secondaires les plus fréquents observés ?"
- "Pouvez-vous expliquer la méthodologie utilisée dans cette recherche ?"

### 👩‍⚕️ Consultation Patient
**Questions include:**
- "Bonjour, comment vous sentez-vous depuis votre dernière visite ?"
- "Avez-vous pris vos médicaments comme prescrit ?"
- "Avez-vous ressenti des effets secondaires ?"

### 📋 Réunion Réglementaire
**Questions include:**
- "Pouvez-vous confirmer que tous les documents sont conformes aux exigences de l'ANSM ?"
- "Quels sont les délais pour l'obtention de l'autorisation de mise sur le marché ?"
- "Avez-vous vérifié la conformité avec les bonnes pratiques de fabrication ?"

### 🧪 Discussion Laboratoire
**Questions include:**
- "Pouvez-vous expliquer les résultats des tests de stabilité ?"
- "Quelle est la pureté du composé actif ?"
- "Avez-vous effectué les tests de dissolution requis ?"

### 💼 Réunion Commerciale
**Questions include:**
- "Quels sont les avantages de notre nouveau médicament par rapport à la concurrence ?"
- "Pouvez-vous présenter les données d'efficacité clinique ?"
- "Quel est le prix de vente recommandé ?"

## 🔮 Future Integrations

### SpeechAce Integration
- Real-time pronunciation analysis
- Detailed feedback on French pronunciation
- Progress tracking over time

### OpenAI Integration
- Intelligent conversation flow
- Contextual follow-up questions
- Advanced feedback generation

### Progress Tracking
- Session history and analytics
- Performance metrics
- Personalized learning paths

## 🛠️ Development

### Adding New Scenarios
1. Edit `pharma_scenarios.py`
2. Add new scenario to `self.scenarios` dictionary
3. Include questions, voice type, and metadata

### Customizing Voices
1. Update voice IDs in `elevenlabs_client.py`
2. Modify `self.french_voices` dictionary
3. Test with voice settings interface

### Extending UI
1. Add new methods to `ConversationUI` class
2. Update main interface in `conversational_ai_app.py`
3. Add new pages to sidebar navigation

## 📞 Support

For questions or suggestions about the conversational AI feature, please refer to the main project documentation.
