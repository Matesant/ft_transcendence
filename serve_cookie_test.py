#!/usr/bin/env python3
"""
Simple HTTP server to serve the cookie test HTML file.
This solves the issue of cookies not working from file:// protocol.
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Get the directory of this script
SCRIPT_DIR = Path(__file__).parent.absolute()
HTML_FILE = SCRIPT_DIR / "cookie-test-fixed.html"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SCRIPT_DIR, **kwargs)
    
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        super().end_headers()

def main():
    PORT = 8080
    
    if not HTML_FILE.exists():
        print(f"❌ HTML file not found: {HTML_FILE}")
        print("Make sure cookie-test-fixed.html exists in the same directory.")
        return
    
    try:
        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            print("🚀 Starting Cookie Test Server...")
            print(f"📂 Serving files from: {SCRIPT_DIR}")
            print(f"🌐 Server running at: http://localhost:{PORT}")
            print(f"🍪 Cookie test page: http://localhost:{PORT}/cookie-test-fixed.html")
            print("📋 Use Ctrl+C to stop the server")
            print()
            
            # Try to open the browser automatically
            try:
                url = f"http://localhost:{PORT}/cookie-test-fixed.html"
                print(f"🖥️ Opening browser: {url}")
                webbrowser.open(url)
            except Exception as e:
                print(f"⚠️ Could not open browser automatically: {e}")
                print(f"Please open manually: http://localhost:{PORT}/cookie-test-fixed.html")
            
            print("\n💡 Tips for Windows users:")
            print("  • This server runs on the same protocol (HTTP) as your services")
            print("  • Cookies should work properly from http://localhost:8080")
            print("  • Try 'Debug Auth Flow' for complete testing")
            print("  • If still having issues, check if your services are running")
            print()
            
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use.")
            print("Try stopping other servers or use a different port.")
        else:
            print(f"❌ Error starting server: {e}")
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")

if __name__ == "__main__":
    main()
