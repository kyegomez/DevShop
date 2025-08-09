"""
Multi-App Generator using Claude Code SDK

This module ingests CSV files containing app specifications and generates
multiple applications using Claude's code generation capabilities.
"""

import asyncio
import concurrent.futures
import json
import pandas as pd
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Optional, Any
import logging
from datetime import datetime
import multiprocessing
import threading
import os

def get_optimal_worker_count() -> int:
    """
    Calculate the optimal number of worker threads for concurrent app generation.

    Uses 95% of available CPU cores for optimal performance, similar to the
    swarms ConcurrentWorkflow pattern.

    Returns:
        int: Optimal number of worker threads
    """
    try:
        cpu_count = os.cpu_count()
        # Use 95% of CPU cores for optimal performance without overwhelming the system
        optimal_workers = max(1, int(cpu_count * 0.95))
        return optimal_workers
    except Exception:
        # Fallback to a reasonable default
        return 4


@dataclass
class AppSpecification:
    """
    Data class representing an application specification from CSV.
    """

    name: str
    description: str
    app_goal: str
    target_user: str
    main_problem: str
    design_preferences: str
    additional_requirements: Optional[str] = None
    tech_stack: Optional[str] = None
    complexity_level: Optional[str] = "medium"

    def __post_init__(self):
        """Validate and clean the specification data."""
        if not self.name or not self.description:
            raise ValueError("App name and description are required")

        # Clean up string fields
        self.name = self.name.strip()
        self.description = self.description.strip()
        self.app_goal = self.app_goal.strip()
        self.target_user = self.target_user.strip()
        self.main_problem = self.main_problem.strip()
        self.design_preferences = self.design_preferences.strip()


class CSVAppIngester:
    """
    Handles ingestion and validation of app specifications from CSV files.
    """

    def __init__(self, csv_file_path: str):
        """
        Initialize the CSV ingester.

        Args:
            csv_file_path: Path to the CSV file containing app specifications
        """
        self.csv_file_path = Path(csv_file_path)
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        """Set up logging for the ingester."""
        logger = logging.getLogger(f"{__name__}.CSVAppIngester")
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def validate_csv_structure(self, df: pd.DataFrame) -> bool:
        """
        Validate that the CSV has required columns.

        Args:
            df: Pandas DataFrame from CSV

        Returns:
            bool: True if valid structure, False otherwise
        """
        required_columns = {
            "name",
            "description",
            "app_goal",
            "target_user",
            "main_problem",
            "design_preferences",
        }

        csv_columns = set(df.columns.str.lower().str.strip())
        missing_columns = required_columns - csv_columns

        if missing_columns:
            self.logger.error(f"Missing required columns: {missing_columns}")
            return False

        return True

    def read_app_specifications(self) -> List[AppSpecification]:
        """
        Read and parse app specifications from CSV file.

        Returns:
            List[AppSpecification]: List of validated app specifications
        """
        if not self.csv_file_path.exists():
            raise FileNotFoundError(f"CSV file not found: {self.csv_file_path}")

        try:
            # Read CSV with pandas for better handling
            df = pd.read_csv(self.csv_file_path)

            if df.empty:
                raise ValueError("CSV file is empty")

            # Normalize column names
            df.columns = df.columns.str.lower().str.strip()

            if not self.validate_csv_structure(df):
                raise ValueError("Invalid CSV structure")

            specifications = []

            for index, row in df.iterrows():
                try:
                    spec = AppSpecification(
                        name=str(row["name"]),
                        description=str(row["description"]),
                        app_goal=str(row["app_goal"]),
                        target_user=str(row["target_user"]),
                        main_problem=str(row["main_problem"]),
                        design_preferences=str(row["design_preferences"]),
                        additional_requirements=str(
                            row.get("additional_requirements", "")
                        ),
                        tech_stack=str(row.get("tech_stack", "Python/React")),
                        complexity_level=str(row.get("complexity_level", "medium")),
                    )
                    specifications.append(spec)
                    self.logger.info(f"Successfully parsed app: {spec.name}")

                except Exception as e:
                    self.logger.error(f"Error parsing row {index}: {e}")
                    continue

            self.logger.info(
                f"Successfully parsed {len(specifications)} app specifications"
            )
            return specifications

        except Exception as e:
            self.logger.error(f"Error reading CSV file: {e}")
            raise


class ClaudeAppGenerator:
    """
    Generates applications using Claude Code SDK based on specifications.
    """

    def __init__(self, output_directory: str = "generated_apps"):
        """
        Initialize the app generator.

        Args:
            output_directory: Directory where generated apps will be stored
        """
        self.output_directory = Path(output_directory)
        self.output_directory.mkdir(exist_ok=True)
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        """Set up logging for the generator."""
        logger = logging.getLogger(f"{__name__}.ClaudeAppGenerator")
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def _create_system_prompt(self, spec: AppSpecification) -> str:
        """
        Create a detailed system prompt for Claude based on app specification.

        Args:
            spec: App specification

        Returns:
            str: System prompt for Claude
        """
        return f"""You are an expert software developer and architect. You will create a complete, production-ready application based on the following specification:

**Application Name:** {spec.name}
**Description:** {spec.description}
**Goal:** {spec.app_goal}
**Target User:** {spec.target_user}
**Main Problem Solved:** {spec.main_problem}
**Design Preferences:** {spec.design_preferences}
**Tech Stack:** {spec.tech_stack}
**Complexity Level:** {spec.complexity_level}
**Additional Requirements:** {spec.additional_requirements}

Create a complete application that includes:
1. Proper project structure with all necessary files
2. Clean, well-documented code following best practices
3. User interface that matches the design preferences
4. Error handling and input validation
5. README with setup and usage instructions
6. Configuration files (requirements.txt, package.json, etc.)
7. Basic tests if applicable

Focus on creating a functional, user-friendly application that directly addresses the main problem for the target user. Make sure the code is production-ready and follows modern development practices.

Include proper documentation with docstrings for all functions and classes. Ensure the application can be run immediately after setup.
"""

    def _create_generation_prompt(self, spec: AppSpecification) -> str:
        """
        Create the main generation prompt for Claude.

        Args:
            spec: App specification

        Returns:
            str: Generation prompt
        """
        return f"""Please create the complete application "{spec.name}" based on the specification provided in your system prompt. 

Create all necessary files including:
- Main application code
- Configuration files
- README with setup instructions
- Any required assets or templates
- Basic tests if applicable

Make sure the application is immediately runnable after following the setup instructions in the README.

Start by creating the project structure, then implement all the core functionality. Ensure the code is clean, well-documented, and follows best practices for {spec.tech_stack}.
"""

    async def generate_app_mock(self, spec: AppSpecification) -> Dict[str, Any]:
        """
        Mock implementation of app generation (replace with actual Claude SDK calls).

        Args:
            spec: App specification

        Returns:
            Dict containing generation results
        """
        self.logger.info(f"Starting generation for app: {spec.name}")

        # Create app directory
        app_dir = self.output_directory / spec.name.lower().replace(" ", "_")
        app_dir.mkdir(exist_ok=True)

        # Mock generation - in real implementation, this would use Claude SDK
        await asyncio.sleep(2)  # Simulate generation time

        # Create basic files
        readme_content = f"""# {spec.name}

## Description
{spec.description}

## Goal
{spec.app_goal}

## Target User
{spec.target_user}

## Problem Solved
{spec.main_problem}

## Design Preferences
{spec.design_preferences}

## Tech Stack
{spec.tech_stack}

## Setup Instructions
1. Navigate to the project directory
2. Install dependencies
3. Run the application

## Usage
[Usage instructions would be generated by Claude]

Generated on: {datetime.now().isoformat()}
"""

        # Write README
        (app_dir / "README.md").write_text(readme_content)

        # Create a basic Python app structure
        if "python" in spec.tech_stack.lower():
            main_py_content = f'''"""
{spec.name} - {spec.description}

This application addresses: {spec.main_problem}
Target users: {spec.target_user}
"""

def main():
    """
    Main entry point for {spec.name}.
    
    This function would contain the core application logic
    generated by Claude based on the specifications.
    """
    print(f"Welcome to {spec.name}!")
    print(f"Description: {spec.description}")
    print(f"This app helps: {spec.target_user}")
    print(f"By solving: {spec.main_problem}")

if __name__ == "__main__":
    main()
'''
            (app_dir / "main.py").write_text(main_py_content)

            # Create requirements.txt
            requirements_content = """# Requirements for this application would be generated by Claude
# Based on the actual functionality implemented
"""
            (app_dir / "requirements.txt").write_text(requirements_content)

        self.logger.info(f"Successfully generated app: {spec.name}")

        return {
            "success": True,
            "app_name": spec.name,
            "output_directory": str(app_dir),
            "files_created": list(app_dir.glob("*")),
            "generation_time": datetime.now().isoformat(),
        }

    async def generate_app_with_claude(self, spec: AppSpecification) -> Dict[str, Any]:
        """
        Generate app using actual Claude Code SDK.

        Args:
            spec: App specification

        Returns:
            Dict containing generation results
        """
        try:
            from claude_code_sdk import ClaudeSDKClient, ClaudeCodeOptions
            
            system_prompt = self._create_system_prompt(spec)
            generation_prompt = self._create_generation_prompt(spec)
            
            async with ClaudeSDKClient(
                options=ClaudeCodeOptions(
                    system_prompt=system_prompt,
                    max_turns=10,
                    allowed_tools=["Read", "Write", "Bash", "Grep"]
                )
            ) as client:
                
                # Set working directory to app folder
                app_dir = self.output_directory / spec.name.lower().replace(' ', '_')
                app_dir.mkdir(exist_ok=True)
                
                # Generate the application
                await client.query(generation_prompt)
                
                response_text = []
                async for message in client.receive_response():
                    if hasattr(message, 'content'):
                        for block in message.content:
                            if hasattr(block, 'text'):
                                response_text.append(block.text)
                
                return {
                    "success": True,
                    "app_name": spec.name,
                    "output_directory": str(app_dir),
                    "response": ''.join(response_text),
                    "generation_time": datetime.now().isoformat()
                }
                
        except ImportError:
            self.logger.error("Claude Code SDK not installed. Using mock implementation.")
            return await self.generate_app_mock(spec)
        except Exception as e:
            self.logger.error(f"Error generating app {spec.name}: {e}")
            return {
                "success": False,
                "app_name": spec.name,
                "error": str(e),
                "generation_time": datetime.now().isoformat()
            }

    def generate_app_sync(self, spec: AppSpecification) -> Dict[str, Any]:
        """
        Synchronous wrapper for app generation to work with ThreadPoolExecutor.

        Args:
            spec: App specification

        Returns:
            Dict containing generation results
        """
        return asyncio.run(self.generate_app_with_claude(spec))


class MultiAppOrchestrator:
    """
    Orchestrates the concurrent generation of multiple applications from CSV specifications.

    Uses ThreadPoolExecutor to generate all apps in parallel, with optimal worker count
    based on available CPU cores for maximum performance.
    """

    def __init__(
        self,
        csv_file_path: str,
        output_directory: str = "generated_apps",
        max_concurrent: Optional[int] = None,
        show_progress: bool = True,
    ):
        """
        Initialize the orchestrator.

        Args:
            csv_file_path: Path to CSV file with app specifications
            output_directory: Directory for generated apps
            max_concurrent: Maximum number of concurrent app generations.
                          If None, uses optimal count based on CPU cores
            show_progress: Whether to show real-time progress dashboard
        """
        self.csv_file_path = csv_file_path
        self.output_directory = output_directory
        # Auto-calculate optimal worker count if not specified
        self.max_concurrent = (
            max_concurrent if max_concurrent is not None else get_optimal_worker_count()
        )
        self.show_progress = show_progress
        self.logger = self._setup_logger()

        # Track app generation status for progress monitoring
        self.app_statuses = {}
        self.status_lock = threading.Lock()

        self.ingester = CSVAppIngester(csv_file_path)
        self.generator = ClaudeAppGenerator(output_directory)

        self.logger.info(
            f"Initialized with {self.max_concurrent} concurrent workers (CPU cores: {multiprocessing.cpu_count()})"
        )

    def _setup_logger(self) -> logging.Logger:
        """Set up logging for the orchestrator."""
        logger = logging.getLogger(f"{__name__}.MultiAppOrchestrator")
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def update_app_status(self, app_name: str, status: str, output: str = ""):
        """
        Thread-safe update of app generation status.

        Args:
            app_name: Name of the app being generated
            status: Current status (pending, running, completed, error)
            output: Output or error message
        """
        with self.status_lock:
            self.app_statuses[app_name] = {
                "status": status,
                "output": output,
                "timestamp": datetime.now().isoformat(),
            }

    def display_progress_dashboard(self, title: str = "🚀 App Generation Progress"):
        """
        Display real-time progress dashboard showing status of all apps.

        Args:
            title: Dashboard title
        """
        if not self.show_progress:
            return

        print(f"\n{title}")
        print("=" * 80)

        with self.status_lock:
            for app_name, status_info in self.app_statuses.items():
                status = status_info["status"]
                timestamp = status_info["timestamp"]

                # Status emoji mapping
                status_emoji = {
                    "pending": "⏳",
                    "running": "🔄",
                    "completed": "✅",
                    "error": "❌",
                }

                emoji = status_emoji.get(status, "❓")
                print(f"{emoji} {app_name:<30} {status:<12} {timestamp}")

                # Show output preview for completed/error states
                if status in ["completed", "error"] and status_info["output"]:
                    output_preview = status_info["output"][:100]
                    if len(status_info["output"]) > 100:
                        output_preview += "..."
                    print(f"   └─ {output_preview}")

        print()

    def generate_single_app_concurrent(self, spec: AppSpecification) -> Dict[str, Any]:
        """
        Generate a single app with status tracking for concurrent execution.

        This method is designed to work with ThreadPoolExecutor and includes
        thread-safe status updates and progress tracking.

        Args:
            spec: App specification

        Returns:
            Dict containing generation results
        """
        app_name = spec.name

        try:
            # Update status to running
            self.update_app_status(app_name, "running", "Starting generation...")
            if self.show_progress:
                self.display_progress_dashboard()

            # Generate the app (this calls the sync wrapper)
            result = self.generator.generate_app_sync(spec)

            if result.get("success", False):
                self.update_app_status(
                    app_name, "completed", f"Generated in {result['output_directory']}"
                )
                self.logger.info(f"✅ Successfully generated: {app_name}")
            else:
                error_msg = result.get("error", "Unknown error")
                self.update_app_status(app_name, "error", error_msg)
                self.logger.error(f"❌ Failed to generate {app_name}: {error_msg}")

            if self.show_progress:
                self.display_progress_dashboard()

            return result

        except Exception as e:
            error_msg = str(e)
            self.update_app_status(app_name, "error", error_msg)
            self.logger.error(f"❌ Exception generating {app_name}: {error_msg}")

            if self.show_progress:
                self.display_progress_dashboard()

            return {
                "success": False,
                "app_name": app_name,
                "error": error_msg,
                "generation_time": datetime.now().isoformat(),
            }

    async def _generate_single_app(
        self, spec: AppSpecification, semaphore: asyncio.Semaphore
    ) -> Dict[str, Any]:
        """
        Generate a single app with concurrency control.

        Args:
            spec: App specification
            semaphore: Asyncio semaphore for concurrency control

        Returns:
            Dict containing generation results
        """
        async with semaphore:
            try:
                result = await self.generator.generate_app_with_claude(spec)
                return result
            except Exception as e:
                self.logger.error(f"Failed to generate app {spec.name}: {e}")
                return {
                    "success": False,
                    "app_name": spec.name,
                    "error": str(e),
                    "generation_time": datetime.now().isoformat(),
                }

    def generate_all_apps(self) -> Dict[str, Any]:
        """
        Generate all applications from the CSV file using true concurrent execution.

        Uses ThreadPoolExecutor to generate all apps in parallel, with optimal
        worker count based on CPU cores for maximum performance.

        Returns:
            Dict containing overall results and individual app results
        """
        start_time = datetime.now()
        self.logger.info(
            f"🚀 Starting concurrent multi-app generation from {self.csv_file_path}"
        )
        self.logger.info(
            f"💻 Using {self.max_concurrent} concurrent workers (CPU cores: {multiprocessing.cpu_count()})"
        )

        try:
            # Read app specifications
            specifications = self.ingester.read_app_specifications()

            if not specifications:
                raise ValueError("No valid app specifications found in CSV")

            self.logger.info(
                f"📊 Found {len(specifications)} app specifications to generate"
            )

            # Initialize status tracking for all apps
            for spec in specifications:
                self.update_app_status(spec.name, "pending", "Queued for generation")

            # Show initial dashboard
            if self.show_progress:
                self.display_progress_dashboard(
                    "🚀 Initializing Concurrent App Generation"
                )

            # Generate ALL apps concurrently using ThreadPoolExecutor
            with concurrent.futures.ThreadPoolExecutor(
                max_workers=self.max_concurrent
            ) as executor:
                # Submit all app generation tasks simultaneously
                future_to_spec = {
                    executor.submit(self.generate_single_app_concurrent, spec): spec
                    for spec in specifications
                }

                self.logger.info(
                    f"🔄 Submitted {len(future_to_spec)} apps for concurrent generation"
                )

                # Collect results as they complete
                successful_apps = []
                failed_apps = []

                # Use as_completed to process results as they finish
                for future in concurrent.futures.as_completed(future_to_spec):
                    spec = future_to_spec[future]
                    try:
                        result = future.result()
                        if result.get("success", False):
                            successful_apps.append(result)
                        else:
                            failed_apps.append(result)
                    except Exception as e:
                        error_result = {
                            "success": False,
                            "app_name": spec.name,
                            "error": str(e),
                            "generation_time": datetime.now().isoformat(),
                        }
                        failed_apps.append(error_result)
                        self.logger.error(
                            f"❌ Exception in future for {spec.name}: {e}"
                        )

            end_time = datetime.now()
            total_time = (end_time - start_time).total_seconds()

            # Display final results
            if self.show_progress:
                self.display_progress_dashboard("🎉 Final Generation Results")

            summary = {
                "total_apps": len(specifications),
                "successful_apps": len(successful_apps),
                "failed_apps": len(failed_apps),
                "total_time_seconds": total_time,
                "concurrent_workers": self.max_concurrent,
                "cpu_cores": multiprocessing.cpu_count(),
                "output_directory": self.output_directory,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "results": {"successful": successful_apps, "failed": failed_apps},
            }

            self.logger.info(
                f"🎉 Concurrent generation complete: {len(successful_apps)}/{len(specifications)} apps successful"
            )
            self.logger.info(
                f"⚡ Total time: {total_time:.2f} seconds with {self.max_concurrent} workers"
            )
            self.logger.info(
                f"📈 Average time per app: {total_time/len(specifications):.2f} seconds"
            )

            return summary

        except Exception as e:
            self.logger.error(f"❌ Error in concurrent multi-app generation: {e}")
            raise


