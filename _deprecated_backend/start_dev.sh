#!/bin/bash

# Start both Francoflex API and React app in development mode

echo "🎤 Starting Francoflex Development Environment..."
echo "=============================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Please create .env with your API keys:"
    echo "OPENAI_API_KEY=your_key_here"
    echo "SPEECHACE_API_KEY=your_key_here"
    echo "ELEVENLABS_API_KEY=your_key_here"
    echo ""
fi

# Function to kill background processes on script exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $API_PID $NEXT_PID 2>/dev/null
    exit
}

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start API server in background
echo "🚀 Starting FastAPI server (legacy)..."
cd _deprecated_backend
source ../venv/bin/activate
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload &
API_PID=$!
cd ..

# Wait a moment for API to start
sleep 3

# Start Next.js app in background
echo "🎨 Starting Next.js development server..."
cd web-client
npm run dev &
NEXT_PID=$!
cd ..

echo ""
echo "✅ Development environment started!"
echo "📊 API Server: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo "🎨 Next.js App: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
