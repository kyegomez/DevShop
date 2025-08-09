#!/usr/bin/env python3
"""
Example script showing how to use the Multi-App Generator with Rich UI.

This script demonstrates both the new Rich console UI and the legacy progress display.
"""

from main import run_multi_app_generation, MultiAppOrchestrator
from loguru import logger
import sys

def demo_with_ui():
    """Demo using the new Rich console UI."""
    print("🎨 Demo: Multi-App Generation with Rich Console UI")
    print("=" * 60)
    
    try:
        # Run with Rich UI enabled
        results = run_multi_app_generation(
            csv_file_path="sample.csv",
            output_directory="artifacts",
            enable_ui=True,
            show_claude_output=True,
        )
        
        print(f"\n🎉 Generation Results:")
        print(f"  Total Apps: {results['total_apps']}")
        print(f"  Successful: {results['successful_apps']}")
        print(f"  Failed: {results['failed_apps']}")
        print(f"  Total Time: {results['total_time_seconds']:.2f}s")
        print(f"  Workers Used: {results['concurrent_workers']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def demo_legacy_mode():
    """Demo using the legacy progress display (no Rich UI)."""
    print("\n📊 Demo: Multi-App Generation with Legacy Progress Display")
    print("=" * 60)
    
    try:
        # Run without Rich UI (legacy mode)
        results = run_multi_app_generation(
            csv_file_path="sample.csv",
            output_directory="artifacts_legacy",
            enable_ui=False,  # Disable Rich UI
            show_claude_output=False,
        )
        
        print(f"\n🎉 Generation Results:")
        print(f"  Total Apps: {results['total_apps']}")
        print(f"  Successful: {results['successful_apps']}")
        print(f"  Failed: {results['failed_apps']}")
        print(f"  Total Time: {results['total_time_seconds']:.2f}s")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def demo_custom_orchestrator():
    """Demo using the orchestrator directly with custom settings."""
    print("\n⚙️ Demo: Custom Orchestrator Configuration")
    print("=" * 60)
    
    try:
        # Create orchestrator with custom settings
        orchestrator = MultiAppOrchestrator(
            csv_file_path="sample.csv",
            output_directory="artifacts_custom",
            max_concurrent=2,  # Limit to 2 concurrent workers
            enable_ui=True,
            show_claude_output=True,
        )
        
        # Run the generation
        results = orchestrator.run()
        
        print(f"\n🎉 Custom Generation Results:")
        print(f"  Total Apps: {results['total_apps']}")
        print(f"  Successful: {results['successful_apps']}")
        print(f"  Failed: {results['failed_apps']}")
        print(f"  Total Time: {results['total_time_seconds']:.2f}s")
        print(f"  Workers Used: {results['concurrent_workers']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Main demo function."""
    print("🚀 Multi-App Generator Demos")
    print("=" * 60)
    print("Choose a demo to run:")
    print("1. Rich Console UI Demo (Recommended)")
    print("2. Legacy Progress Display Demo")
    print("3. Custom Orchestrator Demo")
    print("4. Run UI Test Demo (No Claude SDK)")
    print("0. Exit")
    
    while True:
        try:
            choice = input("\nEnter your choice (0-4): ").strip()
            
            if choice == "0":
                print("👋 Goodbye!")
                break
            elif choice == "1":
                demo_with_ui()
                break
            elif choice == "2":
                demo_legacy_mode()
                break
            elif choice == "3":
                demo_custom_orchestrator()
                break
            elif choice == "4":
                print("🎨 Running UI test demo...")
                import subprocess
                subprocess.run([sys.executable, "demo_ui.py"])
                break
            else:
                print("❌ Invalid choice. Please enter 0-4.")
                
        except KeyboardInterrupt:
            print("\n👋 Demo interrupted. Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            break

if __name__ == "__main__":
    # Configure logging
    logger.add("logs/ui_demo_{time}.log", rotation="1 day")
    
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
