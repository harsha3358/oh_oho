from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from src.services.desktop_engine import desktop_engine, vision_engine
from src.services.memory_engine import memory_engine
import os

if os.environ.get("GEMINI_API_KEY"):
    llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=os.environ.get("GEMINI_API_KEY"))
else:
    llm = ChatOpenAI(model="qwen2.5:7b", base_url="http://localhost:11434/v1", api_key="ollama")

RESEARCH_PROMPT = """You are the Research & Analysis Agent.
You handle screen analysis, debugging, and deep factual investigations.
When you complete a research task, you MUST extract insights and recommendations.
Format your output cleanly:
- Summary
- Opportunities
- Risks
- Action Items
"""

def research_node(state):
    messages = state["messages"]
    user_input = messages[-1].content
    
    # If the user asks about the screen, invoke the Vision Engine
    if "look at this" in user_input.lower() or "analyze this screen" in user_input.lower():
        vision_analysis = vision_engine.analyze_screen(user_input)
        response_text = f"Based on my visual analysis:\n{vision_analysis}"
        
        # Save insight to Life Graph
        memory_engine.add_life_graph_node("Research", f"Vision Analysis: {user_input}", {"insights": vision_analysis})
        
        return {"messages": [AIMessage(content=response_text)]}
        
    sys_msg = SystemMessage(content=RESEARCH_PROMPT)
    response = llm.invoke([sys_msg, HumanMessage(content=user_input)])
    
    # Store research brief in Memory and Life Graph
    memory_engine.add_life_graph_node("Research", f"Query: {user_input}", {"insights": response.content})
    memory_engine.store_memory(f"Research on '{user_input}': {response.content}", category="research", importance=0.8)
    
    return {"messages": [response]}
