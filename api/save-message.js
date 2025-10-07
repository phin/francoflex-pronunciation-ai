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
    const { author, session_id, content, audio_url, ai_feedback } = JSON.parse(event.body);

    // Use ai_feedback as content if content is not provided (for system messages)
    // For system messages without content, use a placeholder
    let messageContent = content || ai_feedback || '';

    if (!messageContent && author === 'system') {
      messageContent = '[System message]';
    }

    if (!author || !session_id) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'author and session_id are required' })
      };
    }

    if (!messageContent) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'content or ai_feedback is required for user messages' })
      };
    }

    // Validate author is either 'user' or 'system'
    if (author !== 'user' && author !== 'system') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'author must be "user" or "system"' })
      };
    }

    const supabase = getSupabaseClient();

    // Insert message (store audio_url in metadata)
    const messageData = {
      author: author,
      session: session_id,
      content: messageContent,
      created_at: new Date().toISOString()
    };

    // Add audio_url to metadata if provided
    if (audio_url) {
      messageData.metadata = { audio_url: audio_url };
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
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
    console.error('Save message error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to save message',
        details: error.message
      })
    };
  }
}
