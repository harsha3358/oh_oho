from langchain_core.tools import tool
import asyncio
from src.agents.browser_agent import browser_agent

@tool
def search_drive(query: str) -> str:
    """Uses Google Drive API (or browser fallback) to search for documents."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    loop.run_until_complete(browser_agent.navigate(f"https://drive.google.com/drive/search?q={query}"))
    return loop.run_until_complete(browser_agent.extract_page_summary())
