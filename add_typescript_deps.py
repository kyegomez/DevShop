#!/usr/bin/env python3
"""
Add missing TypeScript dependencies to fix builds
"""

import os
import json
from pathlib import Path

def add_typescript_deps(app_path):
    """Add TypeScript dependencies to package.json"""
    package_json_path = app_path / "package.json"
    
    if not package_json_path.exists():
        return False
    
    with open(package_json_path, "r") as f:
        package_data = json.load(f)
    
    # Add TypeScript dependencies
    if "devDependencies" not in package_data:
        package_data["devDependencies"] = {}
    
    package_data["devDependencies"].update({
        "typescript": "^5",
        "@types/react": "^18", 
        "@types/node": "^20"
    })
    
    with open(package_json_path, "w") as f:
        json.dump(package_data, f, indent=2)
    
    return True

def main():
    """Add TypeScript deps to all apps"""
    generated_apps_dir = Path("generated_apps")
    
    app_dirs = [d for d in generated_apps_dir.iterdir() if d.is_dir()]
    
    for app_dir in app_dirs:
        if add_typescript_deps(app_dir):
            print(f"✅ Added TypeScript deps to {app_dir.name}")

if __name__ == "__main__":
    main()