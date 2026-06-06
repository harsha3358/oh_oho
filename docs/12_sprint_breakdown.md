# Complete Sprint Roadmap (All 4 Sprints)

## Sprint 1: Foundation & Soul (Days 1-14)
**Goal**: Working JARVIS with real AI, real voice, real memory, beautiful UI.

### Day-by-Day Breakdown
- **Day 1**: Repo Setup, Electron scaffolding, FastAPI setup, SQLite config.
- **Day 2**: Basic Frontend routing (Dashboard, Chat), Zustand stores (System, Chat).
- **Day 3**: Integrate Local LLM (Ollama) & API fallback. Connect LLM to UI via FastAPI WS.
- **Day 4**: Base Database Schema setup (Users, Sessions, Messages, Memories).
- **Day 5**: Memory System V1 (Extraction Pipeline, Semantic Search in Chroma).
- **Day 6**: Voice Stack setup (OpenWakeWord + VAD).
- **Day 7**: Voice Stack integration (Faster-Whisper + Kokoro TTS).
- **Day 8**: Companion Agent Prompt Engineering & Personality calibration.
- **Day 9**: UI Wireframing implementation (Tailwind CSS, Iron Man aesthetics).
- **Day 10**: Dashboard implementation & basic Goal tracking forms.
- **Day 11**: Memory UI implementation (Viewing and editing memories).
- **Day 12**: Settings UI implementation (Managing providers, voice settings).
- **Day 13**: End-to-End integration testing of the core loop (Wake word -> Speak -> Transcribe -> Think -> Respond -> Synthesize).
- **Day 14**: Buffer day, bug fixes, Sprint 1 Demo.

### Exit Criteria
- Electron app builds on Windows.
- User can chat via text.
- User can chat via "Oh Oh" wake word.
- JARVIS accurately extracts a memory and uses it in a future message.
- UI perfectly matches the dark/glassmorphic aesthetics.

## Sprint 2: Intelligence & Autonomy (Days 15-28)
**Goal**: Multi-agent system, screen understanding, computer control.

### Major Features
- **Week 3**: LangGraph multi-agent routing (Research, Founder, Companion). Life Graph V1 node extraction.
- **Week 4**: Desktop Context Engine (Screenshot capture + Vision LLM). PyAutoGUI computer control base layer.

### Exit Criteria
- JARVIS can answer questions about what is on the screen.
- JARVIS can search the web if asked to research a topic.

## Sprint 3: Ecosystem & Power (Days 29-42)
**Goal**: Plugin system, autonomous workflows, founder mode.

### Major Features
- **Week 5**: Plugin SDK core implementation. First-party plugins (GitHub, Gmail).
- **Week 6**: Founder Mode implementation (Dashboards, OKRs). Workflow engine (scheduled tasks).

## Sprint 4: Polish & Personal OS (Days 43-56)
**Goal**: Production quality, 3D avatar, advanced emotional intelligence.

### Major Features
- **Week 7**: 3D AI Core visualizer (Three.js). Advanced emotional tone adaptation.
- **Week 8**: Performance optimization, SQLite vacuuming, Security hardening. v1.0 Release Prep.
