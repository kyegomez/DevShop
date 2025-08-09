import { NextRequest, NextResponse } from 'next/server'
import { Logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') as any
    const appName = searchParams.get('appName')
    const count = parseInt(searchParams.get('count') || '50')
    
    const logger = Logger.getInstance()
    
    let logs
    if (level || appName) {
      logs = logger.getLogs({ 
        level: level || undefined, 
        appName: appName || undefined 
      })
    } else {
      logs = logger.getRecentLogs(count)
    }
    
    return NextResponse.json({
      success: true,
      logs,
      total: logs.length
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const logger = Logger.getInstance()
    logger.clearLogs()
    
    return NextResponse.json({
      success: true,
      message: 'Logs cleared'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}