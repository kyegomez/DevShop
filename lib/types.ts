export interface AppSpecification {
  name: string
  description: string
  app_goal: string
  target_user: string
  main_problem: string
  design_preferences: string
  additional_requirements?: string
  tech_stack?: string
  complexity_level?: 'low' | 'medium' | 'high'
}

export interface GenerationResult {
  success: boolean
  app_name: string
  output_directory?: string
  files_created?: string[]
  error?: string
  generation_time: string
}

export interface GenerationSummary {
  total_apps: number
  successful_apps: number
  failed_apps: number
  total_time_seconds: number
  concurrent_workers: number
  cpu_cores: number
  output_directory: string
  start_time: string
  end_time: string
  results: {
    successful: GenerationResult[]
    failed: GenerationResult[]
  }
}

export type AppStatus = 'pending' | 'running' | 'completed' | 'error'