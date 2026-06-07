import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, MessageSquare, BrainCircuit, History, Target, Settings, Database, Briefcase, Activity } from 'lucide-react';
import AICore from './components/AICore';
import Dashboard from './components/Dashboard';
import MemoryInspector from './components/MemoryInspector';
import LifeTimeline from './components/LifeTimeline';
import WelcomeWizard from './components/WelcomeWizard';
import FeedbackModal from './components/FeedbackModal';
import * as Sentry from "@sentry/react";
import posthog from 'posthog-js';

// Initialize Telemetry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0, 
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: !!import.meta.env.VITE_SENTRY_DSN
});

posthog.init(import.meta.env.VITE_POSTHOG_KEY || "", {
  api_host: 'https://app.posthog.com',
  autocapture: false, // Opt-in based
  opt_out_capturing_by_default: true, // Only track if explicitly opted-in
});

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
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [memoryApprovalRequest, setMemoryApprovalRequest] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState({
    brief: "Awaiting initialization...",
    goals: [],
    metrics: { velocity: 0, learning: "Unknown", stress: "Unknown" },
    insights: []
  });

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectDelay = 1000;
    
    const connect = () => {
      setConnectionStatus('connecting');
      ws = new WebSocket(`ws://localhost:8765/ws/default-session`);
      
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
          setTimeout(() => setCoreState('sleeping'), 3000);
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

  if (isLoading) {
    return <div className="h-screen w-screen bg-dark flex items-center justify-center text-white/30 tracking-[0.3em] text-sm animate-pulse">INITIALIZING CORE...</div>;
  }

  if (isFirstRun) {
    return <WelcomeWizard onComplete={() => setIsFirstRun(false)} />;
  }

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      setCoreState('sleeping');
    } else {
      setIsListening(true);
      setCoreState('listening');
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setCoreState('thinking');
    // Send message to websocket
    const ws = new WebSocket(`ws://localhost:8765/ws/default-session`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'chat_message', content: inputText }));
    };
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
          <p className="text-white/60">Current Priority: Execute JARVIS Beta Validation</p>
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
              <span>Gemini Pro Model</span>
              <span className="text-xs px-2 py-1 bg-softGreen/20 text-softGreen rounded font-mono border border-softGreen/30">ONLINE</span>
            </div>
            <div className="glass-panel p-4 flex justify-between items-center">
              <span>Ollama (Local Fallback)</span>
              <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded font-mono border border-yellow-500/30">STANDBY</span>
            </div>
            <div className="glass-panel p-4 flex justify-between items-center">
              <span>OpenWakeWord (Voice)</span>
              <span className="text-xs px-2 py-1 bg-softGreen/20 text-softGreen rounded font-mono border border-softGreen/30">ACTIVE</span>
            </div>
            <div className="glass-panel p-4 flex justify-between items-center">
              <span>Vector Memory (ChromaDB)</span>
              <span className="text-xs px-2 py-1 bg-softGreen/20 text-softGreen rounded font-mono border border-softGreen/30">SYNCED</span>
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
                  <input type="password" value="****************" readOnly className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white/50" />
                  <button onClick={() => {}} className="px-4 bg-lightBlue/20 text-lightBlue hover:bg-lightBlue/30 rounded border border-lightBlue/30 transition-colors">Change</button>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5">
              <h3 className="font-medium mb-4 text-lightBlue">Startup & Behavior</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-black/40 text-lightBlue focus:ring-lightBlue/50 focus:ring-offset-dark" />
                <span className="text-sm">Launch JARVIS on Startup</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer mt-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-black/40 text-lightBlue focus:ring-lightBlue/50 focus:ring-offset-dark" />
                <span className="text-sm">Smart Meeting Mode (Auto-mute wake word)</span>
              </label>
            </div>

            <div className="glass-panel p-5 border-lavender/30">
              <h3 className="font-medium mb-4 text-lavender">Data & Privacy</h3>
              <p className="text-xs text-white/50 mb-4 leading-relaxed">
                You own your data. JARVIS runs locally and stores all your memories, goals, and reflections on your machine.
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
    const ws = new WebSocket(`ws://localhost:8765/ws/default-session`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'memory_approval_response', action, content: memoryApprovalRequest }));
    };
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

      {/* LEFT SIDEBAR - Memory & Tools */}
      <aside className="w-72 h-full border-r border-white/5 bg-black/20 backdrop-blur-md p-4 flex flex-col gap-6 flex-shrink-0 z-20">
        <div className="flex items-center gap-3 px-2 py-4 border-b border-white/10">
          <BrainCircuit className="text-lightBlue" />
          <h1 className="text-xl font-light tracking-[0.2em] text-glow">JARVIS</h1>
        </div>
        
        <nav className="flex flex-col gap-2">
          <NavItem icon={<Target size={18} />} label="Chief of Staff" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavItem icon={<History size={18} />} label="Life Timeline" active={activeView === 'timeline'} onClick={() => setActiveView('timeline')} />
          <NavItem icon={<Database size={18} />} label="Memory Inspector" active={activeView === 'memory'} onClick={() => setActiveView('memory')} />
          <NavItem icon={<Briefcase size={18} />} label="Founder Mode" active={activeView === 'founder'} onClick={() => setActiveView('founder')} />
          <NavItem icon={<MessageSquare size={18} />} label="Reflection Engine" active={activeView === 'reflection'} onClick={() => setActiveView('reflection')} />
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <NavItem icon={<MessageSquare size={18} />} label="Submit Feedback" onClick={() => setShowFeedback(true)} />
          <NavItem icon={<Settings size={18} />} label="Trust & Privacy" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </div>
      </aside>

      {/* CENTER - AI Core & Interaction */}
      <main className="flex-1 h-full flex flex-col items-center justify-center relative z-10">
        <div className="flex-1 flex items-center justify-center w-full relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
          <AICore state={coreState} />
        </div>

        <div className="w-full max-w-2xl pb-12 px-8 z-20">
          <form onSubmit={handleChatSubmit} className="relative flex items-center">
            <button 
              type="button"
              onClick={toggleListening}
              className={`absolute left-3 p-2 rounded-full transition-all duration-300 ${isListening ? 'bg-lightBlue/20 text-lightBlue shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
            >
              {isListening ? <Mic size={20} className="animate-pulse" /> : <MicOff size={20} />}
            </button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? "Listening..." : "Command JARVIS..."}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder-white/30 focus:outline-none focus:border-lightBlue/50 focus:ring-1 focus:ring-lightBlue/50 backdrop-blur-md transition-all shadow-xl"
            />
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

      {/* RIGHT SIDEBAR - Active View */}
      <aside className="w-[450px] h-full border-l border-white/5 bg-black/20 backdrop-blur-md flex-shrink-0 z-20 relative">
        {renderActiveView()}
      </aside>

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

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${active ? 'bg-white/10 text-white shadow-[inset_2px_0_0_rgba(96,165,250,1)]' : 'text-white/50 hover:bg-white/5 hover:text-white/90'}`}>
      {icon}
      <span className="text-sm tracking-wide">{label}</span>
    </div>
  );
}

export default App;
