'use client'

import { useState, useRef } from 'react'
import { Upload, Play, Download, FileText, Users, Zap, ExternalLink, Rocket, Terminal, X } from 'lucide-react'

interface AppSpec {
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'error' | 'deploying' | 'deployed'
  progress?: number
  deploymentUrl?: string
}

export default function Home() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [apps, setApps] = useState<AppSpec[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      // Parse CSV preview
      parseCSVPreview(file)
    }
  }

  const parseCSVPreview = async (file: File) => {
    const text = await file.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',')
    
    const specs: AppSpec[] = []
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',')
        specs.push({
          name: values[0]?.replace(/"/g, '') || `App ${i}`,
          description: values[1]?.replace(/"/g, '') || 'No description',
          status: 'pending'
        })
      }
    }
    setApps(specs.slice(0, 10)) // Limit preview
  }

  const startGeneration = async () => {
    if (!csvFile) return

    setIsGenerating(true)
    setApps(prev => prev.map(app => ({ ...app, status: 'running' as const })))

    try {
      const formData = new FormData()
      formData.append('csvFile', csvFile)

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'app_update') {
                setApps(prev => 
                  prev.map(app => 
                    app.name === data.app_name 
                      ? { 
                          ...app, 
                          status: data.status, 
                          progress: data.progress,
                          deploymentUrl: data.deployment_url || app.deploymentUrl
                        }
                      : app
                  )
                )
              } else if (data.type === 'final_results') {
                setResults(data.results)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error)
      setApps(prev => prev.map(app => ({ ...app, status: 'error' as const })))
    } finally {
      setIsGenerating(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs')
      const data = await response.json()
      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center relative">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Build Millions of Apps at Once
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A multi-agent structure that can build multiple applications in parallel using AI-powered code generation
        </p>
        
        {/* Logs Button */}
        <button
          onClick={() => {
            setShowLogs(!showLogs)
            if (!showLogs) fetchLogs()
          }}
          className="absolute top-0 right-0 flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
        >
          <Terminal className="h-4 w-4" />
          <span>Logs</span>
        </button>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <Users className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Multi-Agent System</h3>
          <p className="text-gray-600">Concurrent processing using multiple AI agents for maximum efficiency</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <Zap className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Parallel Generation</h3>
          <p className="text-gray-600">Generate multiple applications simultaneously with optimal performance</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <FileText className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">CSV-Driven</h3>
          <p className="text-gray-600">Define app specifications in a simple CSV format for batch processing</p>
        </div>
      </div>

      {/* Logs Viewer */}
      {showLogs && (
        <div className="bg-gray-900 rounded-lg p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Terminal className="h-5 w-5 mr-2" />
              System Logs
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={fetchLogs}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowLogs(false)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="bg-black rounded p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-400">No logs available. Generate some apps to see logs here.</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-2 ${
                    log.level === 'ERROR' ? 'text-red-400' :
                    log.level === 'WARN' ? 'text-yellow-400' :
                    log.level === 'DEPLOY' ? 'text-green-400' :
                    'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span className="ml-2 font-bold">[{log.level}]</span>
                  <span className="ml-2">{log.message}</span>
                  {log.context && (
                    <div className="ml-4 text-xs text-gray-400 mt-1">
                      {JSON.stringify(log.context, null, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Upload App Specifications</h3>
        <div className="space-y-4">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">
              {csvFile ? csvFile.name : 'Choose CSV file or drag and drop'}
            </p>
            <p className="text-sm text-gray-500">
              CSV file with app specifications (name, description, requirements, etc.)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          
          {csvFile && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{csvFile.name}</span>
                <span className="text-sm text-blue-600">({apps.length} apps detected)</span>
              </div>
              <button
                onClick={startGeneration}
                disabled={isGenerating}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4" />
                <span>{isGenerating ? 'Generating...' : 'Generate Apps'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* App Preview/Progress */}
      {apps.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">App Generation Progress</h3>
          <div className="space-y-3">
            {apps.map((app, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{app.name}</h4>
                  <p className="text-sm text-gray-600">{app.description}</p>
                </div>
                <div className="flex items-center space-x-3">
                  {app.progress && (
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${app.progress}%` }}
                      ></div>
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    app.status === 'deployed' ? 'bg-green-100 text-green-800 border-green-200' :
                    app.status === 'deploying' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    app.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    app.status === 'running' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    app.status === 'error' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {app.status === 'deploying' && <Rocket className="w-3 h-3 inline mr-1" />}
                    {app.status === 'deployed' && <ExternalLink className="w-3 h-3 inline mr-1" />}
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                  {app.status === 'deployed' && app.deploymentUrl && (
                    <>
                      {app.deploymentUrl.includes('devshop.local') ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const appName = app.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
                              const localPath = `public/generated_apps/${appName}`
                              alert(`🎯 Demo Mode!\n\nThis app was built locally at:\n${localPath}\n\nTo deploy to real Vercel:\n1. Add VERCEL_TOKEN to .env.local\n2. Run generation again\n\nClick OK to view local files`)
                              // In a real app, you might open the local directory or show the built files
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                          >
                            <FileText className="h-4 w-4" />
                            <span>View Files</span>
                          </button>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Demo Mode</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => window.open(app.deploymentUrl, '_blank')}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Show App</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Generation Results</h3>
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download className="h-4 w-4" />
              <span>Download Results</span>
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{results.total_apps}</div>
              <div className="text-sm text-gray-600">Total Apps</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.successful_apps}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{results.failed_apps}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Generation completed in {results.total_time_seconds}s using {results.concurrent_workers} workers</p>
            <p>Average time per app: {(results.total_time_seconds / results.total_apps).toFixed(2)}s</p>
          </div>
        </div>
      )}
    </div>
  )
}