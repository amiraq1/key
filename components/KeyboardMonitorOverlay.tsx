import React, { useEffect, useState } from 'react';
import { Activity, Server, Cpu } from 'lucide-react';

export const KeyboardMonitorOverlay: React.FC = () => {
  const [status, setStatus] = useState("Checking...");
  const [memory, setMemory] = useState("0 MB");
  const [elements, setElements] = useState(0);

  useEffect(() => {
    // Simulate Service periodic check (every 2 seconds)
    const interval = setInterval(() => {
      // 1. Check Keyboard Status (DOM Presence & Visibility)
      const keyboard = document.querySelector('.virtual-keyboard');
      if (keyboard) {
          const rect = keyboard.getBoundingClientRect();
          const isVisible = rect.height > 0 && window.getComputedStyle(keyboard).display !== 'none';
          setStatus(isVisible ? "Active" : "Hidden (Background)");
          
          // Count active keys
          setElements(keyboard.querySelectorAll('button').length);
      } else {
          setStatus("Service Detached");
          setElements(0);
      }

      // 2. Check Memory (Chrome specific API)
      const perf = window.performance as any;
      if (perf && perf.memory) {
        setMemory(`${Math.round(perf.memory.usedJSHeapSize / 1024 / 1024)} MB`);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-20 right-4 z-[100] bg-black/80 backdrop-blur-md text-white p-3 rounded-lg shadow-xl border border-white/10 text-[10px] font-mono pointer-events-none select-none animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-2 border-b border-white/20 pb-1">
        <Activity size={12} className="text-green-400" />
        <span className="font-bold text-green-400">Keyboard Monitor Service</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
            <span className="text-gray-400">Status:</span>
            <span className={status === 'Active' ? 'text-blue-300' : 'text-red-400'}>{status}</span>
        </div>
        
        <div className="flex justify-between gap-4">
            <span className="text-gray-400 flex items-center gap-1"><Cpu size={10}/> Memory:</span>
            <span>{memory}</span>
        </div>

        <div className="flex justify-between gap-4">
            <span className="text-gray-400 flex items-center gap-1"><Server size={10}/> Views:</span>
            <span>{elements} Nodes</span>
        </div>
      </div>
    </div>
  );
};