import { getSupabaseClient } from './_utils/supabase.js';

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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { user_id, level, mode = 'repeat' } = JSON.parse(event.body);

    if (!user_id || !level) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'user_id and level are required' })
      };
    }

    const supabase = getSupabaseClient();

    // Create session content based on level
    const sessionContent = generateSessionContent(level);

    // Insert new session
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user: user_id,
        level: level,
        mode: mode,
        content: sessionContent,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: data
      })
    };

  } catch (error) {
    console.error('Create session error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to create session',
        details: error.message
      })
    };
  }
}

function generateSessionContent(level) {
  const content = {
    beginner: [
      {
        learning: "Bonjour, comment allez-vous?",
        native: "Hello, how are you?",
        audio_url: null
      },
      {
        learning: "Je m'appelle...",
        native: "My name is...",
        audio_url: null
      },
      {
        learning: "Enchanté de vous rencontrer",
        native: "Nice to meet you",
        audio_url: null
      }
    ],
    intermediate: [
      {
        learning: "Pouvez-vous m'aider avec ce projet?",
        native: "Can you help me with this project?",
        audio_url: null
      },
      {
        learning: "J'aimerais réserver une table pour deux personnes",
        native: "I would like to reserve a table for two people",
        audio_url: null
      }
    ],
    advanced: [
      {
        learning: "Nous devons discuter des implications stratégiques de cette décision",
        native: "We need to discuss the strategic implications of this decision",
        audio_url: null
      },
      {
        learning: "Je pense que nous devrions reconsidérer notre approche",
        native: "I think we should reconsider our approach",
        audio_url: null
      }
    ]
  };

  return content[level] || content.beginner;
}
