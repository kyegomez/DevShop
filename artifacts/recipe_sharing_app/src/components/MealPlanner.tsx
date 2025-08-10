'use client'

import { useState } from 'react'
import { Calendar, Plus, ChevronLeft, ChevronRight, Trash2, Clock, Users } from 'lucide-react'
import { User, Recipe, MealPlanItem } from '@/lib/types'
import { generateId, formatDate } from '@/lib/storage'

interface MealPlannerProps {
  user: User
  recipes: Recipe[]
}

export default function MealPlanner({ user, recipes }: MealPlannerProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [mealPlan, setMealPlan] = useState<MealPlanItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; meal: string } | null>(null)

  const mealTypes = [
    { id: 'breakfast', label: 'Breakfast', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'lunch', label: 'Lunch', color: 'bg-green-100 text-green-800' },
    { id: 'dinner', label: 'Dinner', color: 'bg-blue-100 text-blue-800' },
    { id: 'snack', label: 'Snack', color: 'bg-purple-100 text-purple-800' }
  ]

  // Get the start of the current week (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  const weekStart = getWeekStart(currentWeek)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    return day
  })

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const openAddModal = (date: string, meal: string) => {
    setSelectedSlot({ date, meal })
    setShowAddModal(true)
  }

  const addMealPlan = (recipeId: string, servings: number = 1) => {
    if (!selectedSlot) return

    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return

    const newPlan: MealPlanItem = {
      id: generateId(),
      date: selectedSlot.date,
      meal: selectedSlot.meal as any,
      recipeId: recipe.id,
      recipeName: recipe.title,
      servings
    }

    setMealPlan([...mealPlan, newPlan])
    setShowAddModal(false)
    setSelectedSlot(null)
  }

  const removeMealPlan = (planId: string) => {
    setMealPlan(mealPlan.filter(plan => plan.id !== planId))
  }

  const getMealPlansForSlot = (date: string, meal: string) => {
    return mealPlan.filter(plan => 
      plan.date === date && plan.meal === meal
    )
  }

  const getTotalPlansForDay = (date: string) => {
    return mealPlan.filter(plan => plan.date === date).length
  }

  const renderAddModal = () => {
    if (!showAddModal || !selectedSlot) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Add Recipe to {selectedSlot.meal} on{' '}
                {formatDate(selectedSlot.date)}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {recipes.length > 0 ? (
              <div className="space-y-3">
                {recipes.map(recipe => (
                  <button
                    key={recipe.id}
                    onClick={() => addMealPlan(recipe.id)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="text-2xl">{recipe.image}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{recipe.title}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {recipe.prepTime + recipe.cookTime}m
                        <Users className="h-3 w-3 ml-2" />
                        {recipe.servings}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No saved recipes available</p>
                <p className="text-sm">Save some recipes first to add them to your meal plan!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Meal Planner</h1>
              <p className="text-gray-600">Plan your weekly meals</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center px-4 py-2 bg-gray-50 rounded-lg font-medium text-gray-800 min-w-[200px]">
              Week of {formatDate(weekStart.toISOString())}
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Week Overview */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekDays.map(day => {
            const dateKey = formatDateKey(day)
            const plansCount = getTotalPlansForDay(dateKey)
            const isToday = formatDateKey(new Date()) === dateKey

            return (
              <div
                key={dateKey}
                className={`text-center p-2 rounded-lg ${
                  isToday ? 'bg-primary-100 text-primary-800' : 'bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-lg font-semibold">
                  {day.getDate()}
                </div>
                {plansCount > 0 && (
                  <div className="text-xs text-primary-600 mt-1">
                    {plansCount} meal{plansCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Meal Plan Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 w-24">
                  Meal
                </th>
                {weekDays.map(day => (
                  <th key={formatDateKey(day)} className="px-4 py-3 text-center text-sm font-semibold text-gray-800 min-w-[140px]">
                    {day.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mealTypes.map(({ id: mealId, label, color }) => (
                <tr key={mealId} className="border-b border-gray-200">
                  <td className="px-4 py-4 font-medium text-gray-800">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
                      {label}
                    </span>
                  </td>
                  {weekDays.map(day => {
                    const dateKey = formatDateKey(day)
                    const plans = getMealPlansForSlot(dateKey, mealId)

                    return (
                      <td key={`${dateKey}-${mealId}`} className="px-2 py-2">
                        <div className="min-h-[80px] space-y-1">
                          {plans.map(plan => {
                            const recipe = recipes.find(r => r.id === plan.recipeId)
                            return (
                              <div
                                key={plan.id}
                                className="relative bg-primary-50 border border-primary-200 rounded-md p-2 text-xs"
                              >
                                <div className="flex items-center gap-1">
                                  <span className="text-sm">
                                    {recipe?.image || '🍽️'}
                                  </span>
                                  <span className="font-medium text-gray-800 truncate">
                                    {plan.recipeName}
                                  </span>
                                </div>
                                {plan.servings > 1 && (
                                  <div className="text-gray-600 mt-1">
                                    {plan.servings} servings
                                  </div>
                                )}
                                <button
                                  onClick={() => removeMealPlan(plan.id)}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                  <Trash2 className="h-2 w-2" />
                                </button>
                              </div>
                            )
                          })}
                          <button
                            onClick={() => openAddModal(dateKey, mealId)}
                            className="w-full h-8 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-500 hover:border-primary-300 hover:text-primary-500 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meal Plan Summary */}
      {mealPlan.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">This Week's Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            {mealTypes.map(({ id: mealId, label, color }) => {
              const count = mealPlan.filter(plan => plan.meal === mealId).length
              return (
                <div key={mealId} className="p-4 bg-gray-50 rounded-lg">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold mb-2 ${color}`}>
                    {label}
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{count}</div>
                  <div className="text-sm text-gray-600">planned</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {renderAddModal()}
    </div>
  )
}