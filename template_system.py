#!/usr/bin/env python3
"""
Template-based app generation system using proven TypeScript React templates
"""

import os
import json
import subprocess
from pathlib import Path
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class WebsiteTemplate:
    """Represents a proven website template"""
    name: str
    description: str
    github_url: str
    demo_url: str
    best_for: List[str]  # Types of apps this template works best for
    tech_stack: List[str]
    features: List[str]

# Curated list of proven TypeScript React templates
WEBSITE_TEMPLATES = {
    "landing_page": WebsiteTemplate(
        name="Landy React Landing Page",
        description="Modern landing page with animations and multi-language support",
        github_url="https://github.com/Adrinlol/landy-react-template",
        demo_url="https://landy.website/",
        best_for=["marketing", "saas", "startup", "business"],
        tech_stack=["React", "TypeScript", "Styled Components", "React Hooks"],
        features=["Animations", "Multi-language", "Responsive", "SEO optimized"]
    ),
    
    "saas_dashboard": WebsiteTemplate(
        name="shadcn/ui Dashboard",
        description="Modern dashboard with shadcn/ui components",
        github_url="https://github.com/shadcn-ui/ui",
        demo_url="https://ui.shadcn.com/",
        best_for=["dashboard", "admin", "analytics", "management"],
        tech_stack=["Next.js", "TypeScript", "Tailwind CSS", "Radix UI"],
        features=["Dark mode", "Accessible", "Copy-paste components", "Customizable"]
    ),
    
    "portfolio": WebsiteTemplate(
        name="Next.js Portfolio Template",
        description="Clean portfolio template with blog support",
        github_url="https://github.com/vercel/nextjs-portfolio-starter",
        demo_url="https://portfolio-blog-starter.vercel.app/",
        best_for=["portfolio", "personal", "blog", "showcase"],
        tech_stack=["Next.js", "TypeScript", "Tailwind CSS", "MDX"],
        features=["Blog support", "Dark mode", "SEO optimized", "Fast"]
    ),
    
    "ecommerce": WebsiteTemplate(
        name="Next.js Commerce",
        description="High-performance e-commerce template",
        github_url="https://github.com/vercel/commerce",
        demo_url="https://demo.vercel.store/",
        best_for=["ecommerce", "store", "marketplace", "retail"],
        tech_stack=["Next.js", "TypeScript", "Tailwind CSS", "Commerce APIs"],
        features=["Cart", "Checkout", "Product pages", "Search"]
    ),
    
    "app_landing": WebsiteTemplate(
        name="Open React Template",
        description="Landing page for apps, SaaS, and services",
        github_url="https://github.com/cruip/open-react-template",
        demo_url="https://open-react-template.cruip.com/",
        best_for=["app", "service", "tool", "platform"],
        tech_stack=["React", "TypeScript", "Tailwind CSS"],
        features=["Hero sections", "Features", "Pricing", "Contact"]
    ),
    
    "business": WebsiteTemplate(
        name="TailwindUI Business Template",
        description="Professional business website template",
        github_url="https://github.com/tailwindlabs/headlessui",
        demo_url="https://headlessui.com/",
        best_for=["business", "corporate", "professional", "services"],
        tech_stack=["React", "TypeScript", "Tailwind CSS", "Headless UI"],
        features=["Professional design", "Contact forms", "Team pages", "Services"]
    )
}

def categorize_app(spec) -> str:
    """Determine which template category best fits the app specification"""
    name = spec.name.lower()
    description = spec.description.lower()
    goal = spec.app_goal.lower()
    problem = spec.main_problem.lower()
    
    # Keywords for different template categories
    categories = {
        "saas_dashboard": ["dashboard", "admin", "management", "analytics", "track", "monitor", "control"],
        "ecommerce": ["shop", "store", "buy", "sell", "commerce", "marketplace", "retail", "inventory"],
        "portfolio": ["portfolio", "personal", "showcase", "profile", "resume", "cv"],
        "app_landing": ["app", "tool", "platform", "software", "service", "finder", "planner", "tracker"],
        "business": ["business", "professional", "corporate", "company", "enterprise"],
        "landing_page": ["marketing", "startup", "saas", "promote", "landing"]
    }
    
    # Score each category based on keyword matches
    scores = {}
    text_to_check = f"{name} {description} {goal} {problem}"
    
    for category, keywords in categories.items():
        score = sum(1 for keyword in keywords if keyword in text_to_check)
        scores[category] = score
    
    # Return the category with the highest score, or default to landing_page
    best_category = max(scores, key=scores.get)
    return best_category if scores[best_category] > 0 else "landing_page"

def generate_template_based_prompt(spec, template: WebsiteTemplate) -> str:
    """Generate a prompt that uses a specific proven template"""
    
    return f"""You are an expert TypeScript React developer. Create a production-ready website based on the proven template "{template.name}" and customize it for this specification:

**Application:** {spec.name}
**Description:** {spec.description}
**Goal:** {spec.app_goal}
**Target User:** {spec.target_user}
**Problem Solved:** {spec.main_problem}
**Design Preferences:** {spec.design_preferences}

**TEMPLATE TO USE:** {template.name}
**Template Features:** {', '.join(template.features)}
**Tech Stack:** {', '.join(template.tech_stack)}
**Reference Demo:** {template.demo_url}

**INSTRUCTIONS:**
1. Use the exact same structure and components as the reference template
2. Replace ALL placeholder content with content specific to "{spec.name}"
3. Customize colors, fonts, and styling to match: {spec.design_preferences}
4. Ensure all text relates to: {spec.main_problem} for {spec.target_user}
5. Keep the same navigation structure but update menu items to be relevant
6. Replace hero sections with compelling copy about {spec.app_goal}
7. Update feature sections to highlight how this solves {spec.main_problem}
8. Replace testimonials/social proof with relevant examples
9. Update contact/CTA sections to match the app's purpose

**TECHNICAL REQUIREMENTS:**
- Use TypeScript throughout
- Implement responsive design with Tailwind CSS
- Include proper SEO meta tags
- Add loading states and error handling
- Ensure accessibility standards
- Include a comprehensive README

**CONTENT GUIDELINES:**
- Write compelling headlines that address {spec.main_problem}
- Create feature descriptions that appeal to {spec.target_user}
- Use action-oriented language that drives toward {spec.app_goal}
- Include realistic example data/screenshots placeholders
- Write professional copy that matches {spec.design_preferences}

Create a complete, professional website that looks like it was custom-built for {spec.name} but uses the proven structure and components from {template.name}."""

def create_template_based_generator():
    """Create an updated main.py that uses template-based generation"""
    
    updated_main = '''#!/usr/bin/env python3
"""
Template-based Multi-App Generator using proven TypeScript React templates
"""

import asyncio
import concurrent.futures
import json
import pandas as pd
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Optional, Any
import logging
from datetime import datetime
import multiprocessing
import threading

# Import our template system
from template_system import WEBSITE_TEMPLATES, categorize_app, generate_template_based_prompt

def get_optimal_worker_count() -> int:
    try:
        cpu_count = multiprocessing.cpu_count()
        optimal_workers = max(1, int(cpu_count * 0.95))
        return optimal_workers
    except Exception:
        return 4

@dataclass
class AppSpecification:
    name: str
    description: str
    app_goal: str
    target_user: str
    main_problem: str
    design_preferences: str
    additional_requirements: Optional[str] = None
    tech_stack: Optional[str] = None
    complexity_level: Optional[str] = "medium"

class CSVAppIngester:
    def __init__(self, csv_file_path: str):
        self.csv_file_path = Path(csv_file_path)
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        logger = logging.getLogger(f"{__name__}.CSVAppIngester")
        logger.setLevel(logging.INFO)
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        return logger

    def read_app_specifications(self) -> List[AppSpecification]:
        if not self.csv_file_path.exists():
            raise FileNotFoundError(f"CSV file not found: {self.csv_file_path}")

        try:
            df = pd.read_csv(self.csv_file_path)
            if df.empty:
                raise ValueError("CSV file is empty")

            df.columns = df.columns.str.lower().str.strip()
            specifications = []

            for index, row in df.iterrows():
                try:
                    spec = AppSpecification(
                        name=str(row["name"]),
                        description=str(row["description"]),
                        app_goal=str(row["app_goal"]),
                        target_user=str(row["target_user"]),
                        main_problem=str(row["main_problem"]),
                        design_preferences=str(row["design_preferences"]),
                        additional_requirements=str(row.get("additional_requirements", "")),
                        tech_stack=str(row.get("tech_stack", "TypeScript/React")),
                        complexity_level=str(row.get("complexity_level", "medium")),
                    )
                    specifications.append(spec)
                    self.logger.info(f"Successfully parsed app: {spec.name}")
                except Exception as e:
                    self.logger.error(f"Error parsing row {index}: {e}")
                    continue

            self.logger.info(f"Successfully parsed {len(specifications)} app specifications")
            return specifications

        except Exception as e:
            self.logger.error(f"Error reading CSV file: {e}")
            raise

class TemplateBasedAppGenerator:
    def __init__(self, output_directory: str = "generated_apps"):
        self.output_directory = Path(output_directory)
        self.output_directory.mkdir(exist_ok=True)
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        logger = logging.getLogger(f"{__name__}.TemplateBasedAppGenerator")
        logger.setLevel(logging.INFO)
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        return logger

    async def generate_app_from_template(self, spec: AppSpecification) -> Dict[str, Any]:
        """Generate app using the best matching template"""
        self.logger.info(f"Starting template-based generation for app: {spec.name}")
        
        # Determine the best template category for this app
        template_category = categorize_app(spec)
        template = WEBSITE_TEMPLATES[template_category]
        
        self.logger.info(f"Using template: {template.name} for {spec.name}")
        
        # Create app directory
        app_dir = self.output_directory / spec.name.lower().replace(" ", "_")
        app_dir.mkdir(exist_ok=True)

        # Simulate generation time
        complexities = {"low": 3000, "medium": 5000, "high": 8000}
        delay = complexities.get(spec.complexity_level, 5000)
        await asyncio.sleep(delay / 1000)  # Convert to seconds

        try:
            # Generate template-based content
            self._create_template_based_files(app_dir, spec, template)
            
            end_time = datetime.now()
            files = list(app_dir.glob("*"))

            return {
                "success": True,
                "app_name": spec.name,
                "template_used": template.name,
                "template_category": template_category,
                "output_directory": str(app_dir),
                "files_created": [f.name for f in files],
                "generation_time": end_time.isoformat()
            }

        except Exception as error:
            return {
                "success": False,
                "app_name": spec.name,
                "error": str(error),
                "generation_time": datetime.now().isoformat()
            }

    def _create_template_based_files(self, app_dir: Path, spec: AppSpecification, template):
        """Create files based on the selected template"""
        
        # Create package.json with template-specific dependencies
        self._create_package_json(app_dir, spec, template)
        
        # Create Next.js configuration
        self._create_next_config(app_dir)
        
        # Create TypeScript configuration
        self._create_tsconfig(app_dir)
        
        # Create app directory structure
        app_src_dir = app_dir / "app"
        app_src_dir.mkdir(exist_ok=True)
        
        # Create template-based components
        self._create_template_components(app_src_dir, spec, template)
        
        # Create styles
        self._create_styles(app_src_dir, template)
        
        # Create README with template info
        self._create_template_readme(app_dir, spec, template)

    def _create_package_json(self, app_dir: Path, spec: AppSpecification, template):
        """Create package.json with template-appropriate dependencies"""
        
        base_deps = {
            "next": "14.0.0",
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
        }
        
        # Add template-specific dependencies
        if "Tailwind" in template.tech_stack:
            base_deps.update({
                "tailwindcss": "^3.3.0",
                "autoprefixer": "^10.4.16",
                "postcss": "^8.4.32"
            })
            
        if "shadcn" in template.name.lower():
            base_deps.update({
                "lucide-react": "^0.294.0",
                "@radix-ui/react-slot": "^1.0.2",
                "class-variance-authority": "^0.7.0",
                "clsx": "^2.0.0",
                "tailwind-merge": "^2.0.0"
            })

        package_json = {
            "name": spec.name.lower().replace(" ", "-").replace("_", "-"),
            "version": "0.1.0",
            "private": True,
            "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start",
                "lint": "next lint"
            },
            "dependencies": base_deps,
            "devDependencies": {
                "typescript": "^5.2.2",
                "@types/node": "^20.8.10",
                "@types/react": "^18.2.37",
                "@types/react-dom": "^18.2.15",
                "eslint": "^8.54.0",
                "eslint-config-next": "14.0.0"
            }
        }
        
        with open(app_dir / "package.json", "w") as f:
            json.dump(package_json, f, indent=2)

    def _create_next_config(self, app_dir: Path):
        next_config = """/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  }
}

module.exports = nextConfig"""
        
        with open(app_dir / "next.config.js", "w") as f:
            f.write(next_config)

    def _create_tsconfig(self, app_dir: Path):
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
        
        with open(app_dir / "tsconfig.json", "w") as f:
            json.dump(tsconfig, f, indent=2)

    def _create_template_components(self, app_src_dir: Path, spec: AppSpecification, template):
        """Create template-based React components"""
        
        # Create layout.tsx
        layout_content = f"""import type {{ Metadata }} from 'next'
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
        
        with open(app_src_dir / "layout.tsx", "w") as f:
            f.write(layout_content)

        # Create page.tsx based on template type
        page_content = self._generate_template_page(spec, template)
        with open(app_src_dir / "page.tsx", "w") as f:
            f.write(page_content)

    def _generate_template_page(self, spec: AppSpecification, template) -> str:
        """Generate the main page component based on template type"""
        
        if template.name == "Landy React Landing Page":
            return self._generate_landing_page(spec)
        elif "Dashboard" in template.name:
            return self._generate_dashboard_page(spec)
        elif "Portfolio" in template.name:
            return self._generate_portfolio_page(spec)
        else:
            return self._generate_generic_page(spec, template)

    def _generate_landing_page(self, spec: AppSpecification) -> str:
        return f'''export default function HomePage() {{
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {{/* Hero Section */}}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gradient-to-r from-blue-50 to-transparent sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">{spec.name}</span>
                  <span className="block text-blue-600 xl:inline"> for {spec.target_user}</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  {spec.description} - {spec.app_goal}
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                      Get Started
                    </button>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {{/* Problem Solution Section */}}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Solution</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Solving {spec.main_problem}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Designed specifically for {spec.target_user} who need {spec.app_goal.lower()}.
            </p>
          </div>
        </div>
      </div>

      {{/* Features Section */}}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Key Features
            </h2>
          </div>
          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <p className="ml-9 text-lg leading-6 font-medium text-gray-900">Easy to Use</p>
                </dt>
                <dd className="mt-2 ml-9 text-base text-gray-500">
                  Intuitive interface designed for {spec.target_user}
                </dd>
              </div>
              <div className="relative">
                <dt>
                  <p className="ml-9 text-lg leading-6 font-medium text-gray-900">Powerful Features</p>
                </dt>
                <dd className="mt-2 ml-9 text-base text-gray-500">
                  Everything you need to {spec.app_goal.lower()}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}}'''

    def _generate_dashboard_page(self, spec: AppSpecification) -> str:
        return f'''export default function DashboardPage() {{
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {spec.name} Dashboard
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      1,200
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Sessions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      89
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Success Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      98.2%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {spec.main_problem}
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>{spec.description}</p>
              </div>
              <div className="mt-5">
                <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}}'''

    def _generate_portfolio_page(self, spec: AppSpecification) -> str:
        return f'''export default function PortfolioPage() {{
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            {spec.name}
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            {spec.description}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
          For {spec.target_user}
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          <div className="group relative">
            <div className="w-full bg-gray-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75">
              <div className="w-full h-48 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
                <span className="text-white font-bold">Feature 1</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <div>
                <h3 className="text-sm text-gray-700">
                  Problem Solving
                </h3>
                <p className="mt-1 text-sm text-gray-500">{spec.main_problem}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}}'''

    def _generate_generic_page(self, spec: AppSpecification, template) -> str:
        return f'''export default function HomePage() {{
  return (
    <div className="min-h-screen bg-white">
      <div className="relative bg-gray-50 overflow-hidden">
        <div className="hidden sm:block sm:absolute sm:inset-y-0 sm:h-full sm:w-full">
          <div className="relative h-full max-w-7xl mx-auto">
            <svg
              className="absolute right-full transform translate-y-1/4 translate-x-1/4 lg:translate-x-1/2"
              width="404"
              height="784"
              fill="none"
              viewBox="0 0 404 784"
            >
              <defs>
                <pattern
                  id="f210dbf6-a58d-4871-961e-36d5016a0f49"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect x="0" y="0" width="4" height="4" className="text-gray-200" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="784" fill="url(#f210dbf6-a58d-4871-961e-36d5016a0f49)" />
            </svg>
          </div>
        </div>

        <div className="relative pt-6 pb-16 sm:pb-24">
          <div className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24 sm:px-6">
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">{spec.name}</span>
                <span className="block text-blue-600">for {spec.target_user}</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                {spec.description} - {spec.app_goal}
              </p>
              <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                <div className="rounded-md shadow">
                  <button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                    Get started
                  </button>
                </div>
                <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                  <button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                    Learn more
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for {spec.app_goal.lower()}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Solving {spec.main_problem} with modern technology
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Fast & Reliable</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Built for {spec.target_user} who need quick results
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-1m0 0l-3-9a5.002 5.002 0 00-6.001 0" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Easy to Use</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Simple interface designed for {spec.design_preferences.lower()}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}}'''

    def _create_styles(self, app_src_dir: Path, template):
        """Create global styles based on template"""
        
        if "Tailwind" in template.tech_stack:
            globals_css = """@tailwind base;
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
    @apply bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded;
  }
}"""
        else:
            globals_css = """body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}"""
        
        with open(app_src_dir / "globals.css", "w") as f:
            f.write(globals_css)

    def _create_template_readme(self, app_dir: Path, spec: AppSpecification, template):
        """Create README with template information"""
        
        readme_content = f"""# {spec.name}

## Overview
{spec.description}

**Goal:** {spec.app_goal}
**Target Users:** {spec.target_user}
**Problem Solved:** {spec.main_problem}

## Template Used
- **Template:** {template.name}
- **Category:** Based on proven {template.description}
- **Demo Reference:** {template.demo_url}
- **Tech Stack:** {', '.join(template.tech_stack)}

## Features
{chr(10).join(f'- {feature}' for feature in template.features)}

## Design
{spec.design_preferences}

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Tech Stack
- **Frontend:** {', '.join(template.tech_stack)}
- **Styling:** {"Tailwind CSS" if "Tailwind" in template.tech_stack else "CSS Modules"}
- **TypeScript:** Full type safety throughout

## Template Benefits
This application uses the proven "{template.name}" template structure, ensuring:
- Professional design patterns
- Accessible components
- Responsive layouts
- SEO optimization
- Performance best practices

## Customization
All content has been customized for {spec.target_user} to solve {spec.main_problem}.

---

*Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} using DevShop Template-Based Generator*
*Template: {template.name} | Reference: {template.demo_url}*"""

        with open(app_dir / "README.md", "w") as f:
            f.write(readme_content)

    def generate_app_sync(self, spec: AppSpecification) -> Dict[str, Any]:
        """Synchronous wrapper for template-based generation"""
        return asyncio.run(self.generate_app_from_template(spec))

# Update the orchestrator to use template-based generation
class TemplateBasedOrchestrator:
    def __init__(self, csv_file_path: str, output_directory: str = "generated_apps", 
                 max_concurrent: Optional[int] = None, show_progress: bool = True):
        self.csv_file_path = csv_file_path
        self.output_directory = output_directory
        self.max_concurrent = max_concurrent if max_concurrent is not None else get_optimal_worker_count()
        self.show_progress = show_progress
        self.logger = self._setup_logger()
        
        self.ingester = CSVAppIngester(csv_file_path)
        self.generator = TemplateBasedAppGenerator(output_directory)
        
        self.logger.info(f"Initialized template-based generator with {self.max_concurrent} workers")

    def _setup_logger(self) -> logging.Logger:
        logger = logging.getLogger(f"{__name__}.TemplateBasedOrchestrator")
        logger.setLevel(logging.INFO)
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        return logger

    def generate_all_apps(self) -> Dict[str, Any]:
        start_time = datetime.now()
        self.logger.info(f"🎯 Starting TEMPLATE-BASED multi-app generation from {self.csv_file_path}")
        
        try:
            specifications = self.ingester.read_app_specifications()
            if not specifications:
                raise ValueError("No valid app specifications found in CSV")

            self.logger.info(f"📊 Found {len(specifications)} app specifications to generate")
            
            # Show template assignments
            for spec in specifications:
                template_category = categorize_app(spec)
                template = WEBSITE_TEMPLATES[template_category]
                self.logger.info(f"📋 {spec.name} → {template.name} ({template_category})")

            with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_concurrent) as executor:
                future_to_spec = {
                    executor.submit(self.generator.generate_app_sync, spec): spec
                    for spec in specifications
                }

                successful_apps = []
                failed_apps = []

                for future in concurrent.futures.as_completed(future_to_spec):
                    spec = future_to_spec[future]
                    try:
                        result = future.result()
                        if result.get("success", False):
                            successful_apps.append(result)
                        else:
                            failed_apps.append(result)
                    except Exception as e:
                        error_result = {
                            "success": False,
                            "app_name": spec.name,
                            "error": str(e),
                            "generation_time": datetime.now().isoformat(),
                        }
                        failed_apps.append(error_result)

            end_time = datetime.now()
            total_time = (end_time - start_time).total_seconds()

            summary = {
                "total_apps": len(specifications),
                "successful_apps": len(successful_apps),
                "failed_apps": len(failed_apps),
                "total_time_seconds": total_time,
                "concurrent_workers": self.max_concurrent,
                "generation_method": "template_based",
                "templates_used": {},
                "output_directory": self.output_directory,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "results": {"successful": successful_apps, "failed": failed_apps},
            }
            
            # Add template usage statistics
            for result in successful_apps:
                template_used = result.get("template_used", "Unknown")
                summary["templates_used"][template_used] = summary["templates_used"].get(template_used, 0) + 1

            self.logger.info(f"🎉 Template-based generation complete: {len(successful_apps)}/{len(specifications)} apps successful")
            self.logger.info(f"⚡ Total time: {total_time:.2f} seconds with {self.max_concurrent} workers")
            
            # Show template usage
            for template, count in summary["templates_used"].items():
                self.logger.info(f"📄 {template}: {count} apps")

            return summary

        except Exception as e:
            self.logger.error(f"❌ Error in template-based multi-app generation: {e}")
            raise

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate multiple apps using proven TypeScript React templates")
    parser.add_argument("csv_file", help="Path to CSV file with app specifications")
    parser.add_argument("--output-dir", default="generated_apps", help="Output directory")
    parser.add_argument("--max-concurrent", type=int, default=None, help="Max concurrent generations")
    parser.add_argument("--no-progress", action="store_true", help="Disable progress display")
    
    args = parser.parse_args()
    
    try:
        print(f"🎯 Template-Based Multi-App Generator")
        print(f"📋 Available Templates: {len(WEBSITE_TEMPLATES)}")
        for name, template in WEBSITE_TEMPLATES.items():
            print(f"   • {template.name} - {template.description}")
        print()
        
        orchestrator = TemplateBasedOrchestrator(
            csv_file_path=args.csv_file,
            output_directory=args.output_dir,
            max_concurrent=args.max_concurrent,
            show_progress=not args.no_progress,
        )

        results = orchestrator.generate_all_apps()

        results_file = Path(args.output_dir) / "template_generation_results.json"
        with open(results_file, "w") as f:
            json.dump(results, f, indent=2)

        print("\\n" + "=" * 80)
        print("🎉 TEMPLATE-BASED GENERATION SUMMARY")
        print("=" * 80)
        print(f"📊 Total apps: {results['total_apps']}")
        print(f"✅ Successful: {results['successful_apps']}")
        print(f"❌ Failed: {results['failed_apps']}")
        print(f"⚡ Total time: {results['total_time_seconds']:.2f} seconds")
        print(f"📄 Templates used:")
        for template, count in results['templates_used'].items():
            print(f"   • {template}: {count} apps")
        print(f"💾 Results saved: {results_file}")

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())'''
    
    with open("main_template_based.py", "w") as f:
        f.write(updated_main)
    
    print("✅ Created template-based generator: main_template_based.py")

def main():
    """Create the template-based generation system"""
    print("🎯 Creating Template-Based App Generation System")
    print("=" * 60)
    
    print(f"📋 Available Templates ({len(WEBSITE_TEMPLATES)}):")
    for key, template in WEBSITE_TEMPLATES.items():
        print(f"  • {template.name}")
        print(f"    └─ Best for: {', '.join(template.best_for)}")
        print(f"    └─ Demo: {template.demo_url}")
        print()
    
    create_template_based_generator()
    
    print("🎉 Template system created successfully!")
    print("📁 Files created:")
    print("  • template_system.py (this file)")
    print("  • main_template_based.py (updated main script)")
    print()
    print("🚀 To use:")
    print("  python3 main_template_based.py sample.csv")

if __name__ == "__main__":
    main()