
import React from 'react';
import { KeyDefinition, KeyType, KeyboardRow, SupportedLanguage } from './types';
import { 
  Delete, 
  ArrowUp, 
  CornerDownLeft, 
  Space, 
  Globe, 
  Mic,
  Settings,
  Smile,
  Keyboard as KeyboardIcon,
  Car,
  X
} from 'lucide-react';

// --- Icons ---
export const ICON_SIZE = 20;

// --- Colors (from resources) ---
export const RESIZE_UI_COLORS = {
  small: '#FF5252',
  medium: '#4CAF50',
  large: '#2196F3',
  custom: '#FF9800',
  keyboardBg: '#F5F5F5',
  handleText: '#616161',
  divider: '#BDBDBD',
  previewBg: '#E0E0E0'
};

// --- Shape Styles (Android XML mapping) ---
export const SHAPE_STYLES = {
  key: 'rounded-xl',       // 12dp
  keyLarge: 'rounded-2xl', // 16dp
  keySpecial: 'rounded-xl',// 12dp
  container: 'rounded-t-[28px]'
};

// --- Typography Styles (Android XML mapping) ---
export const TYPOGRAPHY_STYLES = {
  displayLarge: 'text-[57px] leading-[64px] tracking-tighter',
  titleLarge: 'text-[22px] font-bold leading-[28px]',
  titleMedium: 'text-base font-medium leading-6 tracking-wide',
  titleSmall: 'text-sm font-medium leading-5 tracking-wide',
  bodyLarge: 'text-base leading-6 tracking-wide',
  bodyMedium: 'text-sm leading-5 tracking-normal',
  keyLabel: 'text-lg font-medium select-none',
  keySymbol: 'text-sm select-none'
};

// --- Supported Languages (TranslationManager) ---
export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; labelAr: string }[] = [
  { code: 'auto', label: 'Detect Language', labelAr: 'اكتشاف تلقائي' },
  { code: 'ar', label: 'Arabic', labelAr: 'العربية' },
  { code: 'en', label: 'English', labelAr: 'الإنجليزية' },
  { code: 'fr', label: 'French', labelAr: 'الفرنسية' },
  { code: 'es', label: 'Spanish', labelAr: 'الإسبانية' },
  { code: 'de', label: 'German', labelAr: 'الألمانية' },
  { code: 'ru', label: 'Russian', labelAr: 'الروسية' },
  { code: 'tr', label: 'Turkish', labelAr: 'التركية' },
  { code: 'fa', label: 'Persian', labelAr: 'الفارسية' },
  { code: 'ur', label: 'Urdu', labelAr: 'الأردية' },
  { code: 'hi', label: 'Hindi', labelAr: 'الهندية' },
];

// --- Dynamic Theme Generator (Simulating Material You) ---
const generateDynamicTheme = (seedColor: string) => {
  // Simple simulation: Use the seed color to tint backgrounds and keys
  // Real implementation would use HCT color space (material-color-utilities)
  return {
    appBg: 'bg-black', // Fallback or dynamic
    textMain: 'text-white',
    headerBg: `bg-[${seedColor}] bg-opacity-20 border-[${seedColor}] border-opacity-30`,
    keyboardBg: `bg-[${seedColor}] bg-opacity-10 backdrop-blur-xl`, // Surface Tint
    barBg: `bg-[${seedColor}] bg-opacity-15`,
    
    // Keys: Surface with tint
    keyChar: `bg-[${seedColor}] bg-opacity-20 text-white shadow-sm hover:bg-opacity-30 active:bg-opacity-40 border border-white/5 group`,
    
    // Function Keys: Slightly darker tint
    keyFunc: `bg-[${seedColor}] bg-opacity-30 text-[${seedColor}] text-opacity-90 shadow-sm border border-white/5 group`,
    
    // Active State: High opacity seed
    keyActive: `bg-[${seedColor}] text-white brightness-125`,
    
    preview: `bg-[${seedColor}] text-white shadow-xl`,
    inputPlaceholder: 'placeholder-white/40',
    
    // Inline style objects for color values that Tailwind can't JIT interpolate easily from vars
    inline: {
        appBg: { backgroundColor: '#121212' }, // Dark base
        keyboardBg: { backgroundColor: `${seedColor}1A` }, // 10% opacity hex
        keyChar: { backgroundColor: `${seedColor}26`, color: '#fff' }, // 15% opacity
        keyFunc: { backgroundColor: `${seedColor}40`, color: '#fff' }, // 25% opacity
        keyActive: { backgroundColor: seedColor, color: '#fff' }
    }
  };
};

// --- Themes ---
const STATIC_THEMES: Record<string, any> = {
  Dark: {
    appBg: 'bg-[#121212]',
    textMain: 'text-gray-100',
    headerBg: 'bg-[#121212] border-[#333]',
    keyboardBg: 'bg-[#1a1a1a]',
    barBg: 'bg-[#252525] border-[#333]',
    keyChar: 'bg-[#454545] text-white shadow-[0_1px_0px_rgba(0,0,0,0.4)] active:translate-y-[1px] active:shadow-none group',
    keyFunc: 'bg-[#2b2b2b] text-[#9ca3af] shadow-[0_1px_0px_rgba(0,0,0,0.4)] active:translate-y-[1px] active:shadow-none group',
    keyActive: 'brightness-125',
    preview: 'bg-[#454545] text-white border-gray-600',
    inputPlaceholder: 'placeholder-gray-700'
  },
  Light: {
    appBg: 'bg-[#f3f4f6]',
    textMain: 'text-gray-900',
    headerBg: 'bg-white border-gray-200',
    keyboardBg: 'bg-[#e5e7eb]',
    barBg: 'bg-[#f9fafb] border-gray-200',
    keyChar: 'bg-white text-gray-900 shadow-[0_1px_0px_rgba(0,0,0,0.15)] border-b border-gray-300 active:translate-y-[1px] active:shadow-none group',
    keyFunc: 'bg-gray-200 text-gray-600 shadow-[0_1px_0px_rgba(0,0,0,0.1)] border-b border-gray-300 active:translate-y-[1px] active:shadow-none group',
    keyActive: 'bg-gray-50',
    preview: 'bg-white text-gray-900 border-gray-200',
    inputPlaceholder: 'placeholder-gray-400'
  },
  Blue: {
    appBg: 'bg-[#172554]',
    textMain: 'text-blue-50',
    headerBg: 'bg-[#1e3a8a] border-blue-800',
    keyboardBg: 'bg-[#1e40af]',
    barBg: 'bg-[#1e3a8a] border-blue-700',
    keyChar: 'bg-[#3b82f6] text-white shadow-[0_1px_0px_rgba(0,0,0,0.2)] border-b border-blue-700 active:translate-y-[1px] active:shadow-none group',
    keyFunc: 'bg-[#1d4ed8] text-blue-200 shadow-[0_1px_0px_rgba(0,0,0,0.2)] border-b border-blue-800 active:translate-y-[1px] active:shadow-none group',
    keyActive: 'brightness-110',
    preview: 'bg-[#3b82f6] text-white border-blue-500',
    inputPlaceholder: 'placeholder-blue-300/50'
  },
  Green: {
    appBg: 'bg-[#064e3b]',
    textMain: 'text-emerald-50',
    headerBg: 'bg-[#065f46] border-emerald-800',
    keyboardBg: 'bg-[#047857]',
    barBg: 'bg-[#065f46] border-emerald-700',
    keyChar: 'bg-[#10b981] text-white shadow-[0_1px_0px_rgba(0,0,0,0.2)] border-b border-emerald-600 active:translate-y-[1px] active:shadow-none group',
    keyFunc: 'bg-[#059669] text-emerald-100 shadow-[0_1px_0px_rgba(0,0,0,0.2)] border-b border-emerald-800 active:translate-y-[1px] active:shadow-none group',
    keyActive: 'brightness-110',
    preview: 'bg-[#10b981] text-white border-emerald-500',
    inputPlaceholder: 'placeholder-emerald-300/50'
  },
  Custom: { // Neon / Cyberpunk
    appBg: 'bg-[#09090b]', 
    textMain: 'text-pink-500',
    headerBg: 'bg-black border-pink-900',
    keyboardBg: 'bg-black',
    barBg: 'bg-[#18181b] border-pink-900',
    keyChar: 'bg-[#18181b] text-pink-500 border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.1)] active:translate-y-[1px] group',
    keyFunc: 'bg-[#18181b] text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)] active:translate-y-[1px] group',
    keyActive: 'shadow-[0_0_15px_rgba(236,72,153,0.4)] bg-pink-950/30',
    preview: 'bg-black text-pink-500 border border-pink-500',
    inputPlaceholder: 'placeholder-pink-900'
  },
  Material3: {
    appBg: 'bg-[#FEF7FF]', // Surface (Light)
    textMain: 'text-[#1D1B20]', // On Surface
    headerBg: 'bg-[#F3EDF7]', // Surface Container
    keyboardBg: 'bg-[#ECE6F0]', // Surface Container High (Standard MD3 Bottom Sheet)
    barBg: 'bg-[#F3EDF7]',
    
    // Key Char: Elevated Button style (Surface Container Low + Shadow)
    // mimics com.google.android.material.button.MaterialButton with elevated style
    keyChar: 'bg-[#F7F2FA] text-[#1D1B20] shadow-sm hover:bg-[#F3EDF7] border-transparent group', 
    
    // Key Func: Tonal Button style (Secondary Container)
    // mimics com.google.android.material.button.MaterialButton with tonal style
    keyFunc: 'bg-[#E8DEF8] text-[#1D192B] shadow-none hover:bg-[#E2D7EF] border-transparent group',
    
    // Active State: Primary Container
    keyActive: '!bg-[#EADDFF] !text-[#21005D]', // Primary Container (Active)
    
    preview: 'bg-[#6750A4] text-white shadow-xl', // Primary
    inputPlaceholder: 'placeholder-[#49454F]' // On Surface Variant
  }
};

// Export a proxy or function to get themes
export const getThemeStyles = (themeName: string, dynamicSeed?: string) => {
  if (themeName === 'Dynamic' && dynamicSeed) {
    return generateDynamicTheme(dynamicSeed);
  }
  return STATIC_THEMES[themeName] || STATIC_THEMES['Dark'];
};

export const THEME_STYLES = STATIC_THEMES; // Backward compatibility for direct access if needed, though getThemeStyles is preferred

// --- English Layout (QWERTY) ---
export const KEYBOARD_LAYOUT_LOWER: KeyboardRow[] = [
  [
    { id: 'q', label: 'q', type: KeyType.CHARACTER },
    { id: 'w', label: 'w', type: KeyType.CHARACTER },
    { id: 'e', label: 'e', type: KeyType.CHARACTER },
    { id: 'r', label: 'r', type: KeyType.CHARACTER },
    { id: 't', label: 't', type: KeyType.CHARACTER },
    { id: 'y', label: 'y', type: KeyType.CHARACTER },
    { id: 'u', label: 'u', type: KeyType.CHARACTER },
    { id: 'i', label: 'i', type: KeyType.CHARACTER },
    { id: 'o', label: 'o', type: KeyType.CHARACTER },
    { id: 'p', label: 'p', type: KeyType.CHARACTER },
  ],
  [
    { id: 'spacer_l1', label: '', type: KeyType.SPACER, width: 0.5 },
    { id: 'a', label: 'a', type: KeyType.CHARACTER },
    { id: 's', label: 's', type: KeyType.CHARACTER },
    { id: 'd', label: 'd', type: KeyType.CHARACTER },
    { id: 'f', label: 'f', type: KeyType.CHARACTER },
    { id: 'g', label: 'g', type: KeyType.CHARACTER },
    { id: 'h', label: 'h', type: KeyType.CHARACTER },
    { id: 'j', label: 'j', type: KeyType.CHARACTER },
    { id: 'k', label: 'k', type: KeyType.CHARACTER },
    { id: 'l', label: 'l', type: KeyType.CHARACTER },
    { id: 'spacer_r1', label: '', type: KeyType.SPACER, width: 0.5 },
  ],
  [
    { id: 'shift', label: 'Shift', type: KeyType.FUNCTION, width: 1.5, icon: <ArrowUp size={ICON_SIZE} /> },
    { id: 'z', label: 'z', type: KeyType.CHARACTER },
    { id: 'x', label: 'x', type: KeyType.CHARACTER },
    { id: 'c', label: 'c', type: KeyType.CHARACTER },
    { id: 'v', label: 'v', type: KeyType.CHARACTER },
    { id: 'b', label: 'b', type: KeyType.CHARACTER },
    { id: 'n', label: 'n', type: KeyType.CHARACTER },
    { id: 'm', label: 'm', type: KeyType.CHARACTER },
    { id: 'backspace', label: 'Backspace', type: KeyType.FUNCTION, width: 1.5, icon: <Delete size={ICON_SIZE} /> },
  ],
  [
    { id: 'mode_123', label: '?123', type: KeyType.FUNCTION, width: 1.5 },
    { id: 'comma', label: ',', value: ',', type: KeyType.CHARACTER },
    { id: 'globe', label: 'Lang', type: KeyType.FUNCTION, icon: <Globe size={ICON_SIZE} /> },
    { id: 'space', label: 'Space', value: ' ', type: KeyType.CHARACTER, width: 4, icon: <Space size={16} className="opacity-0" /> }, 
    { id: 'period', label: '.', value: '.', type: KeyType.CHARACTER },
    { id: 'enter', label: 'Enter', value: '\n', type: KeyType.FUNCTION, width: 1.5, icon: <CornerDownLeft size={ICON_SIZE} /> },
  ]
];

export const KEYBOARD_LAYOUT_UPPER: KeyboardRow[] = KEYBOARD_LAYOUT_LOWER.map(row => 
  row.map(key => {
    if (key.type === KeyType.CHARACTER && key.label.length === 1 && /[a-z]/.test(key.label)) {
      return { ...key, label: key.label.toUpperCase(), value: key.label.toUpperCase() };
    }
    return key;
  })
);

// --- Arabic Layout (Matches SimpleMaterialKeyboard) ---
export const KEYBOARD_LAYOUT_ARABIC: KeyboardRow[] = [
  [
    { id: 'dad', label: 'ض', type: KeyType.CHARACTER },
    { id: 'sad', label: 'ص', type: KeyType.CHARACTER },
    { id: 'tha', label: 'ث', type: KeyType.CHARACTER },
    { id: 'qaf', label: 'ق', type: KeyType.CHARACTER },
    { id: 'fa', label: 'ف', type: KeyType.CHARACTER },
    { id: 'ghain', label: 'غ', type: KeyType.CHARACTER },
    { id: 'ain', label: 'ع', type: KeyType.CHARACTER },
    { id: 'ha', label: 'ه', type: KeyType.CHARACTER },
    { id: 'kha', label: 'خ', type: KeyType.CHARACTER },
    { id: 'hah', label: 'ح', type: KeyType.CHARACTER },
  ],
  [
    { id: 'sheen', label: 'ش', type: KeyType.CHARACTER },
    { id: 'seen', label: 'س', type: KeyType.CHARACTER },
    { id: 'yeh', label: 'ي', type: KeyType.CHARACTER },
    { id: 'beh', label: 'ب', type: KeyType.CHARACTER },
    { id: 'lam', label: 'ل', type: KeyType.CHARACTER },
    { id: 'alef', label: 'ا', type: KeyType.CHARACTER },
    { id: 'teh', label: 'ت', type: KeyType.CHARACTER },
    { id: 'noon', label: 'ن', type: KeyType.CHARACTER },
    { id: 'meem', label: 'م', type: KeyType.CHARACTER },
    { id: 'kaf', label: 'ك', type: KeyType.CHARACTER },
  ],
  [
    { id: 'shift', label: 'Shift', type: KeyType.FUNCTION, width: 1.2, icon: <ArrowUp size={ICON_SIZE} /> },
    { id: 'hamza', label: 'ئ', type: KeyType.CHARACTER },
    { id: 'alef_hamza', label: 'ء', type: KeyType.CHARACTER },
    { id: 'waw_hamza', label: 'ؤ', type: KeyType.CHARACTER },
    { id: 'reh', label: 'ر', type: KeyType.CHARACTER },
    { id: 'alef_maksura', label: 'ى', type: KeyType.CHARACTER },
    { id: 'teh_marbuta', label: 'ة', type: KeyType.CHARACTER },
    { id: 'waw', label: 'و', type: KeyType.CHARACTER },
    { id: 'zain', label: 'ز', type: KeyType.CHARACTER },
    { id: 'zah', label: 'ظ', type: KeyType.CHARACTER },
    { id: 'backspace', label: 'Backspace', type: KeyType.FUNCTION, width: 1.2, icon: <Delete size={ICON_SIZE} /> },
  ],
  [
    // Simple Layout: 123, Globe, Comma, Space, Period, Enter
    { id: 'mode_123', label: '123', type: KeyType.FUNCTION, width: 1.2 },
    { id: 'globe', label: 'Lang', type: KeyType.FUNCTION, width: 1, icon: <Globe size={ICON_SIZE} /> },
    { id: 'comma_ar', label: '،', value: '،', type: KeyType.CHARACTER, width: 1 },
    { id: 'space', label: 'مسافة', value: ' ', type: KeyType.CHARACTER, width: 3.5, icon: <Space size={16} className="opacity-0" /> },
    { id: 'period_ar', label: '.', value: '.', type: KeyType.CHARACTER, width: 1 },
    { id: 'enter', label: 'Enter', value: '\n', type: KeyType.FUNCTION, width: 1.5, icon: <CornerDownLeft size={ICON_SIZE} /> },
  ]
];

// --- Symbols Layout (Triggered by 123) ---
export const KEYBOARD_LAYOUT_SYMBOLS: KeyboardRow[] = [
  [
    { id: '1', label: '1', type: KeyType.CHARACTER },
    { id: '2', label: '2', type: KeyType.CHARACTER },
    { id: '3', label: '3', type: KeyType.CHARACTER },
    { id: '4', label: '4', type: KeyType.CHARACTER },
    { id: '5', label: '5', type: KeyType.CHARACTER },
    { id: '6', label: '6', type: KeyType.CHARACTER },
    { id: '7', label: '7', type: KeyType.CHARACTER },
    { id: '8', label: '8', type: KeyType.CHARACTER },
    { id: '9', label: '9', type: KeyType.CHARACTER },
    { id: '0', label: '0', type: KeyType.CHARACTER },
  ],
  [
    { id: 'at', label: '@', type: KeyType.CHARACTER },
    { id: 'hash', label: '#', type: KeyType.CHARACTER },
    { id: 'dollar', label: '$', type: KeyType.CHARACTER },
    { id: 'percent', label: '%', type: KeyType.CHARACTER },
    { id: 'and', label: '&', type: KeyType.CHARACTER },
    { id: 'minus', label: '-', type: KeyType.CHARACTER },
    { id: 'plus', label: '+', type: KeyType.CHARACTER },
    { id: 'lparen', label: '(', type: KeyType.CHARACTER },
    { id: 'rparen', label: ')', type: KeyType.CHARACTER },
    { id: 'slash', label: '/', type: KeyType.CHARACTER },
  ],
  [
    { id: 'equals', label: '=', type: KeyType.CHARACTER, width: 1.5 },
    { id: 'lt', label: '<', type: KeyType.CHARACTER },
    { id: 'gt', label: '>', type: KeyType.CHARACTER },
    { id: 'ast', label: '*', type: KeyType.CHARACTER },
    { id: 'quote', label: '"', type: KeyType.CHARACTER },
    { id: 'apos', label: "'", type: KeyType.CHARACTER },
    { id: 'colon', label: ':', type: KeyType.CHARACTER },
    { id: 'semi', label: ';', type: KeyType.CHARACTER },
    { id: 'excl', label: '!', type: KeyType.CHARACTER },
    { id: 'ques', label: '?', type: KeyType.CHARACTER },
    { id: 'backspace', label: 'Backspace', type: KeyType.FUNCTION, width: 1.5, icon: <Delete size={ICON_SIZE} /> },
  ],
  [
    { id: 'abc', label: 'ABC', type: KeyType.FUNCTION, width: 1.5 }, // Return to letters
    { id: 'globe', label: 'Lang', type: KeyType.FUNCTION, width: 1, icon: <Globe size={ICON_SIZE} /> },
    { id: 'space', label: 'Space', value: ' ', type: KeyType.CHARACTER, width: 4, icon: <Space size={16} className="opacity-0" /> },
    { id: 'comma', label: ',', value: ',', type: KeyType.CHARACTER, width: 1 },
    { id: 'enter', label: 'Enter', value: '\n', type: KeyType.FUNCTION, width: 1.5, icon: <CornerDownLeft size={ICON_SIZE} /> },
  ]
];

// --- Arabic Symbols Layout (Triggered by 123 when in Arabic mode) ---
export const KEYBOARD_LAYOUT_SYMBOLS_AR: KeyboardRow[] = [
  [
    { id: 'ar_1', label: '١', value: '١', type: KeyType.CHARACTER },
    { id: 'ar_2', label: '٢', value: '٢', type: KeyType.CHARACTER },
    { id: 'ar_3', label: '٣', value: '٣', type: KeyType.CHARACTER },
    { id: 'ar_4', label: '٤', value: '٤', type: KeyType.CHARACTER },
    { id: 'ar_5', label: '٥', value: '٥', type: KeyType.CHARACTER },
    { id: 'ar_6', label: '٦', value: '٦', type: KeyType.CHARACTER },
    { id: 'ar_7', label: '٧', value: '٧', type: KeyType.CHARACTER },
    { id: 'ar_8', label: '٨', value: '٨', type: KeyType.CHARACTER },
    { id: 'ar_9', label: '٩', value: '٩', type: KeyType.CHARACTER },
    { id: 'ar_0', label: '٠', value: '٠', type: KeyType.CHARACTER },
  ],
  [
    { id: 'at', label: '@', type: KeyType.CHARACTER },
    { id: 'hash', label: '#', type: KeyType.CHARACTER },
    { id: 'dollar', label: '$', type: KeyType.CHARACTER },
    { id: 'percent_ar', label: '٪', value: '٪', type: KeyType.CHARACTER },
    { id: 'and', label: '&', type: KeyType.CHARACTER },
    { id: 'minus', label: '-', type: KeyType.CHARACTER },
    { id: 'plus', label: '+', type: KeyType.CHARACTER },
    { id: 'lparen', label: '(', type: KeyType.CHARACTER },
    { id: 'rparen', label: ')', type: KeyType.CHARACTER },
    { id: 'slash', label: '/', type: KeyType.CHARACTER },
  ],
  [
    { id: 'equals', label: '=', type: KeyType.CHARACTER, width: 1.5 },
    { id: 'lt', label: '<', type: KeyType.CHARACTER },
    { id: 'gt', label: '>', type: KeyType.CHARACTER },
    { id: 'ast', label: '*', type: KeyType.CHARACTER },
    { id: 'quote', label: '"', type: KeyType.CHARACTER },
    { id: 'apos', label: "'", type: KeyType.CHARACTER },
    { id: 'colon', label: ':', type: KeyType.CHARACTER },
    { id: 'semi_ar', label: '؛', value: '؛', type: KeyType.CHARACTER },
    { id: 'excl', label: '!', type: KeyType.CHARACTER },
    { id: 'ques_ar', label: '؟', value: '؟', type: KeyType.CHARACTER },
    { id: 'backspace', label: 'Backspace', type: KeyType.FUNCTION, width: 1.5, icon: <Delete size={ICON_SIZE} /> },
  ],
  [
    { id: 'abc', label: 'ا ب ت', type: KeyType.FUNCTION, width: 1.5 }, // Return to Arabic letters
    { id: 'globe', label: 'Lang', type: KeyType.FUNCTION, width: 1, icon: <Globe size={ICON_SIZE} /> },
    { id: 'space', label: 'مسافة', value: ' ', type: KeyType.CHARACTER, width: 4, icon: <Space size={16} className="opacity-0" /> },
    { id: 'comma_ar', label: '،', value: '،', type: KeyType.CHARACTER, width: 1 },
    { id: 'enter', label: 'Enter', value: '\n', type: KeyType.FUNCTION, width: 1.5, icon: <CornerDownLeft size={ICON_SIZE} /> },
  ]
];

// --- Emoji Layout ---
export const KEYBOARD_LAYOUT_EMOJI: KeyboardRow[] = [
  [
    { id: 'e1', label: '😀', value: '😀', type: KeyType.CHARACTER },
    { id: 'e2', label: '😂', value: '😂', type: KeyType.CHARACTER },
    { id: 'e3', label: '😍', value: '😍', type: KeyType.CHARACTER },
    { id: 'e4', label: '😭', value: '😭', type: KeyType.CHARACTER },
    { id: 'e5', label: '👍', value: '👍', type: KeyType.CHARACTER },
    { id: 'e6', label: '❤️', value: '❤️', type: KeyType.CHARACTER },
    { id: 'e7', label: '🥰', value: '🥰', type: KeyType.CHARACTER },
  ],
  [
    { id: 'e8', label: '🔥', value: '🔥', type: KeyType.CHARACTER },
    { id: 'e9', label: '🎉', value: '🎉', type: KeyType.CHARACTER },
    { id: 'e10', label: '🤔', value: '🤔', type: KeyType.CHARACTER },
    { id: 'e11', label: '🙌', value: '🙌', type: KeyType.CHARACTER },
    { id: 'e12', label: '👀', value: '👀', type: KeyType.CHARACTER },
    { id: 'e13', label: '🙏', value: '🙏', type: KeyType.CHARACTER },
    { id: 'e14', label: '🚀', value: '🚀', type: KeyType.CHARACTER },
  ],
  [
    { id: 'e15', label: '👋', value: '👋', type: KeyType.CHARACTER },
    { id: 'e16', label: '✨', value: '✨', type: KeyType.CHARACTER },
    { id: 'e17', label: '💯', value: '💯', type: KeyType.CHARACTER },
    { id: 'e18', label: '🌹', value: '🌹', type: KeyType.CHARACTER },
    { id: 'e19', label: '☕', value: '☕', type: KeyType.CHARACTER },
    { id: 'e20', label: '🎂', value: '🎂', type: KeyType.CHARACTER },
    { id: 'e21', label: '☀️', value: '☀️', type: KeyType.CHARACTER },
  ],
  [
    { id: 'abc', label: 'ABC', type: KeyType.FUNCTION, width: 1.5, icon: <KeyboardIcon size={ICON_SIZE} /> },
    { id: 'comma', label: ',', value: ',', type: KeyType.CHARACTER },
    { id: 'space', label: 'Space', value: ' ', type: KeyType.CHARACTER, width: 4, icon: <Space size={16} className="opacity-0" /> },
    { id: 'period', label: '.', value: '.', type: KeyType.CHARACTER },
    { id: 'backspace', label: 'Backspace', type: KeyType.FUNCTION, width: 1.5, icon: <Delete size={ICON_SIZE} /> },
  ]
];

// --- Driving Mode Layout (English) ---
export const KEYBOARD_LAYOUT_DRIVING_EN: KeyboardRow[] = [
  [
    { id: 'q', label: 'q', type: KeyType.CHARACTER },
    { id: 'w', label: 'w', type: KeyType.CHARACTER },
    { id: 'e', label: 'e', type: KeyType.CHARACTER },
    { id: 'r', label: 'r', type: KeyType.CHARACTER },
    { id: 't', label: 't', type: KeyType.CHARACTER },
    { id: 'y', label: 'y', type: KeyType.CHARACTER },
    { id: 'u', label: 'u', type: KeyType.CHARACTER },
    { id: 'i', label: 'i', type: KeyType.CHARACTER },
    { id: 'o', label: 'o', type: KeyType.CHARACTER },
    { id: 'p', label: 'p', type: KeyType.CHARACTER },
  ],
  [
    { id: 'spacer_l1', label: '', type: KeyType.SPACER, width: 0.5 },
    { id: 'a', label: 'a', type: KeyType.CHARACTER },
    { id: 's', label: 's', type: KeyType.CHARACTER },
    { id: 'd', label: 'd', type: KeyType.CHARACTER },
    { id: 'f', label: 'f', type: KeyType.CHARACTER },
    { id: 'g', label: 'g', type: KeyType.CHARACTER },
    { id: 'h', label: 'h', type: KeyType.CHARACTER },
    { id: 'j', label: 'j', type: KeyType.CHARACTER },
    { id: 'k', label: 'k', type: KeyType.CHARACTER },
    { id: 'l', label: 'l', type: KeyType.CHARACTER },
    { id: 'spacer_r1', label: '', type: KeyType.SPACER, width: 0.5 },
  ],
  [
    { id: 'shift', label: 'Shift', type: KeyType.FUNCTION, width: 1.5, icon: <ArrowUp size={ICON_SIZE} /> },
    { id: 'z', label: 'z', type: KeyType.CHARACTER },
    { id: 'x', label: 'x', type: KeyType.CHARACTER },
    { id: 'c', label: 'c', type: KeyType.CHARACTER },
    { id: 'v', label: 'v', type: KeyType.CHARACTER },
    { id: 'b', label: 'b', type: KeyType.CHARACTER },
    { id: 'n', label: 'n', type: KeyType.CHARACTER },
    { id: 'm', label: 'm', type: KeyType.CHARACTER },
    { id: 'backspace', label: 'Del', type: KeyType.FUNCTION, width: 1.5, icon: <Delete size={ICON_SIZE} /> },
  ],
  [
    { id: 'driving_exit', label: 'Exit', type: KeyType.FUNCTION, width: 1.5, icon: <X size={24} /> },
    { id: 'mic', label: 'Mic', type: KeyType.FUNCTION, width: 1.5, icon: <Mic size={24} /> },
    { id: 'space', label: 'Space', value: ' ', type: KeyType.CHARACTER, width: 3.5, icon: <Space size={16} className="opacity-0" /> },
    { id: 'enter', label: 'Enter', value: '\n', type: KeyType.FUNCTION, width: 1.5, icon: <CornerDownLeft size={24} /> },
  ]
];

// --- Driving Mode Layout (Arabic) ---
export const KEYBOARD_LAYOUT_DRIVING_AR: KeyboardRow[] = [
  [
    { id: 'dad', label: 'ض', type: KeyType.CHARACTER },
    { id: 'sad', label: 'ص', type: KeyType.CHARACTER },
    { id: 'tha', label: 'ث', type: KeyType.CHARACTER },
    { id: 'qaf', label: 'ق', type: KeyType.CHARACTER },
    { id: 'fa', label: 'ف', type: KeyType.CHARACTER },
    { id: 'ghain', label: 'غ', type: KeyType.CHARACTER },
    { id: 'ain', label: 'ع', type: KeyType.CHARACTER },
    { id: 'ha', label: 'ه', type: KeyType.CHARACTER },
    { id: 'kha', label: 'خ', type: KeyType.CHARACTER },
    { id: 'hah', label: 'ح', type: KeyType.CHARACTER },
    { id: 'jeem', label: 'ج', type: KeyType.CHARACTER },
  ],
  [
    { id: 'sheen', label: 'ش', type: KeyType.CHARACTER },
    { id: 'seen', label: 'س', type: KeyType.CHARACTER },
    { id: 'yeh', label: 'ي', type: KeyType.CHARACTER },
    { id: 'beh', label: 'ب', type: KeyType.CHARACTER },
    { id: 'lam', label: 'ل', type: KeyType.CHARACTER },
    { id: 'alef', label: 'ا', type: KeyType.CHARACTER },
    { id: 'teh', label: 'ت', type: KeyType.CHARACTER },
    { id: 'noon', label: 'ن', type: KeyType.CHARACTER },
    { id: 'meem', label: 'م', type: KeyType.CHARACTER },
    { id: 'kaf', label: 'ك', type: KeyType.CHARACTER },
    { id: 'tah', label: 'ط', type: KeyType.CHARACTER },
  ],
  [
    { id: 'shift', label: 'Shift', type: KeyType.FUNCTION, width: 1.5, icon: <ArrowUp size={ICON_SIZE} /> },
    { id: 'reh', label: 'ر', type: KeyType.CHARACTER },
    { id: 'lam_alef', label: 'لا', type: KeyType.CHARACTER },
    { id: 'alef_maksura', label: 'ى', type: KeyType.CHARACTER },
    { id: 'teh_marbuta', label: 'ة', type: KeyType.CHARACTER },
    { id: 'waw', label: 'و', type: KeyType.CHARACTER },
    { id: 'zain', label: 'ز', type: KeyType.CHARACTER },
    { id: 'zah', label: 'ظ', type: KeyType.CHARACTER },
    { id: 'backspace', label: 'Del', type: KeyType.FUNCTION, width: 1.5, icon: <Delete size={ICON_SIZE} /> },
  ],
  [
    { id: 'driving_exit', label: 'Exit', type: KeyType.FUNCTION, width: 1.5, icon: <X size={24} /> },
    { id: 'mic', label: 'Mic', type: KeyType.FUNCTION, width: 1.5, icon: <Mic size={24} /> },
    { id: 'space', label: 'مسافة', value: ' ', type: KeyType.CHARACTER, width: 3.5, icon: <Space size={16} className="opacity-0" /> },
    { id: 'enter', label: 'Enter', value: '\n', type: KeyType.FUNCTION, width: 1.5, icon: <CornerDownLeft size={24} /> },
  ]
];
