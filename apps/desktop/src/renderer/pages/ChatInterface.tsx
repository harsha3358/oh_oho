import React, { useState, useEffect, useRef } from 'react';
import { useSystemStore } from '../stores/systemStore';
import { useChatStore } from '../stores/chatStore';

export default function ChatInterface() {
  const { jarvisState, isBackendConnected } = useSystemStore();
  const { messages, addMessage, isStreaming, streamingContent, appendStreamingContent, commitStreamingContent, setStreaming } = useChatStore();
  
  const [input, setInput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    // Phase 1C: Setup WebSocket connection
    const ws = new WebSocket('ws://localhost:8765/ws/default_session');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'token') {
        setStreaming(true);
        appendStreamingContent(data.text);
        // Simple mock for end of stream: if it contains a period (very naive just for testing Phase 1A)
        if (data.text.includes('JARVIS received')) {
             setTimeout(() => commitStreamingContent(), 500);
        }
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const handleSend = () => {
    if (!input.trim() || !wsRef.current) return;
    
    addMessage({ id: Date.now().toString(), role: 'user', content: input });
    
    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      content: input
    }));
    
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-jarvis-bg)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isBackendConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
          <span className="font-semibold tracking-widest text-sm text-gray-300">SYSTEM.JARVIS</span>
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-widest">
          State: <span className="text-[var(--color-jarvis-accent)]">{jarvisState}</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-[var(--color-jarvis-panel)] border border-gray-800 text-gray-200' : 'bg-transparent text-[var(--color-jarvis-accent)] font-medium'}`}>
               {msg.content}
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
             <div className="max-w-[70%] p-4 rounded-2xl bg-transparent text-[var(--color-jarvis-accent)] font-medium">
                {streamingContent}<span className="animate-pulse">▋</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 bg-[var(--color-jarvis-panel)]">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Talk to JARVIS..."
            className="flex-1 bg-black/30 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-[var(--color-jarvis-accent)] transition-colors"
          />
          <button 
            onClick={handleSend}
            className="px-6 py-3 bg-[var(--color-jarvis-accent)] hover:bg-blue-600 rounded-lg font-medium transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
