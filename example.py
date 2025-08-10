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

    # Initialize the orchestrator with optimal settings
    orchestrator = MultiAppOrchestrator(
        csv_file_path=csv_file,
        output_directory=output_dir,
        enable_enrichment=True,
        debug_mode=True,
    )

    # Generate all apps concurrently
    results = orchestrator.run()

    return results


if __name__ == "__main__":
    main()
