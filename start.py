#!/usr/bin/env python3
import os
import re
import subprocess

# Get the API key from environment
api_key = os.environ.get('GEMINI_API_KEY', '')

if api_key:
    # Read the index.html file
    with open('index.html', 'r') as file:
        content = file.read()
    
    # Replace the placeholder with the actual API key
    content = content.replace(
        "window.GEMINI_API_KEY = window.GEMINI_API_KEY || null;",
        f"window.GEMINI_API_KEY = '{api_key}';"
    )
    
    # Write back to a temporary file
    with open('index_temp.html', 'w') as file:
        file.write(content)
    
    # Replace original with updated version
    os.rename('index_temp.html', 'index.html')

# Start the HTTP server
subprocess.run(['python', '-m', 'http.server', '5000'])