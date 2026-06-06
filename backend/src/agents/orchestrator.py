from typing import TypedDict, Annotated, Sequence, operator
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END
from src.agents.executive_agent import executive_node
from src.agents.companion_agent import companion_node
from src.agents.founder_agent import founder_node
from src.agents.research_agent import research_node

# Define State
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    session_id: str
    next_agent: str
    context: dict
    desktop_context: dict

# Define the Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("executive", executive_node)
workflow.add_node("companion", companion_node)
workflow.add_node("founder", founder_node)
workflow.add_node("research", research_node)

# Add Edges
workflow.set_entry_point("executive")

# Routing Logic based on 'next_agent' output from Executive
def route_next(state: AgentState):
    next_node = state.get("next_agent", "companion")
    if next_node in ["founder", "research"]:
        return next_node
    return "companion" # Default fallback

workflow.add_conditional_edges(
    "executive",
    route_next,
    {
        "companion": "companion",
        "founder": "founder",
        "research": "research"
    }
)

# Mandatory Companion Layer architecture
# All specialized agents must pass their output to the Companion Layer for final personality alignment
workflow.add_edge("founder", "companion")
workflow.add_edge("research", "companion")

# Only Companion routes to END
workflow.add_edge("companion", END)

# Compile Graph
orchestrator = workflow.compile()
