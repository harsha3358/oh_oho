from src.services.memory_engine import memory_engine

class FounderMode:
    def __init__(self):
        self.active = False
        self.startup_context = "No startup context defined yet."
        
    def activate(self):
        self.active = True
        
    def deactivate(self):
        self.active = False
        
    def get_context(self):
        if not self.active:
            return ""
        
        # Retrieve startup-specific memories
        memories = memory_engine.search_memories("startup business product revenue", n_results=5)
        memory_str = "\n".join([m['content'] for m in memories if m.get('metadata', {}).get('category') == 'startup'])
        
        return f"""
        [FOUNDER MODE ACTIVE]
        You are now acting as a high-tier executive coach and technical co-founder.
        Be brutally honest, focus on execution, metrics, and growth.
        Current Startup Context: {memory_str}
        """

    def record_startup_metric(self, metric_name: str, value: str):
        """Specifically tags this memory as a startup metric for isolation."""
        memory_engine.store_memory(
            content=f"Startup Metric Updated: {metric_name} = {value}",
            category="startup",
            importance=1.0
        )

founder_mode = FounderMode()
