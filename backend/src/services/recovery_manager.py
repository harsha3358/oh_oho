import os
import shutil
import datetime
from pathlib import Path
import json

class RecoveryManager:
    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), "..", "..", "jarvis.db")
        self.backup_dir = os.path.join(os.path.dirname(__file__), "..", "..", "backups")
        
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)

    def trigger_backup(self):
        """Creates a timestamped copy of the database and settings."""
        if not os.path.exists(self.db_path):
            return {"status": "failed", "reason": "No database found to backup."}
            
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(self.backup_dir, f"jarvis_backup_{timestamp}.db")
        
        try:
            shutil.copy2(self.db_path, backup_file)
            return {"status": "success", "file": backup_file}
        except Exception as e:
            return {"status": "failed", "reason": str(e)}

    def generate_diagnostics(self) -> dict:
        """Returns critical system health metrics."""
        try:
            import psutil
            cpu_usage = psutil.cpu_percent(interval=0.1)
            memory_info = psutil.virtual_memory()
            mem_usage = memory_info.percent
        except ImportError:
            cpu_usage = "N/A"
            mem_usage = "N/A"

        return {
            "status": "healthy",
            "cpu_usage_percent": cpu_usage,
            "memory_usage_percent": mem_usage,
            "database_size_mb": round(os.path.getsize(self.db_path) / (1024 * 1024), 2) if os.path.exists(self.db_path) else 0,
            "ai_provider": "Gemini" if os.environ.get("GEMINI_API_KEY") else "Ollama (Limited Mode)",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

recovery_manager = RecoveryManager()
