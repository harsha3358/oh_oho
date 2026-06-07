import { useState } from 'react';
import { Shield, Key, CheckCircle, Database, Lock, Box, BrainCircuit, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomeWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState('hybrid');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [optInTelemetry, setOptInTelemetry] = useState(false);

  const handleSaveAndContinue = async () => {
    if (step === 3) {
      setSaving(true);
      if (window.electronAPI) {
        await window.electronAPI.saveSecret('GEMINI_API_KEY', apiKey);
      }
      
      // Handle telemetry preference
      if (optInTelemetry) {
        import('posthog-js').then((posthog) => posthog.default.opt_in_capturing());
      } else {
        import('posthog-js').then((posthog) => posthog.default.opt_out_capturing());
      }

      setTimeout(() => {
        setSaving(false);
        setStep(4);
      }, 1000);
      return;
    }
    
    if (step === 5) {
      onComplete();
      return;
    }
    
    setStep(s => s + 1);
  };

  return (
    <div className="fixed inset-0 bg-dark z-50 flex items-center justify-center text-primary selection:bg-lightBlue/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-lightBlue/10 via-dark to-dark opacity-50"></div>
      
      <div className="w-full max-w-2xl bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col h-[600px]">
        
        {/* Progress Bar */}
        <div className="h-1 w-full bg-white/5 absolute top-0 left-0">
          <motion.div 
            className="h-full bg-lightBlue"
            initial={{ width: '20%' }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="p-10 flex-1 relative flex flex-col">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full items-center justify-center text-center gap-6">
                <BrainCircuit size={64} className="text-lightBlue drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]" />
                <div>
                  <h1 className="text-4xl font-light tracking-wide mb-3">Welcome to Harsha's Assistant</h1>
                  <p className="text-white/60 text-lg">Your Personal Operating System. Let's get you set up securely.</p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full gap-6">
                <div>
                  <h2 className="text-2xl font-light">Select AI Engine</h2>
                  <p className="text-white/50 mt-2">Choose how Harsha's Assistant powers its reasoning.</p>
                </div>
                
                <div className="grid gap-4 mt-4">
                  <div onClick={() => setProvider('gemini')} className={`p-4 rounded-xl border cursor-pointer transition-all ${provider === 'gemini' ? 'border-lightBlue bg-lightBlue/10' : 'border-white/10 hover:border-white/30 bg-white/5'}`}>
                    <h3 className="font-medium text-lg">Google Gemini (Cloud)</h3>
                    <p className="text-sm text-white/50 mt-1">Maximum reasoning capability. Requires API Key.</p>
                  </div>
                  <div onClick={() => setProvider('ollama')} className={`p-4 rounded-xl border cursor-pointer transition-all ${provider === 'ollama' ? 'border-lavender bg-lavender/10' : 'border-white/10 hover:border-white/30 bg-white/5'}`}>
                    <h3 className="font-medium text-lg">Ollama (Local)</h3>
                    <p className="text-sm text-white/50 mt-1">100% private. Requires heavy local hardware.</p>
                  </div>
                  <div onClick={() => setProvider('hybrid')} className={`p-4 rounded-xl border cursor-pointer transition-all ${provider === 'hybrid' ? 'border-softGreen bg-softGreen/10' : 'border-white/10 hover:border-white/30 bg-white/5'}`}>
                    <h3 className="font-medium text-lg">Hybrid (Recommended)</h3>
                    <p className="text-sm text-white/50 mt-1">Gemini for heavy reasoning, Ollama for background tasks.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full gap-6">
                <div>
                  <h2 className="text-2xl font-light">Secure Configuration</h2>
                  <p className="text-white/50 mt-2">Provide your API key. It will be encrypted natively in your OS Keychain.</p>
                </div>
                
                <div className="mt-8">
                  <label className="block text-sm text-white/70 mb-2">Gemini API Key</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-3.5 text-white/30" size={18} />
                    <input 
                      type="password" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-black/50 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-lightBlue"
                    />
                  </div>
                  <p className="text-xs text-lavender mt-3 flex items-center gap-1"><Lock size={12}/> Never exposed to the UI renderer process.</p>
                  
                  {/* Telemetry Opt-in */}
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={optInTelemetry} onChange={(e) => setOptInTelemetry(e.target.checked)} className="mt-1 w-4 h-4 rounded border-white/20 bg-black/40 text-lightBlue focus:ring-lightBlue/50" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white/90">Share Anonymous Usage Data</span>
                        <span className="text-xs text-white/50 mt-1">Help us improve Harsha's Assistant Beta by sharing anonymous crash reports and feature usage. We never collect personal data, memories, or API keys.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full items-center justify-center text-center gap-6">
                <Box size={48} className="text-lavender animate-pulse" />
                <div>
                  <h2 className="text-2xl font-light">Dependency Check</h2>
                  <p className="text-white/50 mt-2">Verifying local dependencies for audio and models...</p>
                </div>
                
                <div className="w-full max-w-sm mt-6 text-left space-y-3 bg-black/50 p-4 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle size={16} className="text-softGreen" /> SQLite Engine Found
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle size={16} className="text-softGreen" /> ChromaDB Ready
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <div className="w-4 h-4 rounded-full border-2 border-t-lightBlue animate-spin"></div> Scanning for Whisper...
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full items-center justify-center text-center gap-6">
                <Shield size={64} className="text-softGreen" />
                <div>
                  <h2 className="text-3xl font-light mb-3">Harsha's Assistant is Ready</h2>
                  <p className="text-white/60">Your Personal OS is securely configured and encrypted.</p>
                </div>
                
                <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl text-left max-w-sm">
                  <h4 className="text-sm font-medium mb-2 text-lightBlue">Recovery Key</h4>
                  <p className="text-xs text-white/50 mb-3">Save this key to recover your encrypted memories if you lose access.</p>
                  <code className="block w-full bg-black/80 p-3 rounded font-mono text-xs text-center border border-white/20 select-all">
                    A7B9-X2M4-9P1L-CQ88
                  </code>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Footer Controls */}
          <div className="absolute bottom-10 right-10 left-10 flex justify-between items-center">
            {step > 1 && step < 5 ? (
              <button onClick={() => setStep(s => s - 1)} className="text-white/50 hover:text-white transition-colors text-sm font-medium">Back</button>
            ) : <div></div>}
            
            <button 
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="bg-primary text-dark px-6 py-2.5 rounded-full font-medium flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
            >
              {saving ? 'Saving...' : step === 5 ? "Launch Harsha's Assistant" : 'Continue'} 
              {!saving && step !== 5 && <ArrowRight size={16} />}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
