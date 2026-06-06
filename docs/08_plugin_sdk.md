# Plugin SDK Architecture

## 1. Plugin System Philosophy
- **Modular**: Plugins extend JARVIS's abilities without changing core code.
- **Sandboxed**: Plugins cannot access SQLite/Chroma directly. They must use the JARVIS API.
- **Capabilities**: Plugins provide tools (functions LLMs can call) and triggers (events).

## 2. Plugin Manifest Schema (`jarvis-plugin.json`)
```json
{
  "id": "github",
  "name": "GitHub Integration",
  "version": "1.0.0",
  "permissions": ["network_access", "agent_tool"],
  "entry_point": "plugin.py"
}
```

## 3. Plugin Runtime
- Plugins run as separate Python subprocesses.
- Communicate with the JARVIS backend via an internal REST API (`localhost:8765/internal/plugins/...`).

## 4. BasePlugin Interface
```python
class BasePlugin(ABC):
    async def initialize(self) -> bool: ...
    def get_tools(self) -> list[BaseTool]: ...
    async def handle_event(self, event: PluginEvent) -> None: ...
```

## 5. First-Party Plugins
- **GitHub**: Read PRs, create issues, summarize repo changes.
- **Gmail**: Read unread emails, draft replies (requires OAuth).
- **Google Calendar**: Check schedule, add events.
- **Notion**: Fetch documents, append notes.

## 6. Tool Schema
Compatible with LangChain `BaseTool`. When a plugin is enabled, its tools are injected into the agent's tool registry and exposed to the LLM system prompt.

## 7. Security Model
- **Network Sandboxing**: Restrict outward network calls to whitelisted domains in the manifest.
- **API Keys**: Stored encrypted in JARVIS settings. Passed to the plugin only when activated.
- **Capability Escalation**: Blocked. A plugin cannot modify its own permissions.

## 8. Developer Experience
- `jarvis-plugin create my-plugin` generates scaffolding.
- Hot-reloading supported during development.
