"use client";

import { useState, useRef } from 'react';
import { Upload, FileText, Play, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface App {
  name: string;
  path: string;
  package_name: string;
  version: string;
  description: string;
  scripts: Record<string, string>;
  status?: 'idle' | 'starting' | 'running' | 'error';
  port?: number;
}

interface CSVRow {
  [key: string]: string;
}

export default function Home() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string>('');
  const [generatedApps, setGeneratedApps] = useState<App[]>([]);
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: CSVRow[] } | null>(null);
  const [showAllRows, setShowAllRows] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/csv') {
      // Clear previous state
      setCsvData(null);
      setShowAllRows(false);
      setGeneratedApps([]);
      setCurrentTaskId(null);
      setTaskStatus('');
      setError('');
      
      setCsvFile(files[0]);
      parseCSV(files[0]);
    } else {
      setError('Please drop a valid CSV file');
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          setError('CSV file is empty');
          setCsvData(null);
          return;
        }
        
        // Parse headers - handle quoted values properly
        const headerLine = lines[0];
        const headers: string[] = [];
        let currentHeader = '';
        let inQuotes = false;
        
        for (let i = 0; i < headerLine.length; i++) {
          const char = headerLine[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            headers.push(currentHeader.trim());
            currentHeader = '';
          } else {
            currentHeader += char;
          }
        }
        headers.push(currentHeader.trim());
        
        // Parse rows with the same logic
        const rows: CSVRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const values: string[] = [];
          let currentValue = '';
          inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());
          
          // Create row object
          const row: CSVRow = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          rows.push(row);
        }
        
        setCsvData({ headers, rows });
        setError('');
        console.log(`CSV parsed successfully: ${headers.length} columns, ${rows.length} rows`);
      } catch (err) {
        setError(`Error parsing CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setCsvData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      // Clear previous state
      setCsvData(null);
      setShowAllRows(false);
      setGeneratedApps([]);
      setCurrentTaskId(null);
      setTaskStatus('');
      setError('');
      
      setCsvFile(file);
      parseCSV(file);
    } else {
      setError('Please select a valid CSV file');
    }
  };

  const startGeneration = async () => {
    if (!csvFile || !csvData) {
      setError('Please select a CSV file first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setTaskStatus(`Starting generation for ${csvData.rows.length} apps...`);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the CSV content from response
      const csvContent = await response.text();
      
      // Create a blob and download the results CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generation_results_${csvFile.name}`;
      a.click();
      URL.revokeObjectURL(url);

      setTaskStatus('Generation completed! Results CSV downloaded. Starting apps...');
      
      // Start all generated apps
      await startAllApps();
      
      setIsGenerating(false);
    } catch (err) {
      setError(`Failed to start generation: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsGenerating(false);
      setTaskStatus('');
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/tasks/${taskId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTaskStatus(data.status);

        if (data.status === 'completed') {
          clearInterval(pollInterval);
          setIsGenerating(false);
          setTaskStatus('Generation completed! Starting all apps...');
          
          // Start all generated apps
          await startAllApps();
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
          setIsGenerating(false);
          setError(`Generation failed: ${data.error || 'Unknown error'}`);
          setTaskStatus('');
        }
      } catch (err) {
        clearInterval(pollInterval);
        setIsGenerating(false);
        setError(`Failed to poll task status: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setTaskStatus('');
      }
    }, 2000);
  };

  const startAllApps = async () => {
    try {
      // Fetch list of generated apps
      const response = await fetch('http://localhost:8000/artifacts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apps: App[] = await response.json();
      setGeneratedApps(apps);

      // Start each app on a different port
      for (let i = 0; i < apps.length; i++) {
        const port = 3001 + i; // Start from port 3001
        await startApp(apps[i].name, port);
      }
    } catch (err) {
      setError(`Failed to start apps: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const startApp = async (appName: string, port: number) => {
    try {
      const response = await fetch('http://localhost:8000/start-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_name: appName,
          port: port,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update app status
      setGeneratedApps(prev => prev.map(app => 
        app.name === appName 
          ? { ...app, status: data.status, port: port }
          : app
      ));

      setTaskStatus(`App ${appName} ${data.status} on port ${port}`);
    } catch (err) {
      setError(`Failed to start app ${appName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Update app status to error
      setGeneratedApps(prev => prev.map(app => 
        app.name === appName 
          ? { ...app, status: 'error' }
          : app
      ));
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'starting':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'starting':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            DevShop
          </h1>
          <p className="text-xl text-gray-600 mb-2">Multi-App Generator</p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <FileText className="w-5 h-5" />
            <span>{generatedApps.filter(app => app.status === 'running').length} apps running</span>
          </div>
        </div>

        {/* CSV Upload Section */}
        <div className="glass-effect rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upload CSV Specification</h2>
          <p className="text-gray-600 mb-6">
            Drag and drop your CSV file here or click to browse. The CSV should contain app specifications.
          </p>
          
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">Drop your CSV file here</p>
            <p className="text-gray-500 mb-6">or click to browse</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Files
            </button>
          </div>

          {csvFile && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                <FileText className="w-4 h-4 inline mr-2" />
                Selected: {csvFile.name}
              </p>
            </div>
          )}

                            {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800">{error}</p>
                    </div>
                  )}

                  {/* CSV Preview Section */}
                  {csvData && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">CSV Preview</h3>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {csvData.headers.map((header, index) => (
                                <th
                                  key={index}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(showAllRows ? csvData.rows : csvData.rows.slice(0, 5)).map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-gray-50">
                                {csvData.headers.map((header, colIndex) => (
                                  <td
                                    key={colIndex}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100"
                                  >
                                    <div className="max-w-xs truncate" title={row[header]}>
                                      {row[header] || '-'}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {csvData.rows.length > 5 && (
                        <div className="mt-2 text-center">
                          <p className="text-sm text-gray-500 mb-2">
                            {showAllRows ? `Showing all ${csvData.rows.length} rows` : `Showing first 5 rows of ${csvData.rows.length} total rows`}
                          </p>
                          <button
                            onClick={() => setShowAllRows(!showAllRows)}
                            className="text-blue-600 hover:text-blue-700 text-sm underline"
                          >
                            {showAllRows ? 'Show Less' : 'Show All Rows'}
                          </button>
                        </div>
                      )}
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          <strong>{csvData.rows.length}</strong> app specifications found in CSV
                        </p>
                        <button
                          onClick={() => {
                            const csvContent = [csvData.headers.join(','), ...csvData.rows.map(row => 
                              csvData.headers.map(header => row[header]).join(',')
                            )].join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'parsed_apps.csv';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm underline"
                        >
                          Download Parsed CSV
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={startGeneration}
                    disabled={!csvFile || isGenerating}
                    className={`mt-6 px-8 py-3 rounded-lg font-medium transition-all ${
                      !csvFile || isGenerating
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Apps'}
                  </button>

          {taskStatus && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{taskStatus}</p>
            </div>
          )}
        </div>

        {/* Generated Applications */}
        <div className="glass-effect rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Generated Applications</h2>
          
          {generatedApps.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No applications generated yet</p>
              <p className="text-gray-400">Upload a CSV and generate apps to see them here</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {generatedApps.map((app) => (
                <div key={app.name} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(app.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{app.package_name}</h3>
                        <p className="text-sm text-gray-500">{app.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(app.status)}`}>
                        {app.status || 'idle'}
                      </span>
                      {app.port && (
                        <a
                          href={`http://localhost:${app.port}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Port {app.port}
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Version:</span>
                      <span className="ml-2 text-gray-700">{app.version}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Path:</span>
                      <span className="ml-2 text-gray-700 font-mono">{app.path}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
