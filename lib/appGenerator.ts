import { AppSpecification, GenerationResult } from './types'
import fs from 'fs'
import path from 'path'

export class AppGenerator {
  private outputDirectory: string

  constructor(outputDirectory: string = 'generated_apps') {
    this.outputDirectory = outputDirectory
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDirectory)) {
      fs.mkdirSync(this.outputDirectory, { recursive: true })
    }
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

      // Create README
      const readmeContent = this.generateReadme(spec)
      fs.writeFileSync(path.join(appDir, 'README.md'), readmeContent)

      // Create main application file
      const mainContent = this.generateMainFile(spec)
      const mainFileName = this.getMainFileName(spec.tech_stack)
      fs.writeFileSync(path.join(appDir, mainFileName), mainContent)

      // Create requirements/dependencies file
      const depsContent = this.generateDependencies(spec)
      const depsFileName = this.getDependenciesFileName(spec.tech_stack)
      fs.writeFileSync(path.join(appDir, depsFileName), depsContent)

      // Create basic config file
      if (spec.tech_stack?.toLowerCase().includes('react')) {
        const packageJsonContent = this.generatePackageJson(spec)
        fs.writeFileSync(path.join(appDir, 'package.json'), packageJsonContent)
      }

      const endTime = new Date()
      const files = fs.readdirSync(appDir)

      return {
        success: true,
        app_name: spec.name,
        output_directory: appDir,
        files_created: files,
        generation_time: endTime.toISOString()
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
}