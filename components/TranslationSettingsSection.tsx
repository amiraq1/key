import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Zap, WifiOff, Download, Database, Trash2 } from 'lucide-react';
import { KeyboardSettings, SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { clearTranslationCache, getTranslationCacheSize } from '../services/dbService';

interface TranslationSettingsSectionProps {
  settings: KeyboardSettings;
  onUpdateSettings: (newSettings: KeyboardSettings) => void;
  isArabic: boolean;
}

export const TranslationSettingsSection: React.FC<TranslationSettingsSectionProps> = ({
  settings,
  onUpdateSettings,
  isArabic
}) => {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cacheCount, setCacheCount] = useState<number>(0);

  useEffect(() => {
    loadCacheSize();
  }, []);

  const loadCacheSize = async () => {
    const size = await getTranslationCacheSize();
    setCacheCount(size);
  };

  const handleSourceLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ 
        ...settings, 
        translationSource: e.target.value as SupportedLanguage,
        autoDetectLanguage: e.target.value === 'auto'
    });
  };
  
  const handleTargetLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ ...settings, translationTarget: e.target.value as SupportedLanguage });
  };

  const handleSwapLanguages = () => {
    if (settings.translationSource === 'auto') return;
    onUpdateSettings({ 
      ...settings, 
      translationSource: settings.translationTarget,
      translationTarget: settings.translationSource 
    });
  };

  const toggleAutoDetect = () => {
    const newVal = !settings.autoDetectLanguage;
    onUpdateSettings({ 
        ...settings, 
        autoDetectLanguage: newVal,
        translationSource: newVal ? 'auto' : (settings.translationSource === 'auto' ? 'en' : settings.translationSource)
    });
  };

  const toggleRealTimeTranslation = () => onUpdateSettings({ ...settings, realTimeTranslation: !settings.realTimeTranslation });
  const toggleOfflineMode = () => onUpdateSettings({ ...settings, offlineMode: !settings.offlineMode });
  const toggleCache = () => onUpdateSettings({ ...settings, cacheTranslations: !settings.cacheTranslations });

  const handleDownloadModels = () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    
    // Simulate download
    const interval = setInterval(() => {
        setDownloadProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                setIsDownloading(false);
                return 100;
            }
            return prev + 10;
        });
    }, 200);
  };

  const handleClearCache = async () => {
    if (window.confirm("Are you sure you want to clear the translation cache?")) {
        await clearTranslationCache();
        loadCacheSize(); 
        alert("Cache cleared successfully.");
    }
  };

  return (
    <>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-4">
        {isArabic ? 'إعدادات الترجمة' : 'Translation Settings'}
      </div>
      
      <div className="bg-[#2a2a2a] rounded-xl p-3 space-y-3">
         <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
               <label className="text-xs text-gray-500 mb-1 block">{isArabic ? 'من' : 'From'}</label>
               <select 
                  value={settings.translationSource} 
                  onChange={handleSourceLangChange}
                  disabled={settings.autoDetectLanguage}
                  className="w-full bg-[#333] text-white text-sm rounded-md p-2 border border-gray-700 focus:border-blue-500 outline-none disabled:opacity-50"
               >
                 {SUPPORTED_LANGUAGES.map(lang => (
                   <option key={lang.code} value={lang.code}>{isArabic ? lang.labelAr : lang.label}</option>
                 ))}
               </select>
            </div>
            
            <button 
              onClick={handleSwapLanguages}
              disabled={settings.autoDetectLanguage}
              className={`mt-4 p-2 rounded-full transition-colors ${settings.autoDetectLanguage ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              <ArrowRightLeft size={16} />
            </button>

            <div className="flex-1">
               <label className="text-xs text-gray-500 mb-1 block">{isArabic ? 'إلى' : 'To'}</label>
               <select 
                  value={settings.translationTarget} 
                  onChange={handleTargetLangChange}
                  className="w-full bg-[#333] text-white text-sm rounded-md p-2 border border-gray-700 focus:border-blue-500 outline-none"
               >
                 {SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                   <option key={lang.code} value={lang.code}>{isArabic ? lang.labelAr : lang.label}</option>
                 ))}
               </select>
            </div>
         </div>
         
         {/* Auto Detect */}
         <button onClick={toggleAutoDetect} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#333] transition-colors">
            <div className="flex items-center gap-2">
                <Zap size={16} className={settings.autoDetectLanguage ? 'text-blue-400' : 'text-gray-500'} />
                <span className="text-sm text-gray-300">{isArabic ? 'اكتشاف تلقائي' : 'Auto Detect Language'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.autoDetectLanguage ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.autoDetectLanguage ? 'left-4.5' : 'left-0.5'}`} />
            </div>
         </button>

         {/* Real-time Toggle */}
         <button onClick={toggleRealTimeTranslation} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#333] transition-colors">
            <div className="flex items-center gap-2">
                <Zap size={16} className={settings.realTimeTranslation ? 'text-yellow-400' : 'text-gray-500'} />
                <span className="text-sm text-gray-300">{isArabic ? 'ترجمة فورية' : 'Real-time Translation'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.realTimeTranslation ? 'bg-yellow-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.realTimeTranslation ? 'left-4.5' : 'left-0.5'}`} />
            </div>
         </button>

         {/* Offline Mode */}
         <button onClick={toggleOfflineMode} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#333] transition-colors">
            <div className="flex items-center gap-2">
                <WifiOff size={16} className={settings.offlineMode ? 'text-red-400' : 'text-gray-500'} />
                <span className="text-sm text-gray-300">{isArabic ? 'وضع عدم الاتصال' : 'Offline Mode'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.offlineMode ? 'bg-red-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.offlineMode ? 'left-4.5' : 'left-0.5'}`} />
            </div>
         </button>

         {/* Download Models Button (Simulation) */}
         <button 
           onClick={handleDownloadModels} 
           disabled={isDownloading}
           className="w-full p-2 mt-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs flex items-center justify-center gap-2 disabled:opacity-50"
         >
            {isDownloading ? (
                <span>Downloading... {downloadProgress}%</span>
            ) : (
                <>
                    <Download size={14} />
                    {isArabic ? 'تحميل النماذج (للاستخدام دون اتصال)' : 'Download Offline Models'}
                </>
            )}
         </button>
         {isDownloading && (
             <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${downloadProgress}%` }} />
             </div>
         )}
      </div>

      {/* Cache Settings */}
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-4">
        {isArabic ? 'إعدادات التخزين' : 'Cache Settings'}
      </div>
      
      <div className="bg-[#2a2a2a] rounded-xl p-3 space-y-3">
         <button onClick={toggleCache} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#333] transition-colors">
            <div className="flex items-center gap-2">
                <Database size={16} className={settings.cacheTranslations ? 'text-green-400' : 'text-gray-500'} />
                <span className="text-sm text-gray-300">{isArabic ? 'تخزين الترجمات' : 'Cache Translations'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.cacheTranslations ? 'bg-green-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.cacheTranslations ? 'left-4.5' : 'left-0.5'}`} />
            </div>
         </button>

         <div className="text-center text-xs text-gray-400 py-1">
            {isArabic ? `العناصر المخزنة: ${cacheCount}` : `Cached items: ${cacheCount}`}
         </div>

         <button onClick={handleClearCache} className="w-full p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg text-xs flex items-center justify-center gap-2">
            <Trash2 size={14} />
            {isArabic ? 'مسح ذاكرة التخزين المؤقت' : 'Clear Translation Cache'}
         </button>
      </div>
    </>
  );
};
