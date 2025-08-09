"""
Rich Console UI Dashboard for Multi-App Generator

This module provides a beautiful, real-time console interface for monitoring
Claude code agent outputs and app generation progress using Rich panels.
"""

import threading
import time
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from collections import deque

from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    TaskProgressColumn,
    TimeElapsedColumn,
)
from rich.layout import Layout
from rich.table import Table
from rich.text import Text
from rich.live import Live
from rich.columns import Columns
from rich.align import Align
from rich.box import ROUNDED
from loguru import logger


@dataclass
class AppStatus:
    """Represents the status of an app being generated."""

    name: str
    status: str = "pending"  # pending, running, completed, error
    progress: float = 0.0  # 0.0 to 100.0
    current_task: str = ""
    output_log: deque = field(default_factory=lambda: deque(maxlen=100))
    files_created: List[str] = field(default_factory=list)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    error_message: str = ""
    claude_messages: List[str] = field(default_factory=list)

    def add_log(self, message: str):
        """Add a log message with timestamp."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.output_log.append(f"[{timestamp}] {message}")

    def add_claude_message(self, message: str):
        """Add a Claude agent message."""
        self.claude_messages.append(message)
        self.add_log(f"Claude: {message[:100]}...")  # Add truncated to log

    def get_duration(self) -> str:
        """Get the duration of the app generation."""
        if not self.start_time:
            return "Not started"
        end = self.end_time or datetime.now()
        duration = end - self.start_time
        return f"{duration.total_seconds():.1f}s"


class DashboardUI:
    """
    Rich console dashboard for monitoring multi-app generation with Claude agents.

    Features:
    - Real-time progress tracking for each app
    - Live Claude agent output streaming
    - File creation monitoring
    - Performance metrics
    - Beautiful console panels with colors and animations
    """

    def __init__(self, show_claude_output: bool = True, refresh_rate: float = 0.1):
        """
        Initialize the dashboard.

        Args:
            show_claude_output: Whether to show detailed Claude agent outputs
            refresh_rate: How often to refresh the display (seconds)
        """
        self.console = Console(record=True)
        self.show_claude_output = show_claude_output
        self.refresh_rate = refresh_rate

        # Thread-safe data structures
        self.app_statuses: Dict[str, AppStatus] = {}
        self.lock = threading.Lock()

        # Dashboard components
        self.layout = Layout()
        self.progress = Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            TimeElapsedColumn(),
        )

        # Live display
        self.live: Optional[Live] = None
        self.running = False

        # Overall stats
        self.total_apps = 0
        self.start_time = datetime.now()

    def initialize_apps(self, app_names: List[str]):
        """Initialize tracking for all apps."""
        with self.lock:
            self.total_apps = len(app_names)
            for name in app_names:
                self.app_statuses[name] = AppStatus(name=name)

    def update_app_status(
        self,
        app_name: str,
        status: str,
        progress: float = None,
        current_task: str = "",
        error_message: str = "",
    ):
        """Update the status of an app."""
        with self.lock:
            if app_name not in self.app_statuses:
                self.app_statuses[app_name] = AppStatus(name=app_name)

            app = self.app_statuses[app_name]
            app.status = status
            if progress is not None:
                app.progress = progress
            if current_task:
                app.current_task = current_task
            if error_message:
                app.error_message = error_message

            # Set timestamps
            if status == "running" and not app.start_time:
                app.start_time = datetime.now()
            elif status in ["completed", "error"] and not app.end_time:
                app.end_time = datetime.now()

            # Add log entry
            app.add_log(f"Status: {status} - {current_task or error_message}")

    def add_claude_message(self, app_name: str, message: str):
        """Add a Claude agent message for an app."""
        with self.lock:
            if app_name in self.app_statuses:
                self.app_statuses[app_name].add_claude_message(message)

    def add_files_created(self, app_name: str, files: List[str]):
        """Add files created for an app."""
        with self.lock:
            if app_name in self.app_statuses:
                self.app_statuses[app_name].files_created.extend(files)
                self.app_statuses[app_name].add_log(f"Created {len(files)} files")

    def _create_summary_panel(self) -> Panel:
        """Create the summary panel with overall statistics."""
        with self.lock:
            completed = sum(
                1 for app in self.app_statuses.values() if app.status == "completed"
            )
            running = sum(
                1 for app in self.app_statuses.values() if app.status == "running"
            )
            errors = sum(
                1 for app in self.app_statuses.values() if app.status == "error"
            )
            pending = sum(
                1 for app in self.app_statuses.values() if app.status == "pending"
            )

            duration = (datetime.now() - self.start_time).total_seconds()

            table = Table(show_header=False, box=None, padding=(0, 1))
            table.add_column("Metric", style="bold blue")
            table.add_column("Value", style="bold green")

            table.add_row("🎯 Total Apps", str(self.total_apps))
            table.add_row("✅ Completed", str(completed))
            table.add_row("🔄 Running", str(running))
            table.add_row("⏳ Pending", str(pending))
            table.add_row("❌ Errors", str(errors))
            table.add_row("⏱️ Duration", f"{duration:.1f}s")
            if completed > 0:
                avg_time = duration / completed
                table.add_row("📊 Avg Time/App", f"{avg_time:.1f}s")

        return Panel(
            table, title="📈 Generation Summary", border_style="blue", box=ROUNDED
        )

    def _create_app_panel(self, app: AppStatus) -> Panel:
        """Create a panel for a single app."""
        # Status styling
        status_colors = {
            "pending": "yellow",
            "running": "blue",
            "completed": "green",
            "error": "red",
        }
        status_emojis = {
            "pending": "⏳",
            "running": "🔄",
            "completed": "✅",
            "error": "❌",
        }

        color = status_colors.get(app.status, "white")
        emoji = status_emojis.get(app.status, "❓")

        # Create content
        content = []

        # Status line
        status_text = Text()
        status_text.append(f"{emoji} ", style=color)
        status_text.append(f"{app.status.upper()}", style=f"bold {color}")
        if app.current_task:
            status_text.append(f" - {app.current_task}", style="italic")
        content.append(status_text)

        # Progress bar for running apps
        if app.status == "running" and app.progress > 0:
            progress_bar = (
                f"{'█' * int(app.progress / 5)}{'░' * (20 - int(app.progress / 5))}"
            )
            content.append(f"Progress: [{progress_bar}] {app.progress:.1f}%")

        # Duration
        content.append(f"Duration: {app.get_duration()}")

        # Files created
        if app.files_created:
            content.append(f"Files: {len(app.files_created)} created")

        # Error message
        if app.error_message:
            error_text = Text(f"Error: {app.error_message}", style="red")
            content.append(error_text)

        # Recent Claude messages (if enabled)
        if self.show_claude_output and app.claude_messages:
            content.append("\n📝 Recent Claude Output:")
            for msg in app.claude_messages[-3:]:  # Show last 3 messages
                content.append(Text(f"  • {msg[:80]}...", style="dim"))

        # Recent logs
        if app.output_log:
            content.append("\n📋 Recent Activity:")
            for log in list(app.output_log)[-2:]:  # Show last 2 logs
                content.append(Text(f"  {log}", style="dim"))

        panel_content = "\n".join(str(item) for item in content)

        return Panel(
            panel_content, title=f"🚀 {app.name}", border_style=color, box=ROUNDED
        )

    def _create_layout(self) -> Layout:
        """Create the main layout with all panels."""
        layout = Layout()

        # Create summary panel
        summary = self._create_summary_panel()

        # Create app panels
        with self.lock:
            app_panels = []
            for app in self.app_statuses.values():
                app_panels.append(self._create_app_panel(app))

        # Arrange panels in columns (2 columns for better readability)
        if app_panels:
            # Group panels into rows of 2
            rows = []
            for i in range(0, len(app_panels), 2):
                row_panels = app_panels[i : i + 2]
                if len(row_panels) == 2:
                    rows.append(Columns(row_panels, equal=True))
                else:
                    rows.append(row_panels[0])

            # Main layout: summary at top, app panels below
            layout.split_column(Layout(summary, size=8), Layout(Align.center(*rows)))
        else:
            layout.update(summary)

        return layout

    def start_live_display(self):
        """Start the live dashboard display."""
        self.running = True
        self.live = Live(
            self._create_layout(),
            console=self.console,
            refresh_per_second=1 / self.refresh_rate,
            screen=True,
        )
        self.live.start()

    def stop_live_display(self):
        """Stop the live dashboard display."""
        self.running = False
        if self.live:
            self.live.stop()

    def update_display(self):
        """Update the live display with current data."""
        if self.live and self.running:
            self.live.update(self._create_layout())

    def print_final_summary(self):
        """Print a final summary when all apps are complete."""
        self.stop_live_display()

        with self.lock:
            completed = [
                app for app in self.app_statuses.values() if app.status == "completed"
            ]
            errors = [
                app for app in self.app_statuses.values() if app.status == "error"
            ]

        # Create final summary table
        table = Table(title="🎉 Final Generation Results", box=ROUNDED)
        table.add_column("App Name", style="bold")
        table.add_column("Status", style="bold")
        table.add_column("Duration", style="cyan")
        table.add_column("Files Created", style="green")

        for app in self.app_statuses.values():
            status_color = (
                "green"
                if app.status == "completed"
                else "red" if app.status == "error" else "yellow"
            )
            table.add_row(
                app.name,
                Text(app.status.upper(), style=status_color),
                app.get_duration(),
                str(len(app.files_created)),
            )

        self.console.print("\n")
        self.console.print(table)

        # Summary stats
        total_duration = (datetime.now() - self.start_time).total_seconds()
        self.console.print(f"\n📊 Total Generation Time: {total_duration:.1f} seconds")
        self.console.print(
            f"✅ Successfully Generated: {len(completed)}/{self.total_apps} apps"
        )
        if errors:
            self.console.print(f"❌ Failed: {len(errors)} apps")

        # Save console output to file
        self.console.save_html("generation_log.html")
        self.console.print("\n💾 Full log saved to generation_log.html")


class UIManager:
    """
    Manager class to handle UI dashboard integration with the main app generator.
    This provides a clean interface for the main application to use.
    """

    def __init__(self, show_claude_output: bool = True):
        """Initialize the UI manager."""
        self.dashboard = DashboardUI(show_claude_output=show_claude_output)
        self.update_thread: Optional[threading.Thread] = None
        self.running = False

    def initialize(self, app_names: List[str]):
        """Initialize the dashboard with app names."""
        self.dashboard.initialize_apps(app_names)

    def start(self):
        """Start the dashboard and update thread."""
        self.running = True
        self.dashboard.start_live_display()

        # Start background thread to update display
        self.update_thread = threading.Thread(target=self._update_loop, daemon=True)
        self.update_thread.start()

    def stop(self):
        """Stop the dashboard."""
        self.running = False
        if self.update_thread:
            self.update_thread.join(timeout=1.0)
        self.dashboard.print_final_summary()

    def _update_loop(self):
        """Background thread to update the display."""
        while self.running:
            try:
                self.dashboard.update_display()
                time.sleep(self.dashboard.refresh_rate)
            except Exception as e:
                logger.error(f"Error updating dashboard: {e}")
                break

    def update_app_status(
        self,
        app_name: str,
        status: str,
        progress: float = None,
        current_task: str = "",
        error_message: str = "",
    ):
        """Update app status."""
        self.dashboard.update_app_status(
            app_name, status, progress, current_task, error_message
        )

    def add_claude_message(self, app_name: str, message: str):
        """Add Claude agent message."""
        self.dashboard.add_claude_message(app_name, message)

    def add_files_created(self, app_name: str, files: List[str]):
        """Add files created."""
        self.dashboard.add_files_created(app_name, files)

    def log_app_activity(self, app_name: str, message: str):
        """Log activity for an app."""
        with self.dashboard.lock:
            if app_name in self.dashboard.app_statuses:
                self.dashboard.app_statuses[app_name].add_log(message)
