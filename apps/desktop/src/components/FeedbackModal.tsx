import { useState } from 'react';
import { Bug, Lightbulb, MessageSquare, X, Send, Phone } from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'general';

interface FeedbackModalProps {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>('general');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [attachLogs, setAttachLogs] = useState(false);

  const FOUNDER_EMAIL = "harshavardhan414212@gmail.com";
  const WHATSAPP_NUMBER = "+91 9908234531";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct email body
    const subject = `[JARVIS Beta] ${type.toUpperCase()}: from ${name || 'User'}`;
    let body = `Name: ${name}\nEmail: ${email}\nType: ${type}\n\nDescription:\n${description}\n\n`;
    
    if (attachLogs) {
      body += `[SYSTEM LOGS WOULD BE ATTACHED HERE IN PRODUCTION]\n`;
      body += `Platform: ${window.navigator.userAgent}\n`;
    }

    // Launch native mail client
    window.location.href = `mailto:${FOUNDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    onClose();
  };

  const handleWhatsApp = () => {
    const text = `Hi, I need urgent assistance with JARVIS Beta.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-dark border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-light text-white tracking-wide">Beta Feedback</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          
          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-3">
            <button type="button" onClick={() => setType('bug')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${type === 'bug' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'}`}>
              <Bug size={20} />
              <span className="text-xs uppercase tracking-wider">Bug</span>
            </button>
            <button type="button" onClick={() => setType('feature')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${type === 'feature' ? 'bg-softGreen/20 border-softGreen/50 text-softGreen' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'}`}>
              <Lightbulb size={20} />
              <span className="text-xs uppercase tracking-wider">Feature</span>
            </button>
            <button type="button" onClick={() => setType('general')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${type === 'general' ? 'bg-lightBlue/20 border-lightBlue/50 text-lightBlue' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'}`}>
              <MessageSquare size={20} />
              <span className="text-xs uppercase tracking-wider">General</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-white/50">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-lightBlue/50" placeholder="Tony Stark" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-white/50">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-lightBlue/50" placeholder="tony@stark.com" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider text-white/50">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-lightBlue/50 resize-none" placeholder="What happened or what would you like to see?" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <input type="checkbox" checked={attachLogs} onChange={(e) => setAttachLogs(e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-black/40 text-lightBlue focus:ring-lightBlue/50 focus:ring-offset-dark" />
            <span className="text-sm text-white/80">Attach diagnostic logs (Recommended for bugs)</span>
          </label>

          {/* Actions */}
          <div className="flex justify-between items-center mt-2 pt-5 border-t border-white/10">
            <button type="button" onClick={handleWhatsApp} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-medium">
              <Phone size={16} />
              Urgent Support
            </button>
            
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-lightBlue text-dark hover:bg-lightBlue/90 transition-colors text-sm font-medium shadow-[0_0_15px_rgba(96,165,250,0.4)]">
              <Send size={16} />
              Send to Founder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
