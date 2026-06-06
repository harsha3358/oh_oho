import datetime
from sqlalchemy.orm import Session
from src.database import SessionLocal
from src.models.core import Goal

class GoalEngine:
    def __init__(self):
        self.db: Session = SessionLocal()

    def get_all_active_goals(self):
        return self.db.query(Goal).filter(Goal.status == "active").all()

    def update_progress(self, goal_id: str, new_progress: float):
        goal = self.db.query(Goal).filter(Goal.id == goal_id).first()
        if goal:
            goal.progress = new_progress
            goal.last_updated_at = datetime.datetime.utcnow()
            self.db.commit()
            return True
        return False

    def calculate_momentum(self, goal: Goal) -> dict:
        """Calculates momentum (0-100%) based on activity frequency and progress."""
        now = datetime.datetime.utcnow()
        days_since_update = (now - goal.last_updated_at).days if goal.last_updated_at else 0
        
        # Base momentum from raw progress
        base_momentum = goal.progress * 100
        
        # Decay momentum rapidly if untouched for > 3 days
        decay_factor = max(0.1, 1.0 - (days_since_update * 0.15))
        
        momentum_score = int(base_momentum * decay_factor)
        if days_since_update == 0:
            momentum_score = min(100, momentum_score + 20) # Boost for same-day activity
            
        status = "Excellent"
        if momentum_score < 25:
            status = "At Risk"
        elif momentum_score < 60:
            status = "Needs Attention"
            
        return {
            "progress": f"{goal.progress * 100:.0f}%",
            "momentum_score": momentum_score,
            "status": status,
            "days_stagnant": days_since_update
        }

    def generate_accountability_nudge(self, goal: Goal) -> str:
        """Generates the context for the Executive agent to decide why a goal stagnated."""
        momentum_data = self.calculate_momentum(goal)
        if momentum_data["status"] == "At Risk":
            return (f"Goal '{goal.title}' is At Risk. Stagnant for {momentum_data['days_stagnant']} days. "
                    f"Momentum dropped to {momentum_data['momentum_score']}%. "
                    f"Ask the user to determine the bottleneck (Overwhelmed? Blocked? Lost Interest? Competing Priorities?) "
                    f"and propose a smaller next action.")
        return ""

goal_engine = GoalEngine()
