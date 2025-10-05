from flask import Flask, send_from_directory, jsonify, request
import requests
import os

app = Flask(__name__)

# --- Static Files ---
# This serves files like index.html, styles.css, etc.
@app.route('/<path:path>')
def send_public(path):
    return send_from_directory('public', path)

@app.route('/')
def home():
    return send_from_directory('public', 'home.html')

# --- API Proxy ---
# All requests to /api/... will be forwarded to the external API
API_BASE_URL = "https://www.sankavollerei.com"

@app.route('/api/<path:subpath>')
def proxy(subpath):
    # Collect query parameters from the original request
    query_params = request.args.to_dict()
    
    # Construct the full URL for the external API
    full_url = f"{API_BASE_URL}/{subpath}"
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': API_BASE_URL + '/' # Some sites require a Referer header
        }
        
        # Make the request to the external API
        response = requests.get(full_url, headers=headers, params=query_params, timeout=15)
        
        # Raise an exception for bad status codes (like 404 or 500)
        response.raise_for_status()
        
        # Check the content type of the response
        if 'application/json' in response.headers.get('Content-Type', ''):
            # If it's JSON, return it as JSON
            return jsonify(response.json()), response.status_code
        else:
            # Otherwise, return it as plain text
            return response.text, response.status_code

    except requests.exceptions.HTTPError as e:
        # If the API returns an error (e.g., 404, 503), forward it
        return jsonify(error=f"API Error: {str(e)}", url=full_url), e.response.status_code
    except requests.exceptions.RequestException as e:
        # For other errors like connection problems or timeouts
        return jsonify(error=f"Proxy Connection Error: {str(e)}", url=full_url), 503 # Service Unavailable

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8010, debug=True)
