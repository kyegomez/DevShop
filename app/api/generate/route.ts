import { NextRequest, NextResponse } from 'next/server'
import { CSVParser } from '@/lib/csvParser'
import { AppGenerator } from '@/lib/appGenerator'
import { AppSpecification, GenerationResult, AppStatus } from '@/lib/types'
import os from 'os'

// Enable streaming for real-time progress updates
export const runtime = 'nodejs'

interface ProgressUpdate {
  type: 'app_update' | 'final_results'
  app_name?: string
  status?: AppStatus
  progress?: number
  results?: any
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Parse form data
        const formData = await request.formData()
        const csvFile = formData.get('csvFile') as File
        
        if (!csvFile) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'No CSV file provided'
          })}\n\n`))
          controller.close()
          return
        }

        // Read CSV content
        const csvContent = await csvFile.text()
        
        // Parse CSV into app specifications
        const specifications = CSVParser.parseCSVContent(csvContent)
        
        if (specifications.length === 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'No valid app specifications found'
          })}\n\n`))
          controller.close()
          return
        }

        // Initialize generator
        const generator = new AppGenerator('public/generated_apps')
        
        // Calculate optimal concurrency (similar to Python version)
        const cpuCount = os.cpus().length
        const maxConcurrent = Math.max(1, Math.floor(cpuCount * 0.95))
        
        const startTime = new Date()
        
        // Send initial status for all apps
        for (const spec of specifications) {
          const update: ProgressUpdate = {
            type: 'app_update',
            app_name: spec.name,
            status: 'pending',
            progress: 0
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(update)}\n\n`))
        }

        // Process apps in batches for concurrency control
        const results: GenerationResult[] = []
        const batchSize = maxConcurrent
        
        for (let i = 0; i < specifications.length; i += batchSize) {
          const batch = specifications.slice(i, i + batchSize)
          
          // Process batch concurrently
          const batchPromises = batch.map(async (spec) => {
            // Update status to running
            const runningUpdate: ProgressUpdate = {
              type: 'app_update',
              app_name: spec.name,
              status: 'running',
              progress: 25
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(runningUpdate)}\n\n`))

            try {
              // Generate the app
              const result = await generator.generateApp(spec)
              
              // Update progress
              const progressUpdate: ProgressUpdate = {
                type: 'app_update',
                app_name: spec.name,
                status: result.success ? 'completed' : 'error',
                progress: 100
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressUpdate)}\n\n`))
              
              return result
            } catch (error) {
              const errorUpdate: ProgressUpdate = {
                type: 'app_update',
                app_name: spec.name,
                status: 'error',
                progress: 100
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorUpdate)}\n\n`))
              
              return {
                success: false,
                app_name: spec.name,
                error: error instanceof Error ? error.message : 'Unknown error',
                generation_time: new Date().toISOString()
              }
            }
          })

          // Wait for batch to complete
          const batchResults = await Promise.all(batchPromises)
          results.push(...batchResults)
        }

        const endTime = new Date()
        const totalTime = (endTime.getTime() - startTime.getTime()) / 1000

        // Calculate summary
        const successful = results.filter(r => r.success)
        const failed = results.filter(r => !r.success)

        const summary = {
          total_apps: specifications.length,
          successful_apps: successful.length,
          failed_apps: failed.length,
          total_time_seconds: totalTime,
          concurrent_workers: maxConcurrent,
          cpu_cores: cpuCount,
          output_directory: 'public/generated_apps',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          results: {
            successful,
            failed
          }
        }

        // Send final results
        const finalUpdate: ProgressUpdate = {
          type: 'final_results',
          results: summary
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalUpdate)}\n\n`))

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: errorMessage
        })}\n\n`))
      } finally {
        controller.close()
      }
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}