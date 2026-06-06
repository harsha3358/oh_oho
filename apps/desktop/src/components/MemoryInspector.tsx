import { Database, Search, Archive, Trash2, Edit2, Shield, Lock, Unlock } from 'lucide-react';

export default function MemoryInspector() {
  const mockMemories = [
    { id: 1, content: "User hates mushrooms", type: "preference", importance: 0.8, emotional: 0.9, date: "2 hrs ago", perm: true },
    { id: 2, content: "Working on Truxlo Sprint 4", type: "project", importance: 0.9, emotional: 0.5, date: "1 day ago", perm: false },
    { id: 3, content: "Felt overwhelmed about upcoming placement interviews", type: "emotion", importance: 0.7, emotional: 0.95, date: "3 days ago", perm: true }
  ];

  return (
    <div className="h-full w-full flex flex-col gap-6 p-6 overflow-hidden text-primary">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="text-lightBlue" size={24} />
          <h2 className="text-2xl font-light tracking-wide">Memory Inspector</h2>
        </div>
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-2.5 text-white/40" />
          <input 
            type="text" 
            placeholder="Search memories..." 
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-lightBlue focus:ring-1 focus:ring-lightBlue"
          />
        </div>
      </div>

      {/* Memory List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {mockMemories.map(mem => (
          <div key={mem.id} className="glass-panel p-4 flex flex-col gap-3 group">
            <div className="flex justify-between items-start">
              <p className="text-sm leading-relaxed pr-8">{mem.content}</p>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors" title="Edit">
                  <Edit2 size={14} />
                </button>
                <button className="p-1.5 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors" title="Archive">
                  <Archive size={14} />
                </button>
                <button className="p-1.5 hover:bg-red-500/20 rounded-md text-red-400 hover:text-red-300 transition-colors" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-white/40 font-mono">
              <span className="bg-white/5 px-2 py-1 rounded text-lightBlue border border-white/5">{mem.type.toUpperCase()}</span>
              <span>IMP: {mem.importance}</span>
              <span>EMO: {mem.emotional}</span>
              <span className="ml-auto">{mem.date}</span>
              <button className="flex items-center gap-1 hover:text-white transition-colors" title="Toggle Permanence">
                {mem.perm ? <Lock size={12} className="text-softGreen" /> : <Unlock size={12} />}
                {mem.perm ? 'PERMANENT' : 'TEMPORARY'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Trust & Safety Panel */}
      <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center mt-auto shrink-0">
        <div className="flex items-center gap-3 text-white/60 text-sm">
          <Shield size={16} className="text-lavender" />
          <span>End-to-End Local Storage. You own your data.</span>
        </div>
        <div className="flex gap-3">
          <button className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded transition-colors">Export ZIP</button>
          <button className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded transition-colors">Wipe Memory</button>
        </div>
      </div>
    </div>
  );
}
