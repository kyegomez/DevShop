#!/usr/bin/env python3
"""
Create the template-based app generation system
"""

import json
from pathlib import Path

# Template configurations
WEBSITE_TEMPLATES = {
    "landing_page": {
        "name": "Modern Landing Page",
        "description": "Clean landing page with hero section and features",
        "demo_url": "https://landy.website/",
        "best_for": ["marketing", "saas", "startup", "business"],
        "tech_stack": ["Next.js", "TypeScript", "Tailwind CSS"],
        "features": ["Hero section", "Features grid", "CTA buttons", "Responsive"]
    },
    "dashboard": {
        "name": "Admin Dashboard",
        "description": "Professional dashboard with metrics and data display",
        "demo_url": "https://ui.shadcn.com/",
        "best_for": ["dashboard", "admin", "analytics", "management"],
        "tech_stack": ["Next.js", "TypeScript", "Tailwind CSS"],
        "features": ["Data cards", "Charts", "Tables", "Navigation"]
    },
    "portfolio": {
        "name": "Portfolio Site",
        "description": "Clean portfolio for showcasing work and skills",
        "demo_url": "https://portfolio-blog-starter.vercel.app/",
        "best_for": ["portfolio", "personal", "showcase", "creative"],
        "tech_stack": ["Next.js", "TypeScript", "Tailwind CSS"],
        "features": ["Project grid", "About section", "Contact form", "Blog"]
    },
    "ecommerce": {
        "name": "E-commerce Store",
        "description": "Modern e-commerce template with product listings",
        "demo_url": "https://demo.vercel.store/",
        "best_for": ["ecommerce", "store", "marketplace", "retail"],
        "tech_stack": ["Next.js", "TypeScript", "Tailwind CSS"],
        "features": ["Product grid", "Shopping cart", "Search", "Checkout"]
    }
}

def categorize_app(name: str, description: str, goal: str, problem: str) -> str:
    """Determine which template category best fits the app"""
    text = f"{name} {description} {goal} {problem}".lower()
    
    # Keywords for different categories
    if any(word in text for word in ["dashboard", "admin", "management", "analytics", "track", "monitor"]):
        return "dashboard"
    elif any(word in text for word in ["shop", "store", "buy", "sell", "commerce", "inventory"]):
        return "ecommerce"
    elif any(word in text for word in ["portfolio", "personal", "showcase", "profile"]):
        return "portfolio"
    else:
        return "landing_page"

def create_package_json(spec_name: str, template_type: str):
    """Create package.json for the template"""
    return {
        "name": spec_name.lower().replace(" ", "-").replace("_", "-"),
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

def create_layout_component(spec_name: str, spec_description: str):
    """Create the layout.tsx component"""
    return f"""import type {{ Metadata }} from 'next'
import './globals.css'

export const metadata: Metadata = {{
  title: '{spec_name}',
  description: '{spec_description}',
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

def create_landing_page_component(spec):
    """Create a landing page component"""
    return f"""'use client'

import {{ ArrowRight, CheckCircle, Star }} from 'lucide-react'

export default function HomePage() {{
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {{/* Hero Section */}}
      <div className="relative overflow-hidden bg-white">
        <div className="pb-80 pt-16 sm:pb-40 sm:pt-24 lg:pb-48 lg:pt-40">
          <div className="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
            <div className="sm:max-w-lg">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                {spec['name']}
              </h1>
              <p className="mt-4 text-xl text-gray-500">
                {spec['description']}
              </p>
            </div>
            <div className="mt-10">
              {{/* Problem Statement */}}
              <div className="rounded-lg bg-blue-50 p-6">
                <h3 className="text-lg font-medium text-blue-900">Problem We Solve</h3>
                <p className="mt-2 text-blue-800">{spec['main_problem']}</p>
              </div>
              
              {{/* Target Users */}}
              <div className="mt-6 rounded-lg bg-green-50 p-6">
                <h3 className="text-lg font-medium text-green-900">Built For</h3>
                <p className="mt-2 text-green-800">{spec['target_user']}</p>
              </div>
            </div>
            <div className="mt-10">
              <button className="inline-flex items-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {{/* Features Section */}}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for {spec['app_goal'].lower()}
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Designed specifically for {spec['target_user'].lower()}
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <CheckCircle className="h-5 w-5 flex-none text-indigo-600" />
                  Easy to Use
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Intuitive interface designed for quick adoption</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Star className="h-5 w-5 flex-none text-indigo-600" />
                  Powerful Features
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">All the tools you need in one place</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <ArrowRight className="h-5 w-5 flex-none text-indigo-600" />
                  Fast Results
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Get started immediately and see results fast</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}}"""

def create_dashboard_component(spec):
    """Create a dashboard component"""
    return f"""'use client'

import {{ BarChart3, Users, TrendingUp, Activity }} from 'lucide-react'

export default function DashboardPage() {{
  return (
    <div className="min-h-screen bg-gray-50">
      {{/* Header */}}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">{spec['name']}</h1>
            </div>
          </div>
        </div>
      </div>

      {{/* Main Content */}}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {{/* Stats */}}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Total Users</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">1,234</dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Active Sessions</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">89</dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Conversion Rate</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">24.7%</dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Revenue</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">$12.3k</dd>
          </div>
        </div>

        {{/* Main Dashboard Content */}}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {{/* Problem Statement Card */}}
            <div className="overflow-hidden bg-white shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Challenge</h3>
                <p className="text-gray-600">{spec['main_problem']}</p>
              </div>
            </div>

            {{/* Solution Card */}}
            <div className="overflow-hidden bg-white shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Our Solution</h3>
                <p className="text-gray-600">{spec['description']}</p>
              </div>
            </div>
          </div>

          {{/* Target Users */}}
          <div className="mt-6 bg-blue-50 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">Built for {spec['target_user']}</h3>
              <p className="text-blue-800">{spec['app_goal']}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}}"""

def create_globals_css():
    """Create global CSS with Tailwind"""
    return """@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

@layer components {
  .btn-primary {
    @apply bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors;
  }
}"""

def create_next_config():
    """Create Next.js configuration"""
    return """/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  }
}

module.exports = nextConfig"""

def create_tsconfig():
    """Create TypeScript configuration"""
    return {
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

def create_tailwind_config():
    """Create Tailwind configuration"""
    return """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}"""

def create_postcss_config():
    """Create PostCSS configuration"""
    return """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}"""

def generate_template_based_app(spec_data, output_dir):
    """Generate a complete app based on template selection"""
    
    # Determine template type
    template_type = categorize_app(
        spec_data["name"], 
        spec_data["description"], 
        spec_data["app_goal"], 
        spec_data["main_problem"]
    )
    
    # Create app directory
    app_name = spec_data["name"].lower().replace(" ", "_").replace("-", "_")
    app_path = Path(output_dir) / app_name
    app_path.mkdir(exist_ok=True)
    
    # Create app subdirectory for Next.js
    app_src_path = app_path / "app"
    app_src_path.mkdir(exist_ok=True)
    
    # Generate all files
    files_created = []
    
    # package.json
    package_json = create_package_json(spec_data["name"], template_type)
    with open(app_path / "package.json", "w") as f:
        json.dump(package_json, f, indent=2)
    files_created.append("package.json")
    
    # next.config.js
    with open(app_path / "next.config.js", "w") as f:
        f.write(create_next_config())
    files_created.append("next.config.js")
    
    # tsconfig.json
    with open(app_path / "tsconfig.json", "w") as f:
        json.dump(create_tsconfig(), f, indent=2)
    files_created.append("tsconfig.json")
    
    # tailwind.config.js
    with open(app_path / "tailwind.config.js", "w") as f:
        f.write(create_tailwind_config())
    files_created.append("tailwind.config.js")
    
    # postcss.config.js
    with open(app_path / "postcss.config.js", "w") as f:
        f.write(create_postcss_config())
    files_created.append("postcss.config.js")
    
    # app/layout.tsx
    with open(app_src_path / "layout.tsx", "w") as f:
        f.write(create_layout_component(spec_data["name"], spec_data["description"]))
    files_created.append("app/layout.tsx")
    
    # app/globals.css
    with open(app_src_path / "globals.css", "w") as f:
        f.write(create_globals_css())
    files_created.append("app/globals.css")
    
    # app/page.tsx (based on template type)
    if template_type == "dashboard":
        page_component = create_dashboard_component(spec_data)
    else:
        page_component = create_landing_page_component(spec_data)
    
    with open(app_src_path / "page.tsx", "w") as f:
        f.write(page_component)
    files_created.append("app/page.tsx")
    
    # Create README
    readme_content = f"""# {spec_data['name']}

## Overview
{spec_data['description']}

**Goal:** {spec_data['app_goal']}
**Target Users:** {spec_data['target_user']}
**Problem Solved:** {spec_data['main_problem']}

## Template Used
- **Type:** {template_type.title()}
- **Template:** {WEBSITE_TEMPLATES[template_type]['name']}
- **Tech Stack:** {', '.join(WEBSITE_TEMPLATES[template_type]['tech_stack'])}

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Features
- TypeScript for type safety
- Tailwind CSS for styling
- Responsive design
- Modern React patterns
- SEO optimized

---
*Generated using template-based system*"""
    
    with open(app_path / "README.md", "w") as f:
        f.write(readme_content)
    files_created.append("README.md")
    
    return {
        "success": True,
        "app_name": spec_data["name"],
        "template_type": template_type,
        "template_name": WEBSITE_TEMPLATES[template_type]["name"],
        "output_directory": str(app_path),
        "files_created": files_created
    }

def main():
    """Demonstrate the template system"""
    print("🎯 Template-Based App Generation System")
    print("=" * 60)
    
    print(f"📋 Available Templates ({len(WEBSITE_TEMPLATES)}):")
    for key, template in WEBSITE_TEMPLATES.items():
        print(f"  • {template['name']} ({key})")
        print(f"    └─ Best for: {', '.join(template['best_for'])}")
        print(f"    └─ Features: {', '.join(template['features'])}")
        print()
    
    # Test with sample data
    sample_spec = {
        "name": "Task Manager Pro",
        "description": "A comprehensive task management application with team collaboration features",
        "app_goal": "Help teams organize and track project tasks efficiently", 
        "target_user": "Project managers and team leads",
        "main_problem": "Difficulty in coordinating tasks across team members and tracking progress"
    }
    
    print("🧪 Testing with sample spec:")
    template_type = categorize_app(
        sample_spec["name"], 
        sample_spec["description"], 
        sample_spec["app_goal"], 
        sample_spec["main_problem"]
    )
    print(f"  └─ Detected template: {template_type} ({WEBSITE_TEMPLATES[template_type]['name']})")
    
    # Generate sample app
    result = generate_template_based_app(sample_spec, "test_generated")
    if result["success"]:
        print(f"✅ Generated: {result['app_name']}")
        print(f"  └─ Template: {result['template_name']}")
        print(f"  └─ Location: {result['output_directory']}")
        print(f"  └─ Files: {len(result['files_created'])}")
    
    print("\n🎉 Template system ready!")

if __name__ == "__main__":
    main()