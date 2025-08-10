"""
Multi-App Generator using Claude Code SDK

This module ingests CSV files containing app specifications and generates
multiple applications using Claude's code generation capabilities.
"""

import asyncio
import concurrent.futures
import multiprocessing
import os
import subprocess
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from claude_code_sdk import ClaudeCodeOptions, ClaudeSDKClient
from dotenv import load_dotenv
from swarms import Agent

load_dotenv()


def get_optimal_worker_count() -> int:
    """
    Calculate the optimal number of worker threads for concurrent app generation.

    Uses 95% of available CPU cores for optimal performance, similar to the
    swarms ConcurrentWorkflow pattern.

    Returns:
        int: Optimal number of worker threads
    """
    cpu_count = os.cpu_count()
    # Use 95% of CPU cores for optimal performance without overwhelming the system
    optimal_workers = max(1, int(cpu_count * 0.95))
    return optimal_workers


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
            print(f"Missing required columns: {missing_columns}")
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

                except Exception as e:
                    print(f"Error parsing row {index}: {e}")
                    continue

            print(f"Successfully parsed {len(specifications)} app specifications")
            return specifications

        except Exception as e:
            print(f"Error reading CSV file: {e}")
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
        enable_enrichment: bool = False,
        debug_mode: bool = False,
        max_steps: int = 40,
    ):
        """
        Initialize the app generator.

        Args:
            output_directory: Directory where generated apps will be stored
            enable_enrichment: Whether to use product_spec_enricher for enhanced prompts
            debug_mode: Enable extra verbose logging for Claude outputs
        """
        self.retries = retries
        self.retry_delay = retry_delay
        self.output_directory = Path(output_directory)
        self.output_directory.mkdir(exist_ok=True)
        self.enable_enrichment = enable_enrichment
        self.debug_mode = debug_mode
        self.max_steps = max_steps

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

        return f"""You are an expert software developer specializing in creating functional, user-focused applications. You will build a complete, working application that solves real problems based on the following specification.

{base_spec_section}{enriched_section}

**CRITICAL WORKING DIRECTORY REQUIREMENTS:**
- ALWAYS work within the artifacts folder as your base directory
- ALL file operations must be relative to the artifacts folder
- Before starting any work, ensure you are in the artifacts folder
- Create the application project structure within the artifacts folder
- Never work outside of the artifacts folder for any file operations

**DEVELOPMENT WORKFLOW:**
1. **Initialize Working Directory:** Start in artifacts folder and create project subdirectory
2. **File Organization:** Create a simple, well-structured project with clear file organization
3. **Core Functionality:** Focus on solving the user's main problem with working, functional code
4. **Local Execution:** Ensure the application runs locally without external dependencies
5. **Simple Interface:** Create intuitive interfaces that directly address the user's needs
6. **Documentation:** Include clear README with simple setup and usage instructions
7. **Minimal Dependencies:** Use only essential, lightweight packages
8. **Immediate Usability:** Make the app immediately functional after setup

**SIMPLE PROJECT STRUCTURE (within artifacts folder):**
```
artifacts/
└── {spec.name.lower().replace(' ', '_')}/
    ├── README.md (clear setup and usage instructions)
    ├── package.json (Next.js dependencies and scripts)
    ├── next.config.js (Next.js configuration)
    ├── tailwind.config.js (Tailwind CSS configuration)
    ├── src/ (source code directory)
    │   ├── app/ (Next.js app directory)
    │   │   ├── page.tsx (main page component)
    │   │   ├── layout.tsx (root layout)
    │   │   └── globals.css (global styles with Tailwind)
    │   ├── components/ (React components)
    │   └── lib/ (utility functions)
    ├── public/ (static assets)
    ├── vercel.json (REQUIRED - Vercel deployment configuration)
    └── deployment_report.md (deployment status and URLs)
```

**VERCEL CONFIGURATION REQUIREMENT:**
- **MANDATORY:** You MUST create a `vercel.json` file for every project
- The `vercel.json` file must be properly configured for the specific technology stack
- For Python apps: Include proper build commands, output directory, and Python version
- For Node.js apps: Include build commands, output directory, and Node.js version
- For static web apps: Configure proper routing and static file serving
- The vercel.json file is essential for automatic deployment to Vercel
- Without this file, the app cannot be deployed to Vercel automatically

**VERCEL.JSON CONFIGURATION FOR NEXT.JS:**

**Next.js App:**
```json
{{
  "version": 2,
  "builds": [
    {{
      "src": "package.json",
      "use": "@vercel/next"
    }}
  ],
  "routes": [
    {{
      "src": "/(.*)",
      "dest": "/$1"
    }}
  ]
}}
```

**CRITICAL:** Use the Next.js vercel.json configuration above for all projects. This ensures proper deployment of your Next.js application with Tailwind CSS and React components.

**DELIVERABLES REQUIRED:**
- Complete, functional application that solves the user's core problem
- Clean, readable source code that runs locally without complex setup
- Clear README.md with simple setup and usage instructions
- requirements.txt (Python) or package.json (Node.js) with minimal, essential dependencies
- Working application that can be run immediately after following setup instructions
- Focus on core functionality rather than complex integrations or advanced features
- **MANDATORY:** vercel.json file properly configured for the specific technology stack
- **MANDATORY:** vercel.json must include correct build commands, output directory, and runtime configuration
- Live deployment on Vercel with auto-deployment from GitHub
- deployment_report.md with GitHub repository URL and live Vercel URL

**GITHUB REPOSITORY WORKFLOW:**
1. **Repository Creation:** Use GitHub API with GITHUB_PERSONAL_TOKEN to create new repository
2. **Local Git Setup:** Initialize git repository in the project folder within artifacts
3. **File Staging:** Add all project files to git staging area
4. **Initial Commit:** Commit all files with descriptive commit message
5. **Remote Setup:** Add GitHub repository as remote origin
6. **Push Code:** Push all code to the main branch of the GitHub repository
7. **Repository Configuration:** Set up repository settings, description, and topics

**SIMPLE REPOSITORY REQUIREMENTS:**
- Create a basic GitHub repository using the GitHub API with GITHUB_PERSONAL_TOKEN
- Initialize repository with .gitignore, README.md, and application files
- Commit and push the functional application code to the repository
- Focus on sharing working, usable code that solves the user's problem
- Include clear instructions for running the application locally

**TECHNICAL STANDARDS:**
- Write clean, readable React/TypeScript code that directly solves the user's problem
- Use Next.js 14+ with App Router for modern, performant web applications
- Implement responsive design using Tailwind CSS for beautiful, mobile-first interfaces
- Ensure the application runs immediately after following setup instructions
- Focus on core functionality that addresses the main problem
- Keep dependencies minimal and well-justified (Next.js, React, Tailwind CSS)
- Create a user-friendly interface appropriate for the target users
- Include basic error handling for common issues
- Make the app genuinely useful for solving the specified problem
- Use modern React patterns (hooks, functional components) for maintainable code

Create a functional, user-focused Next.js web application with React and Tailwind CSS that directly solves the target users' main problem. The application should work immediately after setup and provide real value without requiring complex infrastructure or external services.
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

**CRITICAL FIRST STEPS:**
1. **Verify Working Directory:** Ensure you are working in the artifacts folder
2. **Create Project Directory:** Create subdirectory `{spec.name.lower().replace(' ', '_')}` within artifacts
3. **Change to Project Directory:** Navigate into the project directory for all subsequent operations
4. **Verify Directory Structure:** Confirm all file operations are within artifacts/{spec.name.lower().replace(' ', '_')}/

**IMPLEMENTATION REQUIREMENTS:**

1. **Next.js Structure:** Create a clean, organized Next.js project following the simple structure in system prompt
2. **Core Problem Solving:** Build React functionality that directly addresses the user's main problem
3. **Local Execution:** Ensure the Next.js app runs completely locally without external APIs or services
4. **Minimal Dependencies:** Use only essential Next.js, React, and Tailwind CSS packages
5. **Tailwind Interface:** Create an intuitive, responsive interface using Tailwind CSS that's easy for target users to understand
6. **Immediate Functionality:** Make the Next.js app work right away after setup with real, useful features
7. **Vercel Ready:** Ensure the Next.js app is compatible with Vercel deployment requirements
8. **Vercel Configuration:** **MANDATORY** - Create a properly configured vercel.json file for Next.js deployment
9. **Simple Documentation:** Write clear, concise setup and usage instructions for Next.js development
10. **Focus on Value:** Prioritize features that directly solve the stated problem over technical complexity

**REPOSITORY AND DEPLOYMENT:**

1. **GitHub Repository Setup:**
   - Create a GitHub repository using the GitHub API with GITHUB_PERSONAL_TOKEN
   - Initialize with basic .gitignore, README.md, and all project files
   - Commit and push the functional application code
   - Include clear setup instructions in README for local execution

2. **Vercel Deployment Setup:**
   - Create vercel.json configuration file with proper build and deployment settings
   - Use VERCEL_TOKEN environment variable to authenticate with Vercel API
   - Create new Vercel project using the Vercel CLI or API
   - Link the Vercel project to the GitHub repository for auto-deployment
   - Configure automatic deployments from GitHub main branch
   - Set up any required environment variables for the application
   - Deploy the application to production and verify it works live
   - Test all core functionality on the live deployment

3. **Local and Live Functionality:**
   - Ensure the app works locally on any machine
   - Verify the live deployment functions correctly
   - Include both local setup and live URL in README
   - Test that core features work in both environments

**TECHNICAL SPECIFICATIONS:**
- Technology Stack: Next.js 14+, React 18+, Tailwind CSS
- Complexity Level: {spec.complexity_level}
- Target Users: {spec.target_user}

**SUCCESS CRITERIA:**
- Next.js application runs immediately after following simple setup instructions
- Directly solves the core problem: {spec.main_problem}
- Works locally without external dependencies or complex setup
- Provides immediate value to the target users
- React/TypeScript code is clean, readable, and easy to understand
- Tailwind CSS interface is intuitive, responsive, and user-friendly
- App actually functions and is genuinely useful for the stated purpose
- **MANDATORY:** vercel.json file is properly configured for Next.js deployment
- **MANDATORY:** vercel.json includes correct Next.js build configuration
- Successfully deployed to Vercel with working live URL
- Auto-deployment configured from GitHub repository
- Both local and live versions function correctly

**DEVELOPMENT WORKFLOW (ALL WITHIN ARTIFACTS FOLDER):**

**Phase 1: Local Application Development**
1. **Verify Location:** Confirm you are in artifacts/{spec.name.lower().replace(' ', '_')}/ directory
2. **Create Next.js Project:** Initialize Next.js project with proper configuration files
3. **Build Functionality:** Implement React components and features that address the main problem
4. **Style with Tailwind:** Apply Tailwind CSS for responsive, beautiful interface design
5. **Create Vercel Config:** **MANDATORY** - Generate vercel.json with Next.js deployment configuration
6. **Test Locally:** Verify the Next.js application works correctly and provides real value

**Phase 2: Repository Setup**
1. **Initialize Git:** Run `git init` in the project directory
2. **Create .gitignore:** Generate a basic .gitignore file
3. **Stage Files:** Add all project files to git with `git add .`
4. **Initial Commit:** Create commit with message "Initial commit: functional {spec.name} app"

**Phase 3: GitHub Repository Creation**
1. **Create Repository:** Use GitHub API with GITHUB_PERSONAL_TOKEN to create repository
2. **Add Remote:** Add GitHub repository as remote origin
3. **Push Code:** Push functional code to GitHub repository
4. **Verify Upload:** Confirm the working application is uploaded

**Phase 4: Vercel Deployment Setup**
1. **Create vercel.json:** Generate Vercel configuration file with proper settings
2. **Authenticate Vercel:** Use VERCEL_TOKEN for Vercel API authentication
3. **Create Vercel Project:** Set up new Vercel project and link to GitHub repository
4. **Configure Auto-Deploy:** Enable automatic deployments from GitHub main branch
5. **Deploy Application:** Deploy the app and verify it works live
6. **Test Live URL:** Confirm the live deployment functions correctly

**Phase 5: Documentation and Verification**
1. **Generate Deployment Report:** Create deployment_report.md with URLs and status
2. **Update README:** Include both local setup and live deployment URL
3. **Final Testing:** Test both local and live versions work correctly
4. **Validate Functionality:** Confirm the app solves the stated problem in both environments

**GITHUB INTEGRATION REQUIREMENTS:**
- Use the GITHUB_PERSONAL_TOKEN environment variable for GitHub API operations
- Create repository with descriptive name based on the application name
- Initialize with basic README that explains how to run the app locally
- Include simple setup and usage instructions
- Focus on sharing functional, working code rather than complex workflows

**DEPLOYMENT REPORT REQUIREMENTS:**
Create a detailed 'deployment_report.md' file containing:
- Brief description of what the app does and the problem it solves
- GitHub repository URL and setup status
- Vercel deployment URL and live application link
- Local setup and installation instructions
- How to use the main features (both locally and live)
- Deployment configuration details
- Auto-deployment status from GitHub to Vercel
- Any environment variables or configuration notes
- Testing results for both local and live versions

**ENVIRONMENT VARIABLE USAGE:**
- Access GITHUB_PERSONAL_TOKEN from environment variables for GitHub API operations
- Access VERCEL_TOKEN from environment variables for Vercel API operations
- Validate both tokens are available before attempting deployment operations
- Use secure token handling practices throughout the deployment process
- Keep application environment requirements minimal for local execution

**ARTIFACTS FOLDER COMPLIANCE:**
- MUST start all work from the artifacts folder
- MUST create project subdirectory within artifacts: artifacts/{spec.name.lower().replace(' ', '_')}/
- ALL file operations must be relative to the project directory within artifacts
- Initialize git repository within the artifacts project directory
- Commit and push from the artifacts project directory
- Never work outside of the artifacts folder structure

**STEP-BY-STEP EXECUTION PLAN:**
1. **Setup Phase:** Verify artifacts folder location and create project subdirectory
2. **Development Phase:** Build functional application within artifacts/{spec.name.lower().replace(' ', '_')}/
3. **Local Testing Phase:** Verify the app works locally and solves the user's problem
4. **Git Phase:** Initialize git, stage files, and commit working application
5. **GitHub Phase:** Create repository and push functional code
6. **Vercel Deployment Phase:** Create vercel.json, set up Vercel project, and deploy live
7. **Verification Phase:** Test both local and live versions work correctly
8. **Documentation Phase:** Create deployment report with all URLs and usage instructions

**AUTO-DEPLOYMENT WORKFLOW:**
1. **Verify Tokens:** Ensure both GITHUB_PERSONAL_TOKEN and VERCEL_TOKEN are available
2. **Local Development:** Build and test the application locally first
3. **Git Setup:** Initialize git repository and commit all files
4. **GitHub Deploy:** Create GitHub repository and push code
5. **Vercel Configuration:** Create vercel.json with proper deployment settings
6. **Vercel Project Setup:** Use Vercel API to create project and link to GitHub
7. **Auto-Deploy Configuration:** Enable automatic deployments from GitHub main branch
8. **Live Deployment:** Deploy to production and verify functionality
9. **Documentation Update:** Update README and create deployment report with all URLs

Start by verifying the artifacts folder location and required tokens, then create the project subdirectory and implement the core functionality that directly solves the user's problem. After ensuring local functionality, deploy to Vercel for live access with auto-deployment configured. Focus on making the application immediately useful both locally and live, providing real value to the target users in both environments.
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
            try:
                spec.enriched_spec = product_spec_enricher(spec)
            except Exception as e:
                print(f"Failed to enrich specification for {spec.name}: {e}")

        for attempt in range(max_retries):
            try:
                system_prompt = self._create_system_prompt(spec)
                generation_prompt = self._create_generation_prompt(spec)

                # Create app directory
                app_dir = self.output_directory / spec.name.lower().replace(" ", "_")
                app_dir.mkdir(exist_ok=True)

                print(
                    f"Starting generation for app: {spec.name} (attempt {attempt + 1}/{max_retries})"
                )

                # Log the Claude SDK configuration
                claude_options = ClaudeCodeOptions(
                    system_prompt=system_prompt,
                    max_turns=self.max_steps,  # Sufficient for local app development and GitHub setup
                    allowed_tools=[
                        "Read",
                        "Write",
                        "Bash",
                        "GitHub",
                        "Git",
                        "Grep",
                        "WebSearch",
                    ],
                    continue_conversation=True,  # Start fresh each time
                    model="claude-sonnet-4-20250514",
                    
                )

                async with ClaudeSDKClient(options=claude_options) as client:
                    # Generate the application
                    await client.query(generation_prompt)

                    response_text = []
                    message_count = 0

                    async for message in client.receive_response():
                        message_count += 1

                        if hasattr(message, "content"):
                            for block in message.content:
                                if hasattr(block, "text"):
                                    text_content = block.text
                                    response_text.append(text_content)

                                elif hasattr(block, "type"):
                                    if self.debug_mode and hasattr(block, "input"):
                                        input_str = str(block.input)
                                        if len(input_str) > 200:
                                            input_str = (
                                                input_str[:200] + "... (truncated)"
                                            )
                                        print(f"Tool Input: {input_str}")

                        elif type(message).__name__ == "ResultMessage":
                            result_text = str(message.result)
                            response_text.append(result_text)

                    # Validate that files were actually created
                    created_files = list(app_dir.glob("**/*"))
                    if not created_files:
                        raise ValueError("No files were generated by Claude")

                    # Log file information
                    file_list = [f for f in created_files if f.is_file()]
                    print(
                        f"Successfully generated app: {spec.name} with {len(file_list)} files in {app_dir}"
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
                print(
                    f"Attempt {attempt + 1}/{max_retries} failed for {spec.name}: {error_msg}"
                )

                # If not the last attempt, add retry delay
                if attempt < max_retries - 1:
                    await asyncio.sleep(self.retry_delay)

        # If we get here, all retries failed
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
            "tech stack, and the most important features to build first."
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
        "5. The most important features to build first\n"
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
        enable_enrichment: bool = False,
        debug_mode: bool = False,
    ):
        """
        Initialize the orchestrator.

        Args:
            csv_file_path: Path to CSV file with app specifications
            output_directory: Directory for generated apps
            max_concurrent: Maximum number of concurrent app generations.
                          If None, uses optimal count based on CPU cores
            enable_enrichment: Whether to enable product specification enrichment
            debug_mode: Enable extra verbose logging for Claude outputs
        """
        self.csv_file_path = csv_file_path
        self.output_directory = output_directory
        # Auto-calculate optimal worker count if not specified
        self.max_concurrent = (
            max_concurrent if max_concurrent is not None else get_optimal_worker_count()
        )
        self.enable_enrichment = enable_enrichment
        self.debug_mode = debug_mode

        self.ingester = CSVAppIngester(csv_file_path)
        self.generator = ClaudeAppGenerator(
            output_directory,
            enable_enrichment=enable_enrichment,
            debug_mode=debug_mode,
        )

        print(
            f"Initialized with {self.max_concurrent} concurrent workers (CPU cores: {multiprocessing.cpu_count()})"
        )

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
            print(f"Starting generation for: {app_name}")

            # Generate the app (this calls the sync wrapper)
            result = self.generator.generate_app_sync(spec)

            if result.get("success", False):
                print(f"✅ Successfully generated: {app_name}")
            else:
                error_msg = result.get("error", "Unknown error")
                print(f"❌ Failed to generate {app_name}: {error_msg}")

            return result

        except Exception as e:
            error_msg = str(e)
            print(f"❌ Exception generating {app_name}: {error_msg}")

            return {
                "success": False,
                "app_name": app_name,
                "error": error_msg,
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
        print(f"🚀 Starting concurrent multi-app generation from {self.csv_file_path}")
        print(
            f"💻 Using {self.max_concurrent} concurrent workers (CPU cores: {multiprocessing.cpu_count()})"
        )

        try:
            # Read app specifications
            specifications = self.ingester.read_app_specifications()

            if not specifications:
                raise ValueError("No valid app specifications found in CSV")

            print(f"📊 Found {len(specifications)} app specifications to generate")

            # Generate ALL apps concurrently using ThreadPoolExecutor
            with concurrent.futures.ThreadPoolExecutor(
                max_workers=self.max_concurrent
            ) as executor:
                # Submit all app generation tasks simultaneously
                future_to_spec = {
                    executor.submit(self.generate_single_app_concurrent, spec): spec
                    for spec in specifications
                }

                print(
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
                        print(f"❌ Exception in future for {spec.name}: {e}")

            end_time = datetime.now()
            total_time = (end_time - start_time).total_seconds()

            # Deploy successful apps to Vercel
            deployment_results = None
            if successful_apps:
                try:
                    deployment_results = self.deploy_apps_to_vercel(successful_apps)
                except Exception as e:
                    print(f"❌ Error during Vercel deployment: {e}")
                    deployment_results = {"success": False, "error": str(e)}

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
                "vercel_deployment": deployment_results,
            }

            print(
                f"🎉 Concurrent generation complete: {len(successful_apps)}/{len(specifications)} apps successful"
            )
            print(
                f"⚡ Total time: {total_time:.2f} seconds with {self.max_concurrent} workers"
            )
            print(
                f"📈 Average time per app: {total_time/len(specifications):.2f} seconds"
            )

            return summary

        except Exception as e:
            print(f"❌ Error in concurrent multi-app generation: {e}")
            raise

    def deploy_apps_to_vercel(
        self, successful_apps: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Deploy all successfully generated apps to Vercel using Vercel CLI and API.

        Args:
            successful_apps: List of successful app generation results

        Returns:
            Dict containing deployment results with URLs
        """
        # Check if Vercel token is available
        vercel_token = os.getenv("VERCEL_TOKEN")
        if not vercel_token:
            print("❌ VERCEL_TOKEN not found in environment variables")
            return {
                "success": False,
                "error": "VERCEL_TOKEN not found",
                "skipped": True,
            }

        # Check if Vercel CLI is installed
        try:
            vercel_version = subprocess.run(
                ["vercel", "--version"], 
                capture_output=True, 
                text=True, 
                timeout=10
            )
            if vercel_version.returncode != 0:
                print("❌ Vercel CLI not found. Installing...")
                self._install_vercel_cli()
        except FileNotFoundError:
            print("❌ Vercel CLI not found. Installing...")
            self._install_vercel_cli()

        # Verify Vercel authentication
        if not self._verify_vercel_auth(vercel_token):
            return {
                "success": False,
                "error": "Vercel authentication failed - check your VERCEL_TOKEN",
                "skipped": True,
            }

        deployment_results = []
        failed_deployments = []

        for app_result in successful_apps:
            app_name = app_result.get("app_name", "unknown")
            app_path = app_result.get("output_directory", "")

            if not app_path or not os.path.exists(app_path):
                print(f"❌ App path not found for {app_name}: {app_path}")
                failed_deployments.append({
                    "app_name": app_name,
                    "error": "App directory not found"
                })
                continue

            try:
                print(f"🚀 Starting Vercel deployment for: {app_name}")
                
                # Create a unique project name for Vercel
                project_name = f"devshop-{app_name.lower().replace(' ', '-').replace('_', '-')}-{int(time.time())}"
                
                # Store original directory
                original_dir = os.getcwd()
                
                # Change to app directory
                os.chdir(app_path)
                print(f"📁 Changed to directory: {os.getcwd()}")

                # Check if vercel.json exists, if not create a basic one
                if not os.path.exists("vercel.json"):
                    print(f"📝 Creating vercel.json for {app_name}")
                    self._create_vercel_config(app_name)

                # Check if package.json exists (required for Next.js)
                if not os.path.exists("package.json"):
                    print(f"❌ package.json not found for {app_name}, skipping deployment")
                    failed_deployments.append({
                        "app_name": app_name,
                        "error": "package.json not found - not a valid Next.js project"
                    })
                    os.chdir(original_dir)
                    continue

                # Initialize Vercel project (this creates the .vercel directory)
                print(f"🔧 Initializing Vercel project: {project_name}")
                init_cmd = [
                    "vercel",
                    "--yes",
                    "--token", vercel_token,
                    "--name", project_name,
                    "--confirm"
                ]

                init_result = subprocess.run(
                    init_cmd, 
                    capture_output=True, 
                    text=True, 
                    timeout=120,
                    env={**os.environ, "VERCEL_TOKEN": vercel_token}
                )

                if init_result.returncode != 0:
                    print(f"❌ Vercel init failed for {app_name}: {init_result.stderr}")
                    failed_deployments.append({
                        "app_name": app_name,
                        "error": f"Vercel init failed: {init_result.stderr}"
                    })
                    os.chdir(original_dir)
                    continue

                print(f"✅ Vercel project initialized for {app_name}")

                # Deploy to Vercel production
                print(f"🚀 Deploying {app_name} to Vercel production...")
                deploy_cmd = [
                    "vercel", 
                    "--prod", 
                    "--yes", 
                    "--token", vercel_token,
                    "--confirm"
                ]

                deploy_result = subprocess.run(
                    deploy_cmd, 
                    capture_output=True, 
                    text=True, 
                    timeout=300,  # 5 minutes for deployment
                    env={**os.environ, "VERCEL_TOKEN": vercel_token}
                )

                if deploy_result.returncode != 0:
                    print(f"❌ Vercel deployment failed for {app_name}: {deploy_result.stderr}")
                    failed_deployments.append({
                        "app_name": app_name,
                        "error": f"Vercel deployment failed: {deploy_result.stderr}"
                    })
                    os.chdir(original_dir)
                    continue

                # Extract deployment URL from output
                deployment_url = self._extract_deployment_url(deploy_result.stdout, deploy_result.stderr)
                
                if deployment_url:
                    print(f"✅ Successfully deployed {app_name} to: {deployment_url}")
                    deployment_results.append({
                        "app_name": app_name,
                        "deployment_url": deployment_url,
                        "project_name": project_name,
                        "status": "success",
                        "vercel_project_id": self._get_vercel_project_id(app_path)
                    })
                else:
                    print(f"⚠️ Deployment successful but URL not found for {app_name}")
                    deployment_results.append({
                        "app_name": app_name,
                        "deployment_url": "URL not found",
                        "project_name": project_name,
                        "status": "success_no_url",
                        "vercel_project_id": self._get_vercel_project_id(app_path)
                    })

                # Wait between deployments to avoid rate limiting
                time.sleep(3)

            except subprocess.TimeoutExpired:
                print(f"⏰ Deployment timeout for {app_name}")
                failed_deployments.append({
                    "app_name": app_name,
                    "error": "Deployment timeout"
                })
            except Exception as e:
                print(f"❌ Unexpected error deploying {app_name}: {str(e)}")
                failed_deployments.append({
                    "app_name": app_name,
                    "error": f"Unexpected error: {str(e)}"
                })
            finally:
                # Return to original directory
                try:
                    os.chdir(original_dir)
                except:
                    pass

        # Summary of deployment results
        deployment_summary = {
            "total_apps": len(successful_apps),
            "successful_deployments": len(deployment_results),
            "failed_deployments": len(failed_deployments),
            "deployment_results": deployment_results,
            "failed_deployments": failed_deployments,
        }

        print(f"🎉 Vercel deployment summary: {len(deployment_results)}/{len(successful_apps)} successful")
        return deployment_summary

    def _install_vercel_cli(self):
        """Install Vercel CLI if not present."""
        try:
            print("📦 Installing Vercel CLI...")
            install_cmd = ["npm", "install", "-g", "vercel"]
            result = subprocess.run(install_cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                print("✅ Vercel CLI installed successfully")
                # Verify installation
                verify_cmd = ["vercel", "--version"]
                verify_result = subprocess.run(verify_cmd, capture_output=True, text=True, timeout=10)
                if verify_result.returncode == 0:
                    print(f"✅ Vercel CLI verified: {verify_result.stdout.strip()}")
                else:
                    raise Exception("Vercel CLI installation verification failed")
            else:
                print(f"❌ Failed to install Vercel CLI: {result.stderr}")
                raise Exception("Vercel CLI installation failed")
        except Exception as e:
            print(f"❌ Error installing Vercel CLI: {e}")
            raise Exception(f"Vercel CLI installation failed: {e}")

    def _verify_vercel_auth(self, vercel_token: str) -> bool:
        """Verify that the Vercel token is valid and authenticated."""
        try:
            print("🔐 Verifying Vercel authentication...")
            # Test the token by trying to list projects
            test_cmd = ["vercel", "ls", "--token", vercel_token, "--max", 1]
            result = subprocess.run(test_cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                print("✅ Vercel authentication verified successfully")
                return True
            else:
                print(f"❌ Vercel authentication failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error verifying Vercel authentication: {e}")
            return False

    def _create_vercel_config(self, app_name: str):
        """Create a basic vercel.json configuration file."""
        vercel_config = {
            "version": 2,
            "builds": [
                {
                    "src": "package.json",
                    "use": "@vercel/next"
                }
            ],
            "routes": [
                {
                    "src": "/(.*)",
                    "dest": "/$1"
                }
            ]
        }
        
        with open("vercel.json", "w") as f:
            import json
            json.dump(vercel_config, f, indent=2)
        
        print(f"✅ Created vercel.json for {app_name}")

    def _extract_deployment_url(self, stdout: str, stderr: str) -> Optional[str]:
        """Extract deployment URL from Vercel CLI output."""
        # Look for URLs in both stdout and stderr
        for output in [stdout, stderr]:
            lines = output.split("\n")
            for line in lines:
                line = line.strip()
                # Look for Vercel deployment URLs
                if "https://" in line and ("vercel.app" in line or "vercel.com" in line):
                    # Clean up the URL
                    url = line.split("https://")[1].split(" ")[0]
                    if url.endswith("/"):
                        url = url[:-1]
                    return f"https://{url}"
                
                # Also look for "Preview:" or "Production:" lines
                if ("Preview:" in line or "Production:" in line) and "https://" in line:
                    url = line.split("https://")[1].strip()
                    if url.endswith("/"):
                        url = url[:-1]
                    return f"https://{url}"
        
        return None

    def _get_vercel_project_id(self, app_path: str) -> Optional[str]:
        """Get Vercel project ID from .vercel/project.json if it exists."""
        try:
            project_json_path = os.path.join(app_path, ".vercel", "project.json")
            if os.path.exists(project_json_path):
                with open(project_json_path, "r") as f:
                    import json
                    project_data = json.load(f)
                    return project_data.get("projectId")
        except Exception:
            pass
        return None


def run_multi_app_generation(
    *args,
    **kwargs,
) -> Dict[str, Any]:
    """
    Convenience function to run multi-app generation.

    Args:
        csv_file_path: Path to CSV file with app specifications
        output_directory: Directory for generated apps
        max_concurrent: Maximum concurrent workers (auto-calculated if None)
        enable_enrichment: Whether to enable product specification enrichment
        debug_mode: Enable extra verbose logging for Claude outputs

    Returns:
        Dict containing generation results and statistics

    Example:
        ```python
        # Run with enrichment enabled
        results = run_multi_app_generation("sample.csv", enable_enrichment=True)

        # Run with debug mode for verbose Claude output logging
        results = run_multi_app_generation("sample.csv", debug_mode=True)
        ```
    """
    orchestrator = MultiAppOrchestrator(
        *args,
        **kwargs,
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

#     # Run with minimal logging for concurrent execution
#     try:
#         results = run_multi_app_generation(
#             csv_file_path=csv_path,
#             output_directory=output_dir,
#             enable_enrichment=enable_enrichment,
#         )
#         print(f"\n🎉 Generation completed! Results: {results}")
#     except KeyboardInterrupt:
#         print("\n⚠️ Generation interrupted by user")
#     except Exception as e:
#         print(f"\n❌ Generation failed: {e}")
#         sys.exit(1)
