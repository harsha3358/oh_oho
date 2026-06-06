import { Calendar, Target, Activity, Zap, TrendingUp, AlertCircle, Info } from 'lucide-react';

export default function Dashboard({ data }: { data: any }) {
  return (
    <div className="h-full w-full flex flex-col gap-6 p-6 overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light tracking-wide text-white">Chief of Staff</h2>
        <div className="px-3 py-1 text-xs rounded-full bg-softGreen/20 text-softGreen border border-softGreen/30 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-softGreen animate-pulse"></span>
          SYSTEM ONLINE
        </div>
      </div>

      {/* Morning Briefing Panel */}
      <div className="glass-panel p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-lightBlue border-b border-white/10 pb-2">
          <Calendar size={18} />
          <span className="font-medium tracking-wider text-sm uppercase">Morning Brief</span>
        </div>
        <p className="text-sm text-white/80 leading-relaxed">
          {data?.brief || "Awaiting synchronization..."}
        </p>
      </div>

      {/* Goal Momentum Grid */}
      {data?.goals?.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {data.goals.map((goal: any, idx: number) => (
            <div key={idx} className={`glass-panel p-4 flex flex-col gap-2 relative overflow-hidden ${goal.progress < 30 ? 'border-red-500/30' : ''}`}>
              <div className="flex justify-between items-start">
                {goal.progress < 30 ? <Activity size={18} className="text-red-400" /> : <Target size={18} className="text-lavender" />}
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${goal.progress < 30 ? 'text-red-400 bg-red-400/10' : 'text-lavender bg-lavender/10'}`}>
                  {goal.progress}% MOMENTUM
                </span>
              </div>
              <h3 className="font-medium mt-2">{goal.title}</h3>
              <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${goal.progress < 30 ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]' : 'bg-lavender shadow-[0_0_10px_rgba(196,181,253,0.8)]'}`}
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Growth Metrics */}
      <div className="glass-panel p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-softGreen border-b border-white/10 pb-2">
          <TrendingUp size={18} />
          <span className="font-medium tracking-wider text-sm uppercase">Growth Metrics</span>
        </div>
        <div className="space-y-3 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Execution Velocity</span>
            <span className="text-softGreen font-mono">{data?.metrics?.velocity}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Learning Consistency</span>
            <span className="text-white font-mono">{data?.metrics?.learning}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Stress Patterns</span>
            <span className="text-lavender font-mono">{data?.metrics?.stress}</span>
          </div>
        </div>
      </div>

      {/* Autonomous Research Insights */}
      {data?.insights?.length > 0 && (
        <div className="glass-panel p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Zap size={18} />
              <span className="font-medium tracking-wider text-sm uppercase">Research Insights</span>
            </div>
            <span className="text-xs text-white/40">Auto-Generated</span>
          </div>
          {data.insights.map((insight: any, idx: number) => (
            <div key={idx} className="flex gap-3 items-start mt-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <Info size={16} className="text-lightBlue shrink-0 mt-0.5" />
              <p className="text-sm text-white/70">{insight.content}</p>
            </div>
          ))}
        </div>
      )}
      
    </div>
  );
}
