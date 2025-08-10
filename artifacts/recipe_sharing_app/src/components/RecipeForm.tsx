'use client'

import { useState } from 'react'
import { Plus, Minus, Save, X } from 'lucide-react'
import { Recipe, Ingredient } from '@/lib/types'

interface RecipeFormProps {
  onSubmit: (recipeData: Omit<Recipe, 'id' | 'authorId' | 'authorName' | 'authorAvatar' | 'rating' | 'ratingsCount' | 'createdAt'>) => void
  onCancel: () => void
}

export default function RecipeForm({ onSubmit, onCancel }: RecipeFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '🍽️',
    ingredients: [{ name: '', amount: '', unit: '' }] as Ingredient[],
    instructions: [''],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    cuisine: '',
    diet: '',
    tags: [] as string[],
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0
    }
  })
  
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const foodEmojis = ['🍽️', '🍝', '🍕', '🍔', '🥗', '🍜', '🍖', '🥘', '🍰', '🍪', '🥙', '🌮', '🍣', '🍛', '🥧']
  const cuisineTypes = ['Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'French', 'Thai', 'Greek', 'Mediterranean', 'American', 'Korean', 'Middle Eastern']
  const dietTypes = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-Carb', 'High-Protein', 'Pescatarian', 'None']
  const unitTypes = ['cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'piece', 'clove', 'pinch', 'dash']

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    const updatedIngredients = [...formData.ingredients]
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value }
    setFormData(prev => ({ ...prev, ingredients: updatedIngredients }))
  }

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '', unit: '' }]
    }))
  }

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index)
      }))
    }
  }

  const handleInstructionChange = (index: number, value: string) => {
    const updatedInstructions = [...formData.instructions]
    updatedInstructions[index] = value
    setFormData(prev => ({ ...prev, instructions: updatedInstructions }))
  }

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }))
  }

  const removeInstruction = (index: number) => {
    if (formData.instructions.length > 1) {
      setFormData(prev => ({
        ...prev,
        instructions: prev.instructions.filter((_, i) => i !== index)
      }))
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!formData.tags.includes(tagInput.trim().toLowerCase())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim().toLowerCase()]
        }))
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.cuisine) newErrors.cuisine = 'Cuisine type is required'
    if (!formData.diet) newErrors.diet = 'Diet type is required'
    
    const validIngredients = formData.ingredients.filter(ing => 
      ing.name.trim() && ing.amount.trim() && ing.unit.trim()
    )
    if (validIngredients.length === 0) newErrors.ingredients = 'At least one complete ingredient is required'

    const validInstructions = formData.instructions.filter(inst => inst.trim())
    if (validInstructions.length === 0) newErrors.instructions = 'At least one instruction is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const recipeData = {
      ...formData,
      ingredients: formData.ingredients.filter(ing => 
        ing.name.trim() && ing.amount.trim() && ing.unit.trim()
      ),
      instructions: formData.instructions.filter(inst => inst.trim())
    }

    onSubmit(recipeData)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create New Recipe</h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter recipe name"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {foodEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleInputChange('image', emoji)}
                    className={`p-2 text-2xl rounded-lg border-2 transition-colors ${
                      formData.image === emoji 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`input-field resize-none ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Describe your recipe..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Recipe Details */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prep Time (min)
              </label>
              <input
                type="number"
                min="1"
                value={formData.prepTime}
                onChange={(e) => handleInputChange('prepTime', parseInt(e.target.value) || 0)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cook Time (min)
              </label>
              <input
                type="number"
                min="1"
                value={formData.cookTime}
                onChange={(e) => handleInputChange('cookTime', parseInt(e.target.value) || 0)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servings
              </label>
              <input
                type="number"
                min="1"
                value={formData.servings}
                onChange={(e) => handleInputChange('servings', parseInt(e.target.value) || 1)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="input-field"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Cuisine and Diet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine Type *
              </label>
              <select
                value={formData.cuisine}
                onChange={(e) => handleInputChange('cuisine', e.target.value)}
                className={`input-field ${errors.cuisine ? 'border-red-500' : ''}`}
              >
                <option value="">Select cuisine</option>
                {cuisineTypes.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
              {errors.cuisine && <p className="text-red-500 text-sm mt-1">{errors.cuisine}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diet Type *
              </label>
              <select
                value={formData.diet}
                onChange={(e) => handleInputChange('diet', e.target.value)}
                className={`input-field ${errors.diet ? 'border-red-500' : ''}`}
              >
                <option value="">Select diet type</option>
                {dietTypes.map(diet => (
                  <option key={diet} value={diet}>{diet}</option>
                ))}
              </select>
              {errors.diet && <p className="text-red-500 text-sm mt-1">{errors.diet}</p>}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Ingredients *
              </label>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Ingredient
              </button>
            </div>

            <div className="space-y-3">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    className="flex-1 input-field"
                  />
                  <input
                    type="text"
                    placeholder="Amount"
                    value={ingredient.amount}
                    onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                    className="w-24 input-field"
                  />
                  <select
                    value={ingredient.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                    className="w-24 input-field"
                  >
                    <option value="">Unit</option>
                    {unitTypes.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.ingredients && <p className="text-red-500 text-sm mt-1">{errors.ingredients}</p>}
          </div>

          {/* Instructions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Instructions *
              </label>
              <button
                type="button"
                onClick={addInstruction}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Step
              </button>
            </div>

            <div className="space-y-3">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold mt-1">
                    {index + 1}
                  </span>
                  <textarea
                    placeholder={`Step ${index + 1} instructions...`}
                    value={instruction}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    rows={2}
                    className="flex-1 input-field resize-none"
                  />
                  {formData.instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 transition-colors mt-1"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.instructions && <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type a tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="input-field"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
            >
              <Save className="h-5 w-5" />
              Save Recipe
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}