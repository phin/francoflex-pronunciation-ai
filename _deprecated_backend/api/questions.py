"""
Question generation module for Francoflex API.
"""

import os
import json
from typing import List, Dict
from fastapi import HTTPException
import openai


def generate_questions(industry: str, job_title: str) -> Dict[str, List[Dict[str, str]]]:
    """Generate French learning questions for specific industry and job title."""
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
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
        
        response_content = response.choices[0].message.content
        questions_data = json.loads(response_content)
        
        questions = questions_data.get('content', [])
        if not questions:
            raise HTTPException(status_code=500, detail="No questions generated")
            
        return {"content": questions}
        
    except Exception as e:
        # Return fallback questions
        fallback_questions = get_fallback_questions(industry, job_title)
        return {"content": fallback_questions}


def get_fallback_questions(industry: str, job_title: str) -> List[Dict[str, str]]:
    """Fallback questions when LLM generation fails."""
    fallback_questions = {
        "Pharmaceutical": [
            {"fr": "Comment présentez-vous un nouveau médicament à votre équipe ?", "en": "How do you present a new medication to your team?"},
            {"fr": "Quels sont les défis de la réglementation pharmaceutique ?", "en": "What are the challenges of pharmaceutical regulation?"},
            {"fr": "Comment gérez-vous les relations avec les autorités de santé ?", "en": "How do you manage relationships with health authorities?"},
            {"fr": "Décrivez votre processus de contrôle qualité.", "en": "Describe your quality control process."},
            {"fr": "Comment communiquez-vous les résultats d'essais cliniques ?", "en": "How do you communicate clinical trial results?"}
        ],
        "Technology": [
            {"fr": "Comment expliquez-vous un concept technique à un client ?", "en": "How do you explain a technical concept to a client?"},
            {"fr": "Quels sont les défis de sécurité dans vos projets ?", "en": "What are the security challenges in your projects?"},
            {"fr": "Comment gérez-vous les délais de développement ?", "en": "How do you manage development deadlines?"},
            {"fr": "Décrivez votre méthodologie de développement.", "en": "Describe your development methodology."},
            {"fr": "Comment formez-vous votre équipe sur les nouvelles technologies ?", "en": "How do you train your team on new technologies?"}
        ]
    }
    
    # Get questions for the industry, or use general questions
    questions = fallback_questions.get(industry, [
        {"fr": "Comment présentez-vous votre travail à un nouveau collègue ?", "en": "How do you present your work to a new colleague?"},
        {"fr": "Quels sont les défis principaux de votre secteur ?", "en": "What are the main challenges in your sector?"},
        {"fr": "Comment gérez-vous les relations avec vos clients ?", "en": "How do you manage relationships with your clients?"},
        {"fr": "Décrivez votre processus de travail quotidien.", "en": "Describe your daily work process."},
        {"fr": "Comment communiquez-vous avec votre équipe ?", "en": "How do you communicate with your team?"}
    ])
    
    return questions[:10]  # Return max 10 questions
