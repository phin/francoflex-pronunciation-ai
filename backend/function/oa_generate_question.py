import os
import json
import openai
from typing import Dict, List
from fastapi import HTTPException
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def generate_questions(industry: str, job_title: str, language: str, level: str, native: str) -> Dict[str, List[Dict[str, str]]]:
    """Generate language learning sentences for specific industry, job title, language, level, and native language."""
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    client = openai.OpenAI(api_key=api_key)
    
    system_prompt = f"You are a {language} language learning assistant specialized in {industry} industry. Generate exactly 10 professional {language} sentences at {level} level with {native} translations, focusing on industry-specific scenarios and terminology. You MUST respond with valid JSON only, no other text."
    
    prompt = f"""Generate 10 highly specific {language} learning sentences for a {job_title} working in {industry} at {level} level.

Requirements:
- Use authentic workplace scenarios they actually encounter in {industry}
- Include industry-specific terminology and jargon relevant to {industry}
- Focus on realistic client/colleague interactions specific to {industry}
- These should be practical sentences/phrases, not questions
- Each sentence should be situational and context-rich with {industry} context
- Match the complexity to {level} level ({language})
- CRITICAL: Use ONLY {language} words in the learning sentences - NO English or other language words mixed in
- For industry terms, job titles, or technical terms, translate them to {language} or use {language} equivalents
- Include scenarios like: meetings, client calls, project discussions, technical reviews, industry-specific processes, compliance, regulations, tools, software, methodologies, etc.

Industry Context Examples for {industry}:
- Use specific {industry} terminology and processes
- Include realistic scenarios they face daily
- Reference industry-specific tools, software, or methodologies
- Include compliance, regulations, or standards relevant to {industry}
- Mention industry-specific roles, departments, or stakeholders

Language Requirements:
- The "learning" field must contain ONLY {language} words
- Translate all technical terms, job titles, and industry-specific vocabulary to {language}
- Avoid mixing languages (e.g., don't use "Software Developer" in a French sentence)
- Use proper {language} terminology for professional contexts

IMPORTANT: Respond with ONLY valid JSON in this exact format:
{{
  "content": [
    {{"learning": "{language} sentence here", "native": "{native} translation here"}},
    {{"learning": "{language} sentence here", "native": "{native} translation here"}}
  ]
}}

Do not include any text before or after the JSON. Do not put {language} and {native} versions adjacent in the same object.

Industry: {industry}
Job Title: {job_title}
Learning Language: {language}
Native Language: {native}
Level: {level}"""
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )
    
    response_content = response.choices[0].message.content
    questions_data = json.loads(response_content)
    
    questions = questions_data.get('content', [])
    if not questions:
        raise HTTPException(status_code=500, detail="No questions generated")
        
    return {"content": questions}


# Test section
if __name__ == "__main__":
    # Test parameters
    test_industry = "Technology"
    test_job_title = "Software Developer"
    test_language = "French"
    test_level = "C1"
    test_native = "English"
    
    print("🧪 Testing generate_questions function...")
    print(f"Industry: {test_industry}")
    print(f"Job Title: {test_job_title}")
    print(f"Learning Language: {test_language}")
    print(f"Level: {test_level}")
    print(f"Native Language: {test_native}")
    print("-" * 50)
    
    try:
        result = generate_questions(
            industry=test_industry,
            job_title=test_job_title,
            language=test_language,
            level=test_level,
            native=test_native
        )
        
        print("✅ Success! Generated questions:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")