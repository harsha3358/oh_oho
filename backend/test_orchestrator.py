from src.agents.orchestrator import orchestrator
from langchain_core.messages import HumanMessage
import sys
import asyncio

print("\n--- Test 1: Desktop Context ---")
res = orchestrator.invoke({"messages": [HumanMessage(content="What am I working on right now?")], "session_id": "test1", "next_agent": "executive", "context": {}, "desktop_context": {}})
print(res["messages"][-1].content)

print("\n--- Test 2: Automation ---")
res = orchestrator.invoke({"messages": [HumanMessage(content="JARVIS, open Google Chrome for me.")], "session_id": "test1", "next_agent": "executive", "context": {}, "desktop_context": {}})
print(res["context"].get("automation_str"))

print("\n--- Test 3: Vision ---")
res = orchestrator.invoke({"messages": [HumanMessage(content="Look at this screen and tell me what's on it.")], "session_id": "test1", "next_agent": "executive", "context": {}, "desktop_context": {}})
print(res["messages"][-1].content)
