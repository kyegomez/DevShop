import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

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
      
      // Check if Vercel CLI is available, if not use API
      if (this.vercelToken) {
        return await this.deployWithAPI(appDir, appName)
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

  private async deployWithAPI(appDir: string, appName: string): Promise<DeploymentResult> {
    try {
      // For now, we'll use a mock deployment URL since Vercel API requires more complex setup
      // In production, you would implement the full Vercel REST API integration
      
      // Simulate deployment time
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Generate a mock Vercel URL
      const sanitizedName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const mockUrl = `https://${sanitizedName}-${Math.random().toString(36).substr(2, 8)}.vercel.app`
      
      console.log(`✅ Mock deployment successful: ${mockUrl}`)
      
      return {
        success: true,
        url: mockUrl,
        appName,
        deploymentId: `dpl_${Math.random().toString(36).substr(2, 16)}`
      }
    } catch (error) {
      console.error(`❌ API deployment failed:`, error)
      throw error
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