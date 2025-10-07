/**
 * Netlify Function: Pronunciation Analysis
 *
 * HTTP wrapper around the reusable pronunciation analysis module.
 * The core logic is in /api/_utils/pronunciation/ for easy reuse.
 */

import { analyzePronunciation } from './_utils/pronunciation/index.js';

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const {
      audio_url,
      target_text,
      analysis_language = 'fr-fr',
      native_language = 'en',
      session_id,
      feedback_tone = 'encouraging',
      detailed = false
    } = JSON.parse(event.body);

    // Validate required fields
    if (!audio_url || !target_text) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'audio_url and target_text are required'
        })
      };
    }

    // Call reusable pronunciation analysis module
    const result = await analyzePronunciation({
      audioUrl: audio_url,
      targetText: target_text,
      analysisLanguage: analysis_language,
      nativeLanguage: native_language,
      includeFeedback: true,
      feedbackTone: feedback_tone,
      detailedReport: detailed,
      userId: session_id
    });

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          analysis: result.analysis,
          ai_feedback: result.feedback?.feedback,
          encouragement: result.feedback?.encouragement,
          overall_score: result.score,
          category: result.feedback?.category,
          metadata: result.metadata
        }
      })
    };

  } catch (error) {
    console.error('Pronunciation analysis error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to analyze pronunciation',
        details: error.message
      })
    };
  }
}
