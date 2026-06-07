import time
import json
import uuid

class ApprovalManager:
    def __init__(self):
        self.pending_approvals = {}
        self.websocket_manager = None
        
    def set_websocket_manager(self, manager):
        self.websocket_manager = manager

    def request_approval(self, action_summary: str, risk_level: str, target: str, preview: str) -> str:
        """
        Pauses the current thread and waits for the frontend to send an approval decision.
        """
        request_id = str(uuid.uuid4())
        self.pending_approvals[request_id] = "PENDING"
        
        request_payload = {
            "type": "human_approval_request",
            "data": {
                "id": request_id,
                "action_summary": action_summary,
                "risk_level": risk_level,
                "target": target,
                "preview": preview
            }
        }
        
        # If we have a reference to the websocket manager, broadcast the request
        if self.websocket_manager:
            import asyncio
            # We are in a synchronous thread (Langchain tool), so we must schedule it on the loop
            try:
                loop = asyncio.get_event_loop()
                asyncio.run_coroutine_threadsafe(self.websocket_manager.broadcast(json.dumps(request_payload)), loop)
            except Exception as e:
                print(f"Failed to broadcast approval request: {e}")
        
        print(f"--- HUMAN APPROVAL REQUIRED ({risk_level} Risk) ---")
        print(f"Action: {action_summary} | Target: {target}")
        
        # Suspend execution
        timeout = 120 # 2 minutes timeout
        elapsed = 0
        while self.pending_approvals[request_id] == "PENDING":
            time.sleep(1)
            elapsed += 1
            if elapsed >= timeout:
                self.pending_approvals[request_id] = "REJECTED_TIMEOUT"
                break
                
        decision = self.pending_approvals[request_id]
        del self.pending_approvals[request_id]
        return decision

    def resolve_approval(self, request_id: str, decision: str):
        """
        Called by the WebSocket handler when the user clicks Approve/Reject/Edit.
        """
        if request_id in self.pending_approvals:
            self.pending_approvals[request_id] = decision

approval_manager = ApprovalManager()
