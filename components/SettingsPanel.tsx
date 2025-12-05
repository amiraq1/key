
import React, { useState, useRef, Suspense } from 'react';
import { X, Volume2, VolumeX, Vibrate, Smartphone, Languages, Shield, Scaling, GripHorizontal, Layout, RefreshCcw, Monitor, Car, Smartphone as Mobile, ArrowRightLeft, Move, Settings as SettingsIcon, Cloud, Columns, Loader2 } from 'lucide-react';
import { KeyboardSettings, Theme } from '../types';
import { calculateDimensions, SIZE_PRESETS, DEFAULT_WIDTH_PERCENTAGE } from '../services/sizeManager';
import { autoSizeManager } from '../services/autoSizeManager';
import { TranslationSettingsSection } from './TranslationSettingsSection';
import { ThemeSettingsSection } from './ThemeSettingsSection';

// Lazy load less frequently used sub-settings
const AdvancedSizeSettings = React.lazy(() => import('./AdvancedSizeSettings').then(m => ({ default: m.AdvancedSizeSettings })));
const CloudSyncSettings = React.lazy(() => import('./CloudSyncSettings').then(m => ({ default: m.CloudSyncSettings })));

interface SettingsPanelProps {
  settings: KeyboardSettings;
  onUpdateSettings: (newSettings: KeyboardSettings) => void;
  onClose: () => void;
  onEnterResizeMode?: () => void;
  onEnterButtonEditMode?: () => void;
  transformOrigin?: { x: number, y: number };
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdateSettings, onClose, onEnterResizeMode, onEnterButtonEditMode, transformOrigin }) => {
  const [showAdvancedSize, setShowAdvancedSize] = useState(false);
  const [showCloudSync, setShowCloudSync] = useState(false);

  const toggleHaptic = () => onUpdateSettings({ ...settings, hapticFeedback: !settings.hapticFeedback });
  const toggleSound = () => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
  const toggleLang = () => onUpdateSettings({ ...settings, language: settings.language === 'EN' ? 'AR' : 'EN' });
  const toggleIncognito = () => onUpdateSettings({ ...settings, incognitoMode: !settings.incognitoMode });
  
  const toggleResizeHandle = () => onUpdateSettings({ ...settings, showResizeHandle: !settings.showResizeHandle });
  const toggleQuickControls = () => onUpdateSettings({ ...settings, showQuickControls: !settings.showQuickControls });
  const toggleOneHanded = () => onUpdateSettings({ ...settings, oneHandedMode: !settings.oneHandedMode });
  const toggleSplitLayout = () => onUpdateSettings({ ...settings, splitLayout: !settings.splitLayout });

  const toggleDrivingMode = () => {
      const isEnabled = !settings.drivingMode;
      const updates: Partial<KeyboardSettings> = { drivingMode: isEnabled };
      
      // Auto-resize for driving mode safety (Large keys)
      if (isEnabled) {
          const { height } = calculateDimensions(SIZE_PRESETS.full, DEFAULT_WIDTH_PERCENTAGE);
          updates.sizeType = 'full';
          updates.keyboardHeight = height;
          updates.splitLayout = false; // Disable split for safety
      } else {
          // Revert to medium if disabled
          const { height } = calculateDimensions(SIZE_PRESETS.medium, DEFAULT_WIDTH_PERCENTAGE);
          updates.sizeType = 'medium';
          updates.keyboardHeight = height;
      }
      
      onUpdateSettings({ ...settings, ...updates });
  };
  
  const toggleAutoAdjust = () => {
      const newVal = !settings.autoAdjustSize;
      onUpdateSettings({ ...settings, autoAdjustSize: newVal });
      if (newVal) {
          // Use AutoSizeManager singleton to get suggestion based on context only initially
          const recommendedSize = autoSizeManager.getContextRecommendation();
          setTimeout(() => {
              if (window.confirm(`System context suggests '${recommendedSize}' size for this screen. Apply?`)) {
                  const { height, sizeType, widthPercent } = autoSizeManager.getAutoAdjustedDimensions();
                  onUpdateSettings({ 
                      ...settings, 
                      autoAdjustSize: true,
                      sizeType: sizeType,
                      keyboardHeight: height,
                      keyboardWidth: widthPercent
                  });
              }
          }, 200);
      }
  };

  const handleResetSize = () => {
      if (window.confirm("Reset keyboard size to default (Medium)?")) {
          const { height } = calculateDimensions(SIZE_PRESETS.medium, DEFAULT_WIDTH_PERCENTAGE);
          onUpdateSettings({
              ...settings,
              sizeType: 'medium',
              keyboardHeight: height,
              keyboardWidth: DEFAULT_WIDTH_PERCENTAGE,
              showResizeHandle: true,
              showQuickControls: true,
              autoAdjustSize: false,
              oneHandedMode: false,
              splitLayout: false,
              customKeySizes: {}
          });
      }
  };

  const isArabic = settings.language === 'AR';

  // Styles for Material Container Transform
  const containerStyle: React.CSSProperties = {
      transformOrigin: transformOrigin ? `${transformOrigin.x}px ${transformOrigin.y}px` : 'center center',
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        style={containerStyle}
        className="bg-[#1f1f1f] w-full max-w-sm rounded-2xl shadow-2xl border border-gray-800 overflow-hidden animate-[scale-in_0.3s_ease-out] flex flex-col max-h-[90vh] relative"
      >
        
        {/* Main Settings View */}
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#252525]">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <Shield size={18} className="text-blue-400"/>
                {isArabic ? 'الإعدادات' : 'Settings'}
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700">
                <X size={20} />
            </button>
            </div>
            
            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
            
            {/* Theme Section (Refactored) */}
            <ThemeSettingsSection 
                settings={settings}
                onUpdateSettings={onUpdateSettings}
                isArabic={isArabic}
            />

            <div className="h-px bg-gray-800 my-4" />

            {/* General Section */}
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                {isArabic ? 'عام' : 'General'}
            </div>

            <button onClick={toggleLang} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-900/50 text-purple-400">
                    <Languages size={20} />
                </div>
                <div className="text-left">
                    <div className="text-gray-200 font-medium">{isArabic ? 'اللغة' : 'Language'}</div>
                    <div className="text-xs text-gray-500">{settings.language === 'EN' ? 'English (US)' : 'العربية (Arabic)'}</div>
                </div>
                </div>
                <div className="px-3 py-1 bg-gray-700 rounded-md text-sm font-mono text-white">
                {settings.language}
                </div>
            </button>

            {/* Cloud Backup */}
            <button onClick={() => setShowCloudSync(true)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-900/50 text-blue-400">
                    <Cloud size={20} />
                </div>
                <div className="text-left">
                    <div className="text-gray-200 font-medium">{isArabic ? 'النسخ الاحتياطي السحابي' : 'Cloud Backup'}</div>
                    <div className="text-xs text-gray-500">{isArabic ? 'Google Drive' : 'Sync with Google Drive'}</div>
                </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${settings.googleUser ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'}`} />
            </button>

            {/* Driving Mode Toggle */}
            <button onClick={toggleDrivingMode} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings.drivingMode ? 'bg-orange-900/50 text-orange-400' : 'bg-gray-800 text-gray-500'}`}>
                    <Car size={20} />
                </div>
                <div className="text-left">
                    <div className="text-gray-200 font-medium">{isArabic ? 'وضع القيادة' : 'Driving Mode'}</div>
                    <div className="text-xs text-gray-500">{isArabic ? 'أزرار كبيرة للسلامة' : 'Large buttons for safety'}</div>
                </div>
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${settings.drivingMode ? 'bg-orange-600' : 'bg-gray-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.drivingMode ? 'left-5' : 'left-1'}`} />
                </div>
            </button>
            
            {/* Keyboard Size & Layout Section */}
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-4">
                {isArabic ? 'حجم وتخطيط الكيبورد' : 'Keyboard Size & Layout'}
            </div>

            <div className="bg-[#2a2a2a] rounded-xl p-3 space-y-3">
                <button 
                    onClick={onEnterResizeMode}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#333] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Scaling size={16} className="text-orange-400" />
                        <span className="text-sm text-gray-300 font-medium">{isArabic ? 'الدخول لوضع تغيير الحجم' : 'Enter Resize Mode'}</span>
                    </div>
                    <div className="p-1 bg-orange-900/30 rounded text-orange-400">
                        <ArrowRightLeft size={14} />
                    </div>
                </button>

                <button 
                    onClick={onEnterButtonEditMode}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#333] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Move size={16} className="text-yellow-400" />
                        <span className="text-sm text-gray-300 font-medium">{isArabic ? 'تعديل حجم الأزرار' : 'Edit Key Sizes'}</span>
                    </div>
                    <div className="p-1 bg-yellow-900/30 rounded text-yellow-400">
                        <Move size={14} />
                    </div>
                </button>

                {/* Entry to Advanced Size Settings */}
                <button 
                    onClick={() => setShowAdvancedSize(true)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#333] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <SettingsIcon size={16} className="text-cyan-400" />
                        <span className="text-sm text-gray-300 font-medium">{isArabic ? 'إعدادات الحجم المتقدمة' : 'Advanced Size Settings'}</span>
                    </div>
                    <div className="p-1 bg-cyan-900/30 rounded text-cyan-400">
                        <SettingsIcon size={14} />
                    </div>
                </button>

                <div className="h-px bg-gray-700/50" />

                {/* Show Resize Handle Toggle */}
                <button onClick={toggleResizeHandle} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#333] transition-colors">
                    <div className="flex items-center gap-2">
                        <GripHorizontal size={16} className={settings.showResizeHandle ? 'text-gray-300' : 'text-gray-600'} />
                        <span className="text-sm text-gray-300">{isArabic ? 'إظهار مقبض السحب' : 'Show Resize Handle'}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.showResizeHandle ? 'bg-blue-600' : 'bg-gray-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.showResizeHandle ? 'left-4.5' : 'left-0.5'}`} />
                    </div>
                </button>

                {/* Show Quick Controls Toggle */}
                <button onClick={toggleQuickControls} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#333] transition-colors">
                    <div className="flex items-center gap-2">
                        <Layout size={16} className={settings.showQuickControls ? 'text-gray-300' : 'text-gray-600'} />
                        <span className="text-sm text-gray-300">{isArabic ? 'عناصر التحكم السريع' : 'Show Quick Controls'}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.showQuickControls ? 'bg-blue-600' : 'bg-gray-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.showQuickControls ? 'left-4.5' : 'left-0.5'}`} />
                    </div>
                </button>
                
                {/* One-Handed Mode Toggle */}
                <button onClick={toggleOneHanded} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#333] transition-colors">
                    <div className="flex items-center gap-2">
                        <Mobile size={16} className={settings.oneHandedMode ? 'text-purple-400' : 'text-gray-600'} />
                        <span className="text-sm text-gray-300">{isArabic ? 'وضع اليد الواحدة' : 'One-Handed Mode'}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.oneHandedMode ? 'bg-purple-600' : 'bg-gray-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.oneHandedMode ? 'left-4.5' : 'left-0.5'}`} />
                    </div>
                </button>

                {/* Split Layout Toggle (Foldable Support) */}
                <button onClick={toggleSplitLayout} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#333] transition-colors">
                    <div className="flex items-center gap-2">
                        <Columns size={16} className={settings.splitLayout ? 'text-indigo-400' : 'text-gray-600'} />
                        <span className="text-sm text-gray-300">{isArabic ? 'تخطيط مقسم' : 'Split Layout (Foldable)'}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.splitLayout ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.splitLayout ? 'left-4.5' : 'left-0.5'}`} />
                    </div>
                </button>

                {/* Auto Adjust Toggle */}
                <button onClick={toggleAutoAdjust} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#333] transition-colors">
                    <div className="flex items-center gap-2">
                        <Monitor size={16} className={settings.autoAdjustSize ? 'text-green-400' : 'text-gray-600'} />
                        <span className="text-sm text-gray-300">{isArabic ? 'ضبط الحجم تلقائياً' : 'Auto-Adjust Size'}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.autoAdjustSize ? 'bg-green-600' : 'bg-gray-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.autoAdjustSize ? 'left-4.5' : 'left-0.5'}`} />
                    </div>
                </button>

                <button 
                    onClick={handleResetSize}
                    className="w-full p-2 mt-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg text-xs flex items-center justify-center gap-2"
                >
                    <RefreshCcw size={14} />
                    {isArabic ? 'إعادة تعيين الحجم' : 'Reset Size to Default'}
                </button>
            </div>

            {/* Translation & Cache Settings via Sub-Component */}
            <TranslationSettingsSection 
                settings={settings}
                onUpdateSettings={onUpdateSettings}
                isArabic={isArabic}
            />

            {/* Other Settings (Preferences) */}
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-4">
                {isArabic ? 'تفضيلات' : 'Preferences'}
            </div>

            <button onClick={toggleHaptic} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings.hapticFeedback ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                    {settings.hapticFeedback ? <Vibrate size={20} /> : <Smartphone size={20} />}
                </div>
                <div className="text-left">
                    <div className="text-gray-200 font-medium">{isArabic ? 'الاهتزاز' : 'Haptic Feedback'}</div>
                    <div className="text-xs text-gray-500">{isArabic ? 'اهتزاز عند الضغط' : 'Vibrate on keypress'}</div>
                </div>
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${settings.hapticFeedback ? 'bg-green-600' : 'bg-gray-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.hapticFeedback ? 'left-5' : 'left-1'}`} />
                </div>
            </button>
            
            <button onClick={toggleSound} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings.soundEnabled ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                    {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </div>
                <div className="text-left">
                    <div className="text-gray-200 font-medium">{isArabic ? 'الصوت' : 'Sound'}</div>
                    <div className="text-xs text-gray-500">{isArabic ? 'صوت عند الضغط' : 'Play sound on keypress'}</div>
                </div>
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.soundEnabled ? 'left-5' : 'left-1'}`} />
                </div>
            </button>
            </div>
            
            <div className="p-4 border-t border-gray-800 bg-[#1a1a1a] text-center">
            <p className="text-xs text-gray-600">GemKey v2.0 • Dynamic Themes</p>
            </div>
        </div>

        {/* Sub-Panel Overlays (Lazy Loaded) */}
        <Suspense fallback={<div className="absolute inset-0 bg-black/80 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
            {showAdvancedSize && (
                <AdvancedSizeSettings 
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                    onBack={() => setShowAdvancedSize(false)}
                    isArabic={isArabic}
                />
            )}
            
            {showCloudSync && (
                <CloudSyncSettings 
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                    onBack={() => setShowCloudSync(false)}
                    isArabic={isArabic}
                />
            )}
        </Suspense>
      </div>
    </div>
  );
};
