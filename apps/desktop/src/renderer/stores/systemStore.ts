import { create } from 'zustand';

interface SystemState {
  jarvisState: 'sleeping' | 'listening' | 'thinking' | 'speaking' | 'working';
  isBackendConnected: boolean;
  setJarvisState: (state: SystemState['jarvisState']) => void;
  setBackendConnection: (status: boolean) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  jarvisState: 'sleeping',
  isBackendConnected: false,
  setJarvisState: (state) => set({ jarvisState: state }),
  setBackendConnection: (status) => set({ isBackendConnected: status }),
}));
