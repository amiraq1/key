
import React, { useState } from 'react';
import { Sparkles, CheckCheck, Wand2, Loader2, Languages, Mic, Camera, ClipboardList } from 'lucide-react';
import { ToneType, Theme } from '../types';
import { THEME_STYLES } from '../constants';

interface AIControlBarProps {
  isLoading: boolean;
  onComplete: () => void;
  onFixGrammar: () => void;
  onChangeTone: (tone: ToneType) => void;
  onQuickTranslate: () => void;
  onVoiceTranslate: () => void;
  onCameraTranslate: () => void;
  onOpenClipboard: () => void;
  theme: Theme;
}

export const AIControlBar: React.FC<AIControlBarProps> = ({ 
  isLoading, 
  onComplete, 
  onFixGrammar, 
  onChangeTone,
  onQuickTranslate,
  onVoiceTranslate,
  onCameraTranslate,
  onOpenClipboard,
  theme
}) => {
  const [showTones, setShowTones] = useState(false);
  const styles = THEME_STYLES[theme] || THEME_STYLES['Dark'];

  // Button base styles based on theme brightness
  const isLight = theme === 'Light';
  const btnBase = isLight ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-[#333] hover:bg-[#444] text-gray-200';
  const primaryBtn = isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500';

  return (
    <div className={`w-full max-w-3xl mx-auto p-2 flex items-center justify-between gap-2 overflow-x-auto rounded-t-lg border-b transition-colors duration-300 ${styles.barBg}`}>
      
      {isLoading ? (
        <div className="flex items-center gap-2 text-blue-400 px-4 py-2 w-full justify-center">
          <Loader2 className="animate-spin" size={18} />
          <span className="text-sm font-medium">Gemini is thinking...</span>
        </div>
      ) : (
        <>
          <button 
            onClick={onComplete}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${primaryBtn}`}
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">Complete</span>
          </button>

          <button 
            onClick={onFixGrammar}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${btnBase}`}
          >
            <CheckCheck size={16} />
            <span className="hidden sm:inline">Fix</span>
          </button>

          {/* Quick Toolbar Section (from XML) */}
          <div className="flex items-center gap-1 pl-1 border-l border-opacity-10 border-gray-500">
             <button 
              onClick={onQuickTranslate}
              className={`p-2 rounded-md transition-colors ${btnBase}`}
              title="Quick Translate"
            >
              <Languages size={18} />
            </button>
            <button 
              onClick={onVoiceTranslate}
              className={`p-2 rounded-md transition-colors ${btnBase}`}
              title="Voice Translate"
            >
              <Mic size={18} />
            </button>
            <button 
              onClick={onCameraTranslate}
              className={`p-2 rounded-md transition-colors ${btnBase}`}
              title="Camera Translate"
            >
              <Camera size={18} />
            </button>
             <button 
              onClick={onOpenClipboard}
              className={`p-2 rounded-md transition-colors ${btnBase}`}
              title="Clipboard History"
            >
              <ClipboardList size={18} />
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowTones(!showTones)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${showTones ? 'bg-purple-600 text-white' : btnBase}`}
            >
              <Wand2 size={16} />
              <span className="hidden sm:inline">Tone</span>
            </button>

            {showTones && (
              <div className={`absolute bottom-full right-0 mb-2 w-40 rounded-lg shadow-xl overflow-hidden flex flex-col z-20 border ${isLight ? 'bg-white border-gray-200' : 'bg-[#333] border-[#444]'}`}>
                {Object.values(ToneType).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => {
                      onChangeTone(tone);
                      setShowTones(false);
                    }}
                    className={`px-4 py-3 text-left text-sm border-b last:border-0 ${isLight ? 'text-gray-800 hover:bg-gray-50 border-gray-100' : 'text-gray-200 hover:bg-[#444] hover:text-white border-[#444]'}`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
