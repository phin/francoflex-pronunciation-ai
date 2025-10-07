"""
Conversational AI package for French pharmaceutical workplace practice.

This package provides:
- ElevenLabs integration for French speech synthesis
- Pharmaceutical workplace conversation scenarios
- Streamlit UI for interactive practice sessions
"""

__version__ = "1.0.0"
__author__ = "FrancoFlex Team"

from .client import ElevenLabsClient
from .scenarios import PharmaScenarios
from .ui import ConversationUI

__all__ = ["ElevenLabsClient", "PharmaScenarios", "ConversationUI"]
