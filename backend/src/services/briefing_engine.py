from src.services.goal_engine import goal_engine
from src.services.memory_engine import memory_engine
from langchain_core.messages import SystemMessage, HumanMessage
import os
import datetime

class BriefingEngine:
    def __init__(self):
        from src.agents.executive_agent import llm # Use the shared LLM instance
        self.llm = llm

    def generate_daily_brief(self) -> str:
        """Generates the Morning Executive Brief."""
        active_goals = goal_engine.get_all_active_goals()
        
        goal_context = "Active Goals Context:\n"
        for g in active_goals:
            m = goal_engine.calculate_momentum(g)
            goal_context += f"- {g.title}: Progress {m['progress']}, Momentum: {m['momentum_score']}% ({m['status']})\n"
            
        sys_msg = SystemMessage(content="""You are Harsha's Assistant, acting as Chief of Staff. 
Generate the Daily Executive Brief. Include:
1. Top Priorities (based on the active goals provided).
2. Potential Risks (Identify goals with At Risk momentum).
3. Recommended Focus.
Keep it strictly professional, concise, and highly actionable.""")
        
        response = self.llm.invoke([sys_msg, HumanMessage(content=goal_context)])
        return response.content

    def generate_weekly_review(self) -> str:
        """Generates the Sunday Weekly Strategy Review."""
        # In a real scenario, this fetches metrics from the past 7 days.
        active_goals = goal_engine.get_all_active_goals()
        recent_memories = memory_engine.search_memories("wins failures lessons", n_results=10)
        
        mem_ctx = "Recent Insights:\n" + "\n".join([m['content'] for m in recent_memories])
        goal_context = "Goals Status:\n" + "\n".join([f"- {g.title}: {g.progress*100}%" for g in active_goals])
        
        sys_msg = SystemMessage(content="""You are Harsha's Assistant. Generate a Weekly Strategy Review.
This is a strategic review, not a productivity review.
Extract patterns from the provided insights and goals.
Format:
Wins:
Concerns:
Recommendation:""")

        response = self.llm.invoke([sys_msg, HumanMessage(content=goal_context + "\n" + mem_ctx)])
        return response.content

briefing_engine = BriefingEngine()
