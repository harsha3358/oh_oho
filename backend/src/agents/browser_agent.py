import os
import asyncio
from playwright.async_api import async_playwright
import urllib.request

class BrowserAgent:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        self.is_connected = False
        
        # Paths
        self.cdp_url = "http://localhost:9222"
        self.jarvis_profile = os.path.expanduser('~/.jarvis_chrome_profile')

    async def initialize(self):
        if self.is_connected:
            return
            
        self.playwright = await async_playwright().start()
        
        # Primary: Attempt to connect to existing Chrome session via CDP
        try:
            # Check if port 9222 is alive
            req = urllib.request.Request(f"{self.cdp_url}/json/version")
            urllib.request.urlopen(req, timeout=1)
            
            print("Connecting to existing Chrome session via CDP...")
            self.browser = await self.playwright.chromium.connect_over_cdp(self.cdp_url)
            self.context = self.browser.contexts[0]
            self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()
            self.is_connected = True
            print("Browser Agent attached to existing Chrome.")
            return
        except Exception as e:
            print(f"Could not connect via CDP (Chrome not running with --remote-debugging-port=9222). Error: {e}")
            
        # Fallback: Launch Dedicated JARVIS Profile
        print(f"Launching fallback persistent profile at {self.jarvis_profile}...")
        os.makedirs(self.jarvis_profile, exist_ok=True)
        
        try:
            self.context = await self.playwright.chromium.launch_persistent_context(
                user_data_dir=self.jarvis_profile,
                headless=False, # We want to see it!
                channel="chrome", # Use system chrome if installed, otherwise chromium
            )
            self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()
            self.is_connected = True
            print("Browser Agent started with fallback profile.")
        except Exception as e:
            print(f"Failed to launch persistent context: {e}")

    async def close(self):
        if self.context:
            await self.context.close()
        if self.playwright:
            await self.playwright.stop()
        self.is_connected = False

    async def ensure_active(self):
        if not self.is_connected or self.page.is_closed():
            await self.initialize()
            if self.page.is_closed():
                self.page = await self.context.new_page()

    # --- Agent Capabilities ---

    async def navigate(self, url: str):
        await self.ensure_active()
        print(f"Navigating to {url}")
        await self.page.goto(url, wait_until="domcontentloaded")
        return f"Successfully navigated to {url}"

    async def click(self, selector: str):
        await self.ensure_active()
        try:
            await self.page.click(selector, timeout=5000)
            return f"Clicked element: {selector}"
        except Exception as e:
            return f"Failed to click {selector}: {e}"

    async def fill(self, selector: str, text: str):
        await self.ensure_active()
        try:
            await self.page.fill(selector, text, timeout=5000)
            return f"Filled {text} into {selector}"
        except Exception as e:
            return f"Failed to fill {selector}: {e}"

    async def extract_text(self, selector: str = "body"):
        await self.ensure_active()
        try:
            text = await self.page.locator(selector).inner_text(timeout=5000)
            return text
        except Exception as e:
            return f"Failed to extract text: {e}"

    async def extract_page_summary(self):
        """Extracts titles, headings, and key text for LLM summarization"""
        await self.ensure_active()
        try:
            title = await self.page.title()
            headings = await self.page.evaluate('''() => {
                return Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText).filter(t => t.trim().length > 0);
            }''')
            return {"title": title, "headings": headings}
        except Exception as e:
            return f"Failed to summarize page: {e}"

browser_agent = BrowserAgent()
