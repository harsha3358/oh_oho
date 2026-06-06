import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemStore } from '../stores/systemStore';

export default function Onboarding() {
  const navigate = useNavigate();
  const setBackendConnection = useSystemStore(state => state.setBackendConnection);
  
  const [step, setStep] = useState(0);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'found' | 'missing'>('checking');
  const [models, setModels] = useState({
    qwen: { status: 'pending', progress: 0 },
    gemma: { status: 'pending', progress: 0 },
    embed: { status: 'pending', progress: 0 },
  });

  useEffect(() => {
    // Phase 1D: Ping local backend to verify health
    fetch('http://localhost:8765/api/v1/system/health')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBackendConnection(true);
        }
      })
      .catch(() => setBackendConnection(false));

    // Mock check for Ollama
    setTimeout(() => {
      setOllamaStatus('found');
      setStep(1);
    }, 1500);
  }, []);

  const skipLocal = () => {
    // Skip downloads, use Gemini API
    navigate('/chat');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-4xl font-bold mb-4 text-[var(--color-jarvis-accent)]">JARVIS Initializing</h1>
      
      <div className="w-full max-w-lg bg-[var(--color-jarvis-panel)] rounded-xl p-6 shadow-2xl border border-gray-800">
        {step === 0 && (
          <div className="text-center">
            <p>Checking system requirements...</p>
            <p className="mt-2 text-sm text-gray-400">Verifying Backend Connection</p>
            <p className="mt-1 text-sm text-gray-400">Detecting Ollama Installation: {ollamaStatus}</p>
          </div>
        )}
        
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Model Manager</h2>
            <p className="text-sm text-gray-400 mb-6">JARVIS requires local AI models to run privately. We will download Qwen 2.5, Gemma, and Embedding models now.</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Qwen 2.5 (7B)</span>
                <span className="text-sm px-2 py-1 bg-blue-900/50 text-blue-400 rounded">Pending</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Faster-Whisper (STT)</span>
                <span className="text-sm px-2 py-1 bg-blue-900/50 text-blue-400 rounded">Pending</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Kokoro TTS</span>
                <span className="text-sm px-2 py-1 bg-blue-900/50 text-blue-400 rounded">Pending</span>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button 
                onClick={skipLocal}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Skip & Use Gemini API
              </button>
              <button 
                onClick={() => navigate('/chat')}
                className="px-6 py-2 bg-[var(--color-jarvis-accent)] text-white font-medium rounded hover:bg-blue-600 transition-colors">
                Start Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
