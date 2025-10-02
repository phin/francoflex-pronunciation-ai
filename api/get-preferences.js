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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { user_id } = event.queryStringParameters || {};

    if (!user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'user_id is required' })
      };
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
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
        data: data || null
      })
    };

  } catch (error) {
    console.error('Get preferences error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to get preferences',
        details: error.message
      })
    };
  }
}
