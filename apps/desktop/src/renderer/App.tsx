import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import ChatInterface from './pages/ChatInterface';

function App() {
  return (
    <BrowserRouter>
      <div className="w-screen h-screen bg-[var(--color-jarvis-bg)] text-[var(--color-jarvis-text)] flex flex-col">
        {/* Custom Titlebar for Electron */}
        <div className="h-10 w-full drag-region flex items-center px-4 font-semibold text-sm border-b border-gray-800">
          JARVIS Personal OS
        </div>
        
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/chat" element={<ChatInterface />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
