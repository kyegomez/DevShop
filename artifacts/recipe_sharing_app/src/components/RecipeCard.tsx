'use client'

import { useState } from 'react'
import { Heart, Star, Clock, Users, ChefHat, Bookmark } from 'lucide-react'
import { Recipe } from '@/lib/types'
import { formatDuration } from '@/lib/storage'

interface RecipeCardProps {
  recipe: Recipe
  onRate: (recipeId: string, rating: number) => void
  onSave: (recipeId: string) => void
  isSaved: boolean
}

export default function RecipeCard({ recipe, onRate, onSave, isSaved }: RecipeCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [userRating, setUserRating] = useState(0)

  const handleRating = (rating: number) => {
    setUserRating(rating)
    onRate(recipe.id, rating)
  }

  const totalTime = recipe.prepTime + recipe.cookTime

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden recipe-card">
      {/* Recipe Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
        <div className="text-6xl">{recipe.image}</div>
        <button
          onClick={() => onSave(recipe.id)}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-colors ${
            isSaved
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-400 hover:text-primary-500'
          }`}
        >
          <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Recipe Content */}
      <div className="p-4">
        {/* Title and Author */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-800 mb-1 line-clamp-2">
            {recipe.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-lg">{recipe.authorAvatar}</span>
            <span>by {recipe.authorName}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {recipe.description}
        </p>

        {/* Recipe Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(totalTime)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{recipe.servings}</span>
          </div>
          <div className="flex items-center gap-1">
            <ChefHat className="h-4 w-4" />
            <span>{recipe.difficulty}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-0.5 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-4 w-4 ${
                      star <= (hoveredStar || Math.floor(recipe.rating))
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {recipe.rating.toFixed(1)} ({recipe.ratingsCount})
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
          {recipe.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{recipe.tags.length - 3} more</span>
          )}
        </div>

        {/* Cuisine and Diet Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {recipe.cuisine}
          </span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
            {recipe.diet}
          </span>
        </div>

        {/* View Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full py-2 px-4 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium"
        >
          {showDetails ? 'Hide Details' : 'View Recipe'}
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {/* Ingredients */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">Ingredients</h4>
            <ul className="space-y-1">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="text-sm text-gray-600 flex justify-between">
                  <span>{ingredient.name}</span>
                  <span className="font-medium">
                    {ingredient.amount} {ingredient.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">Instructions</h4>
            <ol className="space-y-2">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="text-sm text-gray-600 flex">
                  <span className="font-medium text-primary-600 mr-2 min-w-[20px]">
                    {index + 1}.
                  </span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Nutrition Info */}
          {recipe.nutrition && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Nutrition per serving</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-white rounded">
                  <div className="font-semibold text-gray-800">{recipe.nutrition.calories}</div>
                  <div className="text-gray-500">Calories</div>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <div className="font-semibold text-gray-800">{recipe.nutrition.protein}g</div>
                  <div className="text-gray-500">Protein</div>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <div className="font-semibold text-gray-800">{recipe.nutrition.carbs}g</div>
                  <div className="text-gray-500">Carbs</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}