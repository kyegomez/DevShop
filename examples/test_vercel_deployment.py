#!/usr/bin/env python3
"""
Test script for the improved Vercel deployment functionality.
"""

import os
import sys
from main import MultiAppOrchestrator


def test_vercel_setup():
    """Test the Vercel setup verification."""
    print("🧪 Testing Vercel setup verification...")

    # Check if VERCEL_TOKEN is set
    vercel_token = os.getenv("VERCEL_TOKEN")
    if not vercel_token:
        print("❌ VERCEL_TOKEN environment variable not set")
        print("Please set VERCEL_TOKEN before running this test")
        return False

    print(f"✅ VERCEL_TOKEN found: {vercel_token[:10]}...")

    # Create a test orchestrator instance
    orchestrator = MultiAppOrchestrator(
        csv_file_path="examples/sample.csv", output_directory="test_artifacts"
    )

    # Test Vercel setup verification
    try:
        setup_ok = orchestrator._verify_vercel_setup(vercel_token)
        if setup_ok:
            print("✅ Vercel setup verification passed")
            return True
        else:
            print("❌ Vercel setup verification failed")
            return False
    except Exception as e:
        print(f"❌ Error during Vercel setup verification: {e}")
        return False


def test_vercel_config_creation():
    """Test Vercel configuration file creation."""
    print("\n🧪 Testing Vercel configuration creation...")

    orchestrator = MultiAppOrchestrator(
        csv_file_path="examples/sample.csv", output_directory="test_artifacts"
    )

    # Create test directory
    test_dir = "test_vercel_config"
    os.makedirs(test_dir, exist_ok=True)

    original_dir = os.getcwd()
    try:
        os.chdir(test_dir)

        # Test vercel.json creation
        orchestrator._create_vercel_config("test-app")

        if os.path.exists("vercel.json"):
            print("✅ vercel.json created successfully")

            # Verify content
            with open("vercel.json", "r") as f:
                content = f.read()
                if "@vercel/next" in content:
                    print("✅ vercel.json contains correct Next.js configuration")
                else:
                    print("❌ vercel.json missing Next.js configuration")
                    return False
        else:
            print("❌ vercel.json not created")
            return False

        # Test .gitignore creation
        orchestrator._create_gitignore()

        if os.path.exists(".gitignore"):
            print("✅ .gitignore created successfully")
        else:
            print("❌ .gitignore not created")
            return False

        return True

    finally:
        os.chdir(original_dir)
        # Clean up test directory
        import shutil

        if os.path.exists(test_dir):
            shutil.rmtree(test_dir)


def test_package_json_validation():
    """Test package.json validation."""
    print("\n🧪 Testing package.json validation...")

    orchestrator = MultiAppOrchestrator(
        csv_file_path="examples/sample.csv", output_directory="test_artifacts"
    )

    # Create test directory
    test_dir = "test_package_validation"
    os.makedirs(test_dir, exist_ok=True)

    original_dir = os.getcwd()
    try:
        os.chdir(test_dir)

        # Test with missing package.json
        if not orchestrator._validate_package_json():
            print("✅ Correctly rejected missing package.json")
        else:
            print("❌ Should have rejected missing package.json")
            return False

        # Create invalid package.json
        with open("package.json", "w") as f:
            f.write('{"name": "test"}')  # Missing required fields

        if not orchestrator._validate_package_json():
            print("✅ Correctly rejected invalid package.json")
        else:
            print("❌ Should have rejected invalid package.json")
            return False

        # Create valid package.json
        with open("package.json", "w") as f:
            f.write(
                """{
                "name": "test-app",
                "version": "1.0.0",
                "scripts": {
                    "build": "next build",
                    "dev": "next dev"
                }
            }"""
            )

        if orchestrator._validate_package_json():
            print("✅ Correctly accepted valid package.json")
        else:
            print("❌ Should have accepted valid package.json")
            return False

        return True

    finally:
        os.chdir(original_dir)
        # Clean up test directory
        import shutil

        if os.path.exists(test_dir):
            shutil.rmtree(test_dir)


def main():
    """Run all tests."""
    print("🚀 Testing Improved Vercel Deployment Functionality\n")

    tests = [
        ("Vercel Setup Verification", test_vercel_setup),
        ("Vercel Config Creation", test_vercel_config_creation),
        ("Package.json Validation", test_package_json_validation),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"Running: {test_name}")
        print(f"{'='*50}")

        try:
            if test_func():
                print(f"✅ {test_name} PASSED")
                passed += 1
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} ERROR: {e}")

    print(f"\n{'='*50}")
    print(f"Test Results: {passed}/{total} tests passed")
    print(f"{'='*50}")

    if passed == total:
        print(
            "🎉 All tests passed! Vercel deployment improvements are working correctly."
        )
        return 0
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
