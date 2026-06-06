import os
import subprocess
import webbrowser
import platform

class AutomationEngine:
    def __init__(self):
        self.safe_mode_enabled = False
        
        # Strict action whitelist
        self.ALLOWED_ACTIONS = {
            "open_url": True,
            "launch_app": ["chrome", "code", "notepad", "explorer"],
            "create_file": True,
        }

    def set_safe_mode(self, enabled: bool):
        self.safe_mode_enabled = enabled

    def propose_action(self, intent: str, action_type: str, target: str) -> dict:
        """Calculates risk level and requires confirmation for actions."""
        if self.safe_mode_enabled:
            return {"status": "blocked", "reason": "Safe Mode active. Automation disabled."}
            
        risk_level = "LOW"
        requires_confirmation = False
        
        if action_type not in self.ALLOWED_ACTIONS:
            return {"status": "blocked", "reason": f"Action type '{action_type}' is strictly prohibited."}
            
        if action_type == "launch_app":
            # Target must be one of the explicitly allowed application names
            allowed_apps = self.ALLOWED_ACTIONS["launch_app"]
            if not any(app in target.lower() for app in allowed_apps):
                return {"status": "blocked", "reason": f"App '{target}' is not in the whitelist."}

        if action_type in ["create_file"]:
            risk_level = "MEDIUM"
            requires_confirmation = True
            
        return {
            "intent": intent,
            "action_type": action_type,
            "target": target,
            "risk_level": risk_level,
            "requires_confirmation": requires_confirmation,
            "status": "pending_approval" if requires_confirmation else "approved"
        }

    def execute_action(self, action_payload: dict) -> str:
        """Executes the action if approved and allowed."""
        if self.safe_mode_enabled:
            return "Automation blocked: JARVIS is in Safe Mode."
            
        if action_payload.get("status") != "approved":
            return f"Action blocked: {action_payload.get('reason', 'Requires user confirmation.')}"
            
        action_type = action_payload.get("action_type")
        target = action_payload.get("target")
        
        try:
            if action_type == "open_url":
                if not target.startswith(("http://", "https://")):
                    return "Blocked: Only HTTP/HTTPS URLs are allowed."
                webbrowser.open(target)
                return f"Successfully opened URL: {target}"
                
            elif action_type == "launch_app":
                allowed_apps = self.ALLOWED_ACTIONS["launch_app"]
                if not any(app in target.lower() for app in allowed_apps):
                    return "Blocked: App not in whitelist."
                
                # In production, these would map to absolute system paths
                # For sprint 5, we use the safe shell string if on Windows
                if platform.system() == "Windows":
                    os.startfile(target)
                else:
                    subprocess.Popen([target])
                return f"Successfully launched app: {target}"
                
            elif action_type == "create_file":
                # Ensure it doesn't try to write outside of expected directories
                safe_dir = os.path.join(os.path.expanduser("~"), "Documents")
                abs_target = os.path.abspath(target)
                if not abs_target.startswith(safe_dir):
                    return f"Blocked: Can only create files in {safe_dir}"
                    
                content = action_payload.get("content", "")
                with open(abs_target, 'w') as f:
                    f.write(content)
                return f"Successfully created file: {abs_target}"
                
            else:
                return f"Unsupported or blocked action type: {action_type}"
        except Exception as e:
            return f"Action failed during execution: {str(e)}"

automation_engine = AutomationEngine()
