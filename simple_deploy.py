#!/usr/bin/env python3
"""
Simple deployment script - create plain HTML/JS apps instead of Next.js + TypeScript
"""

import os
import json
import subprocess
import sys
from pathlib import Path

def create_simple_app(app_path, app_name, readme_content):
    """Convert a generated app to a deployable simple HTML app"""
    
    # Parse README content
    lines = readme_content.strip().split('\n')
    title = lines[0].replace('# ', '') if lines else app_name
    
    description = ""
    goal = ""
    target_user = ""
    problem = ""
    design = ""
    tech_stack = ""
    
    current_section = ""
    for line in lines:
        if line.startswith('## Description'):
            current_section = "description"
        elif line.startswith('## Goal'):
            current_section = "goal"
        elif line.startswith('## Target User'):
            current_section = "target_user"
        elif line.startswith('## Problem Solved'):
            current_section = "problem"
        elif line.startswith('## Design Preferences'):
            current_section = "design"
        elif line.startswith('## Tech Stack'):
            current_section = "tech_stack"
        elif line.startswith('##'):
            current_section = ""
        elif current_section and line.strip() and not line.startswith('#'):
            if current_section == "description":
                description = line.strip()
            elif current_section == "goal":
                goal = line.strip()
            elif current_section == "target_user":
                target_user = line.strip()
            elif current_section == "problem":
                problem = line.strip()
            elif current_section == "design":
                design = line.strip()
            elif current_section == "tech_stack":
                tech_stack = line.strip()
    
    # Create simple HTML file
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
        }}
        
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 3rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }}
        
        .header p {{
            font-size: 1.2rem;
            opacity: 0.9;
        }}
        
        .content {{
            padding: 2rem;
        }}
        
        .grid {{
            display: grid;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }}
        
        @media (min-width: 768px) {{
            .grid {{
                grid-template-columns: 1fr 1fr;
            }}
        }}
        
        .card {{
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 12px;
            border-left: 4px solid;
            transition: transform 0.2s ease;
        }}
        
        .card:hover {{
            transform: translateY(-2px);
        }}
        
        .card.goal {{ border-left-color: #3b82f6; }}
        .card.users {{ border-left-color: #10b981; }}
        .card.problem {{ border-left-color: #f59e0b; }}
        .card.design {{ border-left-color: #8b5cf6; }}
        .card.tech {{ border-left-color: #ef4444; }}
        .card.status {{ border-left-color: #6b7280; }}
        
        .card h2 {{
            color: #1e293b;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }}
        
        .card p {{
            color: #64748b;
            margin: 0;
        }}
        
        .footer {{
            background: #1e293b;
            color: white;
            text-align: center;
            padding: 2rem;
        }}
        
        .footer p {{
            margin: 0.5rem 0;
        }}
        
        .status-badge {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            margin: 1rem 0;
        }}
        
        .cta {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }}
        
        .cta:hover {{
            transform: translateY(-1px);
        }}
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>{title}</h1>
            <p>{description}</p>
            <div class="status-badge">🤖 Generated by DevShop AI</div>
        </header>
        
        <main class="content">
            <div class="grid">
                <div class="card goal">
                    <h2>🎯 Goal</h2>
                    <p>{goal}</p>
                </div>
                
                <div class="card users">
                    <h2>👥 Target Users</h2>
                    <p>{target_user}</p>
                </div>
                
                <div class="card problem">
                    <h2>🔧 Problem Solved</h2>
                    <p>{problem}</p>
                </div>
                
                <div class="card design">
                    <h2>🎨 Design Style</h2>
                    <p>{design}</p>
                </div>
                
                <div class="card tech">
                    <h2>⚡ Tech Stack</h2>
                    <p>{tech_stack}</p>
                </div>
                
                <div class="card status">
                    <h2>📋 Status</h2>
                    <p>Ready for full implementation with Claude Code</p>
                </div>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
                <button class="cta" onclick="alert('Contact DevShop team to implement this full application!')">
                    🚀 Implement This App
                </button>
            </div>
        </main>
        
        <footer class="footer">
            <p><strong>Generated by DevShop Multi-App Generator</strong></p>
            <p>This is a preview of the application concept. Ready for full development!</p>
        </footer>
    </div>
</body>
</html>'''
    
    # Write HTML file
    with open(app_path / "index.html", "w") as f:
        f.write(html_content)
    
    # Create package.json for static deployment
    package_json = {
        "name": app_name.lower().replace(" ", "-").replace("_", "-"),
        "version": "0.1.0",
        "scripts": {
            "build": "echo 'Static build complete'"
        }
    }
    
    with open(app_path / "package.json", "w") as f:
        json.dump(package_json, f, indent=2)

def deploy_app_to_vercel(app_path, app_name, token):
    """Deploy a single HTML app to Vercel"""
    print(f"🚀 Deploying {app_name}...")
    
    os.chdir(app_path)
    
    try:
        # Deploy to Vercel (no build needed for static HTML)
        result = subprocess.run(
            ["vercel", "--token", token, "--prod", "--yes"],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            # Extract URL from output
            output_lines = result.stdout.strip().split('\\n')
            url = None
            for line in output_lines:
                if line.startswith('https://') and 'vercel.app' in line:
                    url = line.strip()
                    break
                elif line.startswith('Production: https://'):
                    url = line.replace('Production: ', '').strip()
                    break
            
            if url:
                print(f"✅ {app_name}: {url}")
                return url
            else:
                print(f"⚠️  {app_name}: Deployed but URL not found")
                print("Output:", result.stdout)
                return "Deployed (check Vercel dashboard)"
        else:
            print(f"❌ Failed to deploy {app_name}")
            print("Error:", result.stderr)
            return None
            
    except Exception as e:
        print(f"❌ Error deploying {app_name}: {e}")
        return None

def main():
    """Main deployment script"""
    generated_apps_dir = Path("generated_apps")
    token = "WKa82HKKJZTvBXMb8KBJp1Wb"
    
    if not generated_apps_dir.exists():
        print("❌ No generated_apps directory found!")
        sys.exit(1)
    
    # Get all app directories
    app_dirs = [d for d in generated_apps_dir.iterdir() if d.is_dir() and d.name != "__pycache__"]
    
    print(f"🔍 Found {len(app_dirs)} apps to deploy as static HTML")
    
    deployment_urls = {}
    original_dir = os.getcwd()
    
    # Check for existing deployment URLs first
    existing_urls = {
        "Budget Tracker": "https://budgettracker-5kl31x9yq-ellisosborn03s-projects.vercel.app",
        "Study Buddy": "https://studybuddy-4anqyynld-ellisosborn03s-projects.vercel.app",
        "Recipe Finder": "https://recipefinder-5ln251m5g-ellisosborn03s-projects.vercel.app"
    }
    
    for app_dir in app_dirs:
        app_name = app_dir.name.replace("_", " ").title()
        
        # Skip if already deployed
        if app_name in existing_urls:
            deployment_urls[app_name] = existing_urls[app_name]
            print(f"✅ {app_name}: {existing_urls[app_name]} (already deployed)")
            continue
        
        # Read README content
        readme_path = app_dir / "README.md"
        if readme_path.exists():
            readme_content = readme_path.read_text()
        else:
            readme_content = f"# {app_name}\\n\\nGenerated application"
        
        print(f"📦 Preparing {app_name}...")
        
        # Create simple HTML app
        create_simple_app(app_dir, app_name, readme_content)
        
        # Deploy to Vercel
        url = deploy_app_to_vercel(app_dir, app_name, token)
        if url:
            deployment_urls[app_name] = url
        
        # Return to original directory
        os.chdir(original_dir)
    
    # Print final summary
    print("\\n" + "="*60)
    print("🎉 DEPLOYMENT SUMMARY")
    print("="*60)
    
    successful_deployments = [name for name, url in deployment_urls.items() if url]
    
    print(f"✅ Successfully deployed: {len(successful_deployments)}/{len(app_dirs)}")
    print(f"❌ Failed deployments: {len(app_dirs) - len(successful_deployments)}")
    
    if deployment_urls:
        print("\\n🔗 LIVE DEPLOYMENT URLS:")
        for app_name, url in sorted(deployment_urls.items()):
            print(f"  • {app_name}: {url}")
    
    # Save results to file
    with open("deployment_urls.json", "w") as f:
        json.dump(deployment_urls, f, indent=2)
    
    print(f"\\n💾 Results saved to deployment_urls.json")
    
    return deployment_urls

if __name__ == "__main__":
    main()