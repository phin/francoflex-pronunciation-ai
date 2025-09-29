"""Pharmaceutical workplace conversation scenarios for French practice."""

from typing import List, Dict, Any
import random

class PharmaScenarios:
    """Manages pharmaceutical workplace conversation scenarios for French practice."""
    
    def __init__(self):
        """Initialize with pharmaceutical workplace scenarios."""
        self.scenarios = {
            'meeting_presentation': {
                'title': 'Présentation en Réunion',
                'description': 'Practice presenting pharmaceutical data in a team meeting',
                'questions': [
                    "Bonjour, pouvez-vous nous présenter les résultats de l'étude clinique de phase III ?",
                    "Quels sont les effets secondaires les plus fréquents observés ?",
                    "Pouvez-vous expliquer la méthodologie utilisée dans cette recherche ?",
                    "Quel est le délai de mise sur le marché prévu ?",
                    "Avez-vous des questions sur la posologie recommandée ?"
                ],
                'voice_type': 'professional_female'
            },
            
            'patient_consultation': {
                'title': 'Consultation Patient',
                'description': 'Practice patient consultation and medication counseling',
                'questions': [
                    "Bonjour, comment vous sentez-vous depuis votre dernière visite ?",
                    "Avez-vous pris vos médicaments comme prescrit ?",
                    "Avez-vous ressenti des effets secondaires ?",
                    "Pouvez-vous me décrire vos symptômes actuels ?",
                    "Avez-vous des allergies médicamenteuses connues ?"
                ],
                'voice_type': 'friendly_female'
            },
            
            'regulatory_meeting': {
                'title': 'Réunion Réglementaire',
                'description': 'Practice regulatory compliance discussions',
                'questions': [
                    "Pouvez-vous confirmer que tous les documents sont conformes aux exigences de l'ANSM ?",
                    "Quels sont les délais pour l'obtention de l'autorisation de mise sur le marché ?",
                    "Avez-vous vérifié la conformité avec les bonnes pratiques de fabrication ?",
                    "Quels sont les risques identifiés dans l'évaluation bénéfice-risque ?",
                    "Pouvez-vous présenter le plan de pharmacovigilance ?"
                ],
                'voice_type': 'professional_male'
            },
            
            'laboratory_discussion': {
                'title': 'Discussion Laboratoire',
                'description': 'Practice laboratory and research discussions',
                'questions': [
                    "Pouvez-vous expliquer les résultats des tests de stabilité ?",
                    "Quelle est la pureté du composé actif ?",
                    "Avez-vous effectué les tests de dissolution requis ?",
                    "Quels sont les paramètres de qualité contrôlés ?",
                    "Pouvez-vous présenter le certificat d'analyse ?"
                ],
                'voice_type': 'professional_female'
            },
            
            'sales_meeting': {
                'title': 'Réunion Commerciale',
                'description': 'Practice pharmaceutical sales and marketing discussions',
                'questions': [
                    "Quels sont les avantages de notre nouveau médicament par rapport à la concurrence ?",
                    "Pouvez-vous présenter les données d'efficacité clinique ?",
                    "Quel est le prix de vente recommandé ?",
                    "Quelle est la stratégie de lancement sur le marché ?",
                    "Avez-vous des questions sur la formation des équipes commerciales ?"
                ],
                'voice_type': 'professional_male'
            }
        }
    
    def get_scenario(self, scenario_name: str) -> Dict[str, Any]:
        """
        Get a specific scenario by name.
        
        Args:
            scenario_name: Name of the scenario
            
        Returns:
            Scenario data or None if not found
        """
        return self.scenarios.get(scenario_name)
    
    def get_all_scenarios(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all available scenarios.
        
        Returns:
            Dictionary of all scenarios
        """
        return self.scenarios
    
    def get_random_question(self, scenario_name: str) -> str:
        """
        Get a random question from a specific scenario.
        
        Args:
            scenario_name: Name of the scenario
            
        Returns:
            Random question or empty string if scenario not found
        """
        scenario = self.get_scenario(scenario_name)
        if scenario and 'questions' in scenario:
            return random.choice(scenario['questions'])
        return ""
    
    def get_scenario_voice_type(self, scenario_name: str) -> str:
        """
        Get the recommended voice type for a scenario.
        
        Args:
            scenario_name: Name of the scenario
            
        Returns:
            Voice type or default voice
        """
        scenario = self.get_scenario(scenario_name)
        if scenario and 'voice_type' in scenario:
            return scenario['voice_type']
        return 'professional_female'
    
    def get_scenario_list(self) -> List[Dict[str, str]]:
        """
        Get a list of scenarios with titles and descriptions.
        
        Returns:
            List of scenario information
        """
        return [
            {
                'name': name,
                'title': data['title'],
                'description': data['description']
            }
            for name, data in self.scenarios.items()
        ]
