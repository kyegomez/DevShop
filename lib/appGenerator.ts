import { AppSpecification, GenerationResult } from './types'
import { VercelDeployer } from './vercelDeployer'
import { Logger } from './logger'
import fs from 'fs'
import path from 'path'

export class AppGenerator {
  private outputDirectory: string
  private deployer: VercelDeployer
  private enableDeployment: boolean
  private logger: Logger

  constructor(outputDirectory: string = 'generated_apps', enableDeployment: boolean = true) {
    this.outputDirectory = outputDirectory
    this.enableDeployment = enableDeployment
    this.deployer = new VercelDeployer()
    this.logger = Logger.getInstance()
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDirectory)) {
      fs.mkdirSync(this.outputDirectory, { recursive: true })
    }
    
    this.logger.info(`AppGenerator initialized`, {
      outputDirectory: this.outputDirectory,
      enableDeployment: this.enableDeployment
    })
  }

  private createSystemPrompt(spec: AppSpecification): string {
    return `You are an expert software developer and architect. You will create a complete, production-ready application based on the following specification:

**Application Name:** ${spec.name}
**Description:** ${spec.description}
**Goal:** ${spec.app_goal}
**Target User:** ${spec.target_user}
**Main Problem Solved:** ${spec.main_problem}
**Design Preferences:** ${spec.design_preferences}
**Tech Stack:** ${spec.tech_stack || 'Python/React'}
**Complexity Level:** ${spec.complexity_level || 'medium'}
**Additional Requirements:** ${spec.additional_requirements || 'None'}

Create a complete application that includes:
1. Proper project structure with all necessary files
2. Clean, well-documented code following best practices
3. User interface that matches the design preferences
4. Error handling and input validation
5. README with setup and usage instructions
6. Configuration files (requirements.txt, package.json, etc.)
7. Basic tests if applicable

Focus on creating a functional, user-friendly application that directly addresses the main problem for the target user. Make sure the code is production-ready and follows modern development practices.

Include proper documentation with docstrings for all functions and classes. Ensure the application can be run immediately after setup.`
  }

  async generateApp(spec: AppSpecification): Promise<GenerationResult> {
    const startTime = new Date()
    
    try {
      // Create app directory
      const appDirName = spec.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
      const appDir = path.join(this.outputDirectory, appDirName)
      
      if (!fs.existsSync(appDir)) {
        fs.mkdirSync(appDir, { recursive: true })
      }

      // Simulate generation time based on complexity
      const complexityDelays = { low: 2000, medium: 4000, high: 6000 }
      const delay = complexityDelays[spec.complexity_level || 'medium']
      await new Promise(resolve => setTimeout(resolve, delay))

      // Create directory structure based on tech stack
      if (spec.tech_stack?.toLowerCase().includes('react')) {
        await this.createNextJsApp(appDir, spec)
      } else if (spec.tech_stack?.toLowerCase().includes('python')) {
        await this.createPythonApp(appDir, spec)
      } else {
        await this.createBasicApp(appDir, spec)
      }

      const endTime = new Date()
      const files = this.getAllFiles(appDir)

      let deploymentUrl: string | undefined
      let deploymentStatus: 'pending' | 'deploying' | 'deployed' | 'failed' = 'pending'

      // Auto-deploy to Vercel if enabled and it's a React app
      if (this.enableDeployment && spec.tech_stack?.toLowerCase().includes('react')) {
        try {
          this.logger.deployment(`Starting auto-deployment`, spec.name, {
            appDir,
            techStack: spec.tech_stack
          })
          deploymentStatus = 'deploying'
          
          const deployResult = await this.deployer.deployApp(appDir, spec.name)
          
          if (deployResult.success && deployResult.url) {
            deploymentUrl = deployResult.url
            deploymentStatus = 'deployed'
            this.logger.deployment(`Deployment successful`, spec.name, {
              url: deploymentUrl,
              deploymentId: deployResult.deploymentId,
              isDemoMode: deployResult.url.includes('devshop.local')
            })
          } else {
            deploymentStatus = 'failed'
            this.logger.error(`Deployment failed for ${spec.name}`, {
              error: deployResult.error,
              appDir
            })
          }
        } catch (error) {
          deploymentStatus = 'failed'
          this.logger.error(`Deployment error for ${spec.name}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            appDir
          })
        }
      } else {
        this.logger.info(`Skipping deployment`, {
          appName: spec.name,
          reason: !this.enableDeployment ? 'Deployment disabled' : 'Non-React app',
          techStack: spec.tech_stack
        })
      }

      return {
        success: true,
        app_name: spec.name,
        output_directory: appDir,
        files_created: files,
        generation_time: endTime.toISOString(),
        deployment_url: deploymentUrl,
        deployment_status: deploymentStatus
      }

    } catch (error) {
      return {
        success: false,
        app_name: spec.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        generation_time: new Date().toISOString()
      }
    }
  }

  private generateReadme(spec: AppSpecification): string {
    return `# ${spec.name}

## Description
${spec.description}

## Goal
${spec.app_goal}

## Target User
${spec.target_user}

## Problem Solved
${spec.main_problem}

## Design Preferences
${spec.design_preferences}

## Tech Stack
${spec.tech_stack || 'Python/React'}

## Complexity Level
${spec.complexity_level || 'medium'}

## Setup Instructions
1. Navigate to the project directory
2. Install dependencies:
   ${spec.tech_stack?.toLowerCase().includes('python') ? 'pip install -r requirements.txt' : 'npm install'}
3. Run the application:
   ${spec.tech_stack?.toLowerCase().includes('python') ? 'python main.py' : 'npm start'}

## Usage
This application helps ${spec.target_user} by ${spec.app_goal.toLowerCase()}.

Key features:
- Addresses the main problem: ${spec.main_problem}
- Follows design preferences: ${spec.design_preferences}
${spec.additional_requirements ? `- Additional features: ${spec.additional_requirements}` : ''}

## Generated Information
- Generated on: ${new Date().toISOString()}
- Complexity: ${spec.complexity_level || 'medium'}
- Target user: ${spec.target_user}

---
*This application was generated by DevShop Multi-App Generator*`
  }

  private generateMainFile(spec: AppSpecification): string {
    const isReact = spec.tech_stack?.toLowerCase().includes('react')
    const isPython = spec.tech_stack?.toLowerCase().includes('python')

    if (isReact) {
      return `import React, { useState } from 'react';
import './App.css';

/**
 * ${spec.name} - ${spec.description}
 * 
 * This application addresses: ${spec.main_problem}
 * Target users: ${spec.target_user}
 */

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  React.useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>${spec.name}</h1>
        <p>{spec.description}</p>
        <p>For: ${spec.target_user}</p>
        <p>Solving: ${spec.main_problem}</p>
        {isLoaded && <p>✅ Application loaded successfully!</p>}
      </header>
      <main>
        {/* Main application content would be generated by Claude based on specifications */}
        <section>
          <h2>Welcome to ${spec.name}</h2>
          <p>This app helps ${spec.target_user} by providing solutions for ${spec.main_problem}.</p>
          ${spec.additional_requirements ? `<p>Additional features: ${spec.additional_requirements}</p>` : ''}
        </section>
      </main>
    </div>
  );
}

export default App;`
    } else if (isPython) {
      return `"""
${spec.name} - ${spec.description}

This application addresses: ${spec.main_problem}
Target users: ${spec.target_user}
"""

import sys
from datetime import datetime

class ${spec.name.replace(/[^a-zA-Z0-9]/g, '')}App:
    """
    Main application class for ${spec.name}.
    
    This application helps ${spec.target_user} by ${spec.app_goal.toLowerCase()}.
    """
    
    def __init__(self):
        self.name = "${spec.name}"
        self.description = "${spec.description}"
        self.target_user = "${spec.target_user}"
        self.main_problem = "${spec.main_problem}"
        
    def run(self):
        """
        Main entry point for the application.
        
        This method would contain the core application logic
        generated by Claude based on the specifications.
        """
        print(f"🚀 Welcome to {self.name}!")
        print(f"📝 Description: {self.description}")
        print(f"👥 This app helps: {self.target_user}")
        print(f"🎯 By solving: {self.main_problem}")
        print(f"⏰ Started at: {datetime.now().isoformat()}")
        
        # Main application logic would be implemented here
        # based on the specific requirements and design preferences
        
        print("✅ Application initialized successfully!")
        ${spec.additional_requirements ? `print("🔧 Additional features: ${spec.additional_requirements}")` : ''}

def main():
    """Main entry point for ${spec.name}."""
    app = ${spec.name.replace(/[^a-zA-Z0-9]/g, '')}App()
    app.run()

if __name__ == "__main__":
    main()`
    } else {
      return `// ${spec.name} - ${spec.description}
// Target users: ${spec.target_user}
// Main problem solved: ${spec.main_problem}

console.log("🚀 Welcome to ${spec.name}!");
console.log("📝 Description: ${spec.description}");
console.log("👥 This app helps: ${spec.target_user}");
console.log("🎯 By solving: ${spec.main_problem}");

// Main application logic would be implemented here
// based on the specific requirements and design preferences

console.log("✅ Application initialized successfully!");`
    }
  }

  private generateDependencies(spec: AppSpecification): string {
    const isReact = spec.tech_stack?.toLowerCase().includes('react')
    const isPython = spec.tech_stack?.toLowerCase().includes('python')

    if (isPython) {
      return `# Requirements for ${spec.name}
# Generated based on ${spec.complexity_level || 'medium'} complexity level

# Core dependencies
requests>=2.28.0
python-dateutil>=2.8.2

# Additional dependencies based on complexity
${spec.complexity_level === 'high' ? `flask>=2.2.0
sqlalchemy>=1.4.0
pandas>=1.5.0` : ''}
${spec.complexity_level === 'medium' ? `flask>=2.2.0` : ''}

# Development dependencies
pytest>=7.0.0
pytest-cov>=4.0.0`
    } else if (isReact) {
      return `{
  "name": "${spec.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`
    } else {
      return `# Dependencies for ${spec.name}
# This would be customized based on the tech stack and requirements`
    }
  }

  private generatePackageJson(spec: AppSpecification): string {
    return `{
  "name": "${spec.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}",
  "version": "0.1.0",
  "description": "${spec.description}",
  "main": "src/index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`
  }

  private getMainFileName(techStack?: string): string {
    if (techStack?.toLowerCase().includes('python')) return 'main.py'
    if (techStack?.toLowerCase().includes('react')) return 'src/App.js'
    return 'main.js'
  }

  private getDependenciesFileName(techStack?: string): string {
    if (techStack?.toLowerCase().includes('python')) return 'requirements.txt'
    if (techStack?.toLowerCase().includes('react')) return 'package.json'
    return 'package.json'
  }

  private getAllFiles(dir: string): string[] {
    const files: string[] = []
    
    const scanDir = (currentDir: string, relativePath = '') => {
      const items = fs.readdirSync(currentDir)
      for (const item of items) {
        const fullPath = path.join(currentDir, item)
        const itemRelativePath = path.join(relativePath, item)
        
        if (fs.statSync(fullPath).isDirectory()) {
          scanDir(fullPath, itemRelativePath)
        } else {
          files.push(itemRelativePath)
        }
      }
    }
    
    scanDir(dir)
    return files
  }

  private async createNextJsApp(appDir: string, spec: AppSpecification) {
    // Create Next.js directory structure
    const appSubDir = path.join(appDir, 'app')
    const publicDir = path.join(appDir, 'public')
    
    fs.mkdirSync(appSubDir, { recursive: true })
    fs.mkdirSync(publicDir, { recursive: true })

    // Create package.json with Next.js and Vercel-optimized dependencies
    const packageJson = {
      name: spec.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint"
      },
      dependencies: {
        react: "^18",
        "react-dom": "^18",
        next: "14.0.0",
        "@types/node": "^20",
        "@types/react": "^18",
        "@types/react-dom": "^18",
        typescript: "^5",
        tailwindcss: "^3.3.0",
        autoprefixer: "^10.0.1",
        postcss: "^8",
        "lucide-react": "^0.294.0"
      },
      devDependencies: {
        eslint: "^8",
        "eslint-config-next": "14.0.0"
      }
    }
    
    fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(packageJson, null, 2))

    // Create Next.js config
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is enabled by default in Next.js 14+
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverComponentsExternalPackages: [],
  }
}

module.exports = nextConfig`
    
    fs.writeFileSync(path.join(appDir, 'next.config.js'), nextConfig)

    // Create TypeScript config
    const tsConfig = {
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "es6"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./*"] }
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"]
    }
    
    fs.writeFileSync(path.join(appDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2))

    // Create Tailwind config
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
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
}`
    
    fs.writeFileSync(path.join(appDir, 'tailwind.config.js'), tailwindConfig)

    // Create PostCSS config
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
    
    fs.writeFileSync(path.join(appDir, 'postcss.config.js'), postcssConfig)

    // Create Vercel configuration
    const vercelConfig = {
      functions: {
        "app/api/*/route.ts": {
          maxDuration: 60
        }
      }
    }
    
    fs.writeFileSync(path.join(appDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2))

    // Create app layout
    const layout = `import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '${spec.name}',
  description: '${spec.description}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`
    
    fs.writeFileSync(path.join(appSubDir, 'layout.tsx'), layout)

    // Create global styles
    const globalCss = `@tailwind base;
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
}`
    
    fs.writeFileSync(path.join(appSubDir, 'globals.css'), globalCss)

    // Create main page with modern React patterns
    const mainPage = `'use client'

import { useState, useEffect } from 'react'
import { Heart, Star, Users, Target, Zap } from 'lucide-react'

export default function ${spec.name.replace(/[^a-zA-Z0-9]/g, '')}() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeFeatures, setActiveFeatures] = useState(0)

  useEffect(() => {
    setIsLoaded(true)
    const timer = setInterval(() => {
      setActiveFeatures(prev => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const features = [
    { icon: Target, title: "Problem Solving", desc: "${spec.main_problem}" },
    { icon: Users, title: "Target Users", desc: "${spec.target_user}" },
    { icon: Star, title: "Design Focus", desc: "${spec.design_preferences}" },
    { icon: Zap, title: "Additional Features", desc: "${spec.additional_requirements || 'Enhanced functionality'}" }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-indigo-600 rounded-full">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">
            ${spec.name}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            ${spec.description}
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-green-100 dark:bg-green-900 rounded-full">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <span className="text-green-800 dark:text-green-200 font-medium">
              {isLoaded ? "✅ Application Ready" : "🔄 Loading..."}
            </span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div
                key={index}
                className={\`p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 \${
                  activeFeatures === index ? 'ring-2 ring-indigo-500' : ''
                }\`}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg mb-4">
                  <IconComponent className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {feature.desc}
                </p>
              </div>
            )
          })}
        </div>

        {/* App Goal Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">
            Our Mission
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-3xl mx-auto leading-relaxed">
            ${spec.app_goal}
          </p>
        </div>

        {/* Complexity Badge */}
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Complexity Level: 
            </span>
            <span className="ml-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded-full">
              ${spec.complexity_level || 'medium'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            Generated by DevShop Multi-App Generator • Built with Next.js & Tailwind CSS
          </p>
          <p className="text-xs mt-2">
            Ready for Vercel deployment • Optimized for production
          </p>
        </footer>
      </div>
    </main>
  )
}`
    
    fs.writeFileSync(path.join(appSubDir, 'page.tsx'), mainPage)

    // Create README with deployment instructions
    const readme = this.generateVercelReadme(spec)
    fs.writeFileSync(path.join(appDir, 'README.md'), readme)

    // Create .gitignore
    const gitignore = `# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.tsbuildinfo
next-env.d.ts

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# IDEs
.vscode/
.idea/`
    
    fs.writeFileSync(path.join(appDir, '.gitignore'), gitignore)
  }

  private async createPythonApp(appDir: string, spec: AppSpecification) {
    // Create README
    const readmeContent = this.generateReadme(spec)
    fs.writeFileSync(path.join(appDir, 'README.md'), readmeContent)

    // Create main application file
    const mainContent = this.generateMainFile(spec)
    fs.writeFileSync(path.join(appDir, 'main.py'), mainContent)

    // Create requirements
    const depsContent = this.generateDependencies(spec)
    fs.writeFileSync(path.join(appDir, 'requirements.txt'), depsContent)
  }

  private async createBasicApp(appDir: string, spec: AppSpecification) {
    // Create README
    const readmeContent = this.generateReadme(spec)
    fs.writeFileSync(path.join(appDir, 'README.md'), readmeContent)

    // Create main application file
    const mainContent = this.generateMainFile(spec)
    fs.writeFileSync(path.join(appDir, 'main.js'), mainContent)

    // Create package.json
    const packageJsonContent = this.generatePackageJson(spec)
    fs.writeFileSync(path.join(appDir, 'package.json'), packageJsonContent)
  }

  private generateVercelReadme(spec: AppSpecification): string {
    return `# ${spec.name}

## Description
${spec.description}

## 🎯 Goal
${spec.app_goal}

## 👥 Target User
${spec.target_user}

## 🔧 Problem Solved
${spec.main_problem}

## 🎨 Design Preferences
${spec.design_preferences}

## 📊 Complexity Level
${spec.complexity_level || 'medium'}

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/${spec.name.toLowerCase().replace(/[^a-z0-9]/g, '-')})

## 🛠️ Local Development

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Run development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## 📦 Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## 🌐 Deploy to Vercel

### Option 1: One-Click Deploy
Click the "Deploy with Vercel" button above.

### Option 2: Manual Deploy
1. Push this code to GitHub
2. Connect your GitHub repo to Vercel
3. Deploy automatically

### Option 3: Vercel CLI
\`\`\`bash
npm i -g vercel
vercel
\`\`\`

## ✨ Features

- ⚡ **Next.js 14** with App Router
- 🎨 **Tailwind CSS** for styling
- 🔧 **TypeScript** for type safety
- 📱 **Responsive Design** 
- 🌙 **Dark Mode** support
- 🚀 **Vercel-optimized** deployment
- 📊 **Performance** optimized

## 🏗️ Tech Stack

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Icons:** Lucide React
- **Deployment:** Vercel

## 📁 Project Structure

\`\`\`
${spec.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── next.config.js
├── tailwind.config.js
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
\`\`\`

## 🎯 Application Purpose

This application helps **${spec.target_user}** by providing solutions for **${spec.main_problem}**.

${spec.additional_requirements ? `## 🔧 Additional Features\n${spec.additional_requirements}` : ''}

## 📝 Generated Information

- **Generated on:** ${new Date().toISOString()}
- **Complexity:** ${spec.complexity_level || 'medium'}
- **Target user:** ${spec.target_user}
- **Generator:** DevShop Multi-App Generator

---

**🚀 Ready for immediate deployment to Vercel!**`
  }
}