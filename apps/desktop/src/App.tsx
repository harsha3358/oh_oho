import { useState, useEffect } from 'react';
import { Mic, MicOff, MessageSquare, BrainCircuit, History, Target, Settings, Database, Briefcase } from 'lucide-react';
import AICore from './components/AICore';
import Dashboard from './components/Dashboard';
import MemoryInspector from './components/MemoryInspector';
import LifeTimeline from './components/LifeTimeline';
import WelcomeWizard from './components/WelcomeWizard';

type CoreState = 'sleeping' | 'listening' | 'thinking' | 'researching' | 'planning' | 'speaking' | 'alerting';
type ViewState = 'dashboard' | 'timeline' | 'memory' | 'founder' | 'reflection';

declare global {
  interface Window {
    electronAPI?: {
      saveSecret: (key: string, value: string) => Promise<boolean>;
      getSecret: (key: string) => Promise<string | null>;
    }
  }
}

function App() {
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [coreState, setCoreState] = useState<CoreState>('sleeping');
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeView, setActiveView] = useState<ViewState>('dashboard');

  const [dashboardData, setDashboardData] = useState({
    brief: "Awaiting initialization...",
    goals: [],
    metrics: { velocity: 0, learning: "Unknown", stress: "Unknown" },
    insights: []
  });

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/default-session`);
    
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
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    // Check if configuration exists
    const checkSetup = async () => {
      if (window.electronAPI) {
        const key = await window.electronAPI.getSecret('GEMINI_API_KEY');
        if (key) {
          setIsFirstRun(false);
        }
      }
    };
    checkSetup();
  }, []);

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
    const ws = new WebSocket(`ws://localhost:8000/ws/default-session`);
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
      default: return <Dashboard data={dashboardData} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-dark overflow-hidden text-primary selection:bg-lightBlue/30">
      
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
          <NavItem icon={<Settings size={18} />} label="Trust & Privacy" onClick={() => {}} />
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
