from langchain_core.tools import tool
import asyncio
from src.agents.browser_agent import browser_agent
from src.services.approval_manager import approval_manager

@tool
def send_whatsapp_message(phone_number: str, message: str) -> str:
    """Uses Playwright to open WhatsApp Web and send a message. Format phone_number with country code (e.g. 1234567890)."""
    
    # Human-in-the-Loop Barrier (Medium Risk)
    decision = approval_manager.request_approval(
        action_summary="Send WhatsApp Message",
        risk_level="Medium",
        target=phone_number,
        preview=message
    )
    
    if decision != "APPROVE":
        return f"User rejected the WhatsApp message (Reason: {decision}). Do not attempt to send it."

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    try:
        url = f"https://web.whatsapp.com/send?phone={phone_number}&text={message}"
        loop.run_until_complete(browser_agent.navigate(url))
        # Wait for the page to load and click the send button
        loop.run_until_complete(asyncio.sleep(10)) # Give WhatsApp time to load
        loop.run_until_complete(browser_agent.click('button[aria-label="Send"]'))
        return f"Successfully queued WhatsApp message to {phone_number}."
    except Exception as e:
        return f"Failed to send WhatsApp message: {e}. Make sure the user is logged into WhatsApp Web."
