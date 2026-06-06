from src.models.core import GrowthMetric
from src.database import SessionLocal
import datetime

class GrowthEngine:
    def __init__(self):
        self.db = SessionLocal()

    def log_metric(self, metric_type: str, value: float, notes: str = ""):
        """Logs a behavioral indicator metric (e.g. Confidence, Focus, Execution Velocity)"""
        metric = GrowthMetric(
            user_id="default_user",
            metric_type=metric_type,
            value=value,
            notes=notes
        )
        self.db.add(metric)
        self.db.commit()
        return metric.id

    def generate_growth_report(self, timeframe_days: int = 7) -> dict:
        """Generates a structured report of growth metrics over the specified timeframe."""
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=timeframe_days)
        metrics = self.db.query(GrowthMetric).filter(GrowthMetric.logged_at >= cutoff).all()
        
        report = {}
        for m in metrics:
            if m.metric_type not in report:
                report[m.metric_type] = []
            report[m.metric_type].append(m.value)
            
        # Calculate trends
        trends = {}
        for m_type, values in report.items():
            avg = sum(values) / len(values)
            # Very basic trend detection
            trend = "Stable"
            if len(values) > 1:
                if values[-1] > values[0]: trend = "Improving"
                elif values[-1] < values[0]: trend = "Declining"
            trends[m_type] = {"average": avg, "trend": trend}
            
        return trends

growth_engine = GrowthEngine()
