#!/usr/bin/env python3
"""
Start script for the Francoflex API server.
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    # Set up environment
    backend_dir = Path(__file__).parent / "_deprecated_backend"
    os.chdir(backend_dir)
    
    # Check if virtual environment exists
    venv_path = Path("../venv")
    if not venv_path.exists():
        print("Virtual environment not found. Please run:")
        print("python -m venv ../venv")
        print("source ../venv/bin/activate  # On Windows: ..\\venv\\Scripts\\activate")
        print("pip install -r requirements.txt")
        sys.exit(1)
    
    # Start the FastAPI server
    try:
        print("Starting Francoflex API server...")
        print("API will be available at: http://localhost:8000")
        print("API docs available at: http://localhost:8000/docs")
        print("\nPress Ctrl+C to stop the server")
        
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "api.main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\nShutting down server...")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
