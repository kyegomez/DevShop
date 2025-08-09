#!/usr/bin/env python3
"""
Fix deployment issues by converting to plain JavaScript
"""

import os
import json
import subprocess
from pathlib import Path

def fix_app_deployment(app_path, app_name):
    """Fix a single app by removing TypeScript and using plain JS"""
    print(f"🔧 Fixing {app_name}...")
    
    # Remove tsconfig.json if it exists
    tsconfig_path = app_path / "tsconfig.json"
    if tsconfig_path.exists():
        tsconfig_path.unlink()
        print(f"  ✅ Removed tsconfig.json")
    
    # Convert .tsx files to .jsx
    app_dir = app_path / "app"
    if app_dir.exists():
        for tsx_file in app_dir.glob("*.tsx"):
            jsx_file = app_dir / tsx_file.name.replace(".tsx", ".jsx")
            tsx_file.rename(jsx_file)
            print(f"  ✅ Renamed {tsx_file.name} to {jsx_file.name}")
    
    # Update package.json to remove TypeScript
    package_json_path = app_path / "package.json"
    if package_json_path.exists():
        with open(package_json_path, "r") as f:
            package_data = json.load(f)
        
        # Remove TypeScript dependencies
        if "devDependencies" in package_data:
            package_data["devDependencies"].pop("typescript", None)
            package_data["devDependencies"].pop("@types/react", None)
            package_data["devDependencies"].pop("@types/node", None)
            if not package_data["devDependencies"]:
                del package_data["devDependencies"]
        
        with open(package_json_path, "w") as f:
            json.dump(package_data, f, indent=2)
        
        print(f"  ✅ Updated package.json")
    
    return True

def redeploy_app(app_path, app_name, token):
    """Redeploy a fixed app to Vercel"""
    print(f"🚀 Redeploying {app_name}...")
    
    os.chdir(app_path)
    
    try:
        result = subprocess.run(
            ["vercel", "--token", token, "--prod", "--yes"],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            print(f"  ✅ Successfully redeployed {app_name}")
            return True
        else:
            print(f"  ❌ Failed to redeploy {app_name}")
            print(f"  Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error redeploying {app_name}: {e}")
        return False

def main():
    """Fix all deployment issues"""
    generated_apps_dir = Path("generated_apps")
    token = "WKa82HKKJZTvBXMb8KBJp1Wb"
    
    # Apps that need fixing
    failed_apps = [
        "task_manager_pro",
        "habit_tracker", 
        "plant_care",
        "language_exchange",
        "workout_planner",
        "local_events",
        "inventory_manager"
    ]
    
    original_dir = os.getcwd()
    fixed_count = 0
    
    print("🔧 Fixing deployment issues...\n")
    
    for app_dir_name in failed_apps:
        app_path = generated_apps_dir / app_dir_name
        app_name = app_dir_name.replace("_", " ").title()
        
        if not app_path.exists():
            print(f"❌ {app_name}: Directory not found")
            continue
        
        # Fix the app
        if fix_app_deployment(app_path, app_name):
            # Redeploy
            if redeploy_app(app_path, app_name, token):
                fixed_count += 1
        
        os.chdir(original_dir)
        print()
    
    print(f"🎉 Fixed and redeployed {fixed_count}/{len(failed_apps)} apps")

if __name__ == "__main__":
    main()