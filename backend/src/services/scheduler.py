from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.services.briefing_engine import briefing_engine
from src.services.goal_engine import goal_engine
import json

class ProactiveScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.connection_manager = None
        self.active_session_ws = None

    def initialize(self, connection_manager):
        self.connection_manager = connection_manager
        
        # Schedule Daily Briefing (Morning)
        self.scheduler.add_job(self.trigger_daily_brief, 'cron', hour=8, minute=0)
        
        # Schedule Evening Review
        self.scheduler.add_job(self.trigger_evening_review, 'cron', hour=20, minute=0)
        
        # Schedule Weekly Review (Sunday)
        self.scheduler.add_job(self.trigger_weekly_review, 'cron', day_of_week='sun', hour=21, minute=0)
        
        # Accountability Scanner (Runs periodically)
        self.scheduler.add_job(self.scan_goals, 'interval', hours=12)
        
        self.scheduler.start()

    async def _send_notification(self, title: str, message: str, type: str = "toast"):
        """Sends a proactive push notification down the WebSocket to the frontend."""
        if not self.connection_manager or not self.connection_manager.active_connections:
            return
            
        payload = {
            "type": "proactive_notification",
            "notification_type": type,
            "title": title,
            "message": message
        }
        # Broadcast to all active connections (usually just the one Electron client)
        for ws in self.connection_manager.active_connections:
            await self.connection_manager.send_personal_message(json.dumps(payload), ws)

    async def trigger_daily_brief(self):
        brief = briefing_engine.generate_daily_brief()
        await self._send_notification("Morning Executive Brief", brief, type="brief_panel")
        
    async def trigger_evening_review(self):
        await self._send_notification("Evening Review", "Sir, it's time for your evening review. What went well today?", type="toast")
        
    async def trigger_weekly_review(self):
        review = briefing_engine.generate_weekly_review()
        await self._send_notification("Weekly Strategy Review", review, type="review_panel")

    async def scan_goals(self):
        """Scans goals for stagnant momentum and generates nudges."""
        active_goals = goal_engine.get_all_active_goals()
        for g in active_goals:
            nudge = goal_engine.generate_accountability_nudge(g)
            if nudge:
                await self._send_notification("Goal Accountability Alert", nudge, type="toast")

proactive_scheduler = ProactiveScheduler()
