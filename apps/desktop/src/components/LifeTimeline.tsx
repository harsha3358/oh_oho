import { History, GitCommit, Play, CheckCircle, Target } from 'lucide-react';

export default function LifeTimeline() {
  const timelineEvents = [
    { type: 'achievement', title: 'Completed Sprint 3', time: 'Today, 10:30 AM', desc: 'Successfully integrated Chief of Staff layer and Proactive Scheduler.', icon: <CheckCircle className="text-softGreen" size={16} /> },
    { type: 'goal', title: 'New Goal Created: Placement Prep', time: 'Yesterday', desc: 'Target: Complete DSA revisions and mock interviews by next month.', icon: <Target className="text-lightBlue" size={16} /> },
    { type: 'reflection', title: 'Weekly Reflection', time: 'Sunday', desc: 'Identified a pattern of high execution velocity but elevated stress. Recommended adjusting sleep schedule.', icon: <History className="text-lavender" size={16} /> },
    { type: 'action', title: 'Started Truxlo Refactoring', time: 'Last Thursday', desc: 'Began modularizing the logistics microservices.', icon: <Play className="text-white/60" size={16} /> }
  ];

  return (
    <div className="h-full w-full flex flex-col gap-6 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <History className="text-lavender" size={24} />
          <h2 className="text-2xl font-light tracking-wide text-white">Life Timeline</h2>
        </div>
        <div className="flex gap-2">
          <button className="text-xs px-3 py-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">Last 7 Days</button>
          <button className="text-xs px-3 py-1.5 text-white/50 hover:text-white transition-colors">30 Days</button>
          <button className="text-xs px-3 py-1.5 text-white/50 hover:text-white transition-colors">All Time</button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto relative pl-4 pr-2">
        {/* Vertical connecting line */}
        <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent"></div>

        <div className="space-y-8 pb-8">
          {timelineEvents.map((event, i) => (
            <div key={i} className="relative flex gap-6 group">
              {/* Timeline dot */}
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-dark border-2 border-white/20 flex items-center justify-center group-hover:border-lightBlue transition-colors z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-lightBlue transition-colors"></div>
              </div>
              
              <div className="ml-6 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {event.icon}
                  <span className="text-sm font-medium text-white/90">{event.title}</span>
                  <span className="text-xs font-mono text-white/40 ml-auto">{event.time}</span>
                </div>
                <div className="glass-panel p-3 mt-2 text-sm text-white/70">
                  {event.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
