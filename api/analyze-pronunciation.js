import axios from 'axios';
import FormData from 'form-data';
import { getOpenAIClient, DEFAULT_MODEL } from './_utils/openai.js';

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { audio_url, target_text, analysis_language = 'fr-fr', native_language = 'en' } = JSON.parse(event.body);

    if (!audio_url || !target_text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'audio_url and target_text are required' })
      };
    }

    // Call SpeechAce API
    const speechaceApiKey = process.env.SPEECHACE_API_KEY;
    if (!speechaceApiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'SpeechAce API key not configured' })
      };
    }

    // Download audio from URL
    const audioResponse = await axios.get(audio_url, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(audioResponse.data);

    // Prepare form data for SpeechAce
    const formData = new FormData();
    formData.append('user_audio_file', audioBuffer, 'audio.wav');
    formData.append('text', target_text);
    formData.append('dialect', analysis_language);
    formData.append('user_id', 'francoflex_user');

    // Call SpeechAce API
    const speechaceResponse = await axios.post(
      'https://api.speechace.co/api/scoring/speech/v9/json',
      formData,
      {
        params: {
          key: speechaceApiKey,
          dialect: analysis_language
        },
        headers: formData.getHeaders()
      }
    );

    const analysisResult = speechaceResponse.data;

    // Generate AI feedback using OpenAI
    const openai = getOpenAIClient();
    const overallScore = analysisResult.quality_score || 0;

    const aiResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a French pronunciation coach. Analyze the pronunciation data and provide helpful, encouraging feedback.`
        },
        {
          role: 'user',
          content: `The user attempted to say "${target_text}" and received a score of ${overallScore}/100. Provide brief, encouraging feedback with specific tips for improvement.`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    const aiFeedback = aiResponse.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          analysis: analysisResult,
          ai_feedback: aiFeedback,
          overall_score: overallScore
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
