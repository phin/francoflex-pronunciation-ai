"""
Pronunciation AI - French Pronunciation Practice Tool

A comprehensive tool for practicing French pronunciation using SpeechAce API
and OpenAI LLM analysis for detailed feedback.
"""

__version__ = "1.0.0"
__author__ = "FrancoFlex Team"

from .core.audio_handler import AudioHandler
from .core.speechace_client import SpeechAceClient
from .analysis.llm_analyzer import LLMAnalyzer

__all__ = ["AudioHandler", "SpeechAceClient", "LLMAnalyzer"]
