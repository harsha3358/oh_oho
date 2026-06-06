# Security Architecture Design

## 1. Threat Model
- **Malicious Plugins**: High likelihood, high impact. Mitigation: Subprocess sandboxing, zero DB access, strict permission manifest.
- **Data Exfiltration**: Medium likelihood, high impact. Mitigation: Local-first architecture. Port 8765 bound to `127.0.0.1` only.
- **LLM Prompt Injection**: High likelihood. Mitigation: System prompts always supersede injected content. Computer control requires explicit user approval.

## 2. Encryption Architecture
### Data at Rest
- **SQLite**: SQLCipher with AES-256-CBC.
- **Key Storage**: OS Keychain (Windows Credential Manager / macOS Keychain).
- **ChromaDB**: Stored on an encrypted volume or uses application-layer encryption for sensitive collections before embedding.

### Data in Transit
- **Localhost only**: FastAPI refuses connections from non-loopback addresses.
- **IPC Bridge**: Electron passes a bearer token to the frontend on launch. The backend requires this token for all REST and WS requests.

## 3. Trust Zones
- **Zone 0 (Trusted)**: JARVIS Backend Core, SQLite, ChromaDB.
- **Zone 1 (Semi-Trusted)**: Electron Renderer UI.
- **Zone 2 (Untrusted)**: Plugins, External APIs, Internet.

## 4. Sensitive Action Approval
Actions like "Send Email", "Delete File", or "Execute Script" trigger an Approval flow:
- Execution halts.
- A notification pops up in the UI: "JARVIS wants to run `rm -rf /`".
- User must click Approve/Deny.

## 5. Audit Logging
Every action that modifies system state or external data is logged in the `audit_logs` table.
```json
{"action": "send_email", "target": "investor@example.com", "timestamp": "2023-10-01T12:00:00Z", "approved_by": "user"}
```
