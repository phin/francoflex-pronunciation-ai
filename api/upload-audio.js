import { getSupabaseClient } from './_utils/supabase.js';
import multipart from 'lambda-multipart-parser';

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
    // Parse multipart form data
    const result = await multipart.parse(event);

    const file = result.files?.[0];
    const userId = result.user_id;
    const sessionId = result.session_id;

    if (!file) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No file uploaded' })
      };
    }

    if (!userId) {
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

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${sessionId || 'audio'}/${timestamp}-${file.filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('audio')
      .upload(filename, file.content, {
        contentType: file.contentType,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('audio')
      .getPublicUrl(filename);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          audio_url: urlData.publicUrl,
          filename: filename
        }
      })
    };

  } catch (error) {
    console.error('Upload audio error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to upload audio',
        details: error.message
      })
    };
  }
}
