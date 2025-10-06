import axios from 'axios';
import FormData from 'form-data';

// SpeechAce API Configuration
export const SPEECHACE_ENDPOINT = process.env.SPEECHACE_API_ENDPOINT || 'https://api.speechace.co';
export const DEFAULT_DIALECT = 'fr-fr';
export const DEFAULT_USER_ID = 'francoflex_user';

/**
 * Get SpeechAce API key from environment
 * @throws {Error} If API key is not configured
 */
function getSpeechAceApiKey() {
  const apiKey = process.env.SPEECHACE_API_KEY;
  if (!apiKey) {
    throw new Error('SpeechAce API key not configured');
  }
  return apiKey;
}

/**
 * Analyze pronunciation using SpeechAce API
 * 
 * @param {Buffer} audioBuffer - Audio file as buffer
 * @param {string} targetText - Expected text to be spoken
 * @param {Object} options - Analysis options
 * @param {string} options.dialect - Language dialect (e.g., 'fr-fr', 'en-us')
 * @param {string} options.userId - User identifier for tracking
 * @returns {Promise<Object>} SpeechAce analysis result
 */
export async function analyzePronunciation(audioBuffer, targetText, options = {}) {
  const {
    dialect = DEFAULT_DIALECT,
    userId = DEFAULT_USER_ID
  } = options;

  const apiKey = getSpeechAceApiKey();

  // Prepare form data
  const formData = new FormData();
  formData.append('user_audio_file', audioBuffer, 'audio.wav');
  formData.append('text', targetText);
  formData.append('dialect', dialect);
  formData.append('user_id', userId);

  // Call SpeechAce API
  const response = await axios.post(
    `${SPEECHACE_ENDPOINT}/api/scoring/speech/v9/json`,
    formData,
    {
      params: {
        key: apiKey,
        dialect: dialect
      },
      headers: formData.getHeaders()
    }
  );

  return response.data;
}

/**
 * Extract quality score from SpeechAce response
 * @param {Object} analysisResult - SpeechAce API response
 * @returns {number} Quality score (0-100)
 */
export function extractQualityScore(analysisResult) {
  return analysisResult.quality_score || 0;
}

/**
 * Extract word-level details from SpeechAce response
 * @param {Object} analysisResult - SpeechAce API response
 * @returns {Array} Array of word analysis objects
 */
export function extractWordDetails(analysisResult) {
  return analysisResult.words || [];
}

/**
 * Check if analysis result indicates good pronunciation
 * @param {Object} analysisResult - SpeechAce API response
 * @param {number} threshold - Minimum score for "good" (default: 70)
 * @returns {boolean}
 */
export function isGoodPronunciation(analysisResult, threshold = 70) {
  const score = extractQualityScore(analysisResult);
  return score >= threshold;
}
