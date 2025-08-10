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
            enable_ui=False,
            enable_enrichment=True,
            show_claude_output=False,
            debug_mode=False,
        )

        # Generate all apps concurrently
        results = orchestrator.run()

        return results

    except Exception:
        sys.exit(1)


if __name__ == "__main__":
    main()
