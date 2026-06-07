import React, { useEffect, useRef } from 'react';
import { Terminal, Bot, User, Loader2 } from 'lucide-react';

export type AgentStatusData = {
  objective: string;
  agent: string;
  tool: string;
  step: string;
  statusText: string;
  isWorking: boolean;
};

export type TranscriptEntry = {
  id: string;
  role: 'user' | 'agent' | 'thought';
  text: string;
  timestamp: number;
};

interface AgentConsoleProps {
  status: AgentStatusData;
  transcript: TranscriptEntry[];
}

export default function AgentConsole({ status, transcript }: AgentConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, status]);

  return (
    <div className="w-[380px] h-full flex flex-col bg-black/30 backdrop-blur-md border-r border-white/5 relative z-20 flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/80">
          <Terminal size={16} className="text-lightBlue" />
          <span className="text-xs font-mono uppercase tracking-widest font-medium">Agent Console</span>
        </div>
        {status.isWorking && (
          <Loader2 size={14} className="text-lightBlue animate-spin" />
        )}
      </div>

      {/* Live Status HUD */}
      {status.isWorking && (
        <div className="p-4 bg-lightBlue/5 border-b border-lightBlue/10 flex flex-col gap-2 shrink-0 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/40 uppercase font-mono tracking-wider">Objective</span>
            <span className="text-lightBlue font-medium truncate ml-4">{status.objective}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/40 uppercase font-mono tracking-wider">Agent</span>
            <span className="text-white/80">{status.agent || 'Orchestrator'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/40 uppercase font-mono tracking-wider">Tool</span>
            <span className="text-white/80">{status.tool || 'None'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/40 uppercase font-mono tracking-wider">Step</span>
            <span className="text-white/80">{status.step}</span>
          </div>
          <div className="mt-2 text-xs font-mono text-lightBlue/70 border-t border-lightBlue/10 pt-2">
            &gt; {status.statusText}
          </div>
        </div>
      )}

      {/* Transcript Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        {transcript.length === 0 ? (
          <div className="text-xs text-white/30 font-mono text-center my-auto uppercase tracking-widest">
            Awaiting Input...
          </div>
        ) : (
          transcript.map((entry) => (
            <div key={entry.id} className={`flex gap-3 text-sm ${entry.role === 'thought' ? 'opacity-60' : ''}`}>
              {entry.role === 'user' && <User size={16} className="text-lavender shrink-0 mt-0.5" />}
              {entry.role === 'agent' && <Bot size={16} className="text-lightBlue shrink-0 mt-0.5" />}
              {entry.role === 'thought' && <div className="w-4 h-4 shrink-0 flex items-center justify-center text-lightBlue/50 text-[10px] font-mono">_</div>}
              
              <div className="flex flex-col">
                <span className={`leading-relaxed ${
                  entry.role === 'user' ? 'text-white/90' : 
                  entry.role === 'thought' ? 'text-lightBlue/80 font-mono text-xs' : 
                  'text-white/80'
                }`}>
                  {entry.text}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
