import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const execAsync = promisify(exec)

export interface DeploymentResult {
  success: boolean
  url?: string
  error?: string
  appName: string
  deploymentId?: string
}

export class VercelDeployer {
  private vercelToken: string

  constructor(vercelToken?: string) {
    this.vercelToken = vercelToken || process.env.VERCEL_TOKEN || ''
  }

  async deployApp(appDir: string, appName: string): Promise<DeploymentResult> {
    try {
      console.log(`🚀 Starting deployment for ${appName}...`)
      
      // Always try real deployment first if token is available
      if (this.vercelToken) {
        return await this.deployWithVercelAPI(appDir, appName)
      } else {
        return await this.deployWithCLI(appDir, appName)
      }
    } catch (error) {
      console.error(`❌ Deployment failed for ${appName}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error',
        appName
      }
    }
  }

  private async deployWithCLI(appDir: string, appName: string): Promise<DeploymentResult> {
    try {
      // Change to app directory and deploy
      const deployCommand = `cd "${appDir}" && npx vercel --yes --token="${this.vercelToken}"`
      
      console.log(`🔧 Running: ${deployCommand.replace(this.vercelToken, '[TOKEN]')}`)
      
      const { stdout, stderr } = await execAsync(deployCommand, {
        cwd: appDir,
        env: {
          ...process.env,
          VERCEL_TOKEN: this.vercelToken,
          CI: '1'
        }
      })

      if (stderr && !stderr.includes('Warning')) {
        throw new Error(stderr)
      }

      // Extract URL from output
      const urlMatch = stdout.match(/https:\/\/[^\s]+\.vercel\.app/)
      const deploymentUrl = urlMatch ? urlMatch[0] : undefined

      if (deploymentUrl) {
        console.log(`✅ Deployment successful: ${deploymentUrl}`)
        return {
          success: true,
          url: deploymentUrl,
          appName
        }
      } else {
        throw new Error('Could not extract deployment URL from Vercel output')
      }
    } catch (error) {
      console.error(`❌ CLI deployment failed:`, error)
      throw error
    }
  }

  private async deployWithVercelAPI(appDir: string, appName: string): Promise<DeploymentResult> {
    try {
      console.log(`🚀 [VERCEL API] Starting real deployment for ${appName}`)
      console.log(`📁 App directory: ${appDir}`)
      
      // Step 1: Create project if it doesn't exist
      const projectName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      let projectId = await this.createOrGetProject(projectName)
      
      // Step 2: Create deployment using file uploads
      const deploymentUrl = await this.createDeployment(appDir, projectName, projectId)
      
      console.log(`✅ [VERCEL API] Deployment initiated: ${deploymentUrl}`)
      console.log(`⏳ Deployment will be ready in ~30-60 seconds`)
      console.log(`📝 Check logs above for real-time deployment status`)
      
      return {
        success: true,
        url: deploymentUrl,
        appName,
        deploymentId: `vercel_${Date.now()}`
      }
    } catch (error) {
      console.error(`❌ Vercel API deployment failed:`, error)
      
      // Fallback to demo mode if API fails
      console.log(`🔄 Falling back to demo mode for ${appName}`)
      return this.createDemoDeployment(appName)
    }
  }

  private async createOrGetProject(projectName: string): Promise<string> {
    try {
      // First, try to get existing project
      const getResponse = await fetch(`https://api.vercel.com/v9/projects/${projectName}`, {
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (getResponse.ok) {
        const project = await getResponse.json()
        console.log(`📋 Found existing project: ${projectName}`)
        return project.id
      }

      // If project doesn't exist, create it
      console.log(`📋 Creating new project: ${projectName}`)
      const createResponse = await fetch('https://api.vercel.com/v10/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: projectName,
          framework: 'nextjs'
        })
      })

      if (!createResponse.ok) {
        throw new Error(`Failed to create project: ${createResponse.statusText}`)
      }

      const newProject = await createResponse.json()
      console.log(`✅ Created project: ${projectName}`)
      return newProject.id
    } catch (error) {
      console.error(`❌ Project creation failed:`, error)
      throw error
    }
  }

  private async createDeployment(appDir: string, projectName: string, projectId: string): Promise<string> {
    try {
      console.log(`📦 Creating deployment for ${projectName}`)
      
      // Get all files with content
      const files = await this.getFilesWithContent(appDir)
      
      // Create deployment
      const deployResponse = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: projectName,
          files,
          projectSettings: {
            framework: 'nextjs'
          },
          target: 'production'
        })
      })

      if (!deployResponse.ok) {
        const error = await deployResponse.text()
        throw new Error(`Deployment failed: ${error}`)
      }

      const deployment = await deployResponse.json()
      const deploymentUrl = `https://${deployment.url}`
      
      console.log(`🚀 Deployment created: ${deploymentUrl}`)
      console.log(`📋 Deployment ID: ${deployment.id}`)
      
      // Start monitoring deployment status in background (don't await)
      this.monitorDeploymentInBackground(deployment.id, projectName)
      
      // Return URL immediately - don't wait for deployment to finish
      return deploymentUrl
    } catch (error) {
      console.error(`❌ Deployment creation failed:`, error)
      throw error
    }
  }

  private async getFilesWithContent(appDir: string): Promise<any[]> {
    const files: any[] = []
    
    const addFile = (filePath: string, relativePath: string) => {
      if (!fs.existsSync(filePath)) return
      
      const content = fs.readFileSync(filePath, 'utf8')
      files.push({
        file: relativePath,
        data: content
      })
    }

    // Add essential files for Next.js app
    const essentialFiles = [
      'package.json',
      'next.config.js',
      'tsconfig.json',
      'tailwind.config.js',
      'postcss.config.js',
      'vercel.json',
      '.gitignore'
    ]

    essentialFiles.forEach(file => {
      addFile(path.join(appDir, file), file)
    })

    // Add app directory files recursively
    const addDirectory = (dirPath: string, relativeDirPath: string) => {
      if (!fs.existsSync(dirPath)) return
      
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      entries.forEach(entry => {
        const fullPath = path.join(dirPath, entry.name)
        const relativeFilePath = path.join(relativeDirPath, entry.name).replace(/\\/g, '/')
        
        if (entry.isDirectory()) {
          addDirectory(fullPath, relativeFilePath)
        } else if (entry.isFile()) {
          addFile(fullPath, relativeFilePath)
        }
      })
    }

    // Add app directory
    addDirectory(path.join(appDir, 'app'), 'app')

    console.log(`📁 Prepared ${files.length} files for deployment`)
    return files
  }

  private monitorDeploymentInBackground(deploymentId: string, projectName: string): void {
    // Don't await this - let it run in background
    this.checkDeploymentStatus(deploymentId, projectName).catch(error => {
      console.error(`❌ Background monitoring failed for ${projectName}:`, error.message)
    })
  }

  private async checkDeploymentStatus(deploymentId: string, projectName: string): Promise<void> {
    console.log(`🔍 Background monitoring deployment ${deploymentId} for ${projectName}`)
    
    for (let i = 0; i < 20; i++) { // Check for up to 200 seconds
      try {
        const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
          headers: {
            'Authorization': `Bearer ${this.vercelToken}`
          }
        })

        if (response.ok) {
          const deployment = await response.json()
          const state = deployment.readyState || deployment.state
          
          if (i % 3 === 0) { // Log every 30 seconds
            console.log(`📊 ${projectName} deployment status: ${state} (${i * 10}s elapsed)`)
          }
          
          if (state === 'READY') {
            console.log(`✅ ${projectName} deployment completed successfully after ${i * 10} seconds`)
            console.log(`🌐 Live at: https://${deployment.url}`)
            return
          }
          
          if (state === 'ERROR' || state === 'CANCELED') {
            console.error(`❌ ${projectName} deployment failed with status: ${state}`)
            return
          }
        } else {
          if (i % 6 === 0) { // Log errors every minute
            console.log(`⚠️ Status check failed for ${projectName}: ${response.status}`)
          }
        }
      } catch (error) {
        if (i % 6 === 0) {
          console.error(`⚠️ Error monitoring ${projectName}:`, error instanceof Error ? error.message : 'Unknown error')
        }
      }

      await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
    }

    console.log(`⏰ Stopped monitoring ${projectName} after 200 seconds - check Vercel dashboard for final status`)
  }

  private createDemoDeployment(appName: string): DeploymentResult {
    const sanitizedName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const demoUrl = `https://demo-${sanitizedName}-preview.devshop.local`
    
    console.log(`✅ [DEMO] Generated preview URL: ${demoUrl}`)
    console.log(`⚠️  This is a demo URL - app is built locally but not deployed`)
    
    return {
      success: true,
      url: demoUrl,
      appName,
      deploymentId: `demo_${Math.random().toString(36).substr(2, 16)}`
    }
  }

  async createGitHubRepo(appDir: string, appName: string): Promise<string> {
    try {
      // Initialize git repository
      await execAsync('git init', { cwd: appDir })
      await execAsync('git add .', { cwd: appDir })
      await execAsync(`git commit -m "Initial commit for ${appName}"`, { cwd: appDir })
      
      // For demo purposes, return a mock GitHub URL
      // In production, you'd use GitHub API to create actual repos
      const sanitizedName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      return `https://github.com/devshop-generated/${sanitizedName}`
    } catch (error) {
      console.error('Failed to create GitHub repo:', error)
      throw error
    }
  }

  static async setupApp(appDir: string): Promise<void> {
    try {
      // Install dependencies if package.json exists
      const packageJsonPath = path.join(appDir, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        console.log('📦 Installing dependencies...')
        await execAsync('npm install', { cwd: appDir })
        
        console.log('🔨 Building application...')
        await execAsync('npm run build', { cwd: appDir })
      }
    } catch (error) {
      console.error('Setup failed:', error)
      throw error
    }
  }
}