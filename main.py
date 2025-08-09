"""
Multi-App Generator using Claude Code SDK

This module ingests CSV files containing app specifications and generates
multiple applications using Claude's code generation capabilities.
"""

import asyncio
import concurrent.futures
import multiprocessing
import os
import threading
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from claude_code_sdk import ClaudeCodeOptions, ClaudeSDKClient
from loguru import logger
from swarms import Agent

from examples.ui_dashboard import UIManager



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
    enriched_spec: Optional[str] = None

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
            logger.error(f"Missing required columns: {missing_columns}")
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
                    logger.info(f"Successfully parsed app: {spec.name}")

                except Exception as e:
                    logger.error(f"Error parsing row {index}: {e}")
                    continue

            logger.info(f"Successfully parsed {len(specifications)} app specifications")
            return specifications

        except Exception as e:
            logger.error(f"Error reading CSV file: {e}")
            raise


class ClaudeAppGenerator:
    """
    Generates applications using Claude Code SDK based on specifications.
    """

    def __init__(
        self,
        output_directory: str = "artifacts",
        retries: int = 3,
        retry_delay: float = 2.0,
        ui_manager: Optional[UIManager] = None,
        enable_enrichment: bool = False,
    ):
        """
        Initialize the app generator.

        Args:
            output_directory: Directory where generated apps will be stored
            ui_manager: Optional UI manager for real-time updates
            enable_enrichment: Whether to use product_spec_enricher for enhanced prompts
        """
        self.retries = retries
        self.retry_delay = retry_delay
        self.output_directory = Path(output_directory)
        self.output_directory.mkdir(exist_ok=True)
        self.ui_manager = ui_manager
        self.enable_enrichment = enable_enrichment

    def _create_system_prompt(self, spec: AppSpecification) -> str:
        """
        Create a detailed system prompt for Claude based on app specification.

        Args:
            spec: App specification

        Returns:
            str: System prompt for Claude
        """
        # Use enriched specification if available, otherwise use original spec
        base_spec_section = f"""**APPLICATION SPECIFICATION:**
- **Name:** {spec.name}
- **Description:** {spec.description}
- **Primary Goal:** {spec.app_goal}
- **Target Users:** {spec.target_user}
- **Core Problem:** {spec.main_problem}
- **Design Preferences:** {spec.design_preferences}
- **Technology Stack:** {spec.tech_stack}
- **Complexity Level:** {spec.complexity_level}
- **Additional Requirements:** {spec.additional_requirements}"""
        
        enriched_section = ""
        if spec.enriched_spec:
            enriched_section = f"""

**ENHANCED PRODUCT SPECIFICATION:**
{spec.enriched_spec}

**IMPORTANT:** Use the enhanced product specification above as your primary guide. It provides detailed requirements, features, and technical specifications that should drive your implementation decisions."""
        
        return f"""You are an expert software developer and architect specializing in creating production-ready applications. You will build a complete, functional application based on the following specification.

{base_spec_section}{enriched_section}

**DEVELOPMENT GUIDELINES:**

1. **File Organization:** Create a well-structured project with clear separation of concerns
2. **Code Quality:** Write clean, maintainable code with comprehensive error handling
3. **Documentation:** Include detailed README, inline comments, and docstrings
4. **Production Readiness:** Implement proper logging, configuration management, and deployment considerations
5. **User Experience:** Create intuitive interfaces that solve the target user's specific problems
6. **Testing:** Include basic unit tests and validation where appropriate
7. **Dependencies:** Use modern, stable packages with clear version requirements

**DELIVERABLES REQUIRED:**
- Complete application source code
- README.md with setup and usage instructions
- requirements.txt (Python) or package.json (Node.js) with all dependencies
- Configuration files and environment setup
- Basic tests or validation scripts
- Documentation for deployment and maintenance
- GitHub repository setup with proper structure
- Vercel deployment configuration and automation

**DEPLOYMENT REQUIREMENTS:**
- Create a new GitHub repository for the application using the GitHub API
- Set up proper repository structure with .gitignore, LICENSE, and documentation
- Configure Vercel deployment through their API for automatic deployments
- Include vercel.json configuration file for deployment settings
- Set up environment variables and secrets management for production
- Implement CI/CD pipeline for automated testing and deployment
- Include deployment scripts and automation tools

**TECHNICAL STANDARDS:**
- Follow language-specific best practices and conventions
- Implement comprehensive error handling and input validation
- Use appropriate design patterns for the chosen technology stack
- Ensure code is immediately runnable after following setup instructions
- Include proper logging and monitoring capabilities
- Consider security best practices relevant to the application type
- Implement proper environment configuration for development and production
- Set up automated deployment workflows

Create a professional-grade application that directly addresses the specified problem for the target users. The application should be ready for real-world deployment and use with full GitHub integration and Vercel hosting.
"""

    def _create_generation_prompt(self, spec: AppSpecification) -> str:
        """
        Create the main generation prompt for Claude.

        Args:
            spec: App specification

        Returns:
            str: Generation prompt
        """
        # Add reference to enriched spec if available
        enrichment_reference = ""
        if spec.enriched_spec:
            enrichment_reference = " Pay special attention to the enhanced product specification provided in your system prompt, which contains detailed requirements and feature specifications."
            
        return f"""Build the complete "{spec.name}" application based on the detailed specification in your system prompt.{enrichment_reference}

**IMPLEMENTATION REQUIREMENTS:**

1. **Project Structure:** Create a professional directory structure with proper organization
2. **Core Implementation:** Build all functionality to fully address the specified problem
3. **Documentation:** Write comprehensive README.md with clear setup and usage instructions
4. **Dependencies:** Create proper dependency files (requirements.txt, package.json, etc.)
5. **Configuration:** Include any necessary config files and environment setup
6. **Error Handling:** Implement robust error handling throughout the application
7. **User Interface:** Create an intuitive interface that matches the design preferences
8. **Testing:** Add basic validation or test files where appropriate

**DEPLOYMENT AND HOSTING REQUIREMENTS:**

1. **GitHub Repository Setup:**
   - Create a new GitHub repository using the GitHub API
   - Initialize with proper .gitignore, LICENSE, and README.md
   - Set up repository structure with appropriate branches
   - Configure repository settings and permissions
   - Add repository topics and description

2. **Vercel Deployment Configuration:**
   - Create vercel.json configuration file for deployment settings
   - Set up Vercel project through their API
   - Configure build commands and output directory
   - Set up environment variables for production
   - Enable automatic deployments from GitHub

3. **CI/CD Pipeline:**
   - Create GitHub Actions workflows for automated testing
   - Set up deployment automation to Vercel
   - Include build and test scripts
   - Configure deployment previews for pull requests

4. **Production Setup:**
   - Include deployment scripts and configuration
   - Set up monitoring and error tracking
   - Configure custom domain (if applicable)
   - Implement security headers and best practices

**TECHNICAL SPECIFICATIONS:**
- Technology Stack: {spec.tech_stack}
- Complexity Level: {spec.complexity_level}
- Target Users: {spec.target_user}

**SUCCESS CRITERIA:**
- Application runs immediately after following README setup instructions
- Fully addresses the core problem: {spec.main_problem}
- Follows modern development best practices
- Includes proper error handling and user feedback
- Code is clean, well-commented, and maintainable
- Successfully deployed to Vercel with custom domain
- GitHub repository is properly configured with automated workflows

**DEPLOYMENT WORKFLOW:**
1. Create and configure GitHub repository
2. Set up Vercel project and link to repository
3. Configure environment variables and build settings
4. Deploy application and verify functionality
5. Set up monitoring and analytics
6. Document deployment process and maintenance procedures

Start by creating the project structure, then implement the core functionality systematically. After completing the application, set up GitHub repository and Vercel deployment with full automation. Ensure every file serves a clear purpose and the application is production-ready with live deployment.
"""

    async def generate_app_with_claude(self, spec: AppSpecification) -> Dict[str, Any]:
        """
        Generate app using Claude Code SDK with robust error handling and retry logic.

        Args:
            spec: App specification

        Returns:
            Dict containing generation results
        """
        max_retries = self.retries

        # Enrich specification if enabled
        if self.enable_enrichment and not spec.enriched_spec:
            if self.ui_manager:
                self.ui_manager.update_app_status(
                    spec.name, "running", 5.0, "Enriching product specification..."
                )
            try:
                logger.info(f"Enriching specification for app: {spec.name}")
                spec.enriched_spec = product_spec_enricher(spec)
                if self.ui_manager:
                    self.ui_manager.log_app_activity(spec.name, "Product specification enriched")
                    self.ui_manager.update_app_status(
                        spec.name, "running", 8.0, "Specification enriched, initializing Claude SDK..."
                    )
                logger.info(f"Successfully enriched specification for app: {spec.name}")
            except Exception as e:
                logger.warning(f"Failed to enrich specification for {spec.name}: {e}")
                if self.ui_manager:
                    self.ui_manager.log_app_activity(spec.name, f"Enrichment failed: {e}")
                    self.ui_manager.update_app_status(
                        spec.name, "running", 8.0, "Enrichment failed, proceeding with original spec..."
                    )

        # Update UI that generation is starting
        if self.ui_manager:
            self.ui_manager.update_app_status(
                spec.name, "running", 10.0, "Initializing Claude SDK..."
            )

        for attempt in range(max_retries):
            try:
                system_prompt = self._create_system_prompt(spec)
                generation_prompt = self._create_generation_prompt(spec)

                # Create app directory
                app_dir = self.output_directory / spec.name.lower().replace(" ", "_")
                app_dir.mkdir(exist_ok=True)

                logger.info(
                    f"Starting generation for app: {spec.name} (attempt {attempt + 1}/{max_retries})"
                )

                if self.ui_manager:
                    self.ui_manager.update_app_status(
                        spec.name, "running", 15.0, f"Starting generation (attempt {attempt + 1})"
                    )

                async with ClaudeSDKClient(
                    options=ClaudeCodeOptions(
                        system_prompt=system_prompt,
                        max_turns=20,  # Increased for GitHub/Vercel setup
                        allowed_tools=["Read", "Write", "Bash", "Grep", "WebSearch"],
                        continue_conversation=False,  # Start fresh each time
                    )
                ) as client:

                    if self.ui_manager:
                        self.ui_manager.update_app_status(
                            spec.name, "running", 25.0, "Connected to Claude, sending prompt..."
                        )

                    # Generate the application with detailed progress tracking
                    await client.query(generation_prompt)

                    response_text = []
                    message_count = 0
                    progress_increment = 60.0 / 20  # 60% for message processing, divided by max_turns

                    if self.ui_manager:
                        self.ui_manager.update_app_status(
                            spec.name, "running", 35.0, "Processing Claude responses..."
                        )

                    async for message in client.receive_response():
                        message_count += 1
                        current_progress = min(35.0 + (message_count * progress_increment), 90.0)
                        
                        if hasattr(message, "content"):
                            for block in message.content:
                                if hasattr(block, "text"):
                                    text_content = block.text
                                    response_text.append(text_content)
                                    
                                    # Send Claude message to UI (truncated for display)
                                    if self.ui_manager:
                                        self.ui_manager.add_claude_message(spec.name, text_content)
                                        self.ui_manager.update_app_status(
                                            spec.name, "running", current_progress, 
                                            f"Processing message {message_count}/20"
                                        )
                                        
                        elif type(message).__name__ == "ResultMessage":
                            logger.info(f"App {spec.name}: Received result message")
                            result_text = str(message.result)
                            response_text.append(result_text)
                            
                            if self.ui_manager:
                                self.ui_manager.add_claude_message(spec.name, f"Result: {result_text}")
                                self.ui_manager.log_app_activity(spec.name, "Received result message from Claude")

                    if self.ui_manager:
                        self.ui_manager.update_app_status(
                            spec.name, "running", 95.0, "Validating generated files..."
                        )

                    # Validate that files were actually created
                    created_files = list(app_dir.glob("**/*"))
                    if not created_files:
                        raise ValueError("No files were generated by Claude")

                    # Update UI with files created
                    if self.ui_manager:
                        file_names = [f.name for f in created_files if f.is_file()]
                        self.ui_manager.add_files_created(spec.name, file_names)
                        self.ui_manager.update_app_status(
                            spec.name, "completed", 100.0, f"Generated {len(created_files)} files successfully"
                        )

                    logger.info(
                        f"Successfully generated app: {spec.name} with {len(created_files)} files"
                    )

                    return {
                        "success": True,
                        "app_name": spec.name,
                        "output_directory": str(app_dir),
                        "response": "".join(response_text),
                        "files_created": [str(f) for f in created_files],
                        "message_count": message_count,
                        "generation_time": datetime.now().isoformat(),
                        "attempt": attempt + 1,
                    }

            except Exception as e:
                import traceback

                error_msg = str(e)
                tb_str = traceback.format_exc()
                logger.warning(
                    f"Attempt {attempt + 1}/{max_retries} failed for {spec.name}: {error_msg}\nTraceback:\n{tb_str}"
                )
                
                if self.ui_manager:
                    self.ui_manager.update_app_status(
                        spec.name, "error" if attempt == max_retries - 1 else "running", 
                        0.0, f"Attempt {attempt + 1} failed", error_msg
                    )
                    
                # If not the last attempt, add retry delay
                if attempt < max_retries - 1:
                    if self.ui_manager:
                        self.ui_manager.update_app_status(
                            spec.name, "running", 0.0, 
                            f"Retrying in {self.retry_delay}s... (attempt {attempt + 2}/{max_retries})"
                        )
                    await asyncio.sleep(self.retry_delay)
                    
        # If we get here, all retries failed
        if self.ui_manager:
            self.ui_manager.update_app_status(
                spec.name, "error", 0.0, "All retry attempts failed", 
                f"Failed after {max_retries} attempts"
            )
            
        return {
            "success": False,
            "app_name": spec.name,
            "error": f"Failed after {max_retries} attempts",
            "generation_time": datetime.now().isoformat(),
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



def product_spec_enricher(spec: AppSpecification) -> str:
    """
    Transform app configuration into a concise, actionable product specification.
    """
    agent = Agent(
        agent_name="Product-Specification-Agent",
        agent_description="Expert product manager and spec writer",
        system_prompt=(
            "You are an expert product manager. Given a basic app idea, "
            "write a clear, actionable product spec for developers. "
            "Be concise, practical, and cover key requirements, users, features, "
            "tech stack, and success criteria."
        ),
        model_name="claude-sonnet-4-20250514",
        dynamic_temperature_enabled=True,
        output_type="str-all-except-first",
        max_loops=1,
    )

    enrichment_prompt = (
        f"Given this app idea:\n"
        f"- Name: {spec.name}\n"
        f"- Description: {spec.description}\n"
        f"- Goal: {spec.app_goal}\n"
        f"- Target User: {spec.target_user}\n"
        f"- Main Problem: {spec.main_problem}\n"
        f"- Design Preferences: {spec.design_preferences}\n"
        f"- Tech Stack: {spec.tech_stack}\n"
        f"- Complexity: {spec.complexity_level}\n"
        f"- Additional: {spec.additional_requirements}\n\n"
        "Write a compact product specification including:\n"
        "1. Executive summary (value, users, KPIs)\n"
        "2. Key features (bulleted)\n"
        "3. User flows or main use cases\n"
        "4. Technical requirements (stack, APIs, data)\n"
        "5. Success criteria\n"
        "Keep it clear and actionable for a dev team."
    )

    enriched_spec = agent.run(task=enrichment_prompt)
    return enriched_spec

class MultiAppOrchestrator:
    """
    Orchestrates the concurrent generation of multiple applications from CSV specifications.

    Uses ThreadPoolExecutor to generate all apps in parallel, with optimal worker count
    based on available CPU cores for maximum performance.
    """

    def __init__(
        self,
        csv_file_path: str,
        output_directory: str = "artifacts",
        max_concurrent: Optional[int] = None,
        show_progress: bool = True,
        enable_ui: bool = True,
        show_claude_output: bool = True,
        enable_enrichment: bool = False,
    ):
        """
        Initialize the orchestrator.

        Args:
            csv_file_path: Path to CSV file with app specifications
            output_directory: Directory for generated apps
            max_concurrent: Maximum number of concurrent app generations.
                          If None, uses optimal count based on CPU cores
            show_progress: Whether to show real-time progress dashboard
            enable_ui: Whether to enable the Rich console UI
            show_claude_output: Whether to show Claude agent outputs in UI
            enable_enrichment: Whether to enable product specification enrichment
        """
        self.csv_file_path = csv_file_path
        self.output_directory = output_directory
        # Auto-calculate optimal worker count if not specified
        self.max_concurrent = (
            max_concurrent if max_concurrent is not None else get_optimal_worker_count()
        )
        self.show_progress = show_progress
        self.enable_ui = enable_ui
        self.enable_enrichment = enable_enrichment
        
        # Initialize UI Manager
        self.ui_manager = UIManager(show_claude_output=show_claude_output) if enable_ui else None
        
        # Track app generation status for progress monitoring (legacy)
        self.app_statuses = {}
        self.status_lock = threading.Lock()

        self.ingester = CSVAppIngester(csv_file_path)
        self.generator = ClaudeAppGenerator(
            output_directory, 
            ui_manager=self.ui_manager,
            enable_enrichment=enable_enrichment
        )

        logger.info(
            f"Initialized with {self.max_concurrent} concurrent workers (CPU cores: {multiprocessing.cpu_count()})"
        )
        if enable_ui:
            logger.info("Rich console UI enabled for real-time monitoring")

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
                logger.info(f"✅ Successfully generated: {app_name}")
            else:
                error_msg = result.get("error", "Unknown error")
                self.update_app_status(app_name, "error", error_msg)
                logger.error(f"❌ Failed to generate {app_name}: {error_msg}")

            if self.show_progress:
                self.display_progress_dashboard()

            return result

        except Exception as e:
            error_msg = str(e)
            self.update_app_status(app_name, "error", error_msg)
            logger.error(f"❌ Exception generating {app_name}: {error_msg}")

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
                logger.error(f"Failed to generate app {spec.name}: {e}")
                return {
                    "success": False,
                    "app_name": spec.name,
                    "error": str(e),
                    "generation_time": datetime.now().isoformat(),
                }

    def run(self) -> Dict[str, Any]:
        """
        Generate all applications from the CSV file using true concurrent execution.

        Uses ThreadPoolExecutor to generate all apps in parallel, with optimal
        worker count based on CPU cores for maximum performance.

        Returns:
            Dict containing overall results and individual app results
        """
        start_time = datetime.now()
        logger.info(
            f"🚀 Starting concurrent multi-app generation from {self.csv_file_path}"
        )
        logger.info(
            f"💻 Using {self.max_concurrent} concurrent workers (CPU cores: {multiprocessing.cpu_count()})"
        )

        ui_started = False
        try:
            # Read app specifications
            specifications = self.ingester.read_app_specifications()

            if not specifications:
                raise ValueError("No valid app specifications found in CSV")

            logger.info(
                f"📊 Found {len(specifications)} app specifications to generate"
            )

            # Initialize UI if enabled
            if self.ui_manager:
                app_names = [spec.name for spec in specifications]
                self.ui_manager.initialize(app_names)
                self.ui_manager.start()
                ui_started = True
                logger.info("🎨 Rich console UI started")

            # Initialize status tracking for all apps (legacy support)
            for spec in specifications:
                self.update_app_status(spec.name, "pending", "Queued for generation")

            # Show initial dashboard (legacy)
            if self.show_progress and not self.ui_manager:
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

                logger.info(
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
                        logger.error(f"❌ Exception in future for {spec.name}: {e}")

            end_time = datetime.now()
            total_time = (end_time - start_time).total_seconds()

            # Stop UI and show final results
            if ui_started and self.ui_manager:
                # Give a moment for final updates to be displayed
                import time
                time.sleep(1)
                self.ui_manager.stop()
            elif self.show_progress:
                # Display final results (legacy)
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

            logger.info(
                f"🎉 Concurrent generation complete: {len(successful_apps)}/{len(specifications)} apps successful"
            )
            logger.info(
                f"⚡ Total time: {total_time:.2f} seconds with {self.max_concurrent} workers"
            )
            logger.info(
                f"📈 Average time per app: {total_time/len(specifications):.2f} seconds"
            )

            return summary

        except Exception as e:
            # Ensure UI is stopped even on error
            if ui_started and self.ui_manager:
                self.ui_manager.stop()
            logger.error(f"❌ Error in concurrent multi-app generation: {e}")
            raise


def run_multi_app_generation(
    csv_file_path: str,
    output_directory: str = "artifacts",
    max_concurrent: Optional[int] = None,
    enable_ui: bool = True,
    show_claude_output: bool = True,
    enable_enrichment: bool = False,
) -> Dict[str, Any]:
    """
    Convenience function to run multi-app generation with Rich UI.
    
    Args:
        csv_file_path: Path to CSV file with app specifications
        output_directory: Directory for generated apps
        max_concurrent: Maximum concurrent workers (auto-calculated if None)
        enable_ui: Whether to enable the Rich console UI
        show_claude_output: Whether to show Claude agent outputs in UI
        enable_enrichment: Whether to enable product specification enrichment
        
    Returns:
        Dict containing generation results and statistics
        
    Example:
        ```python
        # Run with Rich UI and enrichment enabled
        results = run_multi_app_generation("sample.csv", enable_ui=True, enable_enrichment=True)
        
        # Run without UI (legacy mode)
        results = run_multi_app_generation("sample.csv", enable_ui=False)
        
        # Run with enrichment but without UI
        results = run_multi_app_generation("sample.csv", enable_ui=False, enable_enrichment=True)
        ```
    """
    orchestrator = MultiAppOrchestrator(
        csv_file_path=csv_file_path,
        output_directory=output_directory,
        max_concurrent=max_concurrent,
        enable_ui=enable_ui,
        show_claude_output=show_claude_output,
        enable_enrichment=enable_enrichment,
    )
    
    return orchestrator.run()


# if __name__ == "__main__":
#     import sys
    
#     if len(sys.argv) < 2:
#         print("Usage: python main.py <csv_file_path> [output_directory] [--enrich]")
#         print("Example: python main.py sample.csv artifacts")
#         print("Example with enrichment: python main.py sample.csv artifacts --enrich")
#         sys.exit(1)
    
#     csv_path = sys.argv[1]
#     output_dir = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else "artifacts"
    
#     # Check for enrichment flag
#     enable_enrichment = "--enrich" in sys.argv
    
#     if enable_enrichment:
#         print("🧠 Product specification enrichment enabled!")
    
#     # Run with Rich UI enabled by default
#     try:
#         results = run_multi_app_generation(
#             csv_file_path=csv_path,
#             output_directory=output_dir,
#             enable_ui=True,
#             show_claude_output=True,
#             enable_enrichment=enable_enrichment,
#         )
#         print(f"\n🎉 Generation completed! Results: {results}")
#     except KeyboardInterrupt:
#         print("\n⚠️ Generation interrupted by user")
#     except Exception as e:
#         print(f"\n❌ Generation failed: {e}")
#         sys.exit(1)
