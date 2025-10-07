/**
 * Pronunciation Analysis Configuration
 * 
 * Centralized configuration for pronunciation analysis features
 */

// Supported Languages
export const LANGUAGES = {
  FRENCH: {
    code: 'fr-fr',
    name: 'French (France)',
    nativeCode: 'fr'
  },
  ENGLISH_US: {
    code: 'en-us',
    name: 'English (US)',
    nativeCode: 'en'
  },
  SPANISH: {
    code: 'es-es',
    name: 'Spanish (Spain)',
    nativeCode: 'es'
  }
};

// Default Settings
export const DEFAULTS = {
  analysisLanguage: 'fr-fr',
  nativeLanguage: 'en',
  includeFeedback: true,
  scoreThreshold: 70, // Minimum score for "good" pronunciation
};

// Scoring Thresholds
export const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  FAIR: 60,
  NEEDS_WORK: 40,
  POOR: 0
};

// Feedback Tone Options
export const FEEDBACK_TONES = {
  ENCOURAGING: 'encouraging', // Positive, supportive
  NEUTRAL: 'neutral',          // Objective, factual
  DETAILED: 'detailed',        // Comprehensive analysis
  BRIEF: 'brief'               // Short, concise
};

// AI Model Configuration
export const AI_CONFIG = {
  model: 'gpt-4o-mini',
  maxTokens: {
    brief: 100,
    standard: 200,
    detailed: 400
  },
  temperature: 0.7
};

// Audio Processing Limits
export const AUDIO_LIMITS = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  timeoutMs: 30000, // 30 seconds
  supportedFormats: ['wav', 'mp3', 'ogg', 'webm']
};

/**
 * Get score category based on score value
 * @param {number} score - Pronunciation score (0-100)
 * @returns {string} Category name
 */
export function getScoreCategory(score) {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'GOOD';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'FAIR';
  if (score >= SCORE_THRESHOLDS.NEEDS_WORK) return 'NEEDS_WORK';
  return 'POOR';
}

/**
 * Get encouragement message based on score
 * @param {number} score - Pronunciation score (0-100)
 * @returns {string} Encouragement message
 */
export function getEncouragementMessage(score) {
  const category = getScoreCategory(score);
  
  const messages = {
    EXCELLENT: "Outstanding! Your pronunciation is excellent! 🌟",
    GOOD: "Great job! You're doing really well! 👏",
    FAIR: "Good effort! Keep practicing to improve! 💪",
    NEEDS_WORK: "Keep going! Practice makes perfect! 📚",
    POOR: "Don't give up! Everyone starts somewhere! 🌱"
  };
  
  return messages[category];
}

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validated config with defaults
 */
export function validateConfig(config = {}) {
  return {
    analysisLanguage: config.analysisLanguage || DEFAULTS.analysisLanguage,
    nativeLanguage: config.nativeLanguage || DEFAULTS.nativeLanguage,
    includeFeedback: config.includeFeedback !== undefined ? config.includeFeedback : DEFAULTS.includeFeedback,
    feedbackTone: config.feedbackTone || FEEDBACK_TONES.ENCOURAGING,
    scoreThreshold: config.scoreThreshold || DEFAULTS.scoreThreshold
  };
}
