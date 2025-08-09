export class Logger {
  private static instance: Logger
  private logs: LogEntry[] = []

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  info(message: string, context?: any) {
    this.log('INFO', message, context)
  }

  warn(message: string, context?: any) {
    this.log('WARN', message, context)
  }

  error(message: string, context?: any) {
    this.log('ERROR', message, context)
  }

  deployment(message: string, appName: string, context?: any) {
    this.log('DEPLOY', message, { appName, ...context })
  }

  private log(level: LogLevel, message: string, context?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    }
    
    this.logs.push(entry)
    
    // Also log to console with appropriate emoji
    const emoji = {
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      DEPLOY: '🚀'
    }[level]
    
    console.log(`${emoji} [${level}] ${message}`, context ? context : '')
  }

  getLogs(filter?: { level?: LogLevel; appName?: string }): LogEntry[] {
    return this.logs.filter(log => {
      if (filter?.level && log.level !== filter.level) return false
      if (filter?.appName && log.context?.appName !== filter.appName) return false
      return true
    })
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count)
  }

  clearLogs() {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: any
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEPLOY'