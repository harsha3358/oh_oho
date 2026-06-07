from langchain_core.tools import tool
import asyncio
from src.agents.browser_agent import browser_agent

@tool
def check_gmail() -> str:
    """Uses Gmail API (or browser fallback) to check unread emails."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    loop.run_until_complete(browser_agent.navigate("https://mail.google.com/"))
    return loop.run_until_complete(browser_agent.extract_page_summary())
