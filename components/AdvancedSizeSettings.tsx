
import React, { useRef, useState } from 'react';
import { KeyboardSettings, AnimationSpeed } from '../types';
import { downloadBackup, restoreBackup } from '../services/buttonSizeManager';
import { PerformanceTester } from '../services/performanceTester';
import { DebugHelper } from '../services/debugService';
import { ArrowLeft, HardDriveDownload, HardDriveUpload, FileDown, Sliders, Activity, PlayCircle, Bug, Eye, Monitor } from 'lucide-react';

interface AdvancedSizeSettingsProps {
  settings: KeyboardSettings;
  onUpdateSettings: (newSettings: KeyboardSettings) => void;
  onBack: () => void;
  isArabic: boolean;
}

export const AdvancedSizeSettings: React.FC<AdvancedSizeSettingsProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  isArabic
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<string | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const json = ev.target?.result as string;
        if (restoreBackup(json)) {
          alert(isArabic ? 'تم استعادة النسخة الاحتياطية بنجاح' : 'Backup restored successfully');
          // Reload page to reflect changes as they are saved to localStorage
          window.location.reload(); 
        } else {
          alert(isArabic ? 'ملف غير صالح' : 'Invalid backup file');
        }
      };
      reader.readAsText(file);
    }
  };

  const runBenchmark = async () => {
      setIsBenchmarking(true);
      setBenchmarkResult(null);
      // Small delay to allow UI to update state
      setTimeout(async () => {
          const result = await PerformanceTester.runBenchmark();
          setBenchmarkResult(result);
          setIsBenchmarking(false);
      }, 100);
  };

  const handleRunDiagnostics = () => {
      const result = DebugHelper.runDiagnostics();
      console.log(result);
      alert(result);
  };

  const handleHighlightIssues = () => {
      const result = DebugHelper.highlightZeroSizeElements();
      alert(result);
  };

  return (
    <div className="absolute inset-0 bg-[#1f1f1f] flex flex-col z-20 animate-in slide-in-from-right">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800 bg-[#252525]">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-700 text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <h3 className="text-white font-semibold text-lg">{isArabic ? 'إعدادات متقدمة' : 'Advanced Size Settings'}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Constraints Section */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
             <Sliders size={14} />
             {isArabic ? 'القيود' : 'Constraints'}
          </div>
          
          <div className="bg-[#2a2a2a] rounded-xl p-4 space-y-4">
             <div>
               <div className="flex justify-between mb-2">
                 <label className="text-sm text-gray-300">{isArabic ? 'الحد الأدنى لحجم الزر' : 'Min Button Size'}</label>
                 <span className="text-sm font-bold text-blue-400">{Math.round(settings.minButtonScale * 100)}%</span>
               </div>
               <input 
                 type="range" 
                 min="30" 
                 max="100" 
                 value={settings.minButtonScale * 100} 
                 onChange={(e) => onUpdateSettings({...settings, minButtonScale: parseInt(e.target.value) / 100})}
                 className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
               />
             </div>

             <div>
               <div className="flex justify-between mb-2">
                 <label className="text-sm text-gray-300">{isArabic ? 'الحد الأقصى لحجم الزر' : 'Max Button Size'}</label>
                 <span className="text-sm font-bold text-blue-400">{Math.round(settings.maxButtonScale * 100)}%</span>
               </div>
               <input 
                 type="range" 
                 min="100" 
                 max="300" 
                 value={settings.maxButtonScale * 100} 
                 onChange={(e) => onUpdateSettings({...settings, maxButtonScale: parseInt(e.target.value) / 100})}
                 className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
               />
             </div>
          </div>
        </div>

        {/* Animations Section */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
             {isArabic ? 'التحريك' : 'Animations'}
          </div>
          
          <div className="bg-[#2a2a2a] rounded-xl p-4 space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{isArabic ? 'تفعيل تأثيرات الحركة' : 'Enable Button Animations'}</span>
                <button 
                  onClick={() => onUpdateSettings({...settings, buttonAnimations: !settings.buttonAnimations})}
                  className={`w-10 h-6 rounded-full relative transition-colors ${settings.buttonAnimations ? 'bg-purple-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.buttonAnimations ? 'left-5' : 'left-1'}`} />
                </button>
             </div>

             <div className={`transition-opacity ${settings.buttonAnimations ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
               <label className="text-sm text-gray-300 mb-2 block">{isArabic ? 'سرعة التحريك' : 'Animation Speed'}</label>
               <div className="flex bg-[#333] rounded-lg p-1">
                  {(['slow', 'normal', 'fast'] as AnimationSpeed[]).map(speed => (
                    <button
                      key={speed}
                      onClick={() => onUpdateSettings({...settings, animationSpeed: speed})}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${settings.animationSpeed === speed ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      {speed}
                    </button>
                  ))}
               </div>
             </div>
          </div>
        </div>

        {/* Performance & Benchmark Section */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
             <Activity size={14} />
             {isArabic ? 'الأداء' : 'Performance'}
          </div>
          
          <div className="bg-[#2a2a2a] rounded-xl p-4 space-y-3">
             <button 
                onClick={runBenchmark}
                disabled={isBenchmarking}
                className="w-full flex items-center justify-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
             >
                <PlayCircle size={16} className={isBenchmarking ? 'animate-spin' : ''} />
                {isBenchmarking ? 'Running...' : (isArabic ? 'تشغيل اختبار الأداء' : 'Run Benchmark')}
             </button>
             
             {benchmarkResult && (
                 <div className="p-3 bg-black/30 rounded-lg border border-gray-700">
                     <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap">
                         {benchmarkResult}
                     </pre>
                 </div>
             )}
          </div>
        </div>

        {/* Diagnostics & Debugging Section */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
             <Bug size={14} />
             {isArabic ? 'التصحيح' : 'Diagnostics'}
          </div>
          
          <div className="bg-[#2a2a2a] rounded-xl p-4 space-y-3">
             <button 
                onClick={handleRunDiagnostics}
                className="w-full flex items-center justify-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
             >
                <Bug size={16} />
                {isArabic ? 'فحص التسلسل الهرمي' : 'Debug View Hierarchy'}
             </button>

             <button 
                onClick={handleHighlightIssues}
                className="w-full flex items-center justify-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
             >
                <Eye size={16} />
                {isArabic ? 'تمييز الأخطاء المرئية' : 'Highlight Hidden Views'}
             </button>

             {/* Monitor Overlay Toggle */}
             <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50">
                <div className="flex items-center gap-2">
                    <Monitor size={16} className={settings.showDebugOverlay ? 'text-green-400' : 'text-gray-500'} />
                    <span className="text-sm text-gray-300">{isArabic ? 'طبقة المراقبة' : 'Monitor Overlay'}</span>
                </div>
                <button 
                  onClick={() => onUpdateSettings({...settings, showDebugOverlay: !settings.showDebugOverlay})}
                  className={`w-10 h-6 rounded-full relative transition-colors ${settings.showDebugOverlay ? 'bg-green-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.showDebugOverlay ? 'left-5' : 'left-1'}`} />
                </button>
             </div>
          </div>
        </div>

        {/* Backup Section */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
             {isArabic ? 'النسخ الاحتياطي' : 'Backup & Restore'}
          </div>
          
          <div className="bg-[#2a2a2a] rounded-xl overflow-hidden divide-y divide-gray-700">
             <button 
               onClick={downloadBackup}
               className="w-full p-4 flex items-center gap-3 hover:bg-[#333] transition-colors text-left"
             >
               <HardDriveDownload size={18} className="text-green-400" />
               <div className="flex-1">
                 <div className="text-sm font-medium text-gray-200">{isArabic ? 'نسخ احتياطي للأحجام' : 'Backup Sizes & Profiles'}</div>
                 <div className="text-xs text-gray-500">{isArabic ? 'حفظ التكوين في ملف' : 'Download configuration file'}</div>
               </div>
             </button>

             <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-full p-4 flex items-center gap-3 hover:bg-[#333] transition-colors text-left"
             >
               <HardDriveUpload size={18} className="text-blue-400" />
               <div className="flex-1">
                 <div className="text-sm font-medium text-gray-200">{isArabic ? 'استعادة الأحمال' : 'Restore from Backup'}</div>
                 <div className="text-xs text-gray-500">{isArabic ? 'استعادة التكوين من ملف' : 'Import configuration file'}</div>
               </div>
             </button>
             <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />

             <button 
               onClick={downloadBackup}
               className="w-full p-4 flex items-center gap-3 hover:bg-[#333] transition-colors text-left"
             >
               <FileDown size={18} className="text-orange-400" />
               <div className="flex-1">
                 <div className="text-sm font-medium text-gray-200">{isArabic ? 'تصدير ملف التخصيص' : 'Export Profile Data'}</div>
               </div>
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};