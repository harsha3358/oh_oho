import os
import pygetwindow as gw
import psutil
import mss
import base64
from io import BytesIO
import pytesseract
from PIL import Image
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

class DesktopEngine:
    def get_context_snapshot(self) -> dict:
        """Returns the current desktop context: active window, active app, CPU/RAM stats."""
        try:
            active_window = gw.getActiveWindow()
            title = active_window.title if active_window else "Unknown"
        except Exception:
            title = "Unknown (Permission Denied)"
            
        # Try to infer app from title (basic heuristics for Windows)
        app_name = "Unknown"
        active_file = "None"
        browser_tab = "None"
        
        if "- Visual Studio Code" in title:
            app_name = "VS Code"
            active_file = title.split(" - ")[0].strip()
        elif "- Google Chrome" in title or "- Chrome" in title:
            app_name = "Chrome"
            browser_tab = title.split(" - ")[0].strip()
        elif title.endswith(" - Notepad"):
            app_name = "Notepad"
            active_file = title.split(" - ")[0].strip()
        else:
            app_name = title.split("-")[-1].strip() if "-" in title else title
            
        return {
            "active_application": app_name,
            "active_file": active_file,
            "browser_tab": browser_tab,
            "window_title": title,
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "is_in_meeting": self.is_in_meeting()
        }

    def is_in_meeting(self) -> bool:
        """Detects if a meeting application is running."""
        try:
            titles = gw.getAllTitles()
            meeting_apps = ["Zoom Meeting", "Microsoft Teams", "Discord", "OBS", "Google Meet"]
            for title in titles:
                for app in meeting_apps:
                    if app.lower() in title.lower():
                        return True
            return False
        except Exception:
            return False

class VisionEngine:
    def __init__(self):
        self.gemini_vision = None
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if gemini_key:
            self.gemini_vision = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=gemini_key)
            
    def capture_screen(self, base64_encode=True):
        """Captures the primary monitor using mss."""
        with mss.mss() as sct:
            monitor = sct.monitors[1]  # primary monitor
            sct_img = sct.grab(monitor)
            img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
            
            if base64_encode:
                buffered = BytesIO()
                img.save(buffered, format="JPEG", quality=80)
                return base64.b64encode(buffered.getvalue()).decode('utf-8')
            return img

    def analyze_screen(self, query: str) -> str:
        """Analyzes the current screen using Gemini Vision, falls back to local OCR."""
        img_b64 = self.capture_screen(base64_encode=True)
        
        if self.gemini_vision:
            try:
                message = HumanMessage(
                    content=[
                        {"type": "text", "text": f"Analyze this screenshot and answer: {query}"},
                        {"type": "image_url", "image_url": f"data:image/jpeg;base64,{img_b64}"}
                    ]
                )
                response = self.gemini_vision.invoke([message])
                return response.content
            except Exception as e:
                print(f"Gemini Vision failed: {e}. Falling back to OCR.")
                
        # Fallback to local OCR if Gemini fails or is unconfigured
        try:
            img = self.capture_screen(base64_encode=False)
            text = pytesseract.image_to_string(img)
            return f"[OCR Fallback - Structural insight lost] Screen Text:\n{text[:1000]}..."
        except Exception as e:
            return f"Failed to perform vision analysis or OCR. Error: {e}"

desktop_engine = DesktopEngine()
vision_engine = VisionEngine()
