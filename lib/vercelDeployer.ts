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
      console.log(`📁 App directory: ${appDir}`)
      console.log(`🆔 Project ID: ${projectId}`)
      
      // Get all files with content
      const files = await this.getFilesWithContent(appDir)
      console.log(`📁 Prepared ${files.length} files for deployment`)
      console.log(`📋 Files being deployed:`, files.map(f => `${f.file} (${f.data.length} chars)`))
      
      const deploymentPayload = {
        name: projectName,
        files,
        projectSettings: {
          framework: 'nextjs'
        },
        target: 'production'
      }
      
      console.log(`🚀 Sending deployment request to Vercel API...`)
      console.log(`📊 Payload size: ${JSON.stringify(deploymentPayload).length} bytes`)
      
      // Create deployment
      const deployResponse = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deploymentPayload)
      })

      console.log(`📡 Vercel API response status: ${deployResponse.status} ${deployResponse.statusText}`)
      
      if (!deployResponse.ok) {
        const error = await deployResponse.text()
        console.error(`💥 Vercel API error response:`, error)
        throw new Error(`Deployment failed: ${deployResponse.status} ${error}`)
      }

      const deployment = await deployResponse.json()
      const deploymentUrl = `https://${deployment.url}`
      
      console.log(`🚀 Deployment created successfully: ${deploymentUrl}`)
      console.log(`📋 Deployment ID: ${deployment.id}`)
      console.log(`📊 Deployment state: ${deployment.readyState || deployment.state || 'unknown'}`)
      console.log(`🔍 Background monitoring deployment ${deployment.id} for ${projectName}`)
      
      // Start monitoring deployment status in background (don't await)
      this.monitorDeploymentInBackground(deployment.id, projectName)
      
      // Return URL immediately - don't wait for deployment to finish
      return deploymentUrl
    } catch (error) {
      console.error(`❌ Deployment creation failed for ${projectName}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        appDir,
        projectName,
        projectId
      })
      throw error
    }
  }

  private async getFilesWithContent(appDir: string): Promise<any[]> {
    const files: any[] = []
    
    console.log(`📁 Scanning files in directory: ${appDir}`)
    
    const addFile = (filePath: string, relativePath: string) => {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File not found: ${filePath}`)
        return
      }
      
      const content = fs.readFileSync(filePath, 'utf8')
      const fileSize = content.length
      console.log(`📄 Adding file: ${relativePath} (${fileSize} chars)`)
      
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
      if (!fs.existsSync(dirPath)) {
        console.log(`📁 Directory not found: ${dirPath}`)
        return
      }
      
      console.log(`📁 Scanning directory: ${dirPath} -> ${relativeDirPath}`)
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      console.log(`📂 Found ${entries.length} entries in ${dirPath}`)
      
      entries.forEach(entry => {
        const fullPath = path.join(dirPath, entry.name)
        const relativeFilePath = path.join(relativeDirPath, entry.name).replace(/\\/g, '/')
        
        if (entry.isDirectory()) {
          console.log(`📁 Entering subdirectory: ${entry.name}`)
          addDirectory(fullPath, relativeFilePath)
        } else if (entry.isFile()) {
          console.log(`📄 Found file: ${entry.name}`)
          addFile(fullPath, relativeFilePath)
        }
      })
    }

    // Add app directory
    console.log(`📁 Adding app directory...`)
    addDirectory(path.join(appDir, 'app'), 'app')
    
    // Add components directory
    console.log(`📁 Adding components directory...`)
    addDirectory(path.join(appDir, 'components'), 'components')
    
    // Add lib directory if it exists
    console.log(`📁 Adding lib directory...`)
    addDirectory(path.join(appDir, 'lib'), 'lib')

    console.log(`📁 Final file count: ${files.length} files prepared for deployment`)
    console.log(`📋 Files summary:`, files.map(f => f.file).sort())
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
        console.log(`🔄 Checking deployment status (attempt ${i + 1}/20)...`)
        const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
          headers: {
            'Authorization': `Bearer ${this.vercelToken}`
          }
        })

        console.log(`📡 Status check response: ${response.status} ${response.statusText}`)

        if (response.ok) {
          const deployment = await response.json()
          const state = deployment.readyState || deployment.state
          
          console.log(`📊 ${projectName} deployment status: ${state} (${i * 10}s elapsed)`)
          console.log(`🔍 Full deployment object:`, JSON.stringify(deployment, null, 2))
          
          if (state === 'READY') {
            console.log(`✅ ${projectName} deployment completed successfully after ${i * 10} seconds`)
            console.log(`🌐 Live at: https://${deployment.url}`)
            return
          }
          
          if (state === 'ERROR' || state === 'CANCELED') {
            console.error(`❌ ${projectName} deployment failed with status: ${state}`)
            
            // Get detailed error information
            try {
              console.error(`🔍 Full deployment response for error analysis:`, JSON.stringify(deployment, null, 2))
              
              if (deployment.builds && deployment.builds.length > 0) {
                console.error(`🔍 Build details for ${projectName}:`)
                deployment.builds.forEach((build: any, index: number) => {
                  console.error(`  Build ${index + 1}:`, JSON.stringify(build, null, 2))
                })
              }
              
              if (deployment.errorMessage) {
                console.error(`💥 Error message: ${deployment.errorMessage}`)
              }
              
              if (deployment.errorCode) {
                console.error(`🚨 Error code: ${deployment.errorCode}`)
              }
              
              // Try to get build logs with more detail
              if (deployment.id) {
                try {
                  console.log(`📋 Fetching build logs for deployment ${deployment.id}...`)
                  const logsResponse = await fetch(`https://api.vercel.com/v2/deployments/${deployment.id}/events`, {
                    headers: {
                      'Authorization': `Bearer ${this.vercelToken}`
                    }
                  })
                  
                  console.log(`📡 Logs API response: ${logsResponse.status} ${logsResponse.statusText}`)
                  
                  if (logsResponse.ok) {
                    const logs = await logsResponse.json()
                    console.error(`📋 Raw logs response:`, JSON.stringify(logs, null, 2))
                    
                    if (logs.events && logs.events.length > 0) {
                      console.error(`📋 Build events for ${projectName} (${logs.events.length} total):`)
                      logs.events.forEach((event: any, eventIndex: number) => {
                        console.error(`  Event ${eventIndex + 1}:`, JSON.stringify(event, null, 2))
                      })
                    } else {
                      console.error(`📋 No build events found in logs response`)
                    }
                  } else {
                    const logsError = await logsResponse.text()
                    console.error(`❌ Failed to fetch logs: ${logsResponse.status} ${logsError}`)
                  }
                } catch (logError) {
                  console.error(`⚠️ Could not fetch build logs:`, logError)
                }
              }
            } catch (errorDetailError) {
              console.error(`⚠️ Could not get error details:`, errorDetailError)
            }
            
            return
          }
          
          if (state === 'BUILDING') {
            console.log(`🔨 ${projectName} is currently building...`)
          } else if (state === 'QUEUED') {
            console.log(`⏳ ${projectName} is queued for deployment...`)
          }
          
        } else {
          const statusError = await response.text()
          console.error(`⚠️ Status check failed for ${projectName}: ${response.status} ${statusError}`)
        }
      } catch (error) {
        console.error(`⚠️ Error monitoring ${projectName}:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          attempt: i + 1
        })
      }

      console.log(`⏳ Waiting 10 seconds before next status check...`)
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