import os
import requests
from langchain_core.tools import tool
import asyncio
from src.agents.browser_agent import browser_agent

@tool
def check_github_activity() -> str:
    """Uses GitHub API (or browser fallback) to check recent activity."""
    token = os.environ.get("GITHUB_TOKEN")
    
    if token:
        # API First Approach
        try:
            headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github.v3+json"}
            # Mock getting user events for now
            response = requests.get("https://api.github.com/user", headers=headers)
            if response.status_code == 200:
                user = response.json().get("login")
                events = requests.get(f"https://api.github.com/users/{user}/events/public", headers=headers).json()
                commits = [e for e in events if e.get("type") == "PushEvent"]
                return f"GitHub API Report: Found {len(commits)} recent push events for user {user}."
        except Exception as e:
            return f"API Failed. Self-Healing Protocol: Fallback to navigate_browser and read_browser_page to check github activity. Error: {str(e)}"
            
    # If no token, instruct LLM to use browser
    return "API Failed (No GITHUB_TOKEN). Self-Healing Protocol: Fallback to navigate_browser and read_browser_page to check github activity."
