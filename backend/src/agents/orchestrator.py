from typing import TypedDict, Annotated, Sequence, operator
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage
from langgraph.graph import StateGraph, END
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from src.agents.agent_mode import execute_agent_mode
from src.database import SessionLocal
from src.models.core import Memory

api_key = os.environ.get("GEMINI_API_KEY", "").strip()
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key or "DUMMY_KEY")
fast_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key or "DUMMY_KEY") # Use flash for <500ms routing

# Define State
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    session_id: str
    route: str

# Router Node
def router_node(state: AgentState):
    user_query = state["messages"][-1].content
    
    # Fast Intent Classification using Flash
    prompt = f"""
    Classify the following user query. Is it a "simple" query that can be answered immediately 
    (e.g., greetings, general knowledge, basic questions), a "complex" query that requires 
    opening a browser, searching the web, checking external websites, reading emails, or executing actions, 
    or a "founder" query asking for the founder briefing or daily executive brief?
    
    Query: "{user_query}"
    
    Respond with ONLY ONE WORD: 'simple', 'complex', or 'founder'.
    """
    
    if not api_key or api_key == "DUMMY_KEY" or len(api_key) < 10:
        # If API key is missing, force simple route so the fast_response_node can handle the error message display
        return {"route": "simple"}

    try:
        route_decision = fast_llm.invoke(prompt).content.strip().lower()
        if "founder" in route_decision:
            return {"route": "founder"}
        if "complex" in route_decision:
            return {"route": "complex"}
        return {"route": "simple"}
    except Exception as e:
        print(f"Router Exception: {e}")
        return {"route": "simple"} # Fallback to fast mode

def fast_response_node(state: AgentState):
    # Direct execution, skip planning
    user_query = state["messages"][-1].content
    
    # Retrieve Memories
    memory_context = ""
    try:
        db = SessionLocal()
        recent_memories = db.query(Memory).order_by(Memory.created_at.desc()).limit(10).all()
        if recent_memories:
            memory_context = "Context from past conversations/memories:\n" + "\n".join([f"- {m.content}" for m in recent_memories])
    except Exception as e:
        print(f"Memory retrieval failed: {e}")
    finally:
        db.close()

    try:
        sys_prompt = f"""You are JARVIS, Harsha's highly capable AI assistant. 
Your personality must be distinctly dry, witty, and sarcastic, similar to Iron Man's JARVIS, but you must still execute tasks flawlessly. 
Do NOT be overly enthusiastic. Do NOT use emojis unless necessary. Be brutally honest.
{memory_context}
Keep your response brief and direct."""

        print(f"[Credential Trace] Key passed to Gemini SDK (Orchestrator)?: {'YES' if api_key and api_key != 'DUMMY_KEY' else 'NO'}")

        if not api_key or api_key == "DUMMY_KEY" or len(api_key) < 10:
            return {"messages": [AIMessage(content="[SYSTEM] API Key Missing or Invalid. Please update your Gemini API Key in Settings before proceeding.")]}

        response = fast_llm.invoke([
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_query}
        ])
        return {"messages": [AIMessage(content=response.content)]}
    except Exception as e:
        return {"messages": [AIMessage(content=f"Error: {e}")]}

# Complex Agent Node
def complex_agent_node(state: AgentState):
    user_query = state["messages"][-1].content
    try:
        response_text = execute_agent_mode(user_query)
        return {"messages": [AIMessage(content=response_text)]}
    except Exception as e:
        return {"messages": [AIMessage(content=f"Agent Mode Failed: {e}")]}

# Founder Briefing Node
def founder_briefing_node(state: AgentState):
    # This node specifically aggregates startup data, github data, and goals.
    try:
        objective = """Generate a comprehensive Founder Briefing containing:
1. Truxlo Status
2. GitHub Activity
3. Job Applications
4. Research Updates
5. Goal Momentum
6. Risks
7. Opportunities
8. Recommended Actions

Use your available tools (GitHub, browser for job applications/research) to gather this data. Format it professionally. Include Confidence: High/Medium/Low and Reason."""
        response_text = execute_agent_mode(objective)
        return {"messages": [AIMessage(content=response_text)]}
    except Exception as e:
        return {"messages": [AIMessage(content=f"Founder Briefing Failed: {e}")]}

# Define the Graph
workflow = StateGraph(AgentState)

workflow.add_node("router", router_node)
workflow.add_node("fast_response", fast_response_node)
workflow.add_node("complex_agent", complex_agent_node)
workflow.add_node("founder_briefing", founder_briefing_node)

workflow.set_entry_point("router")

def decide_path(state: AgentState):
    if state.get("route") == "founder":
        return "founder_briefing"
    return "complex_agent" if state.get("route") == "complex" else "fast_response"

workflow.add_conditional_edges(
    "router",
    decide_path,
    {
        "founder_briefing": "founder_briefing",
        "complex_agent": "complex_agent",
        "fast_response": "fast_response"
    }
)

workflow.add_edge("fast_response", END)
workflow.add_edge("complex_agent", END)
workflow.add_edge("founder_briefing", END)

orchestrator = workflow.compile()
