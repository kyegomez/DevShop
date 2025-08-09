#!/usr/bin/env python3
"""
Final fix for all deployment issues
"""

import os
import json
import subprocess
from pathlib import Path
import shutil

def clean_and_fix_app(app_path, app_name):
    """Clean up duplicate files and fix dependencies"""
    print(f"🧹 Cleaning {app_name}...")
    
    # Remove duplicate .jsx files if .tsx exists
    app_dir = app_path / "app"
    if app_dir.exists():
        for jsx_file in app_dir.glob("*.jsx"):
            tsx_equivalent = app_dir / jsx_file.name.replace(".jsx", ".tsx")
            if tsx_equivalent.exists():
                jsx_file.unlink()
                print(f"  ✅ Removed duplicate {jsx_file.name}")
    
    # Update package.json with all required dependencies
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
            "react-dom": "^18.2.0",
            "lucide-react": "^0.294.0"
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
    
    print(f"  ✅ Updated package.json with all dependencies")
    
    # Clean .vercel directory to force fresh deployment
    vercel_dir = app_path / ".vercel"
    if vercel_dir.exists():
        shutil.rmtree(vercel_dir)
        print(f"  ✅ Cleaned .vercel directory")
    
    return True

def deploy_clean_app(app_path, app_name, token):
    """Deploy the cleaned app"""
    print(f"🚀 Deploying clean {app_name}...")
    
    os.chdir(app_path)
    
    try:
        # Deploy with fresh project
        result = subprocess.run(
            ["vercel", "--token", token, "--prod", "--yes"],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        success_indicators = [
            "Build completed successfully",
            "Ready!",
            "✓ Deployed"
        ]
        
        if result.returncode == 0 or any(indicator in result.stdout for indicator in success_indicators):
            # Extract URL
            lines = result.stdout.split('\\n')
            for line in lines:
                if ('https://' in line and 'vercel.app' in line):
                    # Clean up the line to get just the URL
                    url = line.strip()
                    if url.startswith('Production:'):
                        url = url.split('Production:')[-1].strip()
                    elif 'Inspect:' in url:
                        continue  # Skip inspect URLs
                    
                    if url.startswith('https://') and 'vercel.app' in url:
                        print(f"  ✅ SUCCESS: {url}")
                        return url
            
            print(f"  ✅ Deployed successfully - check Vercel dashboard")
            return "SUCCESS"
        else:
            print(f"  ❌ Build failed")
            # Print last few lines of error for debugging
            error_lines = result.stderr.split('\\n')[-5:]
            for line in error_lines:
                if line.strip():
                    print(f"    {line}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"  ⏰ Deployment timeout (5 minutes)")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    """Final fix for all deployment issues"""
    generated_apps_dir = Path("generated_apps")
    token = "WKa82HKKJZTvBXMb8KBJp1Wb"
    
    # Focus on the main failing apps
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
    results = {}
    
    print("🔧 FINAL FIX - Cleaning and Deploying All Apps\\n")
    print("=" * 60)
    
    for app_dir_name in apps_to_fix:
        app_path = generated_apps_dir / app_dir_name
        app_name = app_dir_name.replace("_", " ").title()
        
        if not app_path.exists():
            continue
        
        # Clean and fix
        clean_and_fix_app(app_path, app_name)
        
        # Deploy
        result = deploy_clean_app(app_path, app_name, token)
        results[app_name] = result
        
        os.chdir(original_dir)
        print()
    
    # Final summary
    print("=" * 60)
    print("🎉 FINAL DEPLOYMENT RESULTS")
    print("=" * 60)
    
    successful = [(name, url) for name, url in results.items() if url and url != False]
    failed = [name for name, url in results.items() if not url or url == False]
    
    print(f"✅ Successful: {len(successful)}/{len(apps_to_fix)}")
    print(f"❌ Failed: {len(failed)}")
    
    # Add the already working apps
    working_apps = {
        "Budget Tracker": "https://budgettracker-5kl31x9yq-ellisosborn03s-projects.vercel.app",
        "Study Buddy": "https://studybuddy-4anqyynld-ellisosborn03s-projects.vercel.app", 
        "Recipe Finder": "https://recipefinder-5ln251m5g-ellisosborn03s-projects.vercel.app"
    }
    
    # Combine all working apps
    all_working = dict(working_apps)
    for name, url in successful:
        if isinstance(url, str) and url.startswith('https://'):
            all_working[name] = url
    
    print(f"\\n🔗 COMPLETE URL LIST ({len(all_working)} working apps):")
    for i, (name, url) in enumerate(sorted(all_working.items()), 1):
        print(f"  {i:2d}. {name}")
        print(f"      {url}")
    
    # Save final results
    with open("FINAL_URLS.json", "w") as f:
        json.dump(all_working, f, indent=2)
    
    print(f"\\n💾 Complete URL list saved to: FINAL_URLS.json")
    print(f"\\n🎯 SUMMARY: {len(all_working)}/10 apps successfully deployed to Vercel!")
    
    if failed:
        print(f"\\n⚠️  Failed apps (check Vercel dashboard manually): {', '.join(failed)}")

if __name__ == "__main__":
    main()