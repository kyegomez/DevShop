'use client'

import { SearchFilters as SearchFiltersType } from '@/lib/types'

interface SearchFiltersProps {
  filters: SearchFiltersType
  onFiltersChange: (filters: SearchFiltersType) => void
}

export default function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const cuisineTypes = ['', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'French', 'Thai', 'Greek', 'Mediterranean', 'American', 'Korean', 'Middle Eastern']
  const dietTypes = ['', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-Carb', 'High-Protein', 'Pescatarian', 'None']
  const difficultyLevels = ['', 'Easy', 'Medium', 'Hard']

  const handleFilterChange = (key: keyof SearchFiltersType, value: string | number) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      cuisine: '',
      diet: '',
      difficulty: '',
      maxTime: 0,
      minRating: 0
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value && value !== 0)

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Filter Recipes</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Cuisine Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cuisine
          </label>
          <select
            value={filters.cuisine}
            onChange={(e) => handleFilterChange('cuisine', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {cuisineTypes.map(cuisine => (
              <option key={cuisine} value={cuisine}>
                {cuisine || 'Any Cuisine'}
              </option>
            ))}
          </select>
        </div>

        {/* Diet Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diet
          </label>
          <select
            value={filters.diet}
            onChange={(e) => handleFilterChange('diet', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {dietTypes.map(diet => (
              <option key={diet} value={diet}>
                {diet || 'Any Diet'}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {difficultyLevels.map(difficulty => (
              <option key={difficulty} value={difficulty}>
                {difficulty || 'Any Level'}
              </option>
            ))}
          </select>
        </div>

        {/* Max Time Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Time (minutes)
          </label>
          <select
            value={filters.maxTime}
            onChange={(e) => handleFilterChange('maxTime', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={0}>Any Time</option>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        {/* Min Rating Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Rating
          </label>
          <select
            value={filters.minRating}
            onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={0}>Any Rating</option>
            <option value={3}>3+ Stars</option>
            <option value={3.5}>3.5+ Stars</option>
            <option value={4}>4+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.cuisine && (
              <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                Cuisine: {filters.cuisine}
              </span>
            )}
            {filters.diet && (
              <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                Diet: {filters.diet}
              </span>
            )}
            {filters.difficulty && (
              <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                Level: {filters.difficulty}
              </span>
            )}
            {filters.maxTime > 0 && (
              <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                Max Time: {filters.maxTime}m
              </span>
            )}
            {filters.minRating > 0 && (
              <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                Min Rating: {filters.minRating}+
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}