from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from src.services.memory_engine import memory_engine
import os

if os.environ.get("GEMINI_API_KEY"):
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=os.environ.get("GEMINI_API_KEY"))
else:
    llm = ChatOpenAI(model="qwen2.5:7b", base_url="http://localhost:11434/v1", api_key="ollama")

COMPANION_PROMPT = """You are JARVIS. Personality: FRIDAY/Tony Stark blend. Humor level: 10/10.
You are the final Companion Layer. Your job is to take the factual/technical output from the specialized agents (if any) and deliver it to the user with your distinct personality.

PERSONALITY MEMORY:
Continuously track the user's communication style, inside jokes, motivators, and learning preferences. 
If you notice a pattern, subtly acknowledge it. If they are stressed, dial back the sarcasm and increase support.
If they are executing well, increase the banter.

Do NOT lose any factual details, code, or metrics. Just wrap it in your personality.
If there is no specialized agent output, just chat with the user normally.
Always refer to the Context block provided by the Executive.
"""

def companion_node(state):
    messages = state["messages"]
    user_input = messages[0].content # Original user input is the first message in this cycle
    context = state.get("context", {})
    
    # Check if a previous agent (founder, research) generated a response in this cycle
    previous_agent_output = ""
    if len(messages) > 1:
        previous_agent_output = f"\n\n[Specialized Agent Output to Format]:\n{messages[-1].content}"
    
    # Simple Daily Check-in / Memory Storage trigger
    system_injection = ""
    if "how am i doing" in user_input.lower() or "review" in user_input.lower():
        system_injection = "User is requesting a review. Analyze their goals and metrics."

    sys_msg = SystemMessage(content=COMPANION_PROMPT + f"\n\n{context.get('desktop_str', '')}\n\n{context.get('memory_str', '')}\n{system_injection}{previous_agent_output}")
    
    # Store standard conversational memory (only store user intent, avoid duplicates)
    if len(user_input) > 20 and len(messages) == 1:
        memory_engine.store_memory(
            content=f"User stated: {user_input}",
            category="preference",
            importance=0.4,
            emotional_weight=0.6
        )

    response = llm.invoke([sys_msg, HumanMessage(content=user_input)])
    
    # Replace the specialized agent message with the Companion formatted message
    return {"messages": [response]}

