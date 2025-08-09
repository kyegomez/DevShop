import { AppSpecification } from './types'

export class CSVParser {
  static parseCSVContent(csvContent: string): AppSpecification[] {
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    const headers = this.parseCSVLine(lines[0])
    const specifications: AppSpecification[] = []

    // Normalize headers to lowercase for case-insensitive matching
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim())

    // Required columns mapping
    const columnMap = {
      name: this.findColumn(normalizedHeaders, ['name', 'app_name', 'application_name']),
      description: this.findColumn(normalizedHeaders, ['description', 'desc', 'summary']),
      app_goal: this.findColumn(normalizedHeaders, ['app_goal', 'goal', 'objective', 'purpose']),
      target_user: this.findColumn(normalizedHeaders, ['target_user', 'user', 'audience', 'users']),
      main_problem: this.findColumn(normalizedHeaders, ['main_problem', 'problem', 'issue', 'challenge']),
      design_preferences: this.findColumn(normalizedHeaders, ['design_preferences', 'design', 'ui', 'style'])
    }

    // Optional columns mapping
    const optionalColumnMap = {
      additional_requirements: this.findColumn(normalizedHeaders, ['additional_requirements', 'extra', 'features']),
      tech_stack: this.findColumn(normalizedHeaders, ['tech_stack', 'technology', 'stack', 'framework']),
      complexity_level: this.findColumn(normalizedHeaders, ['complexity_level', 'complexity', 'difficulty'])
    }

    // Validate required columns exist
    const missingColumns = Object.entries(columnMap)
      .filter(([key, index]) => index === -1)
      .map(([key]) => key)

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`)
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const values = this.parseCSVLine(line)
        
        if (values.length < Math.max(...Object.values(columnMap)) + 1) {
          console.warn(`Row ${i + 1}: Insufficient columns, skipping`)
          continue
        }

        const spec: AppSpecification = {
          name: this.cleanValue(values[columnMap.name]),
          description: this.cleanValue(values[columnMap.description]),
          app_goal: this.cleanValue(values[columnMap.app_goal]),
          target_user: this.cleanValue(values[columnMap.target_user]),
          main_problem: this.cleanValue(values[columnMap.main_problem]),
          design_preferences: this.cleanValue(values[columnMap.design_preferences])
        }

        // Add optional fields if they exist
        if (optionalColumnMap.additional_requirements !== -1) {
          spec.additional_requirements = this.cleanValue(values[optionalColumnMap.additional_requirements])
        }
        if (optionalColumnMap.tech_stack !== -1) {
          spec.tech_stack = this.cleanValue(values[optionalColumnMap.tech_stack]) || 'Python/React'
        }
        if (optionalColumnMap.complexity_level !== -1) {
          const complexity = this.cleanValue(values[optionalColumnMap.complexity_level])?.toLowerCase()
          spec.complexity_level = (['low', 'medium', 'high'].includes(complexity)) 
            ? complexity as 'low' | 'medium' | 'high'
            : 'medium'
        }

        // Validate required fields are not empty
        if (!spec.name || !spec.description) {
          console.warn(`Row ${i + 1}: Missing name or description, skipping`)
          continue
        }

        specifications.push(spec)
      } catch (error) {
        console.warn(`Row ${i + 1}: Parse error - ${error}, skipping`)
        continue
      }
    }

    if (specifications.length === 0) {
      throw new Error('No valid app specifications found in CSV')
    }

    return specifications
  }

  private static findColumn(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.includes(name))
      if (index !== -1) return index
    }
    return -1
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    // Add the last field
    result.push(current.trim())
    return result
  }

  private static cleanValue(value: string): string {
    if (!value) return ''
    
    // Remove surrounding quotes and trim whitespace
    let cleaned = value.trim()
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1)
    }
    
    // Handle escaped quotes
    cleaned = cleaned.replace(/""/g, '"')
    
    return cleaned.trim()
  }

  static validateSpecification(spec: AppSpecification): string[] {
    const errors: string[] = []

    if (!spec.name?.trim()) errors.push('Name is required')
    if (!spec.description?.trim()) errors.push('Description is required')
    if (!spec.app_goal?.trim()) errors.push('App goal is required')
    if (!spec.target_user?.trim()) errors.push('Target user is required')
    if (!spec.main_problem?.trim()) errors.push('Main problem is required')
    if (!spec.design_preferences?.trim()) errors.push('Design preferences is required')

    // Validate complexity level if provided
    if (spec.complexity_level && !['low', 'medium', 'high'].includes(spec.complexity_level)) {
      errors.push('Complexity level must be low, medium, or high')
    }

    return errors
  }
}