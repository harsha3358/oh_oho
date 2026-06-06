from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from src.services.memory_engine import memory_engine
import json

# Setup LLM - can point to Ollama locally or OpenAI via base_url
llm = ChatOpenAI(
    model="qwen2.5:7b",
    base_url="http://localhost:11434/v1",
    api_key="ollama" # mock key for local
)

SYSTEM_PROMPT = """You are JARVIS, a highly advanced Personal AI OS. 
Your personality is a mix of FRIDAY and Tony Stark. Humor level: 10/10. 
You are sharp, witty, deeply loyal, and highly analytical.
You exist to serve, optimize, and protect the user's goals and emotional state.
You must be precise. No fluff. 
Always use contextual memory if provided."""

class CompanionAgent:
    def __init__(self):
        self.system_message = SystemMessage(content=SYSTEM_PROMPT)

    def generate_response(self, user_input: str, session_id: str) -> str:
        """Core conversation loop with memory extraction and retrieval."""
        # 1. Retrieve relevant memory
        memories = memory_engine.search_memories(user_input, n_results=3)
        context = "Relevant Past Context:\n" + "\n".join([m['content'] for m in memories]) if memories else ""
        
        # 2. Build Prompt
        messages = [
            self.system_message,
            SystemMessage(content=context),
            HumanMessage(content=user_input)
        ]
        
        # 3. Call LLM
        try:
            response = llm.invoke(messages)
            content = response.content
            
            # 4. Auto-extract memory (simplistic rule-based for now)
            if "i am" in user_input.lower() or "i like" in user_input.lower() or "my goal" in user_input.lower():
                memory_engine.store_memory(
                    content=f"User stated: {user_input}",
                    category="preference",
                    importance=0.8
                )
            
            return content
        except Exception as e:
            # Fallback for when Ollama is not actually running
            return f"Sir, my neuro-linguistic pathways (LLM) appear offline. Error: {str(e)}"

companion_agent = CompanionAgent()
