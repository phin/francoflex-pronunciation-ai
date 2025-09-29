"""LLM-based pronunciation analysis for detailed feedback."""

import json
import os
from typing import Dict, Any, Optional
from langchain.tools import BaseTool
from langchain_community.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class WordPronunciationAnalysisTool(BaseTool):
    """Tool for analyzing pronunciation assessment JSON and providing syllable-focused feedback."""
    
    name: str = "word_pronunciation_analysis"
    description: str = "Analyzes pronunciation assessment JSON and provides detailed syllable-focused feedback with specific corrections"
    llm: Optional[OpenAI] = None
    prompt_template: Optional[PromptTemplate] = None
    chain: Optional[LLMChain] = None
    
    def __init__(self):
        """Initialize the analysis tool."""
        super().__init__()
        
        # Get OpenAI API key
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        # Initialize OpenAI LLM
        self.llm = OpenAI(
            temperature=0.3,
            openai_api_key=openai_api_key
        )
        
        # Create the prompt template
        self.prompt_template = PromptTemplate(
            input_variables=["json_data"],
            template="""Analyze this pronunciation assessment JSON and provide syllable-focused feedback:

{json_data}

For each syllable in syllable_score_list:
1. **Syllable**: "{{letters}}" - Score: {{quality_score}}/100
2. **Issues**: For phones in this syllable with quality_score < 70:
   - Target sound: "{{phone}}" 
   - You pronounced: "{{sound_most_like}}"
   - Correction: [specific guidance]
3. **Good**: Highlight phones > 85 in this syllable

Present as: "In syllable 'bon': your 'b' sounded like 'rw' - try pressing lips together firmly before releasing the sound."

Focus on 1-2 worst syllables. Make corrections specific and actionable based on the "sound_most_like" data."""
        )
        
        # Create the LLM chain
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt_template)
    
    def _run(self, json_data: str) -> str:
        """
        Analyze pronunciation assessment JSON and return detailed feedback.
        
        Args:
            json_data: JSON string containing pronunciation assessment data
            
        Returns:
            Detailed syllable-focused feedback
        """
        try:
            # Validate that the input is valid JSON
            json.loads(json_data)
            
            # Get analysis from LLM
            result = self.chain.run(json_data=json_data)
            return result
            
        except json.JSONDecodeError:
            return "Error: Invalid JSON data provided for analysis"
        except Exception as e:
            return f"Error analyzing pronunciation data: {str(e)}"
    
    async def _arun(self, json_data: str) -> str:
        """Async version of _run."""
        return self._run(json_data)

class LLMAnalyzer:
    """Main class for LLM-based pronunciation analysis."""
    
    analysis_tool: Optional[WordPronunciationAnalysisTool] = None
    
    def __init__(self):
        """Initialize LLM analyzer."""
        self.analysis_tool = WordPronunciationAnalysisTool()
    
    def analyze_pronunciation(self, pronunciation_json: Dict[str, Any]) -> str:
        """
        Analyze pronunciation JSON with LLM feedback.
        
        Args:
            pronunciation_json: Dictionary containing pronunciation assessment data
            
        Returns:
            Detailed syllable-focused feedback from LLM
        """
        # Convert dict to JSON string
        json_string = json.dumps(pronunciation_json, indent=2)
        
        # Use the analysis tool
        return self.analysis_tool._run(json_string)
    
    def format_pronunciation_feedback(self, pronunciation_json: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format pronunciation feedback with both raw data and LLM analysis.
        
        Args:
            pronunciation_json: Dictionary containing pronunciation assessment data
            
        Returns:
            Dictionary with formatted feedback including LLM analysis
        """
        try:
            # Get LLM analysis
            llm_feedback = self.analyze_pronunciation(pronunciation_json)
            
            # Extract key metrics from the JSON
            overall_score = None
            syllable_scores = []
            
            if 'text_score' in pronunciation_json:
                text_score = pronunciation_json['text_score']
                overall_score = text_score.get('quality_score', 0)
                
                # Extract syllable information
                if 'syllable_score_list' in text_score:
                    for syllable in text_score['syllable_score_list']:
                        syllable_info = {
                            'letters': syllable.get('letters', ''),
                            'quality_score': syllable.get('quality_score', 0),
                            'phones': []
                        }
                        
                        # Extract phone information
                        if 'phone_score_list' in syllable:
                            for phone in syllable['phone_score_list']:
                                phone_info = {
                                    'phone': phone.get('phone', ''),
                                    'quality_score': phone.get('quality_score', 0),
                                    'sound_most_like': phone.get('sound_most_like', '')
                                }
                                syllable_info['phones'].append(phone_info)
                        
                        syllable_scores.append(syllable_info)
            
            return {
                'overall_score': overall_score,
                'syllable_scores': syllable_scores,
                'llm_feedback': llm_feedback,
                'raw_data': pronunciation_json
            }
            
        except Exception as e:
            return {
                'error': f"Error formatting feedback: {str(e)}",
                'raw_data': pronunciation_json
            }
    
    def is_configured(self) -> bool:
        """
        Check if LLM analyzer is properly configured.
        
        Returns:
            True if OpenAI API key is available, False otherwise
        """
        openai_api_key = os.getenv('OPENAI_API_KEY')
        return openai_api_key is not None and openai_api_key.strip() != ""
