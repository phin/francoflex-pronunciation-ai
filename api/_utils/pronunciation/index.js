/**
 * Pronunciation Analysis - Main Orchestrator
 *
 * High-level API for pronunciation analysis that combines:
 * - Audio processing
 * - SpeechAce pronunciation analysis
 * - AI-powered feedback generation
 *
 * This module can be used in:
 * - Netlify Functions (HTTP API)
 * - NPM packages (library)
 * - Direct imports (monorepo)
 */

import { downloadAudio, validateAudioFormat, getAudioMetadata } from './audio-processor.js';
import { analyzePronunciation as analyzeSpeechAce } from '../speechace.js';
import { generateFeedback, generateDetailedReport, generateQuickFeedback } from './feedback-generator.js';
import { validateConfig, DEFAULTS } from './config.js';

/**
 * Analyze pronunciation from audio URL
 *
 * @param {Object} options - Analysis options
 * @param {string} options.audioUrl - URL of audio file to analyze
 * @param {string} options.targetText - Expected text that was spoken
 * @param {string} [options.analysisLanguage='fr-fr'] - Language to analyze (fr-fr, en-us, es-es)
 * @param {string} [options.nativeLanguage='en'] - User's native language
 * @param {boolean} [options.includeFeedback=true] - Whether to generate AI feedback
 * @param {string} [options.feedbackTone='encouraging'] - Tone of feedback (encouraging, neutral, detailed, brief)
 * @param {boolean} [options.detailedReport=false] - Generate detailed analysis report
 * @param {boolean} [options.quickFeedback=false] - Use quick feedback (no AI, faster)
 * @param {string} [options.userId] - User ID for tracking
 * @returns {Promise<Object>} Analysis result
 *
 * @example
 * const result = await analyzePronunciation({
 *   audioUrl: 'https://example.com/audio.wav',
 *   targetText: 'Bonjour',
 *   analysisLanguage: 'fr-fr',
 *   nativeLanguage: 'en'
 * });
 *
 * console.log(result.score); // 85
 * console.log(result.feedback.feedback); // AI-generated feedback
 */
export async function analyzePronunciation(options) {
  // Validate and normalize options
  const config = validateConfig(options);
  const {
    audioUrl,
    targetText,
    analysisLanguage,
    nativeLanguage,
    includeFeedback,
    feedbackTone,
    detailedReport = false,
    quickFeedback = false,
    userId
  } = { ...config, ...options };

  // Validate required parameters
  if (!audioUrl) {
    throw new Error('audioUrl is required');
  }
  if (!targetText) {
    throw new Error('targetText is required');
  }

  try {
    // Step 1: Download and validate audio
    const audioBuffer = await downloadAudio(audioUrl);
    validateAudioFormat(audioBuffer);
    const audioMeta = getAudioMetadata(audioBuffer);

    // Step 2: Analyze pronunciation with SpeechAce
    const speechaceResult = await analyzeSpeechAce(audioBuffer, targetText, {
      dialect: analysisLanguage,
      userId: userId
    });

    // Step 3: Generate feedback (if requested)
    let feedbackResult = null;

    if (includeFeedback) {
      if (detailedReport) {
        // Generate comprehensive detailed report
        feedbackResult = await generateDetailedReport(speechaceResult, {
          targetText,
          tone: feedbackTone,
          language: getLanguageName(analysisLanguage)
        });
      } else if (quickFeedback) {
        // Generate quick feedback without AI
        feedbackResult = generateQuickFeedback(speechaceResult);
      } else {
        // Generate standard AI feedback
        feedbackResult = await generateFeedback(speechaceResult, {
          targetText,
          tone: feedbackTone,
          language: getLanguageName(analysisLanguage)
        });
      }
    }

    // Return comprehensive result
    return {
      success: true,
      score: speechaceResult.quality_score || 0,
      analysis: speechaceResult,
      feedback: feedbackResult,
      metadata: {
        audioFormat: audioMeta.format,
        audioSize: audioMeta.sizeKB + ' KB',
        targetText,
        analysisLanguage,
        nativeLanguage,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    // Enhanced error handling
    console.error('Pronunciation analysis error:', error);

    throw new Error(`Pronunciation analysis failed: ${error.message}`);
  }
}

/**
 * Analyze pronunciation from audio buffer (for direct use)
 *
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} targetText - Expected text
 * @param {Object} options - Same options as analyzePronunciation
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzePronunciationFromBuffer(audioBuffer, targetText, options = {}) {
  const config = validateConfig(options);

  try {
    // Validate audio
    validateAudioFormat(audioBuffer);
    const audioMeta = getAudioMetadata(audioBuffer);

    // Analyze with SpeechAce
    const speechaceResult = await analyzeSpeechAce(audioBuffer, targetText, {
      dialect: config.analysisLanguage,
      userId: options.userId
    });

    // Generate feedback if requested
    let feedbackResult = null;
    if (config.includeFeedback) {
      feedbackResult = await generateFeedback(speechaceResult, {
        targetText,
        tone: config.feedbackTone,
        language: getLanguageName(config.analysisLanguage)
      });
    }

    return {
      success: true,
      score: speechaceResult.quality_score || 0,
      analysis: speechaceResult,
      feedback: feedbackResult,
      metadata: {
        audioFormat: audioMeta.format,
        audioSize: audioMeta.sizeKB + ' KB',
        targetText,
        analysisLanguage: config.analysisLanguage,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Pronunciation analysis error:', error);
    throw new Error(`Pronunciation analysis failed: ${error.message}`);
  }
}

/**
 * Get human-readable language name
 * @private
 */
function getLanguageName(languageCode) {
  const languages = {
    'fr-fr': 'French',
    'en-us': 'English',
    'es-es': 'Spanish'
  };
  return languages[languageCode] || 'French';
}

// Re-export useful utilities for advanced users
export { downloadAudio, validateAudioFormat } from './audio-processor.js';
export { generateFeedback, generateDetailedReport, generateQuickFeedback } from './feedback-generator.js';
export { analyzePronunciation as analyzeSpeechAce } from '../speechace.js';
export { LANGUAGES, SCORE_THRESHOLDS, FEEDBACK_TONES, getScoreCategory } from './config.js';
