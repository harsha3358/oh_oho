import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  addMessage: (msg: Message) => void;
  setStreaming: (isStreaming: boolean) => void;
  appendStreamingContent: (content: string) => void;
  commitStreamingContent: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setStreaming: (isStreaming) => set({ isStreaming }),
  appendStreamingContent: (content) => set((state) => ({ streamingContent: state.streamingContent + content })),
  commitStreamingContent: () => {
    const { streamingContent, messages } = get();
    if (streamingContent) {
      set({
        messages: [...messages, { id: Date.now().toString(), role: 'assistant', content: streamingContent }],
        streamingContent: '',
        isStreaming: false,
      });
    }
  }
}));
