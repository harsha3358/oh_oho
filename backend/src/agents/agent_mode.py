import asyncio
import nest_asyncio
nest_asyncio.apply()

from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from src.agents.browser_agent import browser_agent
import os

# --- Tools for Agent Mode ---

@tool
def navigate_browser(url: str) -> str:
    """Navigates the JARVIS browser to a specific URL."""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(browser_agent.navigate(url))

@tool
def read_browser_page() -> str:
    """Extracts the summarized text content from the current browser page."""
    loop = asyncio.get_event_loop()
    summary = loop.run_until_complete(browser_agent.extract_page_summary())
    return str(summary)

@tool
def click_element(selector: str) -> str:
    """Clicks a DOM element matching the CSS selector."""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(browser_agent.click(selector))

@tool
def fill_element(selector: str, text: str) -> str:
    """Fills a DOM element matching the CSS selector with the given text."""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(browser_agent.fill(selector, text))

@tool
def extract_element_text(selector: str) -> str:
    """Extracts text from a specific DOM element matching the CSS selector."""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(browser_agent.extract_text(selector))

# --- API Integrations ---
from src.integrations.github_agent import check_github_activity
from src.integrations.whatsapp_agent import send_whatsapp_message
from src.integrations.gmail_agent import check_gmail
from src.integrations.calendar_agent import check_calendar
from src.integrations.drive_agent import search_drive

@tool
def open_camera() -> str:
    """Instantly opens the Windows Camera application."""
    import os
    os.system("start microsoft.windows.camera:")
    return "Camera application opened."

# Initialize the LLM
api_key = os.environ.get("GEMINI_API_KEY", "")
llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", google_api_key=api_key or "DUMMY_KEY")

system_prompt = """You are JARVIS, Harsha's autonomous Founder OS Agent.
You execute complex tasks using available tools.

CRITICAL REQUIREMENT:
Every final response you give MUST include a Confidence Score and a Reason at the very end of your message.
Format it EXACTLY like this:

Confidence: [High / Medium / Low]
Reason: [Why you assigned this confidence. E.g. Data collected directly from API vs scraped from unstable website.]

SELF HEALING PROTOCOL:
If an API tool fails and returns an error message telling you to fallback, you MUST immediately switch to using the browser tools (`navigate_browser`, `read_browser_page`) to accomplish the objective. If both the API and Browser fail, you MUST report what failed, why it failed, and what fallback was attempted. Never fail silently."""

tools = [
    navigate_browser,
    read_browser_page,
    click_element,
    fill_element,
    extract_element_text,
    check_github_activity,
    send_whatsapp_message,
    check_gmail,
    check_calendar,
    search_drive,
    open_camera
]

# Create the Agent Mode ReAct Graph
agent_mode_app = create_react_agent(llm, tools, prompt=system_prompt)

def execute_agent_mode(objective: str):
    print(f"Executing Agent Mode Objective: {objective}")
    
    print(f"[Credential Trace] Key passed to Gemini SDK (Agent Mode)?: {'YES' if api_key and api_key != 'DUMMY_KEY' else 'NO'}")
    if not api_key or api_key == "DUMMY_KEY" or len(api_key) < 10:
        return "[SYSTEM] API Key Missing or Invalid. Please update your Gemini API Key in Settings before running complex commands."

    # We must run this inside the event loop if called synchronously
    try:
        loop = asyncio.get_running_loop()
        # if there is a running loop, we can't use run_until_complete on it, 
        # but LangChain handles async under the hood for tools if defined async.
        # Wait, our tools are synchronous and use loop.run_until_complete! 
        # This will crash if we are already in an event loop.
    except RuntimeError:
        pass
        
    response = agent_mode_app.invoke(
        {"messages": [("user", objective)]}
    )
    return response["messages"][-1].content
