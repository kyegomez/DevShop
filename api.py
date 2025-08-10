#!/usr/bin/env python3
"""
FastAPI API for MultiAppOrchestrator

This API provides REST endpoints for the MultiAppOrchestrator functionality,
allowing users to generate multiple applications from CSV specifications
via HTTP requests.
"""

import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from loguru import logger
import pandas as pd
import json

# Import from main.py
from main import MultiAppOrchestrator, CSVAppIngester


# Pydantic Models
class GenerationRequest(BaseModel):
    """Request model for app generation"""

    csv_file_path: Optional[str] = Field(
        None, description="Path to CSV file (if not uploading)"
    )
    output_directory: str = Field(
        "artifacts", description="Directory for generated apps"
    )
    max_concurrent: Optional[int] = Field(
        None, description="Maximum concurrent workers"
    )
    show_progress: bool = Field(True, description="Show progress dashboard")
    enable_ui: bool = Field(
        False, description="Enable Rich console UI (not applicable for API)"
    )
    show_claude_output: bool = Field(True, description="Show Claude agent outputs")
    enable_enrichment: bool = Field(
        False, description="Enable product specification enrichment"
    )
    debug_mode: bool = Field(False, description="Enable debug mode for verbose logging")

    @validator("csv_file_path")
    def validate_csv_path(cls, v, values):
        if not v and "csv_file_path" not in values:
            raise ValueError(
                "Either csv_file_path must be provided or CSV file must be uploaded"
            )
        return v


class GenerationResponse(BaseModel):
    """Response model for generation results"""

    task_id: str = Field(..., description="Unique task identifier")
    status: str = Field(..., description="Task status")
    message: str = Field(..., description="Status message")
    timestamp: str = Field(..., description="ISO timestamp")
    results: Optional[Dict[str, Any]] = Field(
        None, description="Generation results when completed"
    )


class TaskStatus(BaseModel):
    """Task status model"""

    task_id: str = Field(..., description="Unique task identifier")
    status: str = Field(..., description="Task status")
    progress: Dict[str, str] = Field(..., description="Progress of individual apps")
    message: str = Field(..., description="Status message")
    timestamp: str = Field(..., description="ISO timestamp")
    start_time: Optional[str] = Field(None, description="Task start time")
    estimated_completion: Optional[str] = Field(
        None, description="Estimated completion time"
    )


class AppSpecificationModel(BaseModel):
    """App specification model for API responses"""

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


class CSVValidationResponse(BaseModel):
    """CSV validation response model"""

    is_valid: bool
    message: str
    app_count: Optional[int] = None
    sample_specs: Optional[List[AppSpecificationModel]] = None
    errors: Optional[List[str]] = None


# Global state for task management
class TaskManager:
    """Manages background tasks and their status"""

    def __init__(self):
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.executor = ThreadPoolExecutor(max_workers=4)

    def create_task(self, task_id: str, request: GenerationRequest) -> str:
        """Create a new task"""
        self.tasks[task_id] = {
            "status": "pending",
            "request": request.dict(),
            "progress": {},
            "start_time": datetime.now().isoformat(),
            "results": None,
            "error": None,
        }
        return task_id

    def update_task_status(
        self,
        task_id: str,
        status: str,
        message: str = "",
        results: Optional[Dict] = None,
    ):
        """Update task status"""
        if task_id in self.tasks:
            self.tasks[task_id]["status"] = status
            self.tasks[task_id]["message"] = message
            if results:
                self.tasks[task_id]["results"] = results
            self.tasks[task_id]["last_update"] = datetime.now().isoformat()

    def update_app_progress(
        self, task_id: str, app_name: str, status: str, output: str = ""
    ):
        """Update progress for a specific app"""
        if task_id in self.tasks:
            self.tasks[task_id]["progress"][app_name] = {
                "status": status,
                "output": output,
                "timestamp": datetime.now().isoformat(),
            }

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task information"""
        return self.tasks.get(task_id)

    def get_all_tasks(self) -> Dict[str, Dict[str, Any]]:
        """Get all tasks"""
        return self.tasks


# Initialize FastAPI app
app = FastAPI(
    title="MultiApp Generator API",
    description="API for generating multiple applications from CSV specifications using Claude",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize task manager
task_manager = TaskManager()


# Custom orchestrator for API use
class APIOrchestrator(MultiAppOrchestrator):
    """Extended orchestrator with API-specific functionality"""

    def __init__(self, task_id: str, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.task_id = task_id

    def update_app_status(self, app_name: str, status: str, output: str = ""):
        """Override to update task manager"""
        super().update_app_status(app_name, status, output)
        task_manager.update_app_progress(self.task_id, app_name, status, output)

    def run(self) -> Dict[str, Any]:
        """Override to update task status"""
        try:
            task_manager.update_task_status(
                self.task_id, "running", "Generation started"
            )
            result = super().run()
            task_manager.update_task_status(
                self.task_id, "completed", "Generation completed successfully", result
            )
            return result
        except Exception as e:
            error_msg = str(e)
            task_manager.update_task_status(
                self.task_id, "error", f"Generation failed: {error_msg}"
            )
            raise


# Background task function
def run_generation_task(task_id: str, request: GenerationRequest, csv_file_path: str):
    """Run generation task in background"""
    try:
        logger.info(f"Starting generation task {task_id}")

        # Create orchestrator
        orchestrator = APIOrchestrator(
            task_id=task_id,
            csv_file_path=csv_file_path,
            output_directory=request.output_directory,
            max_concurrent=request.max_concurrent,
            show_progress=request.show_progress,
            enable_ui=False,  # Disable UI for API
            show_claude_output=request.show_claude_output,
            enable_enrichment=request.enable_enrichment,
            debug_mode=request.debug_mode,
        )

        # Run generation
        result = orchestrator.run()
        logger.info(f"Generation task {task_id} completed successfully")

    except Exception as e:
        logger.error(f"Generation task {task_id} failed: {e}")
        task_manager.update_task_status(
            task_id, "error", f"Generation failed: {str(e)}"
        )


# API Endpoints


@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "MultiApp Generator API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health", response_model=Dict[str, str])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/generate")
async def generate_apps(csv_file: UploadFile = File(...)):
    """Generate applications from CSV specification and return results CSV"""

    logger.info(f"Starting generation request for file: {csv_file.filename}")

    try:
        # Validate file type
        if not csv_file.filename.endswith(".csv"):
            raise HTTPException(status_code=400, detail="File must be a CSV file")

        # Create temporary file
        temp_dir = Path("temp_uploads")
        temp_dir.mkdir(exist_ok=True)

        csv_file_path = temp_dir / f"input_{csv_file.filename}"

        # Save uploaded file
        content = await csv_file.read()
        with open(csv_file_path, "wb") as buffer:
            buffer.write(content)

        logger.info(f"CSV file saved to: {csv_file_path}")

        # Run MultiAppOrchestrator directly
        logger.info("Starting MultiAppOrchestrator...")
        orchestrator = MultiAppOrchestrator(
            csv_file_path=str(csv_file_path),
            output_directory="artifacts",
            max_concurrent=None,  # Use default
            show_progress=False,  # Disable for API
            enable_ui=False,  # Disable for API
            show_claude_output=False,  # Disable for API
            enable_enrichment=False,
            debug_mode=False,
        )

        # Run generation
        logger.info("Running app generation...")
        results = orchestrator.run()

        logger.info(f"Generation completed. Results: {results}")

        # Create results CSV
        results_csv_path = temp_dir / f"results_{csv_file.filename}"

        # Extract the results data
        successful_apps = results.get("results", {}).get("successful", [])
        failed_apps = results.get("results", {}).get("failed", [])

        # Create results DataFrame
        results_data = []

        # Add successful apps
        for app in successful_apps:
            results_data.append(
                {
                    "app_name": app.get("name", "Unknown"),
                    "status": "success",
                    "output_directory": app.get("output_directory", ""),
                    "generation_time": app.get("generation_time", ""),
                    "error": "",
                    "package_json_path": app.get("package_json_path", ""),
                    "readme_path": app.get("readme_path", ""),
                }
            )

        # Add failed apps
        for app in failed_apps:
            results_data.append(
                {
                    "app_name": app.get("name", "Unknown"),
                    "status": "failed",
                    "output_directory": "",
                    "generation_time": "",
                    "error": app.get("error", "Unknown error"),
                    "package_json_path": "",
                    "readme_path": "",
                }
            )

        # Create summary row
        summary_row = {
            "app_name": "SUMMARY",
            "status": f"{len(successful_apps)}/{len(successful_apps) + len(failed_apps)} successful",
            "output_directory": results.get("output_directory", ""),
            "generation_time": f"{results.get('total_time_seconds', 0):.2f}s",
            "error": f"{len(failed_apps)} failed",
            "package_json_path": f"Total apps: {len(successful_apps) + len(failed_apps)}",
            "readme_path": f"Workers: {results.get('concurrent_workers', 'N/A')}",
        }
        results_data.insert(0, summary_row)

        # Save results CSV
        df = pd.DataFrame(results_data)
        df.to_csv(results_csv_path, index=False)

        logger.info(f"Results CSV saved to: {results_csv_path}")

        # Read the results CSV and return it
        with open(results_csv_path, "r") as f:
            csv_content = f.read()

        # Clean up temporary files
        try:
            os.remove(csv_file_path)
            os.remove(results_csv_path)
        except:
            pass

        # Return CSV as response
        from fastapi.responses import Response

        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=generation_results_{csv_file.filename}"
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generation: {e}")
        import traceback

        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.get("/tasks/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    """Get status of a specific task"""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskStatus(
        task_id=task_id,
        status=task["status"],
        progress=task["progress"],
        message=task["message"],
        timestamp=task.get("last_update", task["start_time"]),
        start_time=task["start_time"],
        estimated_completion=None,  # Could implement estimation logic
    )


@app.get("/tasks", response_model=Dict[str, Dict[str, Any]])
async def get_all_tasks():
    """Get all tasks"""
    return task_manager.get_all_tasks()


@app.post("/validate-csv", response_model=CSVValidationResponse)
async def validate_csv(csv_file: UploadFile = File(...)):
    """Validate CSV file structure and content"""

    if not csv_file.filename.endswith(".csv"):
        return CSVValidationResponse(
            is_valid=False,
            message="File must be a CSV file",
            errors=["Invalid file type"],
        )

    try:
        # Read and validate CSV
        content = await csv_file.read()
        df = pd.read_csv(pd.io.common.BytesIO(content))

        ingester = CSVAppIngester("temp")
        is_valid = ingester.validate_csv_structure(df)

        if is_valid:
            specs = ingester.read_app_specifications()
            sample_specs = [
                AppSpecificationModel(
                    name=spec.name,
                    description=spec.description,
                    app_goal=spec.app_goal,
                    target_user=spec.target_user,
                    main_problem=spec.main_problem,
                    design_preferences=spec.design_preferences,
                    additional_requirements=spec.additional_requirements,
                    tech_stack=spec.tech_stack,
                    complexity_level=spec.complexity_level,
                    enriched_spec=spec.enriched_spec,
                )
                for spec in specs[:3]  # Show first 3 as samples
            ]

            return CSVValidationResponse(
                is_valid=True,
                message=f"CSV is valid with {len(specs)} app specifications",
                app_count=len(specs),
                sample_specs=sample_specs,
            )
        else:
            return CSVValidationResponse(
                is_valid=False,
                message="CSV structure is invalid",
                errors=["CSV does not contain required columns"],
            )

    except Exception as e:
        logger.error(f"CSV validation error: {e}")
        return CSVValidationResponse(
            is_valid=False, message=f"Error validating CSV: {str(e)}", errors=[str(e)]
        )


@app.delete("/tasks/{task_id}")
async def cancel_task(task_id: str):
    """Cancel a running task"""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task["status"] in ["completed", "error"]:
        raise HTTPException(
            status_code=400, detail="Cannot cancel completed or failed task"
        )

    # Update task status
    task_manager.update_task_status(task_id, "cancelled", "Task cancelled by user")

    logger.info(f"Task {task_id} cancelled")

    return {"message": f"Task {task_id} cancelled successfully"}


@app.get("/stats", response_model=Dict[str, Any])
async def get_api_stats():
    """Get API statistics"""
    all_tasks = task_manager.get_all_tasks()

    total_tasks = len(all_tasks)
    completed_tasks = len([t for t in all_tasks.values() if t["status"] == "completed"])
    failed_tasks = len([t for t in all_tasks.values() if t["status"] == "error"])
    running_tasks = len([t for t in all_tasks.values() if t["status"] == "running"])
    pending_tasks = len([t for t in all_tasks.values() if t["status"] == "pending"])

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "failed_tasks": failed_tasks,
        "running_tasks": running_tasks,
        "pending_tasks": pending_tasks,
        "success_rate": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/artifacts", response_model=List[Dict[str, Any]])
async def list_artifacts():
    """List all generated applications in artifacts directory"""
    try:
        artifacts_dir = Path("artifacts")
        if not artifacts_dir.exists():
            return []

        apps = []
        for app_dir in artifacts_dir.iterdir():
            if app_dir.is_dir():
                # Check if it's a valid app directory
                package_json = app_dir / "package.json"
                if package_json.exists():
                    try:
                        with open(package_json, "r") as f:
                            package_data = json.loads(f.read())
                            apps.append(
                                {
                                    "name": app_dir.name,
                                    "path": str(app_dir),
                                    "package_name": package_data.get(
                                        "name", app_dir.name
                                    ),
                                    "version": package_data.get("version", "1.0.0"),
                                    "description": package_data.get("description", ""),
                                    "scripts": package_data.get("scripts", {}),
                                }
                            )
                    except Exception as e:
                        logger.warning(
                            f"Error reading package.json for {app_dir.name}: {e}"
                        )
                        continue

        return apps
    except Exception as e:
        logger.error(f"Error listing artifacts: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error listing artifacts: {str(e)}"
        )


@app.post("/start-app")
async def start_app(request: Dict[str, Any]):
    """Start a specific application with yarn install and yarn dev"""
    app_name = request.get("app_name")
    port = request.get("port")

    if not app_name or not port:
        raise HTTPException(status_code=400, detail="app_name and port are required")
    try:
        app_dir = Path("artifacts") / app_name
        if not app_dir.exists():
            raise HTTPException(status_code=404, detail=f"App {app_name} not found")

        package_json = app_dir / "package.json"
        if not package_json.exists():
            raise HTTPException(
                status_code=400,
                detail=f"App {app_name} is not a valid Node.js application",
            )

        # Check if port is available
        import socket

        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(("localhost", port))
        sock.close()

        if result == 0:
            raise HTTPException(
                status_code=400, detail=f"Port {port} is already in use"
            )

        # Start the app in background
        import subprocess
        import threading

        def run_app():
            try:
                # Change to app directory
                os.chdir(app_dir)

                # Install dependencies
                subprocess.run(["yarn", "install"], check=True, capture_output=True)

                # Start the app with the specified port
                env = os.environ.copy()
                env["PORT"] = str(port)

                # Try to set port in package.json scripts if it's a Next.js app
                try:
                    with open(package_json, "r") as f:
                        package_data = json.loads(f.read())

                    if "dev" in package_data.get("scripts", {}):
                        dev_script = package_data["scripts"]["dev"]
                        if "next dev" in dev_script and "-p" not in dev_script:
                            # Update the dev script to use the specified port
                            package_data["scripts"]["dev"] = f"next dev -p {port}"
                            with open(package_json, "w") as f:
                                json.dump(package_data, f, indent=2)
                except Exception as e:
                    logger.warning(f"Could not update package.json for {app_name}: {e}")

                # Start the app
                subprocess.run(["yarn", "dev"], env=env, check=True)

            except subprocess.CalledProcessError as e:
                logger.error(f"Error starting app {app_name}: {e}")
            except Exception as e:
                logger.error(f"Unexpected error starting app {app_name}: {e}")

        # Start app in background thread
        thread = threading.Thread(target=run_app, daemon=True)
        thread.start()

        # Wait a bit for the app to start
        import time

        time.sleep(2)

        # Check if app is running
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(("localhost", port))
        sock.close()

        if result == 0:
            return {
                "message": f"App {app_name} started successfully on port {port}",
                "app_name": app_name,
                "port": port,
                "status": "running",
            }
        else:
            return {
                "message": f"App {app_name} starting on port {port}",
                "app_name": app_name,
                "port": port,
                "status": "starting",
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting app {app_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error starting app: {str(e)}")


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "timestamp": datetime.now().isoformat(),
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP exception handler"""
    logger.warning(f"HTTP exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "timestamp": datetime.now().isoformat()},
    )


if __name__ == "__main__":
    import uvicorn

    # Create logs directory if it doesn't exist
    Path("logs").mkdir(exist_ok=True)
    Path("temp_uploads").mkdir(exist_ok=True)

    logger.info("Starting MultiApp Generator API")

    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
