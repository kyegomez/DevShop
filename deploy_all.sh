#!/bin/bash

echo "🚀 Deploying all template-based apps to Vercel"
echo "=============================================="

# Array to store deployment URLs
declare -a urls=()

# Directory containing all generated apps
APPS_DIR="/Users/ellis.osborn/DevShop/generated_apps"

# Apps to deploy
apps=("task_manager_pro" "budget_tracker" "recipe_finder" "workout_planner" "study_buddy" "local_events" "plant_care" "language_exchange" "habit_tracker" "inventory_manager")

for app in "${apps[@]}"; do
    echo ""
    echo "📦 Deploying $app..."
    echo "--------------------"
    
    cd "$APPS_DIR/$app"
    
    # Install dependencies if not already installed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies for $app..."
        npm install > /dev/null 2>&1
    fi
    
    # Build the app
    echo "Building $app..."
    npm run build > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful for $app"
        
        # Deploy to Vercel
        echo "Deploying to Vercel..."
        vercel_output=$(vercel --prod --yes 2>&1)
        
        if [ $? -eq 0 ]; then
            # Extract URL from vercel output
            url=$(echo "$vercel_output" | grep -o 'https://[a-zA-Z0-9.-]*\.vercel\.app')
            if [ ! -z "$url" ]; then
                echo "✅ $app deployed: $url"
                urls+=("$app: $url")
            else
                echo "⚠️  $app deployed but URL not found in output"
                urls+=("$app: Deployed (URL not captured)")
            fi
        else
            echo "❌ Deployment failed for $app"
            urls+=("$app: DEPLOYMENT FAILED")
        fi
    else
        echo "❌ Build failed for $app"
        urls+=("$app: BUILD FAILED")
    fi
done

echo ""
echo "🎉 DEPLOYMENT SUMMARY"
echo "===================="
for url in "${urls[@]}"; do
    echo "  $url"
done

echo ""
echo "Deployment complete!"