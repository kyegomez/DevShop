'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Check, Plus, Trash2, Package, Apple, Milk, Beef, Wheat } from 'lucide-react'
import { User, Recipe, ShoppingListItem } from '@/lib/types'
import { generateId } from '@/lib/storage'

interface ShoppingListProps {
  user: User
  recipes: Recipe[]
  onUpdateShoppingList: (shoppingList: ShoppingListItem[]) => void
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Produce': <Apple className="h-4 w-4 text-green-500" />,
  'Dairy': <Milk className="h-4 w-4 text-blue-500" />,
  'Meat': <Beef className="h-4 w-4 text-red-500" />,
  'Pantry': <Package className="h-4 w-4 text-yellow-500" />,
  'Grains': <Wheat className="h-4 w-4 text-amber-500" />,
  'Other': <Package className="h-4 w-4 text-gray-500" />
}

export default function ShoppingList({ user, recipes, onUpdateShoppingList }: ShoppingListProps) {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(user.shoppingList || [])
  const [newItem, setNewItem] = useState('')
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([])
  const [showAddForm, setShowAddForm] = useState(false)

  // Categorize ingredients
  const categorizeIngredient = (ingredient: string): string => {
    const produce = ['tomato', 'onion', 'garlic', 'lettuce', 'carrot', 'potato', 'apple', 'lemon', 'lime', 'herbs', 'basil', 'parsley', 'cilantro']
    const dairy = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'feta', 'parmesan', 'mozzarella']
    const meat = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'turkey', 'ham', 'bacon', 'pancetta']
    const grains = ['rice', 'pasta', 'bread', 'flour', 'quinoa', 'oats', 'cereal', 'spaghetti']

    const lowerIngredient = ingredient.toLowerCase()

    if (produce.some(item => lowerIngredient.includes(item))) return 'Produce'
    if (dairy.some(item => lowerIngredient.includes(item))) return 'Dairy'
    if (meat.some(item => lowerIngredient.includes(item))) return 'Meat'
    if (grains.some(item => lowerIngredient.includes(item))) return 'Grains'
    
    return 'Pantry'
  }

  const addRecipeIngredients = (recipeIds: string[]) => {
    const newItems: ShoppingListItem[] = []
    
    recipeIds.forEach(recipeId => {
      const recipe = recipes.find(r => r.id === recipeId)
      if (!recipe) return

      recipe.ingredients.forEach(ingredient => {
        // Check if ingredient already exists in shopping list
        const existingItem = shoppingList.find(item => 
          item.name.toLowerCase() === ingredient.name.toLowerCase()
        )

        if (!existingItem) {
          newItems.push({
            id: generateId(),
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            category: categorizeIngredient(ingredient.name),
            completed: false,
            recipeId: recipe.id,
            recipeName: recipe.title
          })
        }
      })
    })

    const updatedList = [...shoppingList, ...newItems]
    setShoppingList(updatedList)
    onUpdateShoppingList(updatedList)
    setSelectedRecipes([])
  }

  const addCustomItem = () => {
    if (!newItem.trim()) return

    const customItem: ShoppingListItem = {
      id: generateId(),
      name: newItem.trim(),
      amount: '1',
      unit: 'piece',
      category: 'Other',
      completed: false
    }

    const updatedList = [...shoppingList, customItem]
    setShoppingList(updatedList)
    onUpdateShoppingList(updatedList)
    setNewItem('')
    setShowAddForm(false)
  }

  const toggleItemCompleted = (itemId: string) => {
    const updatedList = shoppingList.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    setShoppingList(updatedList)
    onUpdateShoppingList(updatedList)
  }

  const removeItem = (itemId: string) => {
    const updatedList = shoppingList.filter(item => item.id !== itemId)
    setShoppingList(updatedList)
    onUpdateShoppingList(updatedList)
  }

  const clearCompleted = () => {
    const updatedList = shoppingList.filter(item => !item.completed)
    setShoppingList(updatedList)
    onUpdateShoppingList(updatedList)
  }

  // Group items by category
  const groupedItems = shoppingList.reduce((groups, item) => {
    const category = item.category
    if (!groups[category]) groups[category] = []
    groups[category].push(item)
    return groups
  }, {} as Record<string, ShoppingListItem[]>)

  const completedCount = shoppingList.filter(item => item.completed).length
  const totalCount = shoppingList.length

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-primary-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Shopping List</h1>
              <p className="text-gray-600">
                {completedCount} of {totalCount} items completed
              </p>
            </div>
          </div>

          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear Completed
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mb-6">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Add from Recipes */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Add from Saved Recipes</h3>
          {recipes.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recipes.map(recipe => (
                  <label
                    key={recipe.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipes.includes(recipe.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecipes([...selectedRecipes, recipe.id])
                        } else {
                          setSelectedRecipes(selectedRecipes.filter(id => id !== recipe.id))
                        }
                      }}
                      className="h-4 w-4 text-primary-500"
                    />
                    <div className="text-2xl">{recipe.image}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{recipe.title}</div>
                      <div className="text-sm text-gray-600">
                        {recipe.ingredients.length} ingredients
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {selectedRecipes.length > 0 && (
                <button
                  onClick={() => addRecipeIngredients(selectedRecipes)}
                  className="w-full py-2 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  Add Ingredients from {selectedRecipes.length} Recipe{selectedRecipes.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Save some recipes first to add their ingredients here!</p>
            </div>
          )}
        </div>

        {/* Add Custom Item */}
        <div className="mb-6 border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-800 mb-3">Add Custom Item</h3>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <Plus className="h-4 w-4" />
              Add custom item
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                placeholder="Enter item name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={addCustomItem}
                disabled={!newItem.trim()}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewItem('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Shopping List Items */}
      {Object.keys(groupedItems).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-2 p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                {categoryIcons[category] || categoryIcons['Other']}
                <h3 className="font-semibold text-gray-800">{category}</h3>
                <span className="text-sm text-gray-500">({items.length} items)</span>
              </div>
              <div className="p-4 space-y-3">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      item.completed ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => toggleItemCompleted(item.id)}
                      className={`p-1 rounded-full transition-colors ${
                        item.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </button>

                    <div className={`flex-1 ${item.completed ? 'opacity-60' : ''}`}>
                      <div className={`font-medium ${item.completed ? 'line-through' : ''}`}>
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.amount} {item.unit}
                        {item.recipeName && (
                          <span className="ml-2 text-primary-600">
                            from {item.recipeName}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Your shopping list is empty</h3>
          <p className="text-gray-600">Add ingredients from your saved recipes or create custom items.</p>
        </div>
      )}
    </div>
  )
}