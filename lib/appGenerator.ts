import { AppSpecification, GenerationResult } from './types'
import { VercelDeployer } from './vercelDeployer'
import { Logger } from './logger'
import fs from 'fs'
import path from 'path'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

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
    
    // Ensure Anthropic API key available for AI SDK provider
    const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_TOKEN
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY or ANTHROPIC_TOKEN environment variable is required')
    }
    // Normalize to ANTHROPIC_API_KEY expected by @ai-sdk/anthropic
    if (!process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = anthropicKey
    }
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDirectory)) {
      fs.mkdirSync(this.outputDirectory, { recursive: true })
    }
    
    this.logger.info(`AppGenerator initialized`, {
      outputDirectory: this.outputDirectory,
      enableDeployment: this.enableDeployment,
      anthropicConfigured: !!anthropicKey
    })
  }

  private createSystemPrompt(spec: AppSpecification): string {
    const isReact = spec.tech_stack?.toLowerCase().includes('react')
    const techStack = isReact ? 'Next.js 14 with TypeScript and Tailwind CSS' : spec.tech_stack || 'Python'
    
    return `You are an expert product strategist, UX researcher, and full-stack developer. 

PHASE 1 - RESEARCH & IDEATION:
First, deeply analyze and expand on this user idea:

**Original Concept:** ${spec.name} - ${spec.description}
**Target User:** ${spec.target_user}
**Main Problem:** ${spec.main_problem}
**Goal:** ${spec.app_goal}
**Design Preferences:** ${spec.design_preferences}
**Tech Stack:** ${techStack}
**Complexity:** ${spec.complexity_level || 'medium'}
**Additional Requirements:** ${spec.additional_requirements || 'None'}

RESEARCH TASKS:
1. **Market Analysis**: What similar solutions exist? What gaps can we fill?
2. **User Journey Mapping**: How would ${spec.target_user} discover, use, and benefit from this app?
3. **Feature Prioritization**: What are the MUST-HAVE vs NICE-TO-HAVE features?
4. **Pain Point Deep Dive**: What are ALL the sub-problems within "${spec.main_problem}"?
5. **User Personas**: Create 2-3 specific user personas who would use this app
6. **Value Proposition**: What makes this app uniquely valuable?
7. **Success Metrics**: How would we measure if this app solves the problem?

PHASE 2 - ENHANCED CONCEPT:
Based on your research, expand the original idea into a comprehensive product vision:
- Enhanced feature set that goes beyond the basic description
- Specific user workflows and interactions
- Content strategy and data requirements
- Monetization or engagement strategies (if applicable)
- Accessibility and inclusion considerations

PHASE 3 - IMPLEMENTATION:
Build a production-ready application that reflects this enhanced vision:

${isReact ? `
NEXT.JS 14 APP REQUIREMENTS:

**Core Technical Stack:**
- Next.js 14 with App Router and TypeScript
- Tailwind CSS for styling with custom design system
- Lucide React for icons and React Hook Form for forms
- Local state management with useState/useReducer
- Responsive design (mobile-first approach)

**Advanced Features Based on Research:**
1. **Multi-Page Application** - Create logical page structure:
   - Landing page that hooks users immediately
   - Main dashboard/workspace for core functionality  
   - About/How-it-works page explaining value proposition
   - Contact/Support page for user engagement

2. **Enhanced User Experience:**
   - Onboarding flow for new users
   - Interactive tutorials or guided tours
   - Progress indicators and feedback systems
   - Search and filtering capabilities
   - Data persistence (localStorage/sessionStorage)

3. **Content & Data Strategy:**
   - Dynamic content based on user personas identified
   - Sample data that demonstrates real value
   - Export/import functionality where relevant
   - Analytics tracking for user behavior

4. **Modern UI/UX Patterns:**
   - Card-based layouts for information hierarchy
   - Modal dialogs for secondary actions
   - Toast notifications for user feedback
   - Loading skeletons and progressive enhancement
   - Dark/light mode toggle if appropriate

**REQUIRED FILE STRUCTURE:**
- app/page.tsx (compelling landing page)
- app/dashboard/page.tsx (main application interface)
- app/layout.tsx (root layout with navigation)
- app/globals.css (comprehensive design system)
- components/dashboard/ (dashboard-specific components at ROOT level)
- components/ui/ (reusable UI components at ROOT level)
- components/landing/ (landing page components at ROOT level)
- package.json (optimized dependencies)
- next.config.js, tailwind.config.js, tsconfig.json
- README.md (comprehensive setup & value proposition)

**CRITICAL: Import Requirements:**
- Use @/ path aliases for ALL imports (much cleaner than relative paths)
- Ensure all imported components are actually generated
- Include ALL components referenced in any file
- Generate complete component files, not just interfaces

**PATH ALIAS EXAMPLES:**
✅ app/page.tsx imports "@/components/landing/Hero"
✅ app/dashboard/page.tsx imports "@/components/dashboard/DashboardHeader" 
✅ app/components/landing/Hero.tsx imports "@/components/ui/Button"
✅ app/layout.tsx imports "@/app/globals.css"
❌ NEVER use relative paths like "../../components/" - ALWAYS use "@/components/"

**REACT SERVER/CLIENT COMPONENTS:**
- Add "use client" directive to ANY component that uses:
  - useState, useEffect, useRef, or other React hooks
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (localStorage, window, etc.)
- Server components (no "use client") can only use:
  - Props, async/await, server-side APIs
  - No hooks, no event handlers, no browser APIs

**CLIENT COMPONENT EXAMPLES:**
- Add "use client" at the top of any component using hooks
- Example: TaskBoard component with useState needs "use client"
- Example: Button component with onClick needs "use client"

**SYNTAX REQUIREMENTS:**
- NEVER break strings across lines without proper concatenation
- Use template literals for multi-line strings: \`string content\`
- Escape quotes properly in strings: "can't" should be "can\\'t"

**PRE-GENERATION PLANNING:**
Before writing any code, create a complete list of all components you will need:
1. List every component that will be imported
2. Ensure each component has a clear purpose and functionality
3. Generate ALL components before generating files that import them
4. Test your import paths mentally before writing them

**MANDATORY COMPONENT GENERATION:**
If you reference ANY component in an import statement, you MUST generate that component file. For example:
- If dashboard/page.tsx imports "../components/dashboard/DashboardHeader" → Generate DashboardHeader.tsx
- If dashboard/page.tsx imports "../components/dashboard/TaskBoard" → Generate TaskBoard.tsx
- If dashboard/page.tsx imports "../components/ui/LoadingSkeleton" → Generate LoadingSkeleton.tsx

**CRITICAL RULE: BEFORE GENERATING ANY FILE WITH IMPORTS, FIRST LIST ALL COMPONENTS YOU WILL NEED TO GENERATE.**
**Example: If dashboard/page.tsx needs DashboardHeader, TaskBoard, and ProjectStats, generate ALL THREE components first.**
**NEVER leave an import statement without a corresponding component file.**

**WHAT NOT TO DO (THIS WILL CAUSE BUILD FAILURES):**
❌ DO NOT use relative imports: "../../components/dashboard/Header" 
❌ DO NOT break strings: 'can't do this' (missing escape)
❌ DO NOT use hooks without "use client"
❌ DO NOT generate imports for non-existent components

**WHAT TO DO:**
✅ ALWAYS use @/ imports: "@/components/dashboard/Header"
✅ Add "use client" to interactive components
✅ Escape quotes: "can\\'t do this" or use template literals
✅ Generate ALL components before importing them

**CRITICAL IMPORT FIXES:**
Replace these common mistakes:
- "../../components/" → "@/components/"
- "../components/" → "@/components/"  
- "./components/" → "@/components/"
- ALL imports must use @/ aliases!

**COMPONENT STRUCTURE:**
- components/dashboard/ (dashboard-specific components at ROOT level)
- components/ui/ (reusable UI components at ROOT level)  
- components/landing/ (landing page components at ROOT level)
- lib/ (utilities, hooks, types at ROOT level)
- app/ (Next.js pages and layouts)

**NO MISSING IMPORTS:**
Every import statement must have a corresponding generated file. This is critical for successful builds.

**FINAL VALIDATION CHECK:**
Before outputting your JSON, verify that:
1. Every import statement in every file has a corresponding component file
2. All component files are complete and functional (not just stubs)
3. The file structure matches exactly what you're importing
4. No circular dependencies exist

**GENERATION ORDER:**
1. Generate ALL component files first at ROOT level (components/ui/, components/landing/, components/dashboard/)
2. Generate utility files at ROOT level (lib/, types/)
3. Generate page files that import the components (app/page.tsx, app/dashboard/page.tsx)
4. Generate layout files last (app/layout.tsx)

**CRITICAL: Components go at ROOT level, NOT inside app/ folder!**

**IF YOU CANNOT GENERATE ALL REQUIRED COMPONENTS, DO NOT GENERATE THE FILE THAT IMPORTS THEM.**
**PREFER SIMPLER COMPONENTS OVER MISSING IMPORTS.**

**Landing Page Requirements:**
- Hero section that immediately communicates value
- Social proof or testimonials (mock data)
- Feature highlights based on research
- Clear call-to-action to start using the app
- FAQ section addressing common concerns

**Main Application Features:**
- Implement ALL identified must-have features
- Include sample data that showcases capabilities
- Real functionality, not just UI mockups
- Form validation and error handling
- Responsive design for all device sizes
` : `
PYTHON APPLICATION REQUIREMENTS:

**Enhanced Python App Based on Research:**
1. **Comprehensive Application Structure:**
   - main.py (entry point with enhanced CLI interface)
   - core/ (business logic modules)
   - utils/ (helper functions and utilities)
   - data/ (sample data and configurations)
   - tests/ (unit tests for key functionality)

2. **Advanced Features:**
   - Command-line interface with argparse
   - Configuration management (config files)
   - Data persistence (JSON/CSV files)
   - Error logging and user feedback
   - Progress indicators for long operations
   - Help system and documentation

3. **User Experience Focus:**
   - Interactive prompts for user input
   - Clear success/error messages
   - Sample data to demonstrate capabilities
   - Export functionality for results
   - Backup and restore features

**REQUIRED FILES:**
- main.py (enhanced CLI application)
- core/app_logic.py (main business logic)
- utils/helpers.py (utility functions)
- config/settings.py (configuration management)
- data/sample_data.json (demonstration data)
- requirements.txt (comprehensive dependencies)
- README.md (detailed setup and usage guide)
- tests/test_main.py (basic unit tests)
`}

**CRITICAL INSTRUCTIONS:**

1. **Think Like a Product Manager First**: Before coding, deeply understand the user's world, their daily challenges, and how this app fits into their workflow.

2. **Create Real Value**: Don't just build what's described - build what's NEEDED based on your research and user analysis.

3. **Show, Don't Tell**: Include realistic sample data, working examples, and demonstration content that proves the app's value immediately.

4. **Design for Growth**: Create a foundation that could realistically evolve into a larger product.

5. **Focus on User Success**: Every feature should have a clear purpose in helping ${spec.target_user} achieve ${spec.app_goal}.

  **CRITICAL OUTPUT FORMAT (JSON WITH BASE64 CONTENT):**

  You MUST respond with ONLY a valid JSON object. All file content must be base64-encoded to prevent JSON escaping issues.

  Required format:
  {
    "files": {
      "path/to/file.ext": {
        "encoding": "base64",
        "content": "BASE64_ENCODED_CONTENT_HERE"
      }
    }
  }

  CRITICAL RULES:
  - Every file's content MUST be base64-encoded before placing in JSON
  - Use only double quotes for JSON strings
  - No raw code content - everything must be base64 encoded
  - No additional text, markdown, or commentary outside the JSON object
  - Validate your JSON syntax before responding

**Your mission**: Create an application that doesn't just solve "${spec.main_problem}" but creates a delightful, comprehensive solution that users would actually want to use and recommend to others.`
  }

  private async generateWithClaude(spec: AppSpecification): Promise<{ files: Record<string, string> }> {
    this.logger.info(`Generating app with Claude API`, { appName: spec.name, techStack: spec.tech_stack })
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      const systemPrompt = this.createSystemPrompt(spec)
      
      // Define structured schema for robust object generation
      const FileValueSchema = z.union([
        z.object({ encoding: z.literal('base64'), content: z.string() }),
        z.object({ b64: z.string() }),
        z.string()
      ])

      const ResponseSchema = z.object({
        files: z.record(FileValueSchema)
      })

      this.logger.info(`Starting Claude generation with structured output`, { 
        promptLength: systemPrompt.length,
        modelId: 'claude-3-5-sonnet-20241022'
      })

      const { object } = await generateObject({
        model: anthropic('claude-3-5-sonnet-20241022'),
        temperature: 0.7, // Lower temperature for more consistent JSON output
        schema: ResponseSchema,
        prompt: systemPrompt,
      })

      this.logger.info(`Claude API response received`, { 
        appName: spec.name, 
        fileCount: Object.keys(object.files).length,
        fileKeys: Object.keys(object.files).slice(0, 5) // Log first 5 file keys for debugging
      })

      // Decode base64 contents if present
      const decodedFiles: Record<string, string> = {}
      for (const [filePath, value] of Object.entries<any>(object.files)) {
        try {
          if (value && typeof value === 'object' && (value.encoding === 'base64' || value.b64)) {
            const b64 = typeof value.b64 === 'string' ? value.b64 : String(value.content || '')
            
            if (!b64) {
              this.logger.warn(`Empty base64 content for file`, { filePath })
              decodedFiles[filePath] = ''
              continue
            }

            try {
              const decodedContent = Buffer.from(b64, 'base64').toString('utf8')
              decodedFiles[filePath] = decodedContent
              this.logger.info(`Successfully decoded base64 file`, { 
                filePath, 
                originalSize: b64.length, 
                decodedSize: decodedContent.length 
              })
            } catch (b64Error) {
              this.logger.error('Base64 decode failed', { 
                filePath, 
                b64Length: b64.length,
                b64Preview: b64.substring(0, 50),
                error: b64Error instanceof Error ? b64Error.message : 'Unknown base64 error'
              })
              decodedFiles[filePath] = ''
            }
          } else if (typeof value === 'string') {
            // Accept raw string (model may return direct content)
            this.logger.info(`Using raw string content for file`, { filePath, contentLength: value.length })
            decodedFiles[filePath] = value
          } else {
            this.logger.warn('Unknown file value format; coercing to string', { 
              filePath, 
              type: typeof value,
              value: JSON.stringify(value).substring(0, 100)
            })
            decodedFiles[filePath] = String(value ?? '')
          }
        } catch (fileError) {
          this.logger.error('Error processing file', { 
            filePath, 
            error: fileError instanceof Error ? fileError.message : 'Unknown file processing error' 
          })
          decodedFiles[filePath] = ''
        }
      }

      this.logger.info(`Claude generation completed successfully`, { 
        appName: spec.name,
        totalFiles: Object.keys(decodedFiles).length,
        nonEmptyFiles: Object.entries(decodedFiles).filter(([_, content]) => content.length > 0).length
      })
      
      return { files: decodedFiles }
    } catch (error) {
      // Enhanced error logging for better debugging
      if (error instanceof Error) {
        this.logger.error(`Claude API error for ${spec.name}`, { 
          error: error.message,
          stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack trace
          errorName: error.constructor.name
        })
        
        // Check for specific JSON parsing errors
        if (error.message.includes('JSON') || error.message.includes('parse')) {
          this.logger.error(`JSON parsing issue detected - this suggests the Claude response contained unescaped quotes or invalid JSON syntax`)
        }
      } else {
        this.logger.error(`Unknown Claude API error for ${spec.name}`, { error: String(error) })
      }
      throw error
    }
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

      this.logger.info(`Starting Claude-powered generation for ${spec.name}`)

      // Generate app files using Claude
      const claudeResult = await this.generateWithClaude(spec)
      
      // Write all generated files to disk
      const files = await this.writeGeneratedFiles(appDir, claudeResult.files)
      
      // Validate all imports are satisfied
      await this.validateImports(appDir, claudeResult.files)
      
      // Add Vercel-specific configuration files for React apps
      if (spec.tech_stack?.toLowerCase().includes('react')) {
        await this.addVercelConfig(appDir, spec)
      }

      const endTime = new Date()
      this.logger.info(`Claude generation completed for ${spec.name}`, { 
        filesGenerated: files.length,
        generationTime: endTime.getTime() - startTime.getTime()
      })

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

      // Get final file list after all additions
      const allFiles = this.getAllFiles(appDir)

      return {
        success: true,
        app_name: spec.name,
        output_directory: appDir,
        files_created: allFiles,
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

  private async writeGeneratedFiles(appDir: string, files: Record<string, string>): Promise<string[]> {
    const createdFiles: string[] = []
    
    for (const [relativePath, content] of Object.entries(files)) {
      const fullPath = path.join(appDir, relativePath)
      const dir = path.dirname(fullPath)
      
      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      // Write file
      fs.writeFileSync(fullPath, content, 'utf8')
      createdFiles.push(relativePath)
      
      this.logger.info(`Created file: ${relativePath}`, { appDir, size: content.length })
    }
    
    return createdFiles
  }

  private async addVercelConfig(appDir: string, spec: AppSpecification): Promise<void> {
    // Add Vercel-specific configuration
    const vercelConfig = {
      functions: {
        "app/api/*/route.ts": {
          maxDuration: 60
        }
      }
    }
    
    const vercelConfigPath = path.join(appDir, 'vercel.json')
    if (!fs.existsSync(vercelConfigPath)) {
      fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2))
      this.logger.info(`Added vercel.json configuration`, { appDir })
    }

    // Fix next.config.js - remove deprecated serverActions
    const nextConfigPath = path.join(appDir, 'next.config.js')
    if (fs.existsSync(nextConfigPath)) {
      let nextConfig = fs.readFileSync(nextConfigPath, 'utf-8')
      if (nextConfig.includes('serverActions')) {
        nextConfig = nextConfig.replace(/experimental:\s*\{[^}]*serverActions[^}]*\}/g, 'experimental: {}')
        nextConfig = nextConfig.replace(/,\s*experimental:\s*\{\s*\}/g, '')
        fs.writeFileSync(nextConfigPath, nextConfig)
        this.logger.info(`Fixed next.config.js - removed deprecated serverActions`, { appDir })
      }
    } else {
      // Add a clean next.config.js
      const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig`
      fs.writeFileSync(nextConfigPath, nextConfig)
      this.logger.info(`Added clean next.config.js`, { appDir })
    }

    // Ensure tsconfig.json has proper path mapping
    const tsconfigPath = path.join(appDir, 'tsconfig.json')
    if (!fs.existsSync(tsconfigPath)) {
      const tsconfig = {
        "compilerOptions": {
          "target": "es5",
          "lib": ["dom", "dom.iterable", "es6"],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": true,
          "noEmit": true,
          "esModuleInterop": true,
          "module": "esnext",
          "moduleResolution": "bundler",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "incremental": true,
          "plugins": [{"name": "next"}],
          "baseUrl": ".",
          "paths": {
            "@/*": ["./*"]
          }
        },
        "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        "exclude": ["node_modules"]
      }
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2))
      this.logger.info(`Added tsconfig.json with path mapping`, { appDir })
    } else {
      // Update existing tsconfig.json to fix path mapping
      try {
        const existingTsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
        if (existingTsconfig.compilerOptions && existingTsconfig.compilerOptions.paths) {
          if (existingTsconfig.compilerOptions.paths['@/*'] && 
              JSON.stringify(existingTsconfig.compilerOptions.paths['@/*']) !== JSON.stringify(['./*'])) {
            existingTsconfig.compilerOptions.paths['@/*'] = ['./*']
            existingTsconfig.compilerOptions.baseUrl = '.'
            fs.writeFileSync(tsconfigPath, JSON.stringify(existingTsconfig, null, 2))
            this.logger.info(`Updated tsconfig.json path mapping to use root level`, { appDir })
          }
        }
      } catch (error) {
        this.logger.error(`Failed to update tsconfig.json`, { appDir, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    // Add PostCSS config if not present
    const postcssConfigPath = path.join(appDir, 'postcss.config.js')
    if (!fs.existsSync(postcssConfigPath)) {
      const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
      fs.writeFileSync(postcssConfigPath, postcssConfig)
      this.logger.info(`Added postcss.config.js`, { appDir })
    }
  }

  private async validateImports(appDir: string, files: Record<string, string>): Promise<void> {
    // Extract all import statements from TypeScript/JavaScript files
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"`]([^'"`]+)['"`]/g
    const missingImports: string[] = []
    
    this.logger.info(`🔍 Starting import validation for ${appDir}`, {
      totalFiles: Object.keys(files).length,
      fileTypes: Object.keys(files).map(f => path.extname(f)).filter((v, i, a) => a.indexOf(v) === i)
    })
    
    for (const [filePath, content] of Object.entries(files)) {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let match
        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1]
          
          // Skip external packages and validate @/ and relative imports
          if (importPath.startsWith('@/') || (importPath.startsWith('.') && !importPath.startsWith('@/'))) {
            let normalizedImportPath: string
            
            if (importPath.startsWith('@/')) {
              // @/ imports are absolute from project root
              normalizedImportPath = importPath.replace('@/', '')
            } else {
              // Relative imports (./ or ../) need to be resolved from importing file
              const importingDir = path.dirname(filePath)
              const expectedImportPath = path.join(importingDir, importPath)
              normalizedImportPath = path.normalize(expectedImportPath).replace(/\\/g, '/')
            }
            
            // Check if the imported file exists with various extensions
            const importFileWithExt = [
              normalizedImportPath + '.tsx',
              normalizedImportPath + '.ts',
              normalizedImportPath + '/index.tsx',
              normalizedImportPath + '/index.ts'
            ]
            
            // For CSS imports, also check the exact path without extension
            if (importPath.endsWith('.css')) {
              importFileWithExt.unshift(normalizedImportPath)
            }
            
            // Check if any of these files exist in our files object
            const exists = importFileWithExt.some(ext => {
              const fileExists = files[ext] !== undefined
              
              // Debug logging
              if (!fileExists) {
                this.logger.info(`❌ Missing import: ${filePath} -> ${importPath}`, {
                  expectedPath: ext,
                  normalizedImportPath,
                  importType: importPath.startsWith('@/') ? 'alias' : 'relative',
                  availableFiles: Object.keys(files).slice(0, 10) // Show first 10 files for debugging
                })
              }
              
              return fileExists
            })
            
            if (!exists) {
              missingImports.push(`${filePath} imports ${importPath} but file not found`)
            }
          }
        }
      }
    }
    
    if (missingImports.length > 0) {
      this.logger.error(`CRITICAL: Missing imports detected for ${appDir}`, { missingImports })
      throw new Error(`Cannot deploy app with missing imports: ${missingImports.join(', ')}`)
    }
    
    this.logger.info(`✅ All imports validated successfully for ${appDir}`)
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