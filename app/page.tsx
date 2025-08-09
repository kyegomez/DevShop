'use client'

import { useState, useRef } from 'react'
import { Upload, Play, Download, FileText, Users, Zap } from 'lucide-react'

interface AppSpec {
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress?: number
}

export default function Home() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [apps, setApps] = useState<AppSpec[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<any>(null)
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
                      ? { ...app, status: data.status, progress: data.progress }
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Build Millions of Apps at Once
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A multi-agent structure that can build multiple applications in parallel using AI-powered code generation
        </p>
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
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border status-${app.status}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
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