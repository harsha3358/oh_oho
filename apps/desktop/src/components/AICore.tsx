import { motion } from 'framer-motion';

type CoreState = 'sleeping' | 'listening' | 'thinking' | 'researching' | 'planning' | 'speaking' | 'alerting';

export default function AICore({ state = 'sleeping' }: { state?: CoreState }) {
  // State styling maps
  const stateColors = {
    sleeping: 'rgba(96, 165, 250, 0.2)', // Soft light blue
    listening: 'rgba(96, 165, 250, 0.8)', // Bright light blue
    thinking: 'rgba(196, 181, 253, 0.8)', // Lavender
    researching: 'rgba(74, 222, 128, 0.8)', // Soft Green
    planning: 'rgba(196, 181, 253, 1)', // Bright Lavender
    speaking: 'rgba(255, 255, 255, 0.9)', // Pure White
    alerting: 'rgba(239, 68, 68, 0.8)', // Red alert
  };

  const getAnimationProps = () => {
    switch (state) {
      case 'sleeping':
        return { scale: [0.95, 1.05, 0.95], transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } };
      case 'listening':
        return { scale: [1, 1.2, 1], borderRadius: ["50%", "45%", "50%"], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } };
      case 'thinking':
        return { rotate: [0, 360], scale: [1, 0.9, 1], transition: { repeat: Infinity, duration: 3, ease: "linear" } };
      case 'researching':
        return { scale: [1, 1.1, 0.9, 1], rotate: [0, -180, -360], transition: { repeat: Infinity, duration: 2, ease: "backInOut" } };
      case 'speaking':
        return { scale: [1, 1.3, 1, 1.2, 1], transition: { repeat: Infinity, duration: 0.8, ease: "circInOut" } };
      case 'alerting':
        return { scale: [1, 1.1, 1], opacity: [1, 0.5, 1], transition: { repeat: Infinity, duration: 0.5, ease: "easeInOut" } };
      default:
        return { scale: 1 };
    }
  };

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer ambient glow */}
      <motion.div
        animate={getAnimationProps()}
        className="absolute w-full h-full rounded-full blur-3xl opacity-50"
        style={{ backgroundColor: stateColors[state] }}
      />
      
      {/* Middle orbital ring */}
      <motion.div
        animate={{ rotate: state === 'thinking' || state === 'planning' ? 360 : 0 }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        className="absolute w-48 h-48 border border-white/20 rounded-full"
      />
      <motion.div
        animate={{ rotate: state === 'thinking' || state === 'planning' ? -360 : 0 }}
        transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
        className="absolute w-56 h-56 border border-dashed border-white/10 rounded-full"
      />

      {/* Inner Core */}
      <motion.div
        animate={getAnimationProps()}
        className="relative z-10 w-32 h-32 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center backdrop-blur-xl border border-white/30"
        style={{ 
          background: `radial-gradient(circle at center, ${stateColors[state]}, rgba(0,0,0,0.8))`
        }}
      >
        <div className="w-16 h-16 rounded-full bg-white/20 blur-md mix-blend-overlay" />
      </motion.div>

      {/* State Label */}
      <div className="absolute -bottom-12 text-sm uppercase tracking-[0.3em] font-medium text-white/50 text-glow">
        {state}
      </div>
    </div>
  );
}
