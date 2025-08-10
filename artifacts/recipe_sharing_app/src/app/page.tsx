'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Heart, Star, Clock, Users, ChefHat, BookOpen, Calendar, ShoppingCart } from 'lucide-react'
import RecipeCard from '@/components/RecipeCard'
import RecipeForm from '@/components/RecipeForm'
import SearchFilters from '@/components/SearchFilters'
import UserProfile from '@/components/UserProfile'
import ShoppingList from '@/components/ShoppingList'
import MealPlanner from '@/components/MealPlanner'
import { Recipe, User } from '@/lib/types'
import { getStoredData, saveToStorage } from '@/lib/storage'

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeView, setActiveView] = useState<'feed' | 'create' | 'profile' | 'shopping' | 'planner'>('feed')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    cuisine: '',
    diet: '',
    difficulty: '',
    maxTime: 0,
    minRating: 0
  })

  // Initialize data on component mount
  useEffect(() => {
    initializeApp()
  }, [])

  // Filter recipes when search or filters change
  useEffect(() => {
    filterRecipes()
  }, [recipes, searchQuery, filters])

  const initializeApp = async () => {
    // Load existing data or create sample data
    let existingRecipes = getStoredData<Recipe[]>('recipes') || []
    let existingUser = getStoredData<User>('currentUser')

    // Create default user if none exists
    if (!existingUser) {
      existingUser = {
        id: '1',
        name: 'Food Explorer',
        email: 'foodlover@example.com',
        avatar: '👨‍🍳',
        bio: 'Passionate home cook sharing delicious recipes!',
        followers: 147,
        following: 89,
        recipesCount: 0,
        joinedDate: new Date().toISOString(),
        favorites: [],
        savedRecipes: [],
        shoppingList: []
      }
      saveToStorage('currentUser', existingUser)
    }

    // Create sample recipes if none exist
    if (existingRecipes.length === 0) {
      existingRecipes = createSampleRecipes(existingUser.id)
      saveToStorage('recipes', existingRecipes)
    }

    setCurrentUser(existingUser)
    setRecipes(existingRecipes)
  }

  const createSampleRecipes = (userId: string): Recipe[] => [
    {
      id: '1',
      title: 'Classic Spaghetti Carbonara',
      description: 'Authentic Italian pasta dish with eggs, cheese, and pancetta',
      image: '🍝',
      authorId: userId,
      authorName: 'Food Explorer',
      authorAvatar: '👨‍🍳',
      ingredients: [
        { name: 'Spaghetti', amount: '400g', unit: 'grams' },
        { name: 'Pancetta', amount: '200g', unit: 'grams' },
        { name: 'Eggs', amount: '4', unit: 'pieces' },
        { name: 'Parmesan cheese', amount: '100g', unit: 'grams' },
        { name: 'Black pepper', amount: '1 tsp', unit: 'teaspoon' },
        { name: 'Salt', amount: '1 tsp', unit: 'teaspoon' }
      ],
      instructions: [
        'Bring a large pot of salted water to boil and cook spaghetti according to package directions',
        'Meanwhile, cook pancetta in a large skillet until crispy',
        'In a bowl, whisk together eggs and grated Parmesan cheese',
        'Drain pasta, reserving 1 cup of pasta water',
        'Add hot pasta to the skillet with pancetta',
        'Remove from heat and quickly stir in egg mixture, adding pasta water as needed',
        'Season with black pepper and serve immediately'
      ],
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      difficulty: 'Medium',
      cuisine: 'Italian',
      diet: 'Vegetarian',
      rating: 4.8,
      ratingsCount: 124,
      tags: ['pasta', 'italian', 'quick', 'classic'],
      createdAt: new Date('2024-01-15').toISOString(),
      nutrition: {
        calories: 520,
        protein: 22,
        carbs: 65,
        fat: 18,
        fiber: 3,
        sugar: 3
      }
    },
    {
      id: '2',
      title: 'Mediterranean Quinoa Salad',
      description: 'Fresh and healthy salad with quinoa, vegetables, and feta cheese',
      image: '🥗',
      authorId: userId,
      authorName: 'Food Explorer',
      authorAvatar: '👨‍🍳',
      ingredients: [
        { name: 'Quinoa', amount: '1 cup', unit: 'cup' },
        { name: 'Cherry tomatoes', amount: '250g', unit: 'grams' },
        { name: 'Cucumber', amount: '1 large', unit: 'pieces' },
        { name: 'Red onion', amount: '1/2 cup', unit: 'cup' },
        { name: 'Feta cheese', amount: '150g', unit: 'grams' },
        { name: 'Olive oil', amount: '3 tbsp', unit: 'tablespoon' },
        { name: 'Lemon juice', amount: '2 tbsp', unit: 'tablespoon' },
        { name: 'Fresh herbs', amount: '1/4 cup', unit: 'cup' }
      ],
      instructions: [
        'Rinse quinoa and cook according to package directions, then let cool',
        'Dice tomatoes, cucumber, and red onion',
        'Crumble feta cheese',
        'In a large bowl, combine cooled quinoa with vegetables and feta',
        'Whisk together olive oil, lemon juice, salt, and pepper',
        'Pour dressing over salad and toss well',
        'Garnish with fresh herbs and serve chilled'
      ],
      prepTime: 20,
      cookTime: 15,
      servings: 6,
      difficulty: 'Easy',
      cuisine: 'Mediterranean',
      diet: 'Vegetarian',
      rating: 4.6,
      ratingsCount: 89,
      tags: ['healthy', 'salad', 'quinoa', 'mediterranean', 'vegetarian'],
      createdAt: new Date('2024-01-10').toISOString(),
      nutrition: {
        calories: 285,
        protein: 12,
        carbs: 35,
        fat: 12,
        fiber: 4,
        sugar: 8
      }
    },
    {
      id: '3',
      title: 'Chocolate Chip Cookies',
      description: 'Soft and chewy homemade chocolate chip cookies',
      image: '🍪',
      authorId: userId,
      authorName: 'Food Explorer',
      authorAvatar: '👨‍🍳',
      ingredients: [
        { name: 'All-purpose flour', amount: '2¼ cups', unit: 'cup' },
        { name: 'Butter', amount: '1 cup', unit: 'cup' },
        { name: 'Brown sugar', amount: '¾ cup', unit: 'cup' },
        { name: 'White sugar', amount: '¾ cup', unit: 'cup' },
        { name: 'Eggs', amount: '2 large', unit: 'pieces' },
        { name: 'Vanilla extract', amount: '2 tsp', unit: 'teaspoon' },
        { name: 'Baking soda', amount: '1 tsp', unit: 'teaspoon' },
        { name: 'Salt', amount: '1 tsp', unit: 'teaspoon' },
        { name: 'Chocolate chips', amount: '2 cups', unit: 'cup' }
      ],
      instructions: [
        'Preheat oven to 375°F (190°C)',
        'Cream together butter and both sugars until light and fluffy',
        'Beat in eggs one at a time, then add vanilla',
        'In a separate bowl, whisk together flour, baking soda, and salt',
        'Gradually mix dry ingredients into wet ingredients',
        'Stir in chocolate chips',
        'Drop rounded tablespoons of dough onto ungreased baking sheets',
        'Bake for 9-11 minutes until golden brown',
        'Cool on baking sheet for 2 minutes before removing'
      ],
      prepTime: 15,
      cookTime: 10,
      servings: 24,
      difficulty: 'Easy',
      cuisine: 'American',
      diet: 'Vegetarian',
      rating: 4.9,
      ratingsCount: 256,
      tags: ['dessert', 'cookies', 'chocolate', 'baking', 'sweet'],
      createdAt: new Date('2024-01-05').toISOString(),
      nutrition: {
        calories: 180,
        protein: 2,
        carbs: 26,
        fat: 8,
        fiber: 1,
        sugar: 16
      }
    }
  ]

  const filterRecipes = () => {
    let filtered = recipes

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply filters
    if (filters.cuisine) {
      filtered = filtered.filter(recipe => recipe.cuisine === filters.cuisine)
    }
    if (filters.diet) {
      filtered = filtered.filter(recipe => recipe.diet === filters.diet)
    }
    if (filters.difficulty) {
      filtered = filtered.filter(recipe => recipe.difficulty === filters.difficulty)
    }
    if (filters.maxTime > 0) {
      filtered = filtered.filter(recipe => (recipe.prepTime + recipe.cookTime) <= filters.maxTime)
    }
    if (filters.minRating > 0) {
      filtered = filtered.filter(recipe => recipe.rating >= filters.minRating)
    }

    setFilteredRecipes(filtered)
  }

  const handleCreateRecipe = (recipeData: Omit<Recipe, 'id' | 'authorId' | 'authorName' | 'authorAvatar' | 'rating' | 'ratingsCount' | 'createdAt'>) => {
    if (!currentUser) return

    const newRecipe: Recipe = {
      ...recipeData,
      id: Date.now().toString(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      rating: 0,
      ratingsCount: 0,
      createdAt: new Date().toISOString()
    }

    const updatedRecipes = [newRecipe, ...recipes]
    setRecipes(updatedRecipes)
    saveToStorage('recipes', updatedRecipes)

    // Update user's recipe count
    const updatedUser = { ...currentUser, recipesCount: currentUser.recipesCount + 1 }
    setCurrentUser(updatedUser)
    saveToStorage('currentUser', updatedUser)

    setActiveView('feed')
  }

  const handleRateRecipe = (recipeId: string, rating: number) => {
    const updatedRecipes = recipes.map(recipe => {
      if (recipe.id === recipeId) {
        const newRatingsCount = recipe.ratingsCount + 1
        const newRating = ((recipe.rating * recipe.ratingsCount) + rating) / newRatingsCount
        return { ...recipe, rating: newRating, ratingsCount: newRatingsCount }
      }
      return recipe
    })
    setRecipes(updatedRecipes)
    saveToStorage('recipes', updatedRecipes)
  }

  const handleSaveRecipe = (recipeId: string) => {
    if (!currentUser) return

    const updatedUser = {
      ...currentUser,
      savedRecipes: currentUser.savedRecipes.includes(recipeId)
        ? currentUser.savedRecipes.filter(id => id !== recipeId)
        : [...currentUser.savedRecipes, recipeId]
    }
    setCurrentUser(updatedUser)
    saveToStorage('currentUser', updatedUser)
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'create':
        return <RecipeForm onSubmit={handleCreateRecipe} onCancel={() => setActiveView('feed')} />
      case 'profile':
        return currentUser ? (
          <UserProfile 
            user={currentUser} 
            userRecipes={recipes.filter(r => r.authorId === currentUser.id)}
            onEditProfile={(updatedUser) => {
              setCurrentUser(updatedUser)
              saveToStorage('currentUser', updatedUser)
            }}
          />
        ) : null
      case 'shopping':
        return currentUser ? (
          <ShoppingList 
            user={currentUser}
            recipes={recipes.filter(r => currentUser.savedRecipes.includes(r.id))}
            onUpdateShoppingList={(updatedList) => {
              const updatedUser = { ...currentUser, shoppingList: updatedList }
              setCurrentUser(updatedUser)
              saveToStorage('currentUser', updatedUser)
            }}
          />
        ) : null
      case 'planner':
        return currentUser ? (
          <MealPlanner
            user={currentUser}
            recipes={recipes.filter(r => currentUser.savedRecipes.includes(r.id))}
          />
        ) : null
      default:
        return (
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Filter className="h-5 w-5" />
                  Filters
                </button>
              </div>
              {showFilters && (
                <div className="mt-4">
                  <SearchFilters filters={filters} onFiltersChange={setFilters} />
                </div>
              )}
            </div>

            {/* Recipe Feed */}
            <div className="recipe-grid">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onRate={handleRateRecipe}
                  onSave={handleSaveRecipe}
                  isSaved={currentUser?.savedRecipes.includes(recipe.id) || false}
                />
              ))}
            </div>

            {filteredRecipes.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
                <p>Try adjusting your search or filters, or create a new recipe!</p>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🍳</div>
              <h1 className="text-xl font-bold text-gray-800">Recipe Share</h1>
            </div>
            <div className="flex items-center gap-2">
              {currentUser && (
                <span className="text-sm text-gray-600 hidden sm:block">
                  Welcome, {currentUser.name}!
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-[73px] z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'feed', label: 'Feed', icon: BookOpen },
              { id: 'create', label: 'Create', icon: Plus },
              { id: 'profile', label: 'Profile', icon: Users },
              { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
              { id: 'planner', label: 'Planner', icon: Calendar }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeView === id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {renderActiveView()}
      </main>
    </div>
  )
}