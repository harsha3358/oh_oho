# Desktop Context Engine Design

## 1. Context Engine Overview
- **Goal**: Give JARVIS awareness of what the user is currently looking at.
- **Architecture**: Electron main process pulls native OS APIs -> Context Snapshot -> Fast Vision LLM -> JSON Context injected into memory.

## 2. Context Capture Layer
- **Active Window Detection**: Pulls active window title using `active-win` or custom C++ node module. Fast, polling or event-driven.
- **Screen Content Analysis**: Takes a screenshot using `desktopCapturer` in Electron. Scaled down, converted to base64, sent to Gemini Flash Vision.
- **Trigger**: Occurs ONLY on user request ("Look at this") OR periodically if continuous context is enabled.
- **Privacy Blocklist**: Never captures if window title includes "Bank", "Password", "1Password", "Health".

## 3. Active Application Profiles
- **VS Code**: "User is coding in Python. File is main.py. Cursor is on line 42."
- **Browser**: "User is reading Hacker News."
- **Notion**: "User is writing a sprint doc."

## 4. Context State Machine
States: `coding`, `browsing`, `writing`, `designing`, `meeting`, `idle`.

## 5. Proactive Triggers
- If user is stuck in a terminal window reading an error for > 3 minutes, JARVIS asks: "Need help debugging that?"
- Debounce: Max 1 proactive interjection per 30 minutes to prevent annoyance.

## 6. Computer Control System
- **Safe actions**: Open URLs, open apps.
- **Confirmed actions**: Send emails, run destructive terminal commands, submit forms.
- **Execution**: `child_process.exec` or PyAutoGUI in the Python backend.

## 7. Privacy Architecture
- Screen captures are kept entirely in memory and dropped immediately after OCR/Vision analysis. They are never written to disk.
- Users can clear the "Working Memory" context buffer instantly.

## 8. Performance Targets
- Vision analysis latency < 2 seconds.
- Background CPU usage < 1%.
