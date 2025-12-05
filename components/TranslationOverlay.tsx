import React, { useEffect, useState } from 'react';
import { X, ArrowRight, ArrowDown, ArrowRightLeft, Copy, Check, Mic, Camera } from 'lucide-react';
import { Theme, SupportedLanguage } from '../types';
import { THEME_STYLES, SUPPORTED_LANGUAGES } from '../constants';

interface TranslationOverlayProps {
  originalText: string;
  translatedText: string;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  isRealTime: boolean;
  onOriginalTextChange: (text: string) => void;
  onSourceLangChange: (lang: SupportedLanguage) => void;
  onTargetLangChange: (lang: SupportedLanguage) => void;
  onSwapLanguages: () => void;
  onToggleRealTime: () => void;
  onInsert: () => void;
  onCopy: () => void;
  onClose: () => void;
  theme: Theme;
}

export const TranslationOverlay: React.FC<TranslationOverlayProps> = ({
  originalText,
  translatedText,
  sourceLang,
  targetLang,
  isRealTime,
  onOriginalTextChange,
  onSourceLangChange,
  onTargetLangChange,
  onSwapLanguages,
  onToggleRealTime,
  onInsert,
  onCopy,
  onClose,
  theme
}) => {
  const styles = THEME_STYLES[theme] || THEME_STYLES['Dark'];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full max-w-3xl mx-auto p-4 rounded-t-xl border-t shadow-2xl transition-all duration-300 ${styles.barBg} border-opacity-20`}>
      {/* Header: Language Selection */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <select 
          value={sourceLang}
          onChange={(e) => onSourceLangChange(e.target.value as SupportedLanguage)}
          className={`flex-1 p-2 rounded-lg text-sm font-bold text-center appearance-none cursor-pointer outline-none border focus:border-blue-500 transition-colors ${styles.inputPlaceholder} ${theme === 'Light' ? 'bg-white border-gray-300' : 'bg-black/20 border-white/10'}`}
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <option key={`src-${lang.code}`} value={lang.code}>{lang.label}</option>
          ))}
        </select>

        <button 
          onClick={onSwapLanguages}
          disabled={sourceLang === 'auto'}
          className={`p-2 rounded-full transition-colors ${sourceLang === 'auto' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/10'}`}
        >
          <ArrowRightLeft size={18} className={styles.textMain} />
        </button>

        <select 
          value={targetLang}
          onChange={(e) => onTargetLangChange(e.target.value as SupportedLanguage)}
          className={`flex-1 p-2 rounded-lg text-sm font-bold text-center appearance-none cursor-pointer outline-none border focus:border-blue-500 transition-colors ${styles.inputPlaceholder} ${theme === 'Light' ? 'bg-white border-gray-300' : 'bg-black/20 border-white/10'}`}
        >
          {SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
            <option key={`tgt-${lang.code}`} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </div>

      {/* Body: Input/Output */}
      <div className="flex flex-col gap-2">
        <textarea
          value={originalText}
          onChange={(e) => onOriginalTextChange(e.target.value)}
          placeholder="Enter text to translate..."
          className={`w-full p-3 rounded-lg text-base resize-none outline-none border focus:border-blue-500 transition-colors min-h-[80px] ${theme === 'Light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-black/20 border-white/10 text-white'}`}
          dir={sourceLang === 'ar' ? 'rtl' : 'ltr'}
        />

        <div className="flex justify-center -my-3 z-10">
          <div className={`p-1.5 rounded-full border shadow-sm ${theme === 'Light' ? 'bg-white border-gray-200' : 'bg-[#333] border-gray-600'}`}>
            <ArrowDown size={16} className="text-blue-500" />
          </div>
        </div>

        <div className={`w-full p-3 rounded-lg text-base min-h-[80px] border relative ${theme === 'Light' ? 'bg-blue-50 border-blue-100 text-blue-900' : 'bg-blue-900/20 border-blue-500/30 text-blue-100'}`} dir={targetLang === 'ar' ? 'rtl' : 'ltr'}>
          {translatedText || <span className="opacity-50 italic">Translation will appear here...</span>}
        </div>
      </div>

      {/* Footer: Actions */}
      <div className="mt-4 flex flex-col gap-3">
        
        {/* Real-time Toggle */}
        <div className="flex items-center gap-3 px-1">
           <button 
             onClick={onToggleRealTime}
             className={`w-10 h-5 rounded-full relative transition-colors ${isRealTime ? 'bg-green-500' : 'bg-gray-400'}`}
           >
             <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isRealTime ? 'left-5.5' : 'left-0.5'}`} />
           </button>
           <span className="text-sm font-medium opacity-80">Real-time Translation</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onInsert}
            disabled={!translatedText}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Insert Translation
          </button>
          
          <button 
            onClick={handleCopy}
            disabled={!translatedText}
            className={`flex-1 py-2.5 border rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${theme === 'Light' ? 'border-gray-300 hover:bg-gray-50 text-gray-700' : 'border-gray-600 hover:bg-gray-800 text-gray-300'}`}
          >
            {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button 
            onClick={onClose}
            className={`p-2.5 rounded-lg border transition-colors ${theme === 'Light' ? 'border-gray-300 hover:bg-gray-100 text-gray-500' : 'border-gray-600 hover:bg-gray-800 text-gray-400'}`}
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};