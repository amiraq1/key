
import React, { useRef } from 'react';
import { Palette, Check, Moon, Sun, Droplet, Leaf, Zap, LayoutTemplate, Wand2, Monitor } from 'lucide-react';
import { KeyboardSettings, Theme } from '../types';

interface ThemeSettingsSectionProps {
  settings: KeyboardSettings;
  onUpdateSettings: (newSettings: KeyboardSettings) => void;
  isArabic: boolean;
}

export const ThemeSettingsSection: React.FC<ThemeSettingsSectionProps> = ({
  settings,
  onUpdateSettings,
  isArabic
}) => {
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const handleThemeChange = (theme: Theme) => {
      if (theme === 'Dynamic' && !settings.dynamicColorSeed) {
          onUpdateSettings({ ...settings, theme, dynamicColorSeed: '#6750A4' });
      } else {
          onUpdateSettings({ ...settings, theme });
      }
  };

  const handleDynamicColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateSettings({ ...settings, dynamicColorSeed: e.target.value });
  };

  const themeLabels: Record<Theme, string> = {
    Dark: isArabic ? 'داكن' : 'Dark',
    Light: isArabic ? 'فاتح' : 'Light',
    Blue: isArabic ? 'أزرق' : 'Blue',
    Green: isArabic ? 'أخضر' : 'Green',
    Custom: isArabic ? 'نيون' : 'Neon',
    Material3: isArabic ? 'ماتيريال' : 'Material 3',
    Dynamic: isArabic ? 'ديناميكي' : 'Dynamic',
    Auto: isArabic ? 'تلقائي' : 'Auto',
  };

  // Background styles for preview bubbles
  const themePreviews: Record<Theme, string> = {
    Dark: 'bg-[#121212] border-gray-700',
    Light: 'bg-[#f3f4f6] border-gray-300',
    Blue: 'bg-[#172554] border-blue-800',
    Green: 'bg-[#064e3b] border-emerald-800',
    Custom: 'bg-gradient-to-br from-pink-500 to-purple-600 border-pink-500',
    Material3: 'bg-[#F0F2F5] border-[#2196F3]',
    Dynamic: '', // Dynamic is handled via inline style
    Auto: 'bg-gradient-to-br from-gray-800 via-gray-200 to-gray-800 border-gray-500'
  };

  const ThemeIcon = ({ theme, isActive }: { theme: Theme, isActive: boolean }) => {
      const className = isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200';
      const size = 16;
      switch (theme) {
          case 'Dark': return <Moon size={size} className={className} />;
          case 'Light': return <Sun size={size} className={isActive ? 'text-black' : className} />;
          case 'Blue': return <Droplet size={size} className={className} />;
          case 'Green': return <Leaf size={size} className={className} />;
          case 'Custom': return <Zap size={size} className={className} />;
          case 'Material3': return <LayoutTemplate size={size} className={isActive ? 'text-black' : className} />;
          case 'Dynamic': return <Wand2 size={size} className={className} />;
          case 'Auto': return <Monitor size={size} className={className} />;
          default: return null;
      }
  };

  return (
    <div className="mb-6">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>{isArabic ? 'المظهر' : 'Appearance'}</span>
            {settings.theme === 'Dynamic' && (
                <button 
                    onClick={() => colorPickerRef.current?.click()}
                    className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                    <Palette size={12} />
                    {isArabic ? 'تخصيص اللون' : 'Pick Color'}
                </button>
            )}
        </div>
        
        <div className="grid grid-cols-4 gap-3">
            {(Object.keys(themeLabels) as Theme[]).map((t) => {
                const isActive = settings.theme === t;
                return (
                    <button
                        key={t}
                        onClick={() => handleThemeChange(t)}
                        className={`flex flex-col items-center gap-1.5 group relative`}
                    >
                        <div 
                            className={`w-14 h-12 rounded-xl shadow-lg flex items-center justify-center border-2 transition-all duration-200 ${isActive ? 'border-white scale-105 ring-2 ring-blue-500/50' : 'border-transparent hover:scale-105 hover:border-gray-600'} ${themePreviews[t]}`}
                            style={t === 'Dynamic' ? { backgroundColor: settings.dynamicColorSeed, borderColor: isActive ? 'white' : 'transparent' } : {}}
                        >
                            <ThemeIcon theme={t} isActive={isActive} />
                            
                            {/* Checkmark overlay */}
                            {isActive && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                                    <Check size={10} className="text-white" />
                                </div>
                            )}

                            {/* Color Picker Trigger for Dynamic (Secondary access) */}
                            {t === 'Dynamic' && isActive && (
                                <div 
                                    className="absolute -bottom-2 w-6 h-6 bg-white rounded-full border border-gray-300 flex items-center justify-center cursor-pointer shadow-sm z-10 hover:bg-gray-50"
                                    onClick={(e) => { e.stopPropagation(); colorPickerRef.current?.click(); }}
                                    title="Choose Color"
                                >
                                    <Palette size={12} className="text-black" />
                                </div>
                            )}
                        </div>
                        <span className={`text-[10px] font-medium text-center leading-tight transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
                            {themeLabels[t]}
                        </span>
                    </button>
                );
            })}
        </div>
        
        {/* Hidden Input for Dynamic Color */}
        <input 
            ref={colorPickerRef}
            type="color" 
            value={settings.dynamicColorSeed} 
            onChange={handleDynamicColorChange}
            className="hidden" 
        />
        
        {/* Helper text for Dynamic mode */}
        {settings.theme === 'Dynamic' && (
            <div className="mt-3 text-[10px] text-gray-500 text-center animate-in fade-in slide-in-from-top-1">
                {isArabic 
                    ? 'يستخرج السمة من اللون المختار (محاكاة Material You)' 
                    : 'Generates a theme based on your selected color (Material You simulation)'}
            </div>
        )}
    </div>
  );
};
