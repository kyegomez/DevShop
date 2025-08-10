'use client'

import { useState } from 'react'
import { Edit3, Calendar, MapPin, Mail, Users, ChefHat, Heart, Bookmark, Settings } from 'lucide-react'
import { User, Recipe } from '@/lib/types'
import { formatDate } from '@/lib/storage'
import RecipeCard from './RecipeCard'

interface UserProfileProps {
  user: User
  userRecipes: Recipe[]
  onEditProfile: (user: User) => void
}

export default function UserProfile({ user, userRecipes, onEditProfile }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'recipes' | 'saved' | 'settings'>('recipes')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user.name,
    bio: user.bio,
    avatar: user.avatar
  })

  const avatarOptions = ['👨‍🍳', '👩‍🍳', '🧑‍🍳', '👤', '😊', '🙂', '😋', '🤤', '👨', '👩', '🧑']

  const handleSaveProfile = () => {
    const updatedUser = {
      ...user,
      ...editForm
    }
    onEditProfile(updatedUser)
    setIsEditing(false)
  }

  const renderEditForm = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Edit Profile</h3>
        <button
          onClick={() => setIsEditing(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Avatar Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Profile Avatar
          </label>
          <div className="flex flex-wrap gap-2">
            {avatarOptions.map(avatar => (
              <button
                key={avatar}
                onClick={() => setEditForm(prev => ({ ...prev, avatar }))}
                className={`p-3 text-2xl rounded-lg border-2 transition-colors ${
                  editForm.avatar === avatar 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={editForm.bio}
            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Tell us about yourself..."
          />
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSaveProfile}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            Save Changes
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )

  const renderProfileHeader = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          <div className="text-6xl">{user.avatar}</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{user.name}</h1>
            <p className="text-gray-600 mb-3 max-w-md">{user.bio}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatDate(user.joinedDate)}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Edit3 className="h-4 w-4" />
          <span className="hidden sm:inline">Edit Profile</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{userRecipes.length}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <ChefHat className="h-4 w-4" />
            Recipes
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{user.followers}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <Users className="h-4 w-4" />
            Followers
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{user.following}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <Users className="h-4 w-4" />
            Following
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{user.savedRecipes.length}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <Bookmark className="h-4 w-4" />
            Saved
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'recipes':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">My Recipes</h2>
            {userRecipes.length > 0 ? (
              <div className="recipe-grid">
                {userRecipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onRate={() => {}}
                    onSave={() => {}}
                    isSaved={user.savedRecipes.includes(recipe.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No recipes yet</h3>
                <p>Start sharing your delicious creations!</p>
              </div>
            )}
          </div>
        )

      case 'saved':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Saved Recipes</h2>
            {user.savedRecipes.length > 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bookmark className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Your saved recipes will appear here</h3>
                <p>Start saving recipes you love to cook them later!</p>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Bookmark className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No saved recipes yet</h3>
                <p>Discover and save recipes you want to try!</p>
              </div>
            )}
          </div>
        )

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Account Settings</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-800">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Receive notifications about recipe activity</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-primary-500" defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-800">Recipe Recommendations</h3>
                    <p className="text-sm text-gray-600">Get personalized recipe suggestions</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-primary-500" defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="font-medium text-gray-800">Public Profile</h3>
                    <p className="text-sm text-gray-600">Make your profile visible to other users</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-primary-500" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isEditing) {
    return renderEditForm()
  }

  return (
    <div className="space-y-6">
      {renderProfileHeader()}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'recipes', label: 'My Recipes', icon: ChefHat },
              { id: 'saved', label: 'Saved', icon: Bookmark },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}