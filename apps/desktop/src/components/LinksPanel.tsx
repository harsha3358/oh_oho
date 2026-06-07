import { Link2, Code2, Briefcase, FileText, ExternalLink, Copy } from 'lucide-react';

export type DiscoveredLink = {
  id: string;
  title: string;
  url: string;
  type: 'github' | 'linkedin' | 'article' | 'url';
};

interface LinksPanelProps {
  links: DiscoveredLink[];
}

export default function LinksPanel({ links }: LinksPanelProps) {
  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'github': return <Code2 size={16} className="text-white/70" />;
      case 'linkedin': return <Briefcase size={16} className="text-blue-400" />;
      case 'article': return <FileText size={16} className="text-lavender" />;
      default: return <Link2 size={16} className="text-lightBlue" />;
    }
  };

  return (
    <div className="w-[350px] h-full flex flex-col bg-black/30 backdrop-blur-md border-l border-white/5 relative z-20 flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/80">
          <Link2 size={16} className="text-lavender" />
          <span className="text-xs font-mono uppercase tracking-widest font-medium">Context & Links</span>
        </div>
      </div>

      {/* Links List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
        {links.length === 0 ? (
          <div className="text-xs text-white/30 font-mono text-center my-8 uppercase tracking-widest px-4 leading-relaxed">
            No links discovered in current session.
          </div>
        ) : (
          links.map((link) => (
            <div key={link.id} className="group relative bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0 bg-black/40 p-1.5 rounded-md border border-white/5">
                  {getIcon(link.type)}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm text-white/90 font-medium truncate" title={link.title}>
                    {link.title}
                  </span>
                  <span className="text-xs text-white/40 truncate mt-0.5 font-mono" title={link.url}>
                    {link.url.replace(/^https?:\/\/(www\.)?/, '')}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons Overlay */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                <button 
                  onClick={() => handleCopy(link.url)}
                  className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="Copy URL"
                >
                  <Copy size={14} />
                </button>
                <a 
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-white/50 hover:text-lightBlue hover:bg-white/10 rounded transition-colors"
                  title="Open in Browser"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
