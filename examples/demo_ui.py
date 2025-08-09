#!/usr/bin/env python3
"""
Demo script to test the Rich Console UI Dashboard without Claude SDK.

This script simulates the app generation process to test the UI components.
"""

import asyncio
import time
import random
from ui_dashboard import UIManager

async def simulate_app_generation(ui_manager: UIManager, app_name: str):
    """Simulate app generation process for testing UI."""
    
    # Simulate different stages of app generation
    stages = [
        ("Initializing Claude SDK...", 5.0),
        ("Sending prompt to Claude...", 15.0),
        ("Analyzing requirements...", 25.0),
        ("Creating project structure...", 40.0),
        ("Generating application code...", 60.0),
        ("Creating configuration files...", 75.0),
        ("Setting up deployment...", 85.0),
        ("Running final validation...", 95.0),
    ]
    
    # Simulate some variability
    duration = random.uniform(8, 15)  # 8-15 seconds total
    stage_duration = duration / len(stages)
    
    try:
        for i, (task, progress) in enumerate(stages):
            ui_manager.update_app_status(
                app_name, "running", progress, task
            )
            
            # Simulate Claude messages
            if i % 2 == 0:  # Every other stage
                messages = [
                    f"Creating {app_name.lower().replace(' ', '_')}/src/main.py",
                    f"Setting up dependencies for {app_name}",
                    f"Configuring build settings",
                    f"Adding error handling and logging",
                    f"Creating tests for {app_name}",
                ]
                claude_msg = random.choice(messages)
                ui_manager.add_claude_message(app_name, claude_msg)
            
            # Simulate some activity logging
            ui_manager.log_app_activity(app_name, f"Completed: {task}")
            
            await asyncio.sleep(stage_duration)
        
        # Simulate some files being created
        files = [
            "main.py", "requirements.txt", "README.md", 
            "config.json", "Dockerfile", ".gitignore"
        ]
        ui_manager.add_files_created(app_name, files)
        
        # Mark as completed
        ui_manager.update_app_status(
            app_name, "completed", 100.0, 
            f"Successfully generated {len(files)} files"
        )
        
    except Exception as e:
        ui_manager.update_app_status(
            app_name, "error", 0.0, "Generation failed", str(e)
        )

async def demo_ui():
    """Run the UI demo with simulated app generation."""
    
    # Sample app names for testing
    app_names = [
        "Task Manager Pro",
        "Weather Dashboard", 
        "E-commerce Store",
        "Blog Platform",
        "Chat Application"
    ]
    
    print("🎨 Starting Rich Console UI Demo")
    print("   This demo simulates multiple app generations to test the UI")
    print("   Press Ctrl+C to stop the demo\n")
    
    # Initialize UI Manager
    ui_manager = UIManager(show_claude_output=True)
    ui_manager.initialize(app_names)
    ui_manager.start()
    
    try:
        # Start all app generation simulations concurrently
        tasks = []
        for app_name in app_names:
            task = asyncio.create_task(
                simulate_app_generation(ui_manager, app_name)
            )
            tasks.append(task)
        
        # Wait for all simulations to complete
        await asyncio.gather(*tasks)
        
        # Let the UI display for a moment before stopping
        await asyncio.sleep(2)
        
    except KeyboardInterrupt:
        print("\n⚠️ Demo interrupted by user")
    finally:
        ui_manager.stop()
        print("\n✅ Demo completed!")

if __name__ == "__main__":
    try:
        asyncio.run(demo_ui())
    except KeyboardInterrupt:
        print("\n👋 Demo stopped")
