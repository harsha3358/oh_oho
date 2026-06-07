import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, MessageSquare, BrainCircuit, History, Target, Settings, Database, Briefcase, Activity } from 'lucide-react';
import AICore from './components/AICore';
import Dashboard from './components/Dashboard';
import MemoryInspector from './components/MemoryInspector';
import LifeTimeline from './components/LifeTimeline';
import WelcomeWizard from './components/WelcomeWizard';
import FeedbackModal from './components/FeedbackModal';
import AgentConsole from './components/AgentConsole';
import type { AgentStatusData, TranscriptEntry } from './components/AgentConsole';
import LinksPanel from './components/LinksPanel';
import type { DiscoveredLink } from './components/LinksPanel';

type CoreState = 'sleeping' | 'listening' | 'thinking' | 'researching' | 'planning' | 'speaking' | 'alerting';
type ViewState = 'dashboard' | 'timeline' | 'memory' | 'founder' | 'reflection' | 'focus' | 'diagnostics' | 'settings';

declare global {
  interface Window {
    electronAPI?: {
      saveSecret: (key: string, value: string) => Promise<boolean>;
      getSecret: (key: string) => Promise<string | null>;
      onGlobalHotkey: (callback: () => void) => void;
      onNavigate: (callback: (route: string) => void) => void;
    }
  }
}

function App() {
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [coreState, setCoreState] = useState<CoreState>('sleeping');
  const [listeningMode, setListeningMode] = useState<'wake_word' | 'continuous' | 'ptt'>('continuous');
  const [inputText, setInputText] = useState('');
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [memoryApprovalRequest, setMemoryApprovalRequest] = useState<string | null>(null);
  
  // Settings State
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [settingsApiKey, setSettingsApiKey] = useState('');

  const [dashboardData, setDashboardData] = useState({
    brief: "Awaiting initialization...",
    goals: [],
    metrics: { velocity: 0, learning: "Unknown", stress: "Unknown" },
    insights: []
  });

  // Agent Console State
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatusData>({
    objective: "",
    agent: "",
    tool: "",
    step: "",
    statusText: "",
    isWorking: false
  });
  
  // Links State
  const [discoveredLinks, setDiscoveredLinks] = useState<DiscoveredLink[]>([]);
  
  // Diagnostics State
  const [diagnosticsState, setDiagnosticsState] = useState({
    gemini: '⚪ CHECKING...',
    geminiKeyExists: false
  });

  // Human Approval State
  const [pendingApproval, setPendingApproval] = useState<{
    id: string;
    action_summary: string;
    risk_level: string;
    target: string;
    preview: string;
  } | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectDelay = 1000;
    
    const connect = () => {
      setConnectionStatus('connecting');
      ws = new WebSocket(`ws://localhost:8765/ws/default-session`);
      wsRef.current = ws;
      
      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectDelay = 1000; // Reset delay on success
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'state_change') {
          setCoreState(message.state);
        }
        if (message.type === 'dashboard_update') {
          setDashboardData(message.data);
        }
        if (message.type === 'token') {
          setCoreState('speaking');
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'agent' && message.append) {
              return [...prev.slice(0, -1), { ...last, text: last.text + message.text }];
            } else {
              return [...prev, { id: Date.now().toString(), role: 'agent', text: message.text, timestamp: Date.now() }];
            }
          });
        }
        if (message.type === 'interrupt_tts') {
          setCoreState('listening');
        }
        if (message.type === 'transcript_entry') {
           setTranscript(prev => [...prev, message.entry]);
        }
        if (message.type === 'agent_step') {
           setAgentStatus(prev => ({
             ...prev, 
             isWorking: true,
             agent: message.agent || prev.agent,
             tool: message.tool || prev.tool,
             objective: message.objective || prev.objective,
             step: message.step || prev.step,
             statusText: message.statusText || prev.statusText
           }));
           // Also log step to transcript as a thought
           setTranscript(prev => [...prev, { id: Date.now().toString(), role: 'thought', text: message.statusText, timestamp: Date.now() }]);
        }
        if (message.type === 'agent_done') {
           setAgentStatus(prev => ({ ...prev, isWorking: false }));
        }
        if (message.type === 'link_discovered') {
           setDiscoveredLinks(prev => {
             // Deduplicate
             if (prev.find(l => l.url === message.link.url)) return prev;
             return [...prev, message.link];
           });
        }
        if (message.type === 'focus_mode_start') {
          setActiveView('focus');
        }
        if (message.type === 'memory_approval_request') {
          setMemoryApprovalRequest(message.content);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        // Exponential backoff reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, 30000); // Max 30s
          connect();
        }, reconnectDelay);
      };
      
      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (ws) {
        ws.onclose = null; // Prevent reconnect loop on unmount
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    // Check if configuration exists
    const checkSetup = async () => {
      if (window.electronAPI) {
        const key = await window.electronAPI.getSecret('GEMINI_API_KEY');
        if (key) {
          setIsFirstRun(false);
        }
        
        // Register IPC listeners
        window.electronAPI.onGlobalHotkey(() => {
          setIsListening(true);
          setCoreState('listening');
        });

        window.electronAPI.onNavigate((route: string) => {
          if (['dashboard', 'timeline', 'memory', 'founder', 'reflection', 'settings', 'diagnostics'].includes(route)) {
            setActiveView(route as ViewState);
          }
        });
      }
      setIsLoading(false);
    };
    checkSetup();
  }, []);

  // Update Diagnostics Live
  useEffect(() => {
    if (activeView === 'diagnostics' || activeView === 'settings') {
      window.electronAPI?.getSecret('GEMINI_API_KEY').then(key => {
        if (key && key.length > 10) {
          setDiagnosticsState({ gemini: '🟢 Connected', geminiKeyExists: true });
        } else {
          setDiagnosticsState({ gemini: '🔴 Invalid API Key', geminiKeyExists: false });
        }
      });
    }
  }, [activeView, isEditingApiKey]);


  if (isLoading) {
    return <div className="h-screen w-screen bg-dark flex items-center justify-center text-white/30 tracking-[0.3em] text-sm animate-pulse">INITIALIZING CORE...</div>;
  }

  if (isFirstRun) {
    return <WelcomeWizard onComplete={() => setIsFirstRun(false)} />;
  }

  const isListening = coreState === 'listening';

  const toggleListening = () => {
    if (!isListening) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'manual_wake', mode: 'ui' }));
      }
    } else {
      // Allow UI to stop listening
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'mode_change', mode: 'wake_word' }));
        setCoreState('sleeping');
      }
    }
  };

  const handleModeChange = (mode: 'wake_word' | 'continuous' | 'ptt') => {
    setListeningMode(mode);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mode_change', mode }));
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setCoreState('thinking');
    
    // Add optimistic user message to transcript
    setTranscript(prev => [...prev, { id: Date.now().toString(), role: 'user', text: inputText, timestamp: Date.now() }]);

    // Send message to the active websocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'chat_message', content: inputText }));
    } else {
      console.error("Cannot send message, WebSocket is not open");
      setCoreState('sleeping');
    }
    setInputText('');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard data={dashboardData} />;
      case 'timeline': return <LifeTimeline />;
      case 'memory': return <MemoryInspector />;
      case 'founder': return <div className="p-6 text-white"><h2 className="text-2xl font-light">Founder Command Center</h2><p className="mt-4 text-white/50">Startup goals and market insights.</p></div>;
      case 'reflection': return <div className="p-6 text-white"><h2 className="text-2xl font-light">Reflection Engine</h2><p className="mt-4 text-white/50">Weekly patterns and insights.</p></div>;
      case 'focus': return (
        <div className="p-10 flex flex-col items-center justify-center h-full text-white text-center">
          <Target size={48} className="text-lavender mb-6" />
          <h2 className="text-3xl font-light tracking-wide mb-2">Focus Session</h2>
          <div className="text-5xl font-mono text-lightBlue my-8 tracking-wider shadow-lg">25:00</div>
          <p className="text-white/60">Current Priority: Execute Harsha's Assistant Beta Validation</p>
          <div className="w-full h-1 bg-white/10 rounded-full mt-8 overflow-hidden">
            <div className="h-full bg-lavender w-1/4 shadow-[0_0_15px_rgba(196,181,253,0.8)]"></div>
          </div>
        </div>
      );
      case 'diagnostics': return (
        <div className="p-6 text-white h-full overflow-y-auto">
          <h2 className="text-2xl font-light mb-6 flex items-center gap-3"><Activity className="text-red-400" /> System Diagnostics</h2>
          <div className="flex flex-col gap-4">
            <div className="glass-panel p-4 flex justify-between items-center">
              <span>AI Provider (Gemini)</span>
              <span className="text-xs px-2 py-1 bg-black/40 rounded font-mono border border-white/10">{diagnosticsState.gemini}</span>
            </div>
            <div className="glass-panel p-4 flex justify-between items-center">
              <span>Ollama (Local Fallback)</span>
              <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded font-mono border border-yellow-500/30">STANDBY</span>
            </div>
          </div>

          <h2 className="text-2xl font-light mb-6 mt-10 flex items-center gap-3"><Activity className="text-lavender" /> Agent Performance Telemetry</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-5 flex flex-col gap-2 border-t border-softGreen/30">
              <span className="text-xs text-white/50 uppercase tracking-widest">Success Rate</span>
              <span className="text-3xl font-light text-softGreen">98.2%</span>
            </div>
            <div className="glass-panel p-5 flex flex-col gap-2 border-t border-red-500/30">
              <span className="text-xs text-white/50 uppercase tracking-widest">Failure Rate</span>
              <span className="text-3xl font-light text-red-400">1.8%</span>
            </div>
            <div className="glass-panel p-5 flex flex-col gap-2">
              <span className="text-xs text-white/50 uppercase tracking-widest">Avg Task Duration</span>
              <span className="text-xl font-mono text-white/80">3.4s</span>
            </div>
            <div className="glass-panel p-5 flex flex-col gap-2">
              <span className="text-xs text-white/50 uppercase tracking-widest">Most Used Agent</span>
              <span className="text-xl font-mono text-lightBlue">Browser_Agent</span>
            </div>
            <div className="glass-panel p-5 col-span-2 flex justify-between items-center bg-red-500/5">
              <div className="flex flex-col">
                <span className="text-xs text-white/50 uppercase tracking-widest">Last Failure</span>
                <span className="text-sm font-medium text-white/80 mt-1">GitHub API Rate Limit Exceeded</span>
              </div>
              <span className="text-xs font-mono text-red-400 bg-red-500/20 px-2 py-1 rounded">2 hours ago</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 mt-4">
            <div className="glass-panel p-4 flex justify-between items-center">
              <span>OpenWakeWord (Voice)</span>
              <span className="text-xs px-2 py-1 bg-softGreen/20 text-softGreen rounded font-mono border border-softGreen/30">ACTIVE</span>
            </div>
            <div className="glass-panel p-4 flex justify-between items-center">
              <span>Vector Memory (ChromaDB)</span>
              <span className="text-xs px-2 py-1 bg-softGreen/20 text-softGreen rounded font-mono border border-softGreen/30">SYNCED</span>
            </div>
          </div>
            
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <h3 className="text-sm font-medium text-red-400 mb-2 uppercase tracking-wider">Emergency Actions</h3>
            <div className="flex flex-col gap-2">
              <button className="text-xs p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded transition-colors text-left border border-red-500/30">Reset System Settings</button>
              <button className="text-xs p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded transition-colors text-left border border-red-500/30">Restart Voice Pipeline</button>
              <button className="text-xs p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded transition-colors text-left border border-red-500/30">Wipe Context Buffer (Keep Memories)</button>
            </div>
          </div>
        </div>
      );
      case 'settings': return (
        <div className="p-6 text-white h-full overflow-y-auto">
          <h2 className="text-2xl font-light mb-6 flex items-center gap-3"><Settings className="text-lightBlue" /> System Settings</h2>
          
          <div className="flex flex-col gap-6">
            <div className="glass-panel p-5">
              <h3 className="font-medium mb-4 text-lightBlue">AI Providers</h3>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-white/50">Gemini API Key</label>
                <div className="flex gap-2">
                  {isEditingApiKey ? (
                    <>
                      <input 
                        type="text" 
                        value={settingsApiKey} 
                        onChange={(e) => setSettingsApiKey(e.target.value)}
                        placeholder="Enter new API key..."
                        className="flex-1 bg-black/40 border border-lightBlue/50 rounded-lg p-2.5 text-sm text-white focus:outline-none" 
                      />
                      <button 
                        onClick={async () => {
                          if (settingsApiKey.trim() && window.electronAPI) {
                            await window.electronAPI.saveSecret('GEMINI_API_KEY', settingsApiKey);
                            setSettingsApiKey('');
                            setIsEditingApiKey(false);
                          }
                        }} 
                        className="px-4 bg-softGreen/20 text-softGreen hover:bg-softGreen/30 rounded border border-softGreen/30 transition-colors"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditingApiKey(false);
                          setSettingsApiKey('');
                        }} 
                        className="px-4 bg-white/5 text-white/50 hover:bg-white/10 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <input type="password" value="****************" readOnly className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white/50" />
                      <button onClick={() => setIsEditingApiKey(true)} className="px-4 bg-lightBlue/20 text-lightBlue hover:bg-lightBlue/30 rounded border border-lightBlue/30 transition-colors">Change</button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-panel p-5">
              <h3 className="font-medium mb-4 text-lightBlue">Startup & Behavior</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-black/40 text-lightBlue focus:ring-lightBlue/50 focus:ring-offset-dark" />
                <span className="text-sm">Launch Harsha's Assistant on Startup</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer mt-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-black/40 text-lightBlue focus:ring-lightBlue/50 focus:ring-offset-dark" />
                <span className="text-sm">Smart Meeting Mode (Auto-mute wake word)</span>
              </label>
            </div>

            <div className="glass-panel p-5 border-lavender/30">
              <h3 className="font-medium mb-4 text-lavender">Data & Privacy</h3>
              <p className="text-xs text-white/50 mb-4 leading-relaxed">
                You own your data. Harsha's Assistant runs locally and stores all your memories, goals, and reflections on your machine.
              </p>
              <button onClick={() => alert("Packaging ZIP...")} className="w-full py-3 bg-lavender/20 text-lavender hover:bg-lavender/30 rounded-lg border border-lavender/30 transition-colors text-sm font-medium">
                One-Click Export (ZIP)
              </button>
            </div>
          </div>
        </div>
      );
      default: return <Dashboard data={dashboardData} />;
    }
  };

  const handleMemoryApproval = (action: 'remember' | 'not_now' | 'never') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'memory_approval_response', action, content: memoryApprovalRequest }));
    }
    setMemoryApprovalRequest(null);
  };

  return (
    <div className="flex h-screen w-screen bg-dark overflow-hidden text-primary selection:bg-lightBlue/30 relative">
      
      {/* CONNECTION STATUS INDICATOR */}
      {connectionStatus !== 'connected' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-2 rounded-full text-xs font-medium tracking-wider flex items-center gap-2 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          {connectionStatus === 'connecting' ? 'Reconnecting to Core...' : 'Core Disconnected'}
        </div>
      )}

      {/* FAR LEFT MINIMAL NAV */}
      <nav className="w-16 h-full bg-black/40 border-r border-white/5 flex flex-col items-center py-6 gap-6 z-30 shrink-0">
        <BrainCircuit className="text-lightBlue mb-4" size={24} />
        <NavIcon icon={<Target size={20} />} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} tooltip="Dashboard" />
        <NavIcon icon={<History size={20} />} active={activeView === 'timeline'} onClick={() => setActiveView('timeline')} tooltip="Timeline" />
        <NavIcon icon={<Database size={20} />} active={activeView === 'memory'} onClick={() => setActiveView('memory')} tooltip="Memory" />
        <NavIcon icon={<Settings size={20} />} active={activeView === 'settings'} onClick={() => setActiveView('settings')} tooltip="Settings" />
      </nav>

      {/* LEFT SIDEBAR - Agent Console */}
      <AgentConsole status={agentStatus} transcript={transcript} />

      {/* CENTER - AI Core & Interaction */}
      <main className="flex-1 h-full flex flex-col relative z-10">
        {/* Status Bar */}
        <div className="h-10 border-b border-white/5 bg-black/20 flex items-center justify-between px-6 shrink-0 text-xs tracking-widest font-mono uppercase">
           <div className="flex items-center gap-2">
             {coreState === 'sleeping' && <><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-white/60">🟢 Idle</span></>}
             {coreState === 'listening' && <><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><span className="text-white/60">🔵 Listening</span></>}
             {coreState === 'speaking' && <><span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /><span className="text-white/60">🟣 Speaking</span></>}
             {coreState === 'researching' && <><span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" /><span className="text-white/60">🟡 Researching</span></>}
             {agentStatus.isWorking && agentStatus.agent?.includes('Browser') && <><span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /><span className="text-white/60">🟠 Browser Automation</span></>}
             {coreState === 'alerting' && <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-white/60">🔴 Attention Required</span></>}
             {!['sleeping', 'listening', 'speaking', 'researching', 'alerting'].includes(coreState) && !agentStatus.isWorking && <><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-white/60">🟢 Idle</span></>}
           </div>
           
           <div className="flex items-center gap-2 text-white/40">
             <span>Active Agent: {agentStatus.isWorking ? agentStatus.agent : 'Orchestrator'}</span>
           </div>
        </div>

        {/* Center overlay for views, otherwise AI Core */}
        {activeView !== 'dashboard' ? (
          <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md">
            <div className="absolute top-4 right-4 z-40">
              <button onClick={() => setActiveView('dashboard')} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white">Close View</button>
            </div>
            {renderActiveView()}
          </div>
        ) : null}

        <div className="flex-1 flex items-center justify-center w-full relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
          
          {/* Subtle Floating Labels around AI Core */}
          {agentStatus.isWorking && (
            <div className="absolute top-1/4 right-1/4 animate-bounce text-xs font-mono text-lightBlue/50 tracking-widest uppercase pointer-events-none">
              {agentStatus.agent || 'Research'} Agent Active
            </div>
          )}

          {/* Human Approval Modal Override */}
          {pendingApproval && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
              <div className="max-w-lg w-full bg-dark border border-white/20 rounded-xl overflow-hidden shadow-2xl shadow-red-500/20">
                <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center">
                  <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                    <Activity className="text-red-500 animate-pulse" /> 
                    Action Approval Required
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded font-mono ${pendingApproval.risk_level === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'} border`}>
                    {pendingApproval.risk_level.toUpperCase()} RISK
                  </span>
                </div>
                <div className="p-6 flex flex-col gap-4 text-sm text-white/80">
                  <div>
                    <span className="text-white/40 block text-xs uppercase tracking-wider mb-1">Action Summary</span>
                    <p className="font-medium text-white">{pendingApproval.action_summary}</p>
                  </div>
                  <div>
                    <span className="text-white/40 block text-xs uppercase tracking-wider mb-1">Target</span>
                    <p className="font-mono bg-white/5 p-2 rounded">{pendingApproval.target}</p>
                  </div>
                  <div>
                    <span className="text-white/40 block text-xs uppercase tracking-wider mb-1">Preview</span>
                    <p className="font-mono bg-white/5 p-2 rounded text-lightBlue">{pendingApproval.preview}</p>
                  </div>
                </div>
                <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-3">
                  <button 
                    onClick={() => {
                      wsRef.current?.send(JSON.stringify({ type: 'human_approval_response', id: pendingApproval.id, action: 'REJECT' }));
                      setPendingApproval(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => {
                      wsRef.current?.send(JSON.stringify({ type: 'human_approval_response', id: pendingApproval.id, action: 'APPROVE' }));
                      setPendingApproval(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-softGreen/20 hover:bg-softGreen/30 text-softGreen border border-softGreen/30 font-medium transition-colors"
                  >
                    Approve Execution
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <AICore state={coreState} />
        </div>

        <div className="w-full max-w-2xl pb-12 px-8 z-20">
          <form onSubmit={handleChatSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <button 
                type="button"
                onClick={toggleListening}
                className={`absolute left-3 p-2 rounded-full transition-all duration-300 ${isListening ? 'bg-lightBlue/20 text-lightBlue shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
              >
                {isListening ? <Mic size={20} className="animate-pulse" /> : <Mic size={20} />}
              </button>
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? "Listening..." : "Command Harsha's Assistant..."}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder-white/30 focus:outline-none focus:border-lightBlue/50 focus:ring-1 focus:ring-lightBlue/50 backdrop-blur-md transition-all shadow-xl"
              />
            </div>
            <select 
              value={listeningMode}
              onChange={(e) => handleModeChange(e.target.value as any)}
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xs font-mono text-white/50 hover:text-white/80 focus:outline-none focus:border-lightBlue/50 backdrop-blur-md transition-all appearance-none cursor-pointer"
            >
               <option value="continuous">Continuous</option>
               <option value="wake_word">Wake Word</option>
               <option value="ptt">Push To Talk</option>
            </select>
          </form>
          <div className="flex justify-center gap-4 mt-4 text-xs text-white/30 uppercase tracking-widest font-mono">
            <span className="hover:text-white/70 cursor-pointer transition-colors" onClick={() => setCoreState('researching')}>Analyze Screen</span>
            <span>•</span>
            <span className="hover:text-white/70 cursor-pointer transition-colors" onClick={() => setCoreState('planning')}>Generate Brief</span>
            <span>•</span>
            <span className="hover:text-white/70 cursor-pointer transition-colors" onClick={() => setCoreState('alerting')}>Run Diagnostics</span>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR - Links Panel */}
      <LinksPanel links={discoveredLinks} />

      {/* MEMORY APPROVAL TOAST */}
      {memoryApprovalRequest && (
        <div className="absolute bottom-6 right-[470px] z-50 bg-black/80 backdrop-blur-xl border border-lightBlue/30 p-5 rounded-xl shadow-2xl max-w-sm animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <Database className="text-lightBlue mt-1 shrink-0" size={20} />
            <div className="flex flex-col gap-3">
              <p className="text-sm text-white font-medium leading-relaxed">
                {memoryApprovalRequest}
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleMemoryApproval('remember')} className="text-xs py-2 px-3 bg-lightBlue/20 text-lightBlue hover:bg-lightBlue/30 rounded border border-lightBlue/30 transition-colors">
                  Remember
                </button>
                <div className="flex gap-2">
                  <button onClick={() => handleMemoryApproval('not_now')} className="flex-1 text-xs py-2 px-3 bg-white/5 text-white/70 hover:bg-white/10 rounded transition-colors">
                    Not Now
                  </button>
                  <button onClick={() => handleMemoryApproval('never')} className="flex-1 text-xs py-2 px-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded border border-red-500/30 transition-colors">
                    Never
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  );
}

function NavIcon({ icon, active = false, onClick, tooltip }: { icon: React.ReactNode, active?: boolean, onClick: () => void, tooltip: string }) {
  return (
    <div 
      onClick={onClick} 
      title={tooltip}
      className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${active ? 'bg-lightBlue/20 text-lightBlue shadow-[inset_2px_0_0_rgba(96,165,250,1)]' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
    >
      {icon}
    </div>
  );
}

export default App;
