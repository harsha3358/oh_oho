import { Calendar, Target, Activity, Zap, Info, ShieldAlert, CheckCircle, GitBranch, Rocket, Lock } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Dashboard({ data }: { data: any }) {
  return (
    <div className="h-full w-full flex flex-col gap-6 p-6 overflow-y-auto overflow-x-hidden">
      {/* Header with Greeting */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light tracking-wide text-white">Daily Executive Brief</h2>
          <div className="px-3 py-1 text-xs rounded-full bg-softGreen/20 text-softGreen border border-softGreen/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-softGreen animate-pulse"></span>
            Focus Score: {data?.focus_score || 0}/100
          </div>
        </div>
        <p className="text-lavender font-medium mt-2 italic">
          {data?.greeting || "Initializing cognitive routines..."}
        </p>
      </div>

      {/* Suggested First Action / Priority */}
      {data?.suggested_first_action && (
        <div className="glass-panel p-4 flex items-center justify-between border-lightBlue/30 bg-lightBlue/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-lightBlue/20 rounded-lg text-lightBlue">
              <Zap size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-white/50 uppercase tracking-widest">Suggested First Action</span>
              <span className="text-white font-medium">{data.suggested_first_action}</span>
            </div>
          </div>
          <button className="px-4 py-2 bg-lightBlue/20 hover:bg-lightBlue/30 text-lightBlue rounded-lg text-sm font-medium transition-colors border border-lightBlue/30">
            Execute
          </button>
        </div>
      )}

      {/* Founder Summary */}
      <div className="glass-panel p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-primary border-b border-white/10 pb-2">
          <Calendar size={18} />
          <span className="font-medium tracking-wider text-sm uppercase">Founder Summary</span>
        </div>
        <p className="text-sm text-white/80 leading-relaxed">
          {data?.founder_summary || "Awaiting synchronization..."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* GitHub Activity */}
        <div className="glass-panel p-5 flex flex-col gap-3 border-l-4 border-l-white/20">
          <div className="flex items-center gap-2 text-white border-b border-white/10 pb-2">
            <GitBranch size={18} />
            <span className="font-medium tracking-wider text-sm uppercase">GitHub Activity</span>
          </div>
          <p className="text-sm text-white/70">{data?.github_activity || "No recent activity."}</p>
        </div>

        {/* Truxlo Progress */}
        <div className="glass-panel p-5 flex flex-col gap-3 border-l-4 border-l-lavender">
          <div className="flex items-center gap-2 text-lavender border-b border-white/10 pb-2">
            <Rocket size={18} />
            <span className="font-medium tracking-wider text-sm uppercase">Truxlo Progress</span>
          </div>
          <p className="text-sm text-white/70">{data?.truxlo_progress || "No active sprint data."}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* At-Risk Goals */}
        <div className="glass-panel p-5 flex flex-col gap-3 border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 text-red-400 border-b border-red-500/20 pb-2">
            <ShieldAlert size={18} />
            <span className="font-medium tracking-wider text-sm uppercase">At-Risk Goals</span>
          </div>
          <ul className="text-sm text-white/70 space-y-2 list-disc pl-4">
            {data?.at_risk_goals?.map((goal: string, idx: number) => (
              <li key={idx} className="text-red-200">{goal}</li>
            ))}
          </ul>
        </div>

        {/* Biggest Bottleneck */}
        <div className="glass-panel p-5 flex flex-col gap-3 border border-orange-500/20 bg-orange-500/5">
          <div className="flex items-center gap-2 text-orange-400 border-b border-orange-500/20 pb-2">
            <Lock size={18} />
            <span className="font-medium tracking-wider text-sm uppercase">Biggest Bottleneck</span>
          </div>
          <p className="text-sm text-orange-200">{data?.biggest_bottleneck || "None detected."}</p>
        </div>

        {/* Quick Win */}
        <div className="glass-panel p-5 flex flex-col gap-3 border border-softGreen/20 bg-softGreen/5">
          <div className="flex items-center gap-2 text-softGreen border-b border-softGreen/20 pb-2">
            <CheckCircle size={18} />
            <span className="font-medium tracking-wider text-sm uppercase">Quick Win</span>
          </div>
          <p className="text-sm text-green-200">{data?.quick_win_opportunity || "None identified."}</p>
        </div>
      </div>

      {/* Goal Momentum Grid */}
      {data?.open_goals?.length > 0 && (
        <div className="mt-2">
          <h3 className="text-sm font-medium tracking-widest uppercase text-white/50 mb-4">Goal Momentum</h3>
          <div className="grid grid-cols-3 gap-4">
            {data.open_goals.map((goal: any, idx: number) => (
              <div key={idx} className="glass-panel p-4 flex flex-col gap-2 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <Target size={18} className="text-lavender" />
                  <span className="text-xs font-mono px-2 py-0.5 rounded text-lavender bg-lavender/10">
                    {goal.progress}%
                  </span>
                </div>
                <h3 className="font-medium mt-2 truncate">{goal.title}</h3>
                <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-lavender shadow-[0_0_10px_rgba(196,181,253,0.8)]"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deadlines */}
      {data?.upcoming_deadlines?.length > 0 && (
        <div className="glass-panel p-5 flex flex-col gap-3 mt-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Calendar size={18} />
              <span className="font-medium tracking-wider text-sm uppercase">Upcoming Deadlines</span>
            </div>
          </div>
          {data.upcoming_deadlines.map((deadline: string, idx: number) => (
            <div key={idx} className="flex gap-3 items-start mt-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <Info size={16} className="text-lightBlue shrink-0 mt-0.5" />
              <p className="text-sm text-white/70">{deadline}</p>
            </div>
          ))}
        </div>
      )}
      
    </div>
  );
}
