import os
import re

def fix_entities(content):
    # This regex tries to find text nodes in JSX.
    # It looks for content between > and <
    # but avoids script tags, etc.
    
    def replacer(match):
        text = match.group(1)
        # Only replace if it's not a script or style tag and not just whitespace
        if text.strip():
            text = text.replace("'", "&apos;")
            text = text.replace('"', "&quot;")
        return f">{text}<"

    # Match text between tags, but be careful with nested braces
    # This is a simple approximation.
    fixed = re.sub(r'>([^<{]+)<', replacer, content)
    return fixed

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    fixed = fix_entities(content)
    
    if fixed != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"Fixed entities in {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))
