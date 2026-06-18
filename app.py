import re
import time
import xml.etree.ElementTree as ET
import urllib.request
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Simple in-memory cache
cached_data = None
cache_expiry = 0  # Unix timestamp
CACHE_DURATION_SEC = 300  # 5 minutes

def extract_category_and_content(raw_content):
    """
    Extracts the category from <h3>Tags</h3> (e.g. <h3>Feature</h3>)
    and removes it from the main content body.
    """
    if not raw_content:
        return "General", ""
    
    # Regex to find the first <h3> tag content
    match = re.search(r'<h3>(.*?)</h3>', raw_content, re.IGNORECASE)
    if match:
        category = match.group(1).strip()
        # Remove only the first occurrence of the h3 tag
        clean_content = re.sub(r'<h3>.*?</h3>', '', raw_content, count=1, flags=re.IGNORECASE).strip()
        return category, clean_content
    
    return "General", raw_content

def fetch_and_parse_feed():
    """
    Fetches the BigQuery Release Notes RSS feed and parses it.
    """
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as response:
        xml_data = response.read()
        
    root = ET.fromstring(xml_data)
    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = []
    
    for entry in root.findall('atom:entry', namespaces):
        title_el = entry.find('atom:title', namespaces)
        updated_el = entry.find('atom:updated', namespaces)
        link_el = entry.find('atom:link[@rel="alternate"]', namespaces)
        if link_el is None:
            link_el = entry.find('atom:link', namespaces)
        content_el = entry.find('atom:content', namespaces)
        
        title = title_el.text if title_el is not None else "Unknown Date"
        updated = updated_el.text if updated_el is not None else ""
        link = link_el.attrib.get('href') if link_el is not None else "https://cloud.google.com/bigquery/docs/release-notes"
        raw_content = content_el.text if content_el is not None else ""
        
        category, clean_content = extract_category_and_content(raw_content)
        
        entries.append({
            'title': title,
            'updated': updated,
            'link': link,
            'category': category,
            'content': clean_content,
            'raw_content': raw_content
        })
        
    return entries

def get_release_notes(force_refresh=False):
    global cached_data, cache_expiry
    current_time = time.time()
    
    if force_refresh or not cached_data or current_time > cache_expiry:
        try:
            cached_data = fetch_and_parse_feed()
            cache_expiry = current_time + CACHE_DURATION_SEC
        except Exception as e:
            if cached_data:
                # Fallback to old cache
                print(f"Error fetching feed: {e}. Serving cached data.")
            else:
                raise e
                
    return cached_data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def api_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        releases = get_release_notes(force_refresh=force_refresh)
        return jsonify({
            'status': 'success',
            'timestamp': time.time(),
            'releases': releases
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    # Run the application locally
    app.run(host='0.0.0.0', port=5001, debug=True)
