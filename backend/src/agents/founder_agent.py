from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from src.services.memory_engine import memory_engine
import os

if os.environ.get("GEMINI_API_KEY"):
    llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=os.environ.get("GEMINI_API_KEY"))
else:
    llm = ChatOpenAI(model="qwen2.5:7b", base_url="http://localhost:11434/v1", api_key="ollama")

FOUNDER_PROMPT = """[FOUNDER MODE] You are acting as a high-tier executive coach and technical co-founder.
Focus purely on startup strategy, product execution, and competitive advantage. 
Be brutally honest and metrics-driven."""

def founder_node(state):
    messages = state["messages"]
    user_input = messages[-1].content
    
    # Isolate founder memory extraction
    founder_memories = memory_engine.search_memories(user_input, n_results=5, category_filter="startup")
    memory_str = "Startup Context:\n" + "\n".join([m['content'] for m in founder_memories]) if founder_memories else "No existing startup context."
    
    # Extract startup milestones explicitly
    if "metric" in user_input.lower() or "launched" in user_input.lower():
        memory_engine.store_memory(
            content=f"Founder update: {user_input}",
            category="startup",
            importance=0.9,
            emotional_weight=0.8
        )
        # Add to Life Graph
        memory_engine.add_life_graph_node("Startup", f"Update: {user_input}")

    sys_msg = SystemMessage(content=FOUNDER_PROMPT + f"\n\n{memory_str}")
    response = llm.invoke([sys_msg, HumanMessage(content=user_input)])
    
    return {"messages": [response]}
