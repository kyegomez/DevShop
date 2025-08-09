#!/usr/bin/env python3
"""
Fix Next.js detection issues and ensure proper deployment
"""

import os
import json
import subprocess
from pathlib import Path
import shutil

def fix_app_structure(app_path, app_name):
    """Fix Next.js app structure to ensure Vercel detection"""
    print(f"🔧 Fixing {app_name}...")
    
    # Ensure proper directory structure
    app_dir = app_path / "app"
    if not app_dir.exists():
        app_dir.mkdir()
    
    # Create/update package.json with exact Next.js configuration
    package_json = {
        "name": app_name.lower().replace(" ", "-").replace("_", "-"),
        "version": "0.1.0",
        "private": True,
        "scripts": {
            "dev": "next dev",
            "build": "next build",
            "start": "next start",
            "lint": "next lint"
        },
        "dependencies": {
            "next": "14.0.0",
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
        },
        "devDependencies": {
            "typescript": "^5.2.2",
            "@types/node": "^20.8.10",
            "@types/react": "^18.2.37",
            "@types/react-dom": "^18.2.15",
            "eslint": "^8.54.0",
            "eslint-config-next": "14.0.0"
        }
    }
    
    with open(app_path / "package.json", "w") as f:
        json.dump(package_json, f, indent=2)
    
    # Create next.config.js (standard Next.js config)
    next_config = """/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig"""
    
    with open(app_path / "next.config.js", "w") as f:
        f.write(next_config)
    
    # Ensure .vercel directory is clean
    vercel_dir = app_path / ".vercel"
    if vercel_dir.exists():
        shutil.rmtree(vercel_dir)
    
    return True

def redeploy_fixed_app(app_path, app_name, token):
    """Deploy the fixed Next.js app"""
    print(f"🚀 Redeploying {app_name}...")
    
    os.chdir(app_path)
    
    try:
        # Force new project creation with explicit Next.js detection
        result = subprocess.run(
            ["vercel", "--token", token, "--prod", "--yes", "--force"],
            capture_output=True,
            text=True,
            timeout=180
        )
        
        if result.returncode == 0:
            # Extract URL from output
            lines = result.stdout.split('\\n')
            for line in lines:
                if 'Production:' in line or ('https://' in line and 'vercel.app' in line):
                    if 'Production:' in line:
                        url = line.split('Production:')[-1].strip()
                    else:
                        url = line.strip()
                    if url.startswith('https://') and 'vercel.app' in url:
                        print(f"  ✅ Deployed: {url}")
                        return url
            
            print(f"  ✅ Deployed (check Vercel dashboard)")
            return True
        else:
            print(f"  ❌ Deployment failed")
            print(f"  Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    """Fix Next.js detection and redeploy all apps"""
    generated_apps_dir = Path("generated_apps")
    token = "WKa82HKKJZTvBXMb8KBJp1Wb"
    
    # All apps that need fixing
    apps_to_fix = [
        "task_manager_pro",
        "habit_tracker", 
        "plant_care",
        "language_exchange",
        "workout_planner",
        "local_events",
        "inventory_manager"
    ]
    
    original_dir = os.getcwd()
    successful_deployments = {}
    
    print("🔧 Fixing Next.js detection issues...\n")
    
    for app_dir_name in apps_to_fix:
        app_path = generated_apps_dir / app_dir_name
        app_name = app_dir_name.replace("_", " ").title()
        
        if not app_path.exists():
            continue
        
        # Fix the app structure
        fix_app_structure(app_path, app_name)
        
        # Redeploy
        result = redeploy_fixed_app(app_path, app_name, token)
        if result:
            successful_deployments[app_name] = result
        
        os.chdir(original_dir)
        print()
    
    # Display results
    print("="*60)
    print("🎉 NEXT.JS FIX RESULTS")
    print("="*60)
    print(f"✅ Fixed and deployed: {len(successful_deployments)}/{len(apps_to_fix)} apps")
    
    # Add the working apps that were already deployed
    all_working_urls = {
        "Budget Tracker": "https://budgettracker-5kl31x9yq-ellisosborn03s-projects.vercel.app",
        "Study Buddy": "https://studybuddy-4anqyynld-ellisosborn03s-projects.vercel.app", 
        "Recipe Finder": "https://recipefinder-5ln251m5g-ellisosborn03s-projects.vercel.app"
    }
    
    # Merge with newly fixed apps
    all_working_urls.update(successful_deployments)
    
    print(f"\n🔗 ALL WORKING DEPLOYMENT URLS ({len(all_working_urls)} total):")
    for i, (app_name, url) in enumerate(sorted(all_working_urls.items()), 1):
        if isinstance(url, str) and url.startswith('https://'):
            print(f"  {i:2d}. {app_name}: {url}")
        else:
            print(f"  {i:2d}. {app_name}: Check Vercel dashboard")
    
    # Save to file
    with open("final_deployment_urls.json", "w") as f:
        json.dump(all_working_urls, f, indent=2)
    
    print(f"\n💾 All URLs saved to: final_deployment_urls.json")

if __name__ == "__main__":
    main()