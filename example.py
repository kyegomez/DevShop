#!/usr/bin/env python3
"""
Simple runner script to generate all apps from sample.csv using the MultiAppOrchestrator.

This script demonstrates how to use the existing multi-app generator system
to process all the app specifications in the sample.csv file concurrently.
"""

import sys
from pathlib import Path
from main import MultiAppOrchestrator


def main():
    """
    Run the multi-app generator on sample.csv to create all 10 apps.
    """
    # Configure paths
    csv_file = "sample.csv"
    output_dir = "artifacts"

    # Verify CSV file exists
    if not Path(csv_file).exists():
        sys.exit(1)

    try:
        # Initialize the orchestrator with optimal settings
        orchestrator = MultiAppOrchestrator(
            csv_file_path=csv_file,
            output_directory=output_dir,
            max_concurrent=None,  # Auto-detect optimal worker count
            show_progress=False,  # Disable progress dashboard
            enable_ui=True,
            enable_enrichment=True,
        )

        # Generate all apps concurrently
        results = orchestrator.run()

        return results

    except Exception:
        sys.exit(1)


if __name__ == "__main__":
    main()
