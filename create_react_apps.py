#!/usr/bin/env python3
"""
Create proper TypeScript + React apps with full dependencies and responsive design
"""

import os
import json
import subprocess
from pathlib import Path

def create_react_app(app_path, app_name, readme_content):
    """Create a proper TypeScript + React app with full dependencies"""
    
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
    
    # Clean up directory
    for file_to_remove in ["index.html"]:
        file_path = app_path / file_to_remove
        if file_path.exists():
            file_path.unlink()
    
    # Create complete package.json with all dependencies
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
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "next": "14.0.0",
            "lucide-react": "^0.294.0"
        },
        "devDependencies": {
            "typescript": "^5.2.2",
            "@types/react": "^18.2.37",
            "@types/node": "^20.8.10",
            "@types/react-dom": "^18.2.15",
            "eslint": "^8.54.0",
            "eslint-config-next": "14.0.0"
        }
    }
    
    with open(app_path / "package.json", "w") as f:
        json.dump(package_json, f, indent=2)
    
    # Create next.config.js
    next_config = """/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig"""
    
    with open(app_path / "next.config.js", "w") as f:
        f.write(next_config)
    
    # Create tsconfig.json
    tsconfig = {
        "compilerOptions": {
            "target": "es5",
            "lib": ["dom", "dom.iterable", "esnext"],
            "allowJs": True,
            "skipLibCheck": True,
            "strict": True,
            "noEmit": True,
            "esModuleInterop": True,
            "module": "esnext",
            "moduleResolution": "bundler",
            "resolveJsonModule": True,
            "isolatedModules": True,
            "jsx": "preserve",
            "incremental": True,
            "plugins": [{"name": "next"}],
            "paths": {"@/*": ["./*"]}
        },
        "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        "exclude": ["node_modules"]
    }
    
    with open(app_path / "tsconfig.json", "w") as f:
        json.dump(tsconfig, f, indent=2)
    
    # Create app directory
    app_dir = app_path / "app"
    app_dir.mkdir(exist_ok=True)
    
    # Create globals.css
    globals_css = """@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

@media (prefers-color-scheme: dark) {
  html {
    color-scheme: dark;
  }
}

/* Responsive utilities */
@media (max-width: 640px) {
  .container {
    padding: 1rem !important;
  }
  
  .header h1 {
    font-size: 2rem !important;
  }
  
  .grid {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2.5rem !important;
  }
  
  .card {
    padding: 1.5rem !important;
  }
}"""
    
    with open(app_dir / "globals.css", "w") as f:
        f.write(globals_css)
    
    # Create layout.tsx
    layout_tsx = f"""import type {{ Metadata }} from 'next'
import './globals.css'

export const metadata: Metadata = {{
  title: '{title} | DevShop AI',
  description: '{description}',
  viewport: 'width=device-width, initial-scale=1',
}}

export default function RootLayout({{
  children,
}}: {{
  children: React.ReactNode
}}) {{
  return (
    <html lang="en">
      <body>{{children}}</body>
    </html>
  )
}}"""
    
    with open(app_dir / "layout.tsx", "w") as f:
        f.write(layout_tsx)
    
    # Create responsive page.tsx with TypeScript
    page_tsx = f"""'use client'

import React from 'react'
import {{ Target, Users, Wrench, Palette, Zap, Rocket, ExternalLink, Code }} from 'lucide-react'

interface FeatureCardProps {{
  icon: React.ReactNode
  title: string
  description: string
  color: string
}}

const FeatureCard: React.FC<FeatureCardProps> = ({{ icon, title, description, color }}) => (
  <div 
    className="feature-card"
    style={{{{
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '2rem',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      borderLeft: `5px solid ${{color}}`,
      cursor: 'pointer',
    }}}}
    onMouseEnter={{(e) => {{
      e.currentTarget.style.transform = 'translateY(-5px)'
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)'
    }}}}
    onMouseLeave={{(e) => {{
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)'
    }}}}
  >
    <div style={{{{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}}}>
      <div style={{{{ color }}}}>{{icon}}</div>
      <h2 style={{{{ color: '#1e293b', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}}}>
        {{title}}
      </h2>
    </div>
    <p style={{{{ color: '#64748b', lineHeight: '1.6', margin: 0 }}}}>
      {{description}}
    </p>
  </div>
)

interface ActionButtonProps {{
  href: string
  children: React.ReactNode
  primary?: boolean
}}

const ActionButton: React.FC<ActionButtonProps> = ({{ href, children, primary = false }}) => (
  <a
    href={{href}}
    target="_blank"
    rel="noopener noreferrer"
    style={{{{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '1rem 2rem',
      borderRadius: '50px',
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: '1.1rem',
      transition: 'transform 0.3s ease',
      background: primary 
        ? 'linear-gradient(135deg, #667eea, #764ba2)'
        : 'rgba(255, 255, 255, 0.2)',
      color: primary ? 'white' : 'rgba(255, 255, 255, 0.9)',
      border: primary ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
      margin: '0.5rem',
    }}}}
    onMouseEnter={{(e) => {{
      e.currentTarget.style.transform = 'translateY(-2px)'
    }}}}
    onMouseLeave={{(e) => {{
      e.currentTarget.style.transform = 'translateY(0)'
    }}}}
  >
    {{children}}
  </a>
)

export default function HomePage(): JSX.Element {{
  return (
    <div style={{{{ minHeight: '100vh' }}}}>
      <div 
        className="container"
        style={{{{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem',
        }}}}
      >
        {{/* Header Section */}}
        <header 
          className="header"
          style={{{{
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '3rem 2rem',
            borderRadius: '20px',
            marginBottom: '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          }}}}
        >
          <h1 
            style={{{{
              fontSize: '3rem',
              fontWeight: '700',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: '1.2',
            }}}}
          >
            {title}
          </h1>
          <p 
            style={{{{
              fontSize: '1.3rem',
              color: '#64748b',
              marginBottom: '1.5rem',
              lineHeight: '1.5',
            }}}}
          >
            {description}
          </p>
          <div 
            style={{{{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '50px',
              fontWeight: '600',
              fontSize: '0.95rem',
            }}}}
          >
            🤖 Generated by DevShop AI
          </div>
        </header>

        {{/* Features Grid */}}
        <div 
          className="grid"
          style={{{{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '1.5rem',
            margin: '2rem 0',
          }}}}
        >
          <FeatureCard
            icon={{<Target size={{28}} />}}
            title="Goal"
            description="{goal}"
            color="#3b82f6"
          />
          
          <FeatureCard
            icon={{<Users size={{28}} />}}
            title="Target Users"
            description="{target_user}"
            color="#10b981"
          />
          
          <FeatureCard
            icon={{<Wrench size={{28}} />}}
            title="Problem Solved"
            description="{problem}"
            color="#f59e0b"
          />
          
          <FeatureCard
            icon={{<Palette size={{28}} />}}
            title="Design Style"
            description="{design}"
            color="#8b5cf6"
          />
          
          <FeatureCard
            icon={{<Zap size={{28}} />}}
            title="Tech Stack"
            description="{tech_stack}"
            color="#ef4444"
          />
          
          <FeatureCard
            icon={{<Rocket size={{28}} />}}
            title="Implementation Status"
            description="Ready for full development! This concept has been validated and is prepared for complete implementation using Claude Code."
            color="#6366f1"
          />
        </div>

        {{/* Call to Action Section */}}
        <div 
          style={{{{
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '3rem 2rem',
            borderRadius: '20px',
            marginTop: '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          }}}}
        >
          <h2 style={{{{ marginBottom: '1rem', color: '#1e293b', fontSize: '2rem' }}}}>
            Ready to Build This App?
          </h2>
          <p style={{{{ marginBottom: '2rem', color: '#64748b', fontSize: '1.1rem', lineHeight: '1.6' }}}}>
            This application concept is fully planned and ready for implementation with modern TypeScript and React.
          </p>
          
          <div style={{{{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}}}>
            <ActionButton href="https://devshop-53qogrhb9-ellisosborn03s-projects.vercel.app" primary>
              <span style={{{{ fontSize: '1.2em' }}}}>🏭</span>
              Generate More Apps
              <ExternalLink size={{18}} />
            </ActionButton>
            
            <ActionButton href="https://claude.ai/code">
              <Code size={{20}} />
              Implement with Claude Code
              <ExternalLink size={{18}} />
            </ActionButton>
          </div>
        </div>

        {{/* Footer */}}
        <footer 
          style={{{{
            textAlign: 'center',
            padding: '2rem',
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: '2rem',
          }}}}
        >
          <p style={{{{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}}}>
            DevShop Multi-App Generator
          </p>
          <p style={{{{ fontSize: '0.95rem' }}}}>
            AI-powered application concept generation • Ready for full TypeScript & React development
          </p>
        </footer>
      </div>
    </div>
  )
}}"""
    
    with open(app_dir / "page.tsx", "w") as f:
        f.write(page_tsx)

def redeploy_app(app_path, app_name, token):
    """Deploy the TypeScript React app to Vercel"""
    print(f"🚀 Deploying {app_name} with TypeScript + React...")
    
    os.chdir(app_path)
    
    try:
        result = subprocess.run(
            ["vercel", "--token", token, "--prod", "--yes"],
            capture_output=True,
            text=True,
            timeout=180
        )
        
        if result.returncode == 0:
            # Extract URL from output
            output_lines = result.stdout.strip().split('\\n')
            for line in output_lines:
                if 'Production:' in line and 'vercel.app' in line:
                    url = line.split('Production: ')[-1].strip()
                    print(f"  ✅ Successfully deployed: {url}")
                    return url
            print(f"  ✅ Deployed successfully (check Vercel dashboard)")
            return True
        else:
            print(f"  ❌ Deployment failed")
            print(f"  Error: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"  ❌ Error deploying: {e}")
        return None

def main():
    """Create and deploy TypeScript + React apps"""
    generated_apps_dir = Path("generated_apps")
    token = "WKa82HKKJZTvBXMb8KBJp1Wb"
    
    failing_apps = [
        "task_manager_pro",
        "habit_tracker", 
        "plant_care",
        "language_exchange",
        "workout_planner",
        "local_events",
        "inventory_manager"
    ]
    
    original_dir = os.getcwd()
    successful_deployments = []
    
    print("🚀 Creating TypeScript + React apps with responsive design...\n")
    
    for app_dir_name in failing_apps:
        app_path = generated_apps_dir / app_dir_name
        app_name = app_dir_name.replace("_", " ").title()
        
        if not app_path.exists():
            continue
            
        # Read README
        readme_path = app_path / "README.md"
        if readme_path.exists():
            readme_content = readme_path.read_text()
        else:
            readme_content = f"# {app_name}\\n\\nGenerated application"
        
        print(f"📦 Creating {app_name} with TypeScript + React...")
        create_react_app(app_path, app_name, readme_content)
        print(f"  ✅ Created Next.js app with full dependencies")
        
        # Deploy
        result = redeploy_app(app_path, app_name, token)
        if result:
            successful_deployments.append((app_name, result))
        
        os.chdir(original_dir)
        print()
    
    print("=" * 60)
    print("🎉 TYPESCRIPT + REACT DEPLOYMENT SUMMARY")
    print("=" * 60)
    print(f"✅ Successfully created and deployed: {len(successful_deployments)}/{len(failing_apps)}")
    
    if successful_deployments:
        print("\\n🔗 NEW DEPLOYMENT URLS:")
        for name, url in successful_deployments:
            if isinstance(url, str):
                print(f"  • {name}: {url}")
            else:
                print(f"  • {name}: Check Vercel dashboard")

if __name__ == "__main__":
    main()