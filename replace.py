import os
import re

directories = [
    r'apps\desktop\src',
    r'apps\desktop\electron',
    r'backend\src',
]

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace uppercase JARVIS
    new_content = re.sub(r'\bJARVIS\b', "Harsha's Assistant", content)
    # Replace capitalized Jarvis
    new_content = re.sub(r'\bJarvis\b', "Harsha's Assistant", new_content)
    # Replace lowercase jarvis only if it is not part of a technical identifier
    # i.e. not followed by an underscore, dash, dot, or part of a path
    new_content = re.sub(r'(?<![/\\]|-|_|\.)\bjarvis\b(?![/\\]|-|_|\.|_)', "Harsha's Assistant", new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.py', '.json', '.md', '.html')):
                replace_in_file(os.path.join(root, file))

# Also update package.json for product name specifically, avoiding the "name" field
# Actually package.json productName is "JARVIS" which will be caught by the \bJARVIS\b regex.
replace_in_file(r'apps\desktop\package.json')

print("Replacement complete.")
