"""
Core AI modules for Francoflex pronunciation practice.
"""

from .conversational_ai import ElevenLabsClient, PharmaScenarios
from .pronunciation_ai import AudioHandler, SpeechAceClient, LLMAnalyzer

__all__ = [
    "ElevenLabsClient", 
    "PharmaScenarios",
    "AudioHandler", 
    "SpeechAceClient", 
    "LLMAnalyzer"
]
