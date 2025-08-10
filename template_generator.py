#!/usr/bin/env python3
"""
Template-based app generator using proven TypeScript React templates
"""

import os
import json
import pandas as pd
from pathlib import Path
from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime

@dataclass
class AppSpec:
    name: str
    description: str
    app_goal: str
    target_user: str
    main_problem: str
    design_preferences: str

# Template configurations
TEMPLATES = {
    "landing": {
        "name": "Modern Landing Page",
        "best_for": ["marketing", "saas", "startup", "business", "service"],
        "component": "landing"
    },
    "dashboard": {
        "name": "Admin Dashboard", 
        "best_for": ["dashboard", "admin", "analytics", "management", "tracker"],
        "component": "dashboard"
    },
    "portfolio": {
        "name": "Portfolio Site",
        "best_for": ["portfolio", "personal", "showcase", "profile"],
        "component": "portfolio"
    },
    "ecommerce": {
        "name": "E-commerce Store",
        "best_for": ["shop", "store", "marketplace", "inventory", "retail"],
        "component": "ecommerce"
    }
}

def categorize_app(spec: AppSpec) -> str:
    """Determine which template best fits the app"""
    text = f"{spec.name} {spec.description} {spec.app_goal} {spec.main_problem}".lower()
    
    scores = {}
    for template_key, template in TEMPLATES.items():
        score = sum(1 for keyword in template["best_for"] if keyword in text)
        scores[template_key] = score
    
    # Return template with highest score, default to landing
    best_template = max(scores, key=scores.get)
    return best_template if scores[best_template] > 0 else "landing"

def create_package_json(spec: AppSpec):
    """Create package.json with all dependencies"""
    return {
        "name": spec.name.lower().replace(" ", "-").replace("_", "-"),
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
            "tailwindcss": "^3.3.0",
            "autoprefixer": "^10.4.16",
            "postcss": "^8.4.32",
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

def create_layout_tsx(spec: AppSpec):
    """Create layout.tsx"""
    return f"""import type {{ Metadata }} from 'next'
import './globals.css'

export const metadata: Metadata = {{
  title: '{spec.name}',
  description: '{spec.description}',
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

def create_landing_page(spec: AppSpec):
    """Create landing page component"""
    return f"""'use client'

import {{ ArrowRight, CheckCircle, Star, Target }} from 'lucide-react'

export default function HomePage() {{
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {{/* Hero Section */}}
      <div className="relative overflow-hidden bg-white">
        <div className="pb-20 pt-16 sm:pb-24 sm:pt-24 lg:pb-32 lg:pt-32">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                <span className="block">{spec.name}</span>
                <span className="block text-indigo-600">for {spec.target_user}</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
                {spec.description}
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <button className="inline-flex items-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {{/* Problem/Solution Section */}}
      <div className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-lg bg-red-50 p-8">
              <Target className="h-10 w-10 text-red-600" />
              <h3 className="mt-4 text-xl font-semibold text-red-900">The Problem</h3>
              <p className="mt-4 text-red-800">{spec.main_problem}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-8">
              <CheckCircle className="h-10 w-10 text-green-600" />
              <h3 className="mt-4 text-xl font-semibold text-green-900">Our Solution</h3>
              <p className="mt-4 text-green-800">{spec.app_goal}</p>
            </div>
          </div>
        </div>
      </div>

      {{/* Features Section */}}
      <div className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Key Features
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything {spec.target_user.lower()} need to succeed
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Star className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Easy to Use</h3>
              <p className="mt-2 text-base text-gray-600">
                Designed with {spec.design_preferences.lower()} in mind
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <CheckCircle className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Reliable</h3>
              <p className="mt-2 text-base text-gray-600">
                Built for professionals who need consistent results
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <ArrowRight className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Fast</h3>
              <p className="mt-2 text-base text-gray-600">
                Quick setup and immediate results
              </p>
            </div>
          </div>
        </div>
      </div>

      {{/* CTA Section */}}
      <div className="bg-indigo-700">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-200">
            Join thousands of {spec.target_user.lower()} who are already using {spec.name}
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50">
              Get Started Today
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}}"""

def create_dashboard_page(spec: AppSpec):
    """Create dashboard component"""
    return f"""'use client'

import {{ BarChart3, Users, TrendingUp, Activity, Target, CheckCircle }} from 'lucide-react'

export default function DashboardPage() {{
  return (
    <div className="min-h-screen bg-gray-50">
      {{/* Header */}}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{spec.name}</h1>
            <div className="text-sm text-gray-500">For {spec.target_user}</div>
          </div>
        </div>
      </div>

      {{/* Main Content */}}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {{/* Stats Grid */}}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Active Users</dt>
                  <dd className="text-lg font-medium text-gray-900">1,234</dd>
                </dl>
              </div>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Performance</dt>
                  <dd className="text-lg font-medium text-gray-900">98.2%</dd>
                </dl>
              </div>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Growth</dt>
                  <dd className="text-lg font-medium text-gray-900">+12.5%</dd>
                </dl>
              </div>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Active Now</dt>
                  <dd className="text-lg font-medium text-gray-900">89</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {{/* Main Content Areas */}}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {{/* Problem Overview */}}
          <div className="overflow-hidden bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <Target className="h-6 w-6 text-red-500" />
                <h3 className="ml-2 text-lg font-medium text-gray-900">Challenge</h3>
              </div>
              <div className="mt-4">
                <p className="text-gray-600">{spec.main_problem}</p>
              </div>
            </div>
          </div>

          {{/* Solution Overview */}}
          <div className="overflow-hidden bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <h3 className="ml-2 text-lg font-medium text-gray-900">Solution</h3>
              </div>
              <div className="mt-4">
                <p className="text-gray-600">{spec.app_goal}</p>
              </div>
            </div>
          </div>
        </div>

        {{/* Description Section */}}
        <div className="mt-6 bg-blue-50 overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">About {spec.name}</h3>
            <p className="text-blue-800">{spec.description}</p>
            <div className="mt-4 text-sm text-blue-700">
              <strong>Design:</strong> {spec.design_preferences}
            </div>
          </div>
        </div>

        {{/* Action Cards */}}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button className="relative block w-full rounded-lg border border-gray-300 bg-white p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <span className="text-sm font-medium text-gray-900">Quick Start</span>
            <span className="mt-2 block text-sm text-gray-500">Get up and running in minutes</span>
          </button>
          
          <button className="relative block w-full rounded-lg border border-gray-300 bg-white p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <span className="text-sm font-medium text-gray-900">Documentation</span>
            <span className="mt-2 block text-sm text-gray-500">Learn how to use all features</span>
          </button>
          
          <button className="relative block w-full rounded-lg border border-gray-300 bg-white p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <span className="text-sm font-medium text-gray-900">Support</span>
            <span className="mt-2 block text-sm text-gray-500">Get help when you need it</span>
          </button>
        </div>
      </div>
    </div>
  )
}}"""

def create_config_files():
    """Create configuration files"""
    configs = {}
    
    # next.config.js
    configs["next.config.js"] = """/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  }
}

module.exports = nextConfig"""
    
    # tsconfig.json
    configs["tsconfig.json"] = {
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
    
    # tailwind.config.js
    configs["tailwind.config.js"] = """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}"""
    
    # postcss.config.js
    configs["postcss.config.js"] = """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}"""
    
    # globals.css
    configs["globals.css"] = """@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}"""
    
    return configs

def generate_app(spec: AppSpec, output_dir: str = "generated_apps"):
    """Generate a complete app based on the spec"""
    
    # Determine template
    template_key = categorize_app(spec)
    template = TEMPLATES[template_key]
    
    # Create directories
    app_name = spec.name.lower().replace(" ", "_").replace("-", "_")
    app_path = Path(output_dir)
    app_path.mkdir(exist_ok=True)
    
    app_dir = app_path / app_name
    app_dir.mkdir(exist_ok=True)
    
    app_src_dir = app_dir / "app"
    app_src_dir.mkdir(exist_ok=True)
    
    files_created = []
    
    try:
        # Create package.json
        with open(app_dir / "package.json", "w") as f:
            json.dump(create_package_json(spec), f, indent=2)
        files_created.append("package.json")
        
        # Create config files
        configs = create_config_files()
        
        # next.config.js
        with open(app_dir / "next.config.js", "w") as f:
            f.write(configs["next.config.js"])
        files_created.append("next.config.js")
        
        # tsconfig.json
        with open(app_dir / "tsconfig.json", "w") as f:
            json.dump(configs["tsconfig.json"], f, indent=2)
        files_created.append("tsconfig.json")
        
        # tailwind.config.js
        with open(app_dir / "tailwind.config.js", "w") as f:
            f.write(configs["tailwind.config.js"])
        files_created.append("tailwind.config.js")
        
        # postcss.config.js
        with open(app_dir / "postcss.config.js", "w") as f:
            f.write(configs["postcss.config.js"])
        files_created.append("postcss.config.js")
        
        # app/layout.tsx
        with open(app_src_dir / "layout.tsx", "w") as f:
            f.write(create_layout_tsx(spec))
        files_created.append("app/layout.tsx")
        
        # app/globals.css
        with open(app_src_dir / "globals.css", "w") as f:
            f.write(configs["globals.css"])
        files_created.append("app/globals.css")
        
        # app/page.tsx (based on template)
        if template_key == "dashboard":
            page_component = create_dashboard_page(spec)
        else:
            page_component = create_landing_page(spec)
        
        with open(app_src_dir / "page.tsx", "w") as f:
            f.write(page_component)
        files_created.append("app/page.tsx")
        
        # README.md
        readme = f"""# {spec.name}

## Overview
{spec.description}

**Goal:** {spec.app_goal}  
**Target Users:** {spec.target_user}  
**Problem Solved:** {spec.main_problem}

## Template Used
- **Type:** {template["name"]}
- **Category:** {template_key}
- **Design:** {spec.design_preferences}

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Lucide React for icons
- Responsive design

---
*Generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}*"""
        
        with open(app_dir / "README.md", "w") as f:
            f.write(readme)
        files_created.append("README.md")
        
        return {
            "success": True,
            "app_name": spec.name,
            "template_used": template["name"],
            "template_key": template_key,
            "output_directory": str(app_dir),
            "files_created": files_created,
            "generation_time": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "app_name": spec.name,
            "error": str(e),
            "generation_time": datetime.now().isoformat()
        }

def process_csv(csv_file: str, output_dir: str = "generated_apps"):
    """Process CSV file and generate all apps"""
    
    print(f"📊 Processing {csv_file}...")
    
    # Read CSV
    df = pd.read_csv(csv_file)
    df.columns = df.columns.str.lower().str.strip()
    
    results = []
    
    for index, row in df.iterrows():
        if pd.isna(row.get("name", "")):
            continue
            
        spec = AppSpec(
            name=str(row["name"]),
            description=str(row["description"]),
            app_goal=str(row["app_goal"]),
            target_user=str(row["target_user"]),
            main_problem=str(row["main_problem"]),
            design_preferences=str(row["design_preferences"])
        )
        
        # Show template selection
        template_key = categorize_app(spec)
        template_name = TEMPLATES[template_key]["name"]
        print(f"  📋 {spec.name} → {template_name} ({template_key})")
        
        # Generate app
        result = generate_app(spec, output_dir)
        results.append(result)
        
        if result["success"]:
            print(f"    ✅ Generated successfully")
        else:
            print(f"    ❌ Failed: {result['error']}")
    
    return results

def main():
    """Main function"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 template_generator.py <csv_file> [output_dir]")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "generated_apps"
    
    print("🎯 Template-Based App Generator")
    print("=" * 50)
    
    print(f"📋 Available Templates ({len(TEMPLATES)}):")
    for key, template in TEMPLATES.items():
        print(f"  • {template['name']} ({key})")
        print(f"    └─ Best for: {', '.join(template['best_for'])}")
    print()
    
    # Process CSV
    results = process_csv(csv_file, output_dir)
    
    # Summary
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]
    
    print("\n" + "=" * 50)
    print("📊 GENERATION SUMMARY")
    print("=" * 50)
    print(f"✅ Successful: {len(successful)}")
    print(f"❌ Failed: {len(failed)}")
    
    if successful:
        print("\n🎉 Generated Apps:")
        for result in successful:
            print(f"  • {result['app_name']} ({result['template_used']})")
    
    # Save results
    with open(Path(output_dir) / "generation_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to {output_dir}/generation_results.json")

if __name__ == "__main__":
    main()