
import React, { useEffect, useState } from 'react';
import { X, ClipboardList, Pin, Trash2, Plus, Copy } from 'lucide-react';
import { Theme } from '../types';
import { THEME_STYLES } from '../constants';
import { getClipboardItems, addClipboardItem, deleteClipboardItem, togglePinClipboardItem, clearClipboard, ClipboardEntity } from '../services/dbService';

interface ClipboardPanelProps {
  theme: Theme;
  onClose: () => void;
  onInsert: (text: string) => void;
  transformOrigin?: { x: number, y: number };
}

export const ClipboardPanel: React.FC<ClipboardPanelProps> = ({ theme, onClose, onInsert, transformOrigin }) => {
  const [clips, setClips] = useState<ClipboardEntity[]>([]);
  const styles = THEME_STYLES[theme] || THEME_STYLES['Dark'];
  const isLight = theme === 'Light';

  useEffect(() => {
    loadClips();
  }, []);

  const loadClips = async () => {
    const items = await getClipboardItems();
    setClips(items);
  };

  const handleSystemPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        await addClipboardItem(text);
        loadClips();
      }
    } catch (err) {
      console.error("Clipboard permission denied", err);
      alert("Please allow clipboard access to use this feature.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (id) {
        await deleteClipboardItem(id);
        loadClips();
    }
  };

  const handlePin = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (id) {
        await togglePinClipboardItem(id);
        loadClips();
    }
  };

  const handleClear = async () => {
    if (window.confirm("Delete all clipboard history?")) {
        await clearClipboard();
        loadClips();
    }
  };

  const containerStyle: React.CSSProperties = {
      transformOrigin: transformOrigin ? `${transformOrigin.x}px ${transformOrigin.y}px` : 'center center',
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        style={containerStyle}
        className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-[scale-in_0.3s_ease-out] flex flex-col max-h-[80vh] ${isLight ? 'bg-white border-gray-200' : 'bg-[#1f1f1f] border-gray-800 border'}`}
      >
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#252525] border-gray-800'}`}>
          <h2 className={`font-semibold text-lg flex items-center gap-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            <ClipboardList size={18} className="text-blue-500"/>
            Clipboard
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-black/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Actions Bar */}
        <div className={`p-3 flex gap-2 border-b ${isLight ? 'bg-white border-gray-100' : 'bg-[#1f1f1f] border-gray-800'}`}>
           <button 
             onClick={handleSystemPaste}
             className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${isLight ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'}`}
           >
             <Plus size={16} />
             Paste from System
           </button>
           {clips.length > 0 && (
             <button 
               onClick={handleClear}
               className={`py-2 px-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${isLight ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-900/20 text-red-400 hover:bg-red-900/40'}`}
               title="Clear All"
             >
               <Trash2 size={16} />
             </button>
           )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
           {clips.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-2 opacity-50">
                  <ClipboardList size={40} />
                  <p className="text-sm">History is empty</p>
               </div>
           ) : (
               clips.map(clip => (
                 <div 
                   key={clip.id}
                   onClick={() => onInsert(clip.text)}
                   className={`group relative p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${isLight ? 'bg-white border-gray-200 hover:border-blue-300' : 'bg-[#2a2a2a] border-gray-700 hover:border-blue-500/50'}`}
                 >
                    <div className="flex justify-between items-start mb-1">
                       <p className={`text-sm line-clamp-3 w-full pr-8 break-words ${isLight ? 'text-gray-700' : 'text-gray-200'}`}>
                         {clip.text}
                       </p>
                       <div className="flex flex-col gap-1 absolute top-2 right-2">
                          <button 
                            onClick={(e) => handlePin(e, clip.id!)}
                            className={`p-1.5 rounded-full transition-colors ${clip.isPinned ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400 hover:text-blue-500 hover:bg-black/10 opacity-0 group-hover:opacity-100'}`}
                          >
                             <Pin size={14} fill={clip.isPinned ? "currentColor" : "none"} />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, clip.id!)}
                            className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                             <Trash2 size={14} />
                          </button>
                       </div>
                    </div>
                    {/* Timestamp */}
                    <p className="text-[10px] text-gray-500 mt-1">
                      {new Date(clip.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                 </div>
               ))
           )}
        </div>
        
        <div className={`p-2 text-center text-[10px] ${isLight ? 'bg-gray-50 text-gray-400' : 'bg-[#1a1a1a] text-gray-600'}`}>
           Tap an item to insert
        </div>
      </div>
    </div>
  );
};
