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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { learning, native, industry, job, name, user_id } = JSON.parse(event.body);

    if (!user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'user_id is required' })
      };
    }

    const supabase = getSupabaseClient();

    // Upsert user preferences (matching the SQL schema)
    const { data, error } = await supabase
      .from('preferences')
      .upsert({
        user: user_id,  // Column name is "user" not "user_id"
        learning: learning,
        native: native,
        industry,
        job,
        name,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user'
      })
      .select()
      .single();

    if (error) {
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
        message: 'Preferences saved successfully',
        data
      })
    };

  } catch (error) {
    console.error('Save preferences error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to save preferences',
        details: error.message
      })
    };
  }
}
