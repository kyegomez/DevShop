#!/usr/bin/env python3
"""
Simple test script for the MultiApp Generator API
"""

import requests
import json
import time
from pathlib import Path

# API base URL
BASE_URL = "http://localhost:8000"


def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()


def test_root():
    """Test root endpoint"""
    print("Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()


def test_csv_validation():
    """Test CSV validation endpoint"""
    print("Testing CSV validation endpoint...")

    # Use the sample CSV file
    csv_file_path = Path("sample.csv")
    if not csv_file_path.exists():
        print("Sample CSV file not found, skipping validation test")
        return

    with open(csv_file_path, "rb") as f:
        files = {"csv_file": ("sample.csv", f, "text/csv")}
        response = requests.post(f"{BASE_URL}/validate-csv", files=files)

    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_generation():
    """Test app generation endpoint"""
    print("Testing app generation endpoint...")

    # Use the sample CSV file
    csv_file_path = Path("sample.csv")
    if not csv_file_path.exists():
        print("Sample CSV file not found, skipping generation test")
        return

    # Test with file upload
    with open(csv_file_path, "rb") as f:
        files = {"csv_file": ("sample.csv", f, "text/csv")}
        data = {
            "output_directory": "test_artifacts",
            "enable_enrichment": True,
            "debug_mode": True,
        }
        response = requests.post(f"{BASE_URL}/generate", files=files, data=data)

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Task ID: {result['task_id']}")
        print(f"Status: {result['status']}")
        print(f"Message: {result['message']}")

        # Wait a bit and check status
        time.sleep(2)
        task_id = result["task_id"]
        status_response = requests.get(f"{BASE_URL}/tasks/{task_id}")
        if status_response.status_code == 200:
            status_data = status_response.json()
            print(f"Task Status: {status_data['status']}")
            print(f"Progress: {len(status_data['progress'])} apps tracked")
    else:
        print(f"Error: {response.text}")
    print()


def test_stats():
    """Test stats endpoint"""
    print("Testing stats endpoint...")
    response = requests.get(f"{BASE_URL}/stats")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_tasks():
    """Test tasks endpoint"""
    print("Testing tasks endpoint...")
    response = requests.get(f"{BASE_URL}/tasks")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def main():
    """Run all tests"""
    print("🚀 Testing MultiApp Generator API")
    print("=" * 50)

    try:
        test_health()
        test_root()
        test_csv_validation()
        test_generation()
        time.sleep(3)  # Wait for generation to progress
        test_stats()
        test_tasks()

        print("✅ All tests completed!")

    except requests.exceptions.ConnectionError:
        print(
            "❌ Could not connect to API. Make sure the server is running on http://localhost:8000"
        )
        print("Run: python api.py")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")


if __name__ == "__main__":
    main()
