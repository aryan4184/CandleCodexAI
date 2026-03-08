import re
import json

def parse_html(filename):
    with open(filename, 'r') as f:
        html = f.read()
    
    # Regex to find AF_initDataCallback
    # Format: AF_initDataCallback({key: 'ds:1', hash: '...', data: [...]});
    pattern = r"AF_initDataCallback\s*\(\s*({.*?})\s*\)\s*;"
    matches = re.finditer(pattern, html, re.DOTALL)
    
    for match in matches:
        json_str = match.group(1)
        # Fix JS object syntax to valid JSON?
        # Typically keys are not quoted sometimes.
        # But data usually is a list.
        # Let's try to extract the 'data' part: data: [...]
        data_match = re.search(r"data\s*:\s*(\[.*\])\s*,\s*sideChannel", json_str, re.DOTALL)
        if not data_match:
             data_match = re.search(r"data\s*:\s*(\[.*\])\s*}", json_str, re.DOTALL)

        if data_match:
            data_str = data_match.group(1)
            try:
                data = json.loads(data_str)
                # Look for time series array [[ts, price, ...], ...]
                # Google usually nests deeply.
                # Let's verify structure.
                print(f"Parsed data length: {len(str(data))}")
                # Check for array of arrays with numbers
                # Sample logic: check strictly if it contains chart data
                # Usually it's in data[0][0][0]...
                pass 
            except:
                pass

    # Alternative: Look for simpler pattern directly in HTML
    # search for `[[` followed by numbers
    print("Direct search for array patterns:")
    arrays = re.findall(r"\[\[\d{10},", html)
    print(f"Found {len(arrays)} potential timestamp arrays.")

if __name__ == "__main__":
    parse_html("google_tcs.html")
