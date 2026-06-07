from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from src.services.memory_engine import memory_engine
from src.services.desktop_engine import desktop_engine
from src.services.automation_engine import automation_engine
import os
import json

if os.environ.get("GEMINI_API_KEY"):
    llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=os.environ.get("GEMINI_API_KEY"))
else:
    llm = ChatOpenAI(model="qwen2.5:7b", base_url="http://localhost:11434/v1", api_key="ollama")

EXECUTIVE_PROMPT = """You are the Executive Routing Agent for Harsha's Assistant.
Your job is to analyze the user's input, inject desktop context if requested, retrieve relevant memory, and decide which specialized agent should handle the response.

Available Agents:
- 'companion': Default for general chat, emotional support, daily/weekly reviews, and task management.
- 'founder': For startup strategy, metrics, competitive analysis, business planning.
- 'research': For web search, factual inquiries, screen analysis, or coding errors.
- 'automation': Use this ONLY if the user explicitly asks to OPEN an app, CREATE a file, or DELETE something.

Output format MUST be valid JSON exactly like this:
{
  "next_agent": "companion",
  "intent": "casual_chat",
  "automation_target": "null or app/url name"
}
"""

def executive_node(state):
    messages = state["messages"]
    user_input = messages[-1].content if messages else ""
    
    # 1. Desktop Context Engine
    desktop_context = desktop_engine.get_context_snapshot()
    context_str = f"Desktop Context: App={desktop_context['active_application']}, File={desktop_context['active_file']}, Window={desktop_context['window_title']}"
    
    # 2. Extract Memory
    memories = memory_engine.search_memories(user_input, n_results=3)
    memory_str = "Memories:\n" + "\n".join([m['content'] for m in memories]) if memories else ""
    
    sys_msg = SystemMessage(content=EXECUTIVE_PROMPT + f"\n\n{context_str}\n\n{memory_str}")
    
    automation_result = None
    try:
        response = llm.invoke([sys_msg, HumanMessage(content=user_input)])
        clean_json = response.content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean_json)
        next_agent = parsed.get("next_agent", "companion")
        
        # Intercept automation before routing to sub-agents
        if next_agent == "automation":
            target = parsed.get("automation_target")
            action = automation_engine.propose_action(parsed.get("intent"), "launch_app", target)
            if action["requires_confirmation"]:
                automation_result = f"[AUTOMATION BLOCKED] Risk Level: {action['risk_level']}. Require user confirmation to {action['intent']} on {target}."
            else:
                exec_result = automation_engine.execute_action(action)
                automation_result = f"[AUTOMATION EXECUTED] {exec_result}"
                
            # Automation doesn't need to route further, or it routes to companion to speak
            next_agent = "companion"
            
    except Exception as e:
        print(f"Executive routing failed: {e}")
        next_agent = "companion" # Fallback
        
    return {
        "next_agent": next_agent,
        "desktop_context": desktop_context,
        "context": {
            "memory_str": memory_str, 
            "desktop_str": context_str,
            "automation_str": automation_result
        }
    }
