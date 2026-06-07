from src.services.memory_engine import memory_engine
from src.services.goal_engine import goal_engine
from langchain_core.messages import SystemMessage, HumanMessage

class ReflectionEngine:
    def __init__(self):
        from src.agents.executive_agent import llm
        self.llm = llm

    def generate_reflection(self, topic: str = "week") -> str:
        """Generates deep insights and patterns based on the requested topic."""
        
        # Gather relevant memories
        memories = memory_engine.search_memories(f"reflect on {topic}", n_results=15)
        memory_context = "\n".join([m['content'] for m in memories])
        
        # Gather active goals
        goals = goal_engine.get_all_active_goals()
        goal_context = "\n".join([f"- {g.title} ({g.progress * 100}%)" for g in goals])
        
        sys_msg = SystemMessage(content=f"""You are Harsha's Assistant's Reflection Engine.
The user wants to reflect on: {topic}.
Analyze the provided memories and goals. Generate a structured reflection output containing:
- Patterns Detected
- Key Insights
- Potential Mistakes or Blindspots
- Growth Opportunities
- Strategic Recommendations
Be blunt, objective, and highly strategic. Do not flatter the user.""")

        response = self.llm.invoke([sys_msg, HumanMessage(content=f"Memories:\n{memory_context}\n\nGoals:\n{goal_context}")])
        
        # Store the reflection back into the Life Graph
        memory_engine.add_life_graph_node("Reflection", f"Reflection on {topic}", {"insights": response.content})
        
        return response.content

reflection_engine = ReflectionEngine()
