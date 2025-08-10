# Recipe Sharing App 🍳

A social platform for sharing and discovering cooking recipes, designed for home cooks, food bloggers, and culinary students.

## 🎯 Problem Solved

**Core Problem**: Difficulty finding reliable recipes and sharing cooking experiences

This app provides a comprehensive solution with:
- **Recipe Discovery**: Browse and search through community-shared recipes
- **Social Features**: Follow other cooks and share your own creations
- **Practical Tools**: Shopping lists, meal planning, and recipe organization
- **Quality Control**: Rating and review system for recipe reliability

## ✨ Key Features

### 🍽️ Recipe Management
- **Create & Share**: Upload recipes with photos, ingredients, and step-by-step instructions
- **Rich Metadata**: Cuisine type, dietary info, difficulty level, prep/cook times
- **Visual Design**: Instagram-like interface with beautiful food photography (emojis)
- **Rating System**: 5-star ratings and reviews from the community

### 🔍 Discovery & Search
- **Smart Search**: Find recipes by title, description, or tags
- **Advanced Filters**: Filter by cuisine, diet, difficulty, cooking time, and ratings
- **Recipe Feed**: Discover new recipes from followed users and popular content
- **Save Collections**: Bookmark favorite recipes for easy access

### 👤 Social Features
- **User Profiles**: Personal profiles with follower/following system
- **Recipe Collections**: Organize saved recipes in personal collections
- **Community Interaction**: Like, comment, and share recipes with others

### 🛒 Practical Tools
- **Shopping Lists**: Auto-generate shopping lists from saved recipes
- **Smart Categorization**: Ingredients grouped by category (Produce, Dairy, etc.)
- **Meal Planning**: Weekly meal planner with drag-and-drop functionality
- **Recipe Scaling**: Adjust serving sizes with automatic ingredient scaling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Local Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd recipe_sharing_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   ```
   Navigate to http://localhost:3000
   ```

The app will start immediately with sample recipes and a default user profile!

## 📱 How to Use

### Getting Started
1. **Explore Recipes**: Browse the main feed to discover recipes
2. **Search & Filter**: Use the search bar and filters to find specific recipes
3. **View Details**: Click "View Recipe" to see ingredients and instructions
4. **Rate Recipes**: Give 1-5 star ratings to help other users

### Creating Recipes
1. **Click "Create"** in the navigation
2. **Fill Recipe Details**: Add title, description, and select an emoji icon
3. **Add Ingredients**: List all ingredients with amounts and units
4. **Write Instructions**: Step-by-step cooking directions
5. **Set Metadata**: Choose cuisine type, diet info, and difficulty
6. **Publish**: Share your recipe with the community

### Managing Your Profile
1. **Click "Profile"** to view your personal page
2. **Edit Profile**: Update your name, bio, and avatar
3. **View Stats**: See your recipes, followers, and saved items
4. **Recipe History**: Browse all your published recipes

### Shopping & Meal Planning
1. **Shopping Lists**: 
   - Go to "Shopping" tab
   - Add ingredients from saved recipes
   - Check off items as you shop
   - Items are categorized automatically

2. **Meal Planning**:
   - Visit "Planner" tab
   - Navigate between weeks
   - Add saved recipes to meal slots
   - Generate shopping lists from meal plans

## 🏗️ Technical Architecture

### Frontend Stack
- **Next.js 14+**: Modern React framework with App Router
- **React 18+**: Component-based UI with hooks and functional components
- **TypeScript**: Type-safe development with strong typing
- **Tailwind CSS**: Utility-first CSS framework for responsive design

### Data Management
- **Local Storage**: Client-side data persistence for offline functionality
- **React State**: Component state management with useState and useEffect
- **Type Safety**: Comprehensive TypeScript interfaces and types

### Key Components
- `RecipeCard`: Interactive recipe display with ratings and details
- `RecipeForm`: Comprehensive recipe creation interface
- `UserProfile`: User management and profile editing
- `ShoppingList`: Smart shopping list with categorization
- `MealPlanner`: Weekly meal planning calendar

## 🎨 Design Features

### User Experience
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Intuitive Navigation**: Clear tab-based navigation system
- **Visual Feedback**: Smooth animations and hover effects
- **Food Photography**: Emoji-based food icons for visual appeal

### Accessibility
- **Screen Reader Friendly**: Semantic HTML and ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: High contrast ratios for readability
- **Mobile First**: Touch-friendly interface design

## 📊 Data Storage

The app uses browser localStorage for data persistence:
- **Recipes**: All recipe data and metadata
- **User Profile**: Personal information and preferences
- **Saved Recipes**: Bookmarked recipe collections
- **Shopping Lists**: Shopping list items and completion status
- **Meal Plans**: Weekly meal planning data

## 🔧 Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Main application page
│   └── globals.css        # Global styles with Tailwind
├── components/            # React components
│   ├── RecipeCard.tsx     # Recipe display component
│   ├── RecipeForm.tsx     # Recipe creation form
│   ├── UserProfile.tsx    # User profile management
│   ├── ShoppingList.tsx   # Shopping list functionality
│   ├── MealPlanner.tsx    # Meal planning calendar
│   └── SearchFilters.tsx  # Recipe filtering component
└── lib/                   # Utility functions
    ├── types.ts           # TypeScript type definitions
    └── storage.ts         # Local storage utilities
```

## 🚀 Deployment

### Vercel Deployment (Recommended)
The app is optimized for Vercel deployment:

1. **Automatic Deployment**: Connect your GitHub repository to Vercel
2. **Build Configuration**: Uses the included `vercel.json` configuration
3. **Environment**: No environment variables required
4. **Performance**: Optimized for fast loading and responsiveness

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

This is a demonstration project showcasing modern web development practices:
- Clean, readable React/TypeScript code
- Modern Next.js patterns with App Router
- Responsive design with Tailwind CSS
- Local-first data approach
- User-centered design principles

## 📄 License

MIT License - Feel free to use this project as a learning resource or starting point for your own recipe sharing application.

---

**Built with ❤️ for food lovers everywhere!** 🍴

Start your culinary journey by running the app locally and exploring the sample recipes, then create your own food masterpieces to share with the community!