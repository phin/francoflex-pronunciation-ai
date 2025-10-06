import { getSupabaseClient } from './_utils/supabase.js';

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
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
    const { user_id } = event.queryStringParameters || {};

    if (!user_id) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'user_id is required' })
      };
    }

    const supabase = getSupabaseClient();

    // Get the most recent session for this user
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // If no session exists, create a new beginner session
    if (!data) {
      console.log('No session found, creating new beginner session for user:', user_id);

      const sessionContent = [
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
      ];

      const { data: newSession, error: createError } = await supabase
        .from('sessions')
        .insert({
          user: user_id,
          level: 'beginner',
          type: 'repeat',
          content: sessionContent,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating session:', createError);
        throw createError;
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: newSession
        })
      };
    }

    // Return existing session
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
    console.error('Get session error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to get session',
        details: error.message
      })
    };
  }
}
