// Health check endpoint
export async function handler(event, context) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      status: 'healthy',
      message: 'FrancoFlex API is running!',
      timestamp: new Date().toISOString()
    })
  };
}
