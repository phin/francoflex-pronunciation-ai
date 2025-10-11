#!/bin/bash

# Francoflex Web Application Setup Script
echo "🎤 Setting up Francoflex Web Application..."
echo "=========================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Set up Python virtual environment
echo "📦 Setting up Python environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd api
pip install -r requirements.txt
cd ..

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd web-client
npm install --legacy-peer-deps
cd ..

# Check for environment variables
echo "🔧 Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOF
# Add your API keys here
OPENAI_API_KEY=your_openai_api_key_here
SPEECHACE_API_KEY=your_speechace_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
EOF
    echo "📝 Please edit .env file with your actual API keys"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start the API server:"
echo "   python start_api.py"
echo ""
echo "2. In a new terminal, start the React app:"
echo "   cd web-client && npm start"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 See README_WEBAPP.md for detailed documentation"
