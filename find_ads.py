import json
import re
import os

file_path = r"C:\tmp\olx_test.html"

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Content length: {len(content)}")

# Search for common OLX data patterns
patterns = [
    (r'window\.__INITIAL_STATE__\s*=\s*(\{.*?\});', "__INITIAL_STATE__"),
    (r'window\.dataLayer\s*=\s*\[(.*?)\];', "dataLayer"),
    (r'id="__NEXT_DATA__".*?>(\{.*?\})</script>', "__NEXT_DATA__"),
    (r'\{"adList":\[(.*?)\]\}', "adList"),
    (r'\{"listAds":\[(.*?)\]\}', "listAds")
]

found = False
for pattern, name in patterns:
    match = re.search(pattern, content, re.DOTALL)
    if match:
        found = True
        print(f"Match found for pattern: {name}")
        snippet = match.group(1)
        print(f"Snippet start: {snippet[:200]}")
        try:
            # dataLayer can be tricky if it's multiple objects
            if name == "dataLayer":
                # dataLayer is usually a list of objects, might need to wrap it if it's just the content
                data = json.loads("[" + snippet + "]")
            else:
                data = json.loads(snippet)
            print("Successfully parsed JSON")
            with open(r"D:\Sources\BAI\olx_snippet.json", "w", encoding='utf-8') as out:
                json.dump(data, out, indent=2)
            print(f"Snippet saved to D:\\Sources\\BAI\\olx_snippet.json")
            break
        except Exception as e:
            print(f"Error parsing JSON for {name}: {e}")

if not found:
    print("No regex matches found. Searching for 'subject'...")
    if "subject" in content:
        pos = content.find('"subject"')
        print(f"Context: {content[pos:pos+1000]}")
    else:
        print("'subject' not found. Searching for 'listAds'...")
        if "listAds" in content:
            pos = content.find('"listAds"')
            print(f"Context: {content[pos:pos+1000]}")
        else:
            print("Neither 'subject' nor 'listAds' found.")
