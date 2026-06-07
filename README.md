# Harsha's Assistant: A Personal AI Operating System

## From One CEO to Another

If you're reading this, you probably understand the fundamental bottleneck of leadership: **cognitive load.**

As a CEO, your day is a chaotic string of context-switching. You jump from a product roadmap meeting to a financial audit, then to a critical hiring interview. You don't have an intelligence problem; you have an attention problem. 

Currently, when you use AI tools like ChatGPT or Claude, you are treating them like advanced search engines. You ask a question, you get an answer, and the session ends. The context is lost. Tomorrow, you will have to explain your entire business model to the AI again. It’s like hiring a brilliant Chief of Staff who develops amnesia every 24 hours.

**I built Harsha's Assistant to solve this.** 

Harsha's Assistant is not a chatbot. It is a **Personal Operating System**. It runs natively on your machine, lives in your system tray, and acts as a relentless, persistent Chief of Staff. 

It remembers your past decisions. It tracks your long-term goals. It understands your business context. If you say, "Draft an email to the board about the Q3 dip," it remembers who is on the board, what the Q3 dip was, and the specific tone you use with your investors. 

It proactively monitors your execution velocity and holds you accountable when your momentum stalls. And most importantly: **it is entirely private.** It runs on your local silicon, encrypting your most sensitive proprietary data so it never sits exposed on a public cloud server.

This is the ultimate leverage. Let's get to work.

— Harsha

---

## What It Actually Does

* **Persistent Memory Graph:** Every conversation, goal, and preference is extracted into a local vector database. Harsha's Assistant doesn't just answer questions; it recalls your life's context.
* **Founder Mode:** A dedicated analytical engine that strips away the "polite AI" fluff and gives you brutal, strategic, and objective feedback on your business decisions.
* **Ambient Desktop Integration:** With a global hotkey (`Alt + Space`), it instantly overlays on your screen, ready to execute shell commands, manage files, or give you contextual feedback on whatever application is currently active.
* **Proactive Accountability:** It tracks your goal momentum. If you are procrastinating, it will notice and gently (or firmly) push you back on track.
* **Smart Meeting Mode:** It detects when you are in a Zoom, Teams, or Google Meet call and automatically mutes its wake-word detection to prevent interruptions.

---

## The Tech Stack

Harsha's Assistant is built for speed, privacy, and deep OS integration. 

### Frontend (The Experience Layer)
* **Framework:** React 19 + TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS + Framer Motion (for fluid, hardware-accelerated animations)
* **Desktop Shell:** Electron (for secure IPC, system tray, and global hotkeys)

### Backend (The Core Brain)
* **Framework:** Python (FastAPI)
* **Orchestration:** LangGraph (Multi-Agent Routing)
* **Voice & Wake Word:** OpenWakeWord + Faster Whisper (Local Offline Fallback)
* **Task Automation:** APScheduler
* **Hardware Interop:** psutil, pygetwindow (Desktop Context Engine)

### Storage & Memory (Dual-Database Architecture)
* **Relational Data:** SQLite (Schedules, Goals, Logs)
* **Semantic Vector Data:** ChromaDB (High-dimensional embedding space for memory retrieval)
* **Security:** Fernet AES-128-CBC (Application-level encryption of all proprietary data)

---

## Installation Guide (Beta v1.0)

We have engineered the installation process to be as frictionless as possible for Windows environments. 

### Step 1: Clean Installation
1. Navigate to the `release` folder within the repository.
2. Run the `Harsha's Assistant Setup 1.0.0.exe` installer. 
3. The process is fully automated and does not require administrative privileges, making it safe for restricted corporate machines.

### Step 2: The First-Run Wizard
Upon launching the application, you will enter the secure Welcome Wizard to configure your intelligence engine:
* **Hybrid Setup (Recommended):** Enter your Google Gemini API Key. Harsha's Assistant will securely encrypt this key into your Windows Credential Manager. It uses Gemini for heavy strategic reasoning and falls back to local models for background tasks.
* **Local-Only Setup (Air-gapped):** If you require absolute privacy, ensure you have [Ollama](https://ollama.com/) installed locally. Harsha's Assistant will run entirely on your local GPU using `llama3`.

### Step 3: Secure Your Recovery Key
At the end of the setup, you will be given a 32-character **Recovery Key**. **Save this in your password manager.**
Because your local SQLite database is heavily encrypted, this key is the *only* cryptographic backdoor to decrypt your memories if your machine is ever wiped. We do not store a backup.

### Quick Start Commands
* **`Alt + Space`** - Bring up the Assistant interface from anywhere.
* **"Oye"** - The default voice wake word to start a hands-free conversation.
* **System Tray** - Right-click the icon in your taskbar for quick access to the Founder Briefing, Settings, and Diagnostics.

---

## Feedback & Support
Your feedback shapes the future of this product. Use the **Submit Feedback** button inside the desktop application to send an encrypted diagnostic report directly to my personal inbox. 

For emergencies (e.g., database corruption), use the **Urgent Support** button to reach our dedicated WhatsApp channel.