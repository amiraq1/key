
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { AIControlBar } from './components/AIControlBar';
import { completeText, fixGrammar, changeTone, decipherSwipe, translateText, extractTextFromImage } from './services/geminiService';
import { learnFromUser, getPersonalizedPredictions, suggestEmojisBasedOnText } from './services/mlService';
import { voiceHelper } from './services/voiceService';
import { addClipboardItem } from './services/dbService';
import { autoSizeManager } from './services/autoSizeManager';
import { ToneType, KeyboardSettings, SupportedLanguage, SizeType, Theme } from './types';
import { THEME_STYLES, getThemeStyles } from './constants';
import { calculateDimensions, SIZE_PRESETS, DEFAULT_WIDTH_PERCENTAGE, MIN_HEIGHT_PERCENT, MAX_HEIGHT_PERCENT } from './services/sizeManager';
import { saveSizeForApp, loadSizeForApp } from './services/appSpecificSizeManager';
import { loadButtonSizes, saveButtonSizes, KeySizeMap } from './services/buttonSizeManager';
import { startAutoSync, stopAutoSync } from './services/cloudSyncService';
import { Bot, Keyboard as KeyboardIcon, XCircle, Mic, ChevronUp, EyeOff, Lock, Settings, Camera } from 'lucide-react';

// Lazy load heavy components to optimize initial render (Startup Time)
const SettingsPanel = React.lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const TranslationOverlay = React.lazy(() => import('./components/TranslationOverlay').then(m => ({ default: m.TranslationOverlay })));
const ClipboardPanel = React.lazy(() => import('./components/ClipboardPanel').then(m => ({ default: m.ClipboardPanel })));
// Monitor Overlay (Lazy)
const KeyboardMonitorOverlay = React.lazy(() => import('./components/KeyboardMonitorOverlay').then(m => ({ default: m.KeyboardMonitorOverlay })));

export default function App() {
  const [text, setText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceInterimText, setVoiceInterimText] = useState(''); // Real-time voice feedback
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(true);
  const [predictions, setPredictions] = useState<string[]>([]);
  
  // Motion Origin State (for Container Transform)
  const [motionOrigin, setMotionOrigin] = useState<{x: number, y: number} | undefined>(undefined);

  // Resize Mode State
  const [isResizeMode, setIsResizeMode] = useState(false);
  // Button Edit Mode State (Individual Key Resizing)
  const [isButtonEditMode, setIsButtonEditMode] = useState(false);

  // Translation Mode State
  const [isTranslationMode, setIsTranslationMode] = useState(false);
  const [translationData, setTranslationData] = useState({
     original: '',
     translated: '',
     source: 'auto' as SupportedLanguage,
     target: 'en' as SupportedLanguage
  });

  // System Theme Detection
  const [systemTheme, setSystemTheme] = useState<'Dark' | 'Light'>('Dark');

  useEffect(() => {
    // Initial check
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'Dark' : 'Light');

    // Listener
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'Dark' : 'Light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Calculate default dimensions
  const initialDims = calculateDimensions(SIZE_PRESETS.medium, DEFAULT_WIDTH_PERCENTAGE);

  const [settings, setSettings] = useState<KeyboardSettings>({
    hapticFeedback: true,
    soundEnabled: false,
    language: 'EN',
    traceTyping: false,
    incognitoMode: false,
    encryptKeystrokes: false,
    theme: 'Auto', // Default to Auto
    drivingMode: false, 
    
    // Size Management
    keyboardHeight: initialDims.height > 0 ? initialDims.height : 300, // Safety fallback
    keyboardWidth: DEFAULT_WIDTH_PERCENTAGE,
    sizeType: 'medium',
    showResizeHandle: true,
    showQuickControls: true,
    autoAdjustSize: false,
    customKeySizes: {}, // Initialize empty
    
    // Foldable Support
    splitLayout: false,

    // Advanced Button Size Settings
    minButtonScale: 0.5,
    maxButtonScale: 2.0,
    buttonAnimations: true,
    animationSpeed: 'normal',

    // Cloud Sync (Defaults)
    googleUser: null,
    cloudSyncEnabled: false,
    lastCloudSync: null,

    // One-Handed Mode
    oneHandedMode: false,
    oneHandedSide: 'right', // Default to right-handed

    // Translation Defaults
    translationSource: 'auto',
    translationTarget: 'en',
    realTimeTranslation: false,
    autoDetectLanguage: true,
    offlineMode: false,
    cacheTranslations: true,

    // Dynamic Theme
    dynamicColorSeed: '#6750A4',

    // Debug
    showDebugOverlay: false
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Separate ref for translation mode camera
  const transCameraRef = useRef<HTMLInputElement>(null);
  
  // Resolve Auto theme to concrete theme for rendering
  const resolvedTheme: Theme = settings.theme === 'Auto' ? systemTheme : settings.theme;
  const themeStyles = getThemeStyles(resolvedTheme, settings.dynamicColorSeed);

  // Initialize: Load saved size if available
  useEffect(() => {
    // 1. Load General Size
    const savedSize = loadSizeForApp();
    
    // 2. Load Button Sizes
    const savedButtonSizes = loadButtonSizes();

    if (savedSize || Object.keys(savedButtonSizes).length > 0) {
      setSettings(prev => {
        const updates: Partial<KeyboardSettings> = {};
        
        if (savedSize) {
           const { height } = calculateDimensions(savedSize.heightPercent, savedSize.widthPercent);
           updates.sizeType = savedSize.sizeType;
           // Ensure height is valid
           updates.keyboardHeight = height > 100 ? height : 300;
           updates.keyboardWidth = savedSize.widthPercent;
        }

        if (Object.keys(savedButtonSizes).length > 0) {
           updates.customKeySizes = savedButtonSizes;
        }

        return { ...prev, ...updates };
      });
    } else {
        // Double check initial height
        const { height } = calculateDimensions(SIZE_PRESETS.medium, DEFAULT_WIDTH_PERCENTAGE);
        if (settings.keyboardHeight < 100 || isNaN(settings.keyboardHeight)) {
            setSettings(prev => ({ ...prev, keyboardHeight: height > 100 ? height : 300 }));
        }
    }
  }, []);

  // Manage Cloud Sync background worker
  useEffect(() => {
      if (settings.cloudSyncEnabled && settings.googleUser) {
          startAutoSync(settings, (timestamp) => {
              setSettings(prev => ({ ...prev, lastCloudSync: timestamp }));
          });
      } else {
          stopAutoSync();
      }
      return () => stopAutoSync();
  }, [settings.cloudSyncEnabled, settings.googleUser]);

  // Sync translation settings when they change in main settings
  useEffect(() => {
     setTranslationData(prev => ({
         ...prev,
         source: settings.translationSource,
         target: settings.translationTarget
     }));
  }, [settings.translationSource, settings.translationTarget]);

  // Keep textarea focus (unless in translation/settings/resize/clipboard mode)
  useEffect(() => {
    if (textareaRef.current && !isSettingsOpen && isKeyboardVisible && !isTranslationMode && !isResizeMode && !isButtonEditMode && !isClipboardOpen) {
      textareaRef.current.focus();
    }
  }, [text, isSettingsOpen, isKeyboardVisible, isTranslationMode, isResizeMode, isButtonEditMode, isClipboardOpen]);

  // Auto-Adjust Size Manager Integration
  useEffect(() => {
    if (settings.autoAdjustSize && !settings.drivingMode) {
        autoSizeManager.enable((newSizeType, reason) => {
            // Apply the suggested size
            const percent = SIZE_PRESETS[newSizeType === 'custom' ? 'medium' : newSizeType];
            const { height } = calculateDimensions(percent, DEFAULT_WIDTH_PERCENTAGE);
            
            setSettings(prev => ({
                ...prev,
                sizeType: newSizeType,
                keyboardHeight: height,
                keyboardWidth: DEFAULT_WIDTH_PERCENTAGE
            }));
            
            // Optional: You could show a toast here explaining why (reason)
            console.log(`Auto-adjusted to ${newSizeType}: ${reason}`);
        });
    } else {
        autoSizeManager.disable();
    }
    
    return () => autoSizeManager.disable();
  }, [settings.autoAdjustSize, settings.drivingMode]);

  // Update Size Helper & Persist
  const handleUpdateSize = (newHeight: number, newWidthPercent: number, newSizeType: SizeType) => {
    setSettings(prev => ({ 
        ...prev, 
        keyboardHeight: newHeight,
        keyboardWidth: newWidthPercent,
        sizeType: newSizeType 
    }));

    // Save preference
    const heightPercent = newHeight / window.innerHeight;
    saveSizeForApp('com.gemkey.web', newSizeType, heightPercent, newWidthPercent);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if Alt/Meta are pressed to avoid conflict with system/browser shortcuts
      if (e.altKey || e.metaKey) return;

      // --- Translation Shortcuts ---
      
      // Ctrl + T: Toggle Translation Panel
      if (e.ctrlKey && e.key.toLowerCase() === 't' && !e.shiftKey) {
        e.preventDefault();
        setIsTranslationMode(prev => !prev);
        return;
      }

      // Ctrl + Shift + T: Swap Languages
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setTranslationData(prev => ({ ...prev, source: prev.target, target: prev.source }));
        return;
      }

      // Ctrl + Shift + V: Paste and Translate
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setIsTranslationMode(true);
                setTranslationData(prev => ({ ...prev, original: text }));
            }
        } catch (err) {
            console.error("Clipboard permission denied or empty", err);
        }
        return;
      }

      // --- Context-Aware Shortcuts (Translation vs Size) ---

      // Ctrl + 1
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        if (isTranslationMode) {
            setTranslationData(prev => ({ ...prev, target: 'ar' }));
            setSettings(prev => ({ ...prev, translationTarget: 'ar' }));
        } else {
            // Set Size Small
            const { height } = calculateDimensions(SIZE_PRESETS.small, settings.keyboardWidth);
            handleUpdateSize(height, settings.keyboardWidth, 'small');
        }
        return;
      }

      // Ctrl + 2
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        if (isTranslationMode) {
            setTranslationData(prev => ({ ...prev, target: 'en' }));
            setSettings(prev => ({ ...prev, translationTarget: 'en' }));
        } else {
            // Set Size Medium
            const { height } = calculateDimensions(SIZE_PRESETS.medium, settings.keyboardWidth);
            handleUpdateSize(height, settings.keyboardWidth, 'medium');
        }
        return;
      }

      // Ctrl + 3 (Size Large only)
      if (e.ctrlKey && e.key === '3') {
          e.preventDefault();
          const { height } = calculateDimensions(SIZE_PRESETS.large, settings.keyboardWidth);
          handleUpdateSize(height, settings.keyboardWidth, 'large');
          return;
      }

      // --- Size Control Shortcuts ---

      // Ctrl + + / = (Increase Size)
      if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
          e.preventDefault();
          const screenHeight = window.innerHeight;
          const currentHeight = settings.keyboardHeight;
          const newHeight = Math.min(currentHeight + (screenHeight * 0.05), screenHeight * MAX_HEIGHT_PERCENT);
          handleUpdateSize(newHeight, settings.keyboardWidth, 'custom');
      }

      // Ctrl + - (Decrease Size)
      if (e.ctrlKey && e.key === '-') {
          e.preventDefault();
          const screenHeight = window.innerHeight;
          const currentHeight = settings.keyboardHeight;
          const newHeight = Math.max(currentHeight - (screenHeight * 0.05), screenHeight * MIN_HEIGHT_PERCENT);
          handleUpdateSize(newHeight, settings.keyboardWidth, 'custom');
      }

      // Ctrl + 0 (Reset Size)
      if (e.ctrlKey && e.key === '0') {
          e.preventDefault();
          const { height } = calculateDimensions(SIZE_PRESETS.medium, settings.keyboardWidth);
          handleUpdateSize(height, settings.keyboardWidth, 'medium');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTranslationMode, settings.keyboardHeight, settings.keyboardWidth]); // Dependencies for latest state access

  // Real-Time Translation Logic (Debounced)
  useEffect(() => {
    if (!settings.realTimeTranslation || !text.trim() || isLoading || isTranslationMode) return;

    const timeoutId = setTimeout(async () => {
       if (text.length > 3) {
           setIsLoading(true);
           try {
             const translated = await translateText(
               text, 
               settings.translationSource, 
               settings.translationTarget,
               { useCache: settings.cacheTranslations, isOffline: settings.offlineMode }
             );
             if (translated !== text) setText(translated);
           } catch(e) {
             console.error("Auto-translate failed", e);
           } finally {
             setIsLoading(false);
           }
       }
    }, 2000); 

    return () => clearTimeout(timeoutId);
  }, [text, settings.realTimeTranslation, settings.translationSource, settings.translationTarget, isTranslationMode, settings.cacheTranslations, settings.offlineMode]);

  // Translation Overlay Real-time Logic
  useEffect(() => {
      if (!isTranslationMode || !settings.realTimeTranslation || !translationData.original.trim()) return;
      
      const timeoutId = setTimeout(async () => {
          try {
              const res = await translateText(
                translationData.original, 
                translationData.source, 
                translationData.target,
                { useCache: settings.cacheTranslations, isOffline: settings.offlineMode }
              );
              setTranslationData(prev => ({ ...prev, translated: res }));
          } catch(e) { console.error(e); }
      }, 1000);
      return () => clearTimeout(timeoutId);
  }, [translationData.original, translationData.source, translationData.target, isTranslationMode, settings.realTimeTranslation, settings.cacheTranslations, settings.offlineMode]);

  // ML Predictor Logic
  useEffect(() => {
    let isCancelled = false;
    const fetchPredictions = async () => {
      if (settings.incognitoMode || settings.encryptKeystrokes) {
        if (!isCancelled) setPredictions([]);
        return;
      }
      if (!text) {
        if (!isCancelled) setPredictions(settings.language === 'AR' ? ['مرحبا', 'كيف', 'أنا'] : ['I', 'The', 'Hello']);
        return;
      }
      
      const emojiSuggestions = suggestEmojisBasedOnText(text);
      const personalPredictions = await getPersonalizedPredictions(text, settings.language);

      if (isCancelled) return;

      let genericPredictions: string[] = [];
      if (personalPredictions.length < 2) {
          const words = text.trim().split(/\s+/);
          const lastWord = words[words.length - 1].toLowerCase();
          
          if (settings.language === 'EN') {
              if (lastWord === 'hello') genericPredictions = ['world', 'there', 'friend'];
              else if (lastWord === 'how') genericPredictions = ['are', 'is', 'do'];
          }
      }
      const combined = Array.from(new Set([...emojiSuggestions, ...personalPredictions, ...genericPredictions])).slice(0, 4); 
      setPredictions(combined);
    };
    fetchPredictions();
    return () => { isCancelled = true; };
  }, [text, settings.incognitoMode, settings.language, settings.encryptKeystrokes]);

  const handleToggleVoice = (target: 'main' | 'translation') => {
    if (isListening) {
      voiceHelper.stopListening();
    } else {
      const listenLang = target === 'translation' 
          ? (translationData.source === 'auto' ? 'en' : translationData.source) 
          : settings.language;

      voiceHelper.startListening(
        listenLang,
        async (resultText, isFinal) => {
          if (isFinal) {
             if (target === 'main') {
                 setText((prev) => {
                   const needsSpace = prev.length > 0 && !prev.endsWith(' ');
                   const finalText = prev + (needsSpace ? ' ' : '') + resultText;
                   if (!settings.incognitoMode && !settings.encryptKeystrokes) learnFromUser(resultText, false, settings.language);
                   return finalText;
                });
             } else {
                // Translation Mode: Append text and trigger IMMEDIATE translation
                const newOriginal = translationData.original + (translationData.original ? ' ' : '') + resultText;
                setTranslationData(prev => ({ ...prev, original: newOriginal }));
                
                setIsLoading(true);
                try {
                  const translated = await translateText(
                    newOriginal, 
                    translationData.source, 
                    translationData.target,
                    { useCache: settings.cacheTranslations, isOffline: settings.offlineMode }
                  );
                  setTranslationData(prev => ({ ...prev, translated }));
                } catch (e) {
                  console.error("Voice translation failed", e);
                } finally {
                  setIsLoading(false);
                }
             }
            setVoiceInterimText(''); 
          } else {
            setVoiceInterimText(resultText); 
          }
        },
        () => {
          setIsListening(true);
          setVoiceInterimText('');
        },
        () => {
          setIsListening(false);
          setVoiceInterimText('');
        },
        (error) => {
          console.error("Voice error:", error);
          setIsListening(false);
          setVoiceInterimText('');
        }
      );
    }
  };

  const handleKeyPress = (char: string) => {
      // Report key press for speed analysis
      autoSizeManager.reportKeyPress();
      setText((prev) => prev + char);
  };

  const handleDelete = () => setText((prev) => prev.slice(0, -1));
  const handleEnter = () => {
    if (!settings.incognitoMode && !settings.encryptKeystrokes) learnFromUser(text, false, settings.language);
    setText((prev) => prev + '\n');
  };

  const handleSwipeLeft = () => {
    setText(prev => {
      const trimmed = prev.trimEnd();
      const lastSpaceIndex = trimmed.lastIndexOf(' ');
      return lastSpaceIndex === -1 ? '' : trimmed.substring(0, lastSpaceIndex) + ' '; 
    });
  };
  const handleSwipeRight = () => setText(prev => prev + ' ');
  const handleSwipeDown = () => { setIsKeyboardVisible(false); textareaRef.current?.blur(); };

  const handleTraceEnd = async (path: string) => {
    if (!path) return;
    setIsLoading(true);
    try {
      const decipheredWord = await decipherSwipe(path, (settings.incognitoMode || settings.encryptKeystrokes) ? "" : text, settings.language);
      if (decipheredWord) {
        setText((prev) => {
          const needsSpace = prev.length > 0 && !prev.endsWith(' ') && !decipheredWord.startsWith(' ');
          const newText = prev + (needsSpace ? ' ' : '') + decipheredWord + ' ';
          if (!settings.incognitoMode && !settings.encryptKeystrokes) learnFromUser(decipheredWord, false, settings.language);
          return newText;
        });
      }
    } catch (e) { console.error("Trace error", e); } finally { setIsLoading(false); }
  };

  const handleSmartComplete = async () => {
    if (!text) return;
    setIsLoading(true);
    try {
      const completion = await completeText(text);
      if (completion) setText((prev) => prev + (prev.endsWith(' ') ? '' : ' ') + completion);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleFixGrammar = async () => {
    if (!text) return;
    setIsLoading(true);
    try { const fixed = await fixGrammar(text); setText(fixed); } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleChangeTone = async (tone: ToneType) => {
    if (!text) return;
    setIsLoading(true);
    try { const rewritten = await changeTone(text, tone); setText(rewritten); } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  // --- Translation Overlay Handlers ---
  const handleQuickTranslate = () => {
    setIsTranslationMode(true);
    if (text.trim() && !translationData.original) {
        setTranslationData(prev => ({ ...prev, original: text }));
    }
  };

  const handleVoiceTranslate = () => {
      setIsTranslationMode(true);
      handleToggleVoice('translation');
  };

  const handleCameraTranslate = () => {
      setIsTranslationMode(true);
      if (transCameraRef.current) transCameraRef.current.click();
  };

  const handleClipboardInsert = (clipText: string) => {
     setText(prev => prev + clipText);
     setIsClipboardOpen(false);
  };
  
  // Save copied translation to history
  const handleCopyTranslation = async (translated: string) => {
      await navigator.clipboard.writeText(translated);
      await addClipboardItem(translated);
  };

  // --- Camera/OCR Handler ---
  const handleCameraClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'translation') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Url = ev.target?.result as string;
        if (base64Url) {
           const base64Data = base64Url.split(',')[1];
           const extractedText = await extractTextFromImage(base64Data, file.type || 'image/jpeg');
           if (extractedText) {
             if (target === 'main') {
                 setText(prev => prev + (prev ? '\n' : '') + extractedText);
             } else {
                 setTranslationData(prev => ({ ...prev, original: prev.original + (prev.original ? ' ' : '') + extractedText }));
             }
           }
        }
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch(err) { console.error("OCR Error", err); setIsLoading(false); } finally {
       if (target === 'main' && fileInputRef.current) fileInputRef.current.value = '';
       if (target === 'translation' && transCameraRef.current) transCameraRef.current.value = '';
    }
  };
  
  // Resize Mode Handlers
  const handleEnterResize = () => {
    setIsSettingsOpen(false);
    setIsResizeMode(true);
  };

  // Button Edit Mode Handlers
  const handleEnterButtonEdit = () => {
    setIsSettingsOpen(false);
    setIsButtonEditMode(true);
  };
  
  // One-Handed Mode Handlers
  const handleToggleOneHanded = () => {
    setSettings(prev => ({ ...prev, oneHandedMode: !prev.oneHandedMode }));
  };

  const handleSwitchOneHandedSide = () => {
    setSettings(prev => ({ ...prev, oneHandedSide: prev.oneHandedSide === 'left' ? 'right' : 'left' }));
  };

  // Custom Key Size update
  const handleUpdateKeySize = (keyId: string, factor: number) => {
     setSettings(prev => {
        const newSizes = {
          ...prev.customKeySizes,
          [keyId]: factor
        };
        // Auto-save changes
        saveButtonSizes(newSizes);
        return {
           ...prev,
           customKeySizes: newSizes
        };
     });
  };

  // Apply a size profile
  const handleApplyKeyProfile = (sizes: KeySizeMap) => {
      setSettings(prev => {
         // Auto-save the new active set
         saveButtonSizes(sizes);
         return {
             ...prev,
             customKeySizes: sizes
         };
      });
  };

  // Driving Mode Handler
  const handleToggleDrivingMode = () => {
      setSettings(prev => {
          const isEnabled = !prev.drivingMode;
          let newHeight = prev.keyboardHeight;
          let newSizeType = prev.sizeType;

          if (isEnabled) {
              const { height } = calculateDimensions(SIZE_PRESETS.full, DEFAULT_WIDTH_PERCENTAGE);
              newHeight = height;
              newSizeType = 'full';
          } else {
              const { height } = calculateDimensions(SIZE_PRESETS.medium, DEFAULT_WIDTH_PERCENTAGE);
              newHeight = height;
              newSizeType = 'medium';
          }

          return {
              ...prev,
              drivingMode: isEnabled,
              sizeType: newSizeType,
              keyboardHeight: newHeight,
              splitLayout: false // Disable split in driving mode
          };
      });
  };

  // Remove Suggestion Handler (Long Press on Chip)
  const handleRemovePrediction = (word: string) => {
      // Optimistically remove from UI
      setPredictions(prev => prev.filter(p => p !== word));
      
      // Optional: Add logic to 'unlearn' or blacklist if ML backend supports it
      if (settings.hapticFeedback && navigator.vibrate) {
          navigator.vibrate(50); // Feedback
      }
  };

  // Capture click coordinates for Material Container Transform motion
  const handleOpenSettings = (e: React.MouseEvent) => {
      setMotionOrigin({ x: e.clientX, y: e.clientY });
      setIsSettingsOpen(true);
  };

  const handleOpenClipboard = (e: React.MouseEvent) => {
      setMotionOrigin({ x: e.clientX, y: e.clientY });
      setIsClipboardOpen(true);
  };
  
  // PASS RESOLVED THEME TO VISUAL COMPONENTS, but keep raw settings for SettingsPanel
  const visualSettings = { ...settings, theme: resolvedTheme };

  return (
    <div 
        className={`min-h-screen flex flex-col overflow-hidden font-sans transition-colors duration-300 ${themeStyles.appBg} ${themeStyles.textMain}`}
        style={settings.theme === 'Dynamic' ? themeStyles.inline?.appBg : undefined}
    >
      {/* Hidden Inputs for Camera */}
      <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, 'main')} />
      <input type="file" ref={transCameraRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, 'translation')} />

      {/* Debug Monitor Overlay */}
      {settings.showDebugOverlay && (
          <Suspense fallback={null}>
              <KeyboardMonitorOverlay />
          </Suspense>
      )}

      {/* Header */}
      <header className={`px-4 py-3 border-b flex items-center justify-between select-none z-20 transition-colors duration-300 ${themeStyles.headerBg}`}>
        <div className="flex items-center gap-2">
           <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg border border-white/10 ${settings.incognitoMode ? 'bg-gray-700' : 'bg-gradient-to-br from-green-500 to-emerald-700'}`}>
             {settings.incognitoMode ? <EyeOff size={18} className="text-white" /> : <KeyboardIcon size={18} className="text-white" />}
           </div>
           <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight leading-none">GemKey</h1>
              {settings.incognitoMode && <span className="text-[10px] text-gray-500 font-medium">Incognito</span>}
           </div>
        </div>
        <div className="flex items-center gap-3">
          {isListening && <Mic size={16} className="text-red-500 animate-pulse" />}
          <button onClick={handleCameraClick} className="p-2 rounded-full hover:bg-black/10 transition-colors">
            <Camera size={20} />
          </button>
          <button onClick={handleOpenSettings} className="p-2 rounded-full hover:bg-black/10 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area (Layout matching TextInputLayout) */}
      <main className="flex-1 flex flex-col w-full max-w-3xl mx-auto relative" onClick={() => !isKeyboardVisible && setIsKeyboardVisible(true)}>
        <div className="flex-1 p-4 flex flex-col">
          {/* TextInputLayout-like Container */}
          <div 
            className={`
                relative flex-1 w-full border rounded-lg transition-colors overflow-hidden flex flex-col
                ${resolvedTheme === 'Light' ? 'border-gray-400 bg-white focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600' : 'border-gray-600 bg-black/20 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400'}
            `}
          >
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={settings.language === 'AR' ? "اكتب هنا..." : "Type here..."}
                className={`w-full h-full p-4 bg-transparent text-xl md:text-2xl leading-relaxed resize-none focus:outline-none ${themeStyles.inputPlaceholder} ${settings.language === 'AR' ? 'text-right font-sans' : 'text-left font-sans'} ${settings.encryptKeystrokes ? 'secure-text tracking-widest' : ''}`}
                spellCheck={false}
                autoCorrect={settings.encryptKeystrokes ? "off" : "on"}
                autoCapitalize={settings.encryptKeystrokes ? "off" : "on"}
                autoComplete={settings.encryptKeystrokes ? "off" : "on"}
                dir={settings.language === 'AR' ? 'rtl' : 'ltr'}
                // Prevent native keyboard on mobile
                inputMode="none" 
              />
              
              {/* End Icon (Clear Text) */}
              {text.length > 0 && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setText(''); textareaRef.current?.focus(); }} 
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
                    title="Clear text"
                >
                  <XCircle size={20} fill="currentColor" className="opacity-50" />
                </button>
              )}
          </div>
        </div>

        {!text && !isListening && !isTranslationMode && !isResizeMode && !isButtonEditMode && !isClipboardOpen && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none opacity-20">
            {settings.encryptKeystrokes ? <Lock size={48} className="text-red-400" /> : settings.incognitoMode ? <EyeOff size={48} /> : <Bot size={48} />}
            <p className="text-sm font-medium">{settings.encryptKeystrokes ? "Secure Input Mode" : settings.incognitoMode ? "History Paused" : "Gemini AI Ready"}</p>
          </div>
        )}
        
        {isListening && (
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a]/95 backdrop-blur-md border border-red-500/30 p-8 rounded-3xl flex flex-col items-center shadow-2xl z-50">
             <Mic size={48} className="text-red-500 animate-pulse mb-4" />
             <p className="text-red-400 font-bold mb-2">Listening...</p>
             <p className="text-gray-200 text-center">{voiceInterimText || '...'}</p>
             <button onClick={() => handleToggleVoice('main')} className="mt-4 px-4 py-1 bg-red-500/20 text-red-400 rounded-full">Cancel</button>
           </div>
        )}
      </main>

      {/* Bottom Section */}
      <section className={`mt-auto w-full z-10 transition-transform duration-300 ease-in-out ${isKeyboardVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Translation Overlay */}
        <Suspense fallback={<div className="h-40 w-full bg-gray-900 animate-pulse" />}>
            {isTranslationMode && (
            <TranslationOverlay 
                originalText={translationData.original}
                translatedText={translationData.translated}
                sourceLang={translationData.source}
                targetLang={translationData.target}
                isRealTime={settings.realTimeTranslation}
                theme={resolvedTheme}
                onOriginalTextChange={(val) => setTranslationData(prev => ({...prev, original: val}))}
                onSourceLangChange={(val) => setTranslationData(prev => ({...prev, source: val}))}
                onTargetLangChange={(val) => setTranslationData(prev => ({...prev, target: val}))}
                onSwapLanguages={() => setTranslationData(prev => ({...prev, source: prev.target, target: prev.source}))}
                onToggleRealTime={() => setSettings(prev => ({...prev, realTimeTranslation: !prev.realTimeTranslation}))}
                onInsert={() => {
                    if (translationData.translated) {
                        setText(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + translationData.translated);
                        setIsTranslationMode(false);
                        setTranslationData(prev => ({...prev, original: '', translated: ''}));
                    }
                }}
                onCopy={() => handleCopyTranslation(translationData.translated)}
                onClose={() => setIsTranslationMode(false)}
            />
            )}
        </Suspense>

        <AIControlBar 
          isLoading={isLoading}
          onComplete={handleSmartComplete}
          onFixGrammar={handleFixGrammar}
          onChangeTone={handleChangeTone}
          onQuickTranslate={handleQuickTranslate}
          onVoiceTranslate={handleVoiceTranslate}
          onCameraTranslate={handleCameraTranslate}
          onOpenClipboard={(e) => handleOpenClipboard(e as unknown as React.MouseEvent)}
          theme={resolvedTheme}
        />

        <VirtualKeyboard 
          onKeyPress={handleKeyPress}
          onDelete={handleDelete}
          onEnter={handleEnter}
          onToggleVoice={() => handleToggleVoice('main')}
          onToggleSettings={() => setIsSettingsOpen(true)}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onSwipeDown={handleSwipeDown}
          onTraceEnd={handleTraceEnd}
          onUpdateSize={handleUpdateSize}
          onExitResize={() => setIsResizeMode(false)}
          onToggleOneHanded={handleToggleOneHanded}
          onSwitchOneHandedSide={handleSwitchOneHandedSide}
          settings={visualSettings}
          isListening={isListening}
          isResizeMode={isResizeMode}
          isButtonEditMode={isButtonEditMode}
          onEnterButtonEditMode={handleEnterButtonEdit}
          onExitButtonEditMode={() => setIsButtonEditMode(false)}
          onUpdateKeySize={handleUpdateKeySize}
          onApplyKeyProfile={handleApplyKeyProfile}
          predictions={predictions}
          onRemoveSuggestion={handleRemovePrediction}
          onToggleDrivingMode={handleToggleDrivingMode}
        />
      </section>
      
      {!isKeyboardVisible && (
        <button onClick={() => setIsKeyboardVisible(true)} className="fixed bottom-6 right-6 p-4 bg-green-600 text-white rounded-full shadow-2xl z-20 hover:bg-green-500 transition-colors animate-bounce">
          <ChevronUp size={24} />
        </button>
      )}

      <Suspense fallback={null}>
        {isSettingsOpen && (
            <SettingsPanel 
            settings={settings} 
            onUpdateSettings={setSettings} 
            onClose={() => setIsSettingsOpen(false)} 
            onEnterResizeMode={handleEnterResize}
            onEnterButtonEditMode={handleEnterButtonEdit}
            transformOrigin={motionOrigin}
            />
        )}

        {isClipboardOpen && (
            <ClipboardPanel 
            theme={resolvedTheme}
            onClose={() => setIsClipboardOpen(false)}
            onInsert={handleClipboardInsert}
            transformOrigin={motionOrigin}
            />
        )}
      </Suspense>
    </div>
  );
}