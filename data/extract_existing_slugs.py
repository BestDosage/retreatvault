"""
Extract existing retreat slugs from Supabase to use for deduplication.
Usage: python3 extract_existing_slugs.py
Output: ../src/data/existing-slugs.json
"""

import json
import os
import sys

# Add parent dir to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Read .env.local for Supabase credentials
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
env_vars = {}
try:
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                env_vars[key.strip()] = val.strip()
except FileNotFoundError:
    print(f"No .env.local found at {env_path}")
    sys.exit(1)

url = env_vars.get("NEXT_PUBLIC_SUPABASE_URL", "")
key = env_vars.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

if not url or not key:
    print("Missing Supabase credentials in .env.local")
    sys.exit(1)

# Use requests to hit Supabase REST API directly
import requests

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
}

resp = requests.get(
    f"{url}/rest/v1/retreats?select=slug,name&order=slug",
    headers=headers,
    timeout=30,
)
resp.raise_for_status()
data = resp.json()

slugs = [r["slug"] for r in data]
names = [r["name"] for r in data]

output_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "existing-slugs.json")
with open(output_path, "w") as f:
    json.dump(slugs, f, indent=2)

print(f"Extracted {len(slugs)} existing slugs to {output_path}")
print(f"Sample: {slugs[:5]}")
