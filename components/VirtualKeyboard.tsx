
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Key } from './Key';
import { 
  KEYBOARD_LAYOUT_LOWER, 
  KEYBOARD_LAYOUT_UPPER,
  KEYBOARD_LAYOUT_ARABIC,
  KEYBOARD_LAYOUT_SYMBOLS,
  KEYBOARD_LAYOUT_SYMBOLS_AR,
  KEYBOARD_LAYOUT_EMOJI,
  KEYBOARD_LAYOUT_DRIVING_EN,
  KEYBOARD_LAYOUT_DRIVING_AR,
  RESIZE_UI_COLORS,
  SHAPE_STYLES,
  getThemeStyles
} from '../constants';
import { KeyboardSettings, KeyDefinition, KeyType } from '../types';
import { GripHorizontal, Check, Maximize2, ArrowLeftRight, Save, Upload, RotateCcw } from 'lucide-react';
import { SIZE_PRESETS, getSizeTypeFromHeight } from '../services/sizeManager';
import { 
  KeySizeMap, 
  getSavedProfilesMap, 
  handleLoadProfile,
  getButtonSize,
  saveButtonSize,
  resetAllSizes,
  deleteProfile,
  PRESET_PROFILES
} from '../services/buttonSizeManager';
import { pointPool, Point } from '../services/memoryOptimizer';
import { layoutOptimizer } from '../services/layoutOptimizer';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  onToggleVoice: () => void;
  onToggleSettings: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onTraceEnd?: (path: string) => void;
  
  onUpdateSize?: (height: number, widthPercent: number, sizeType: any) => void;
  onExitResize?: () => void;

  onToggleOneHanded?: () => void;
  onSwitchOneHandedSide?: () => void;
  
  settings: KeyboardSettings;
  isListening?: boolean;
  isResizeMode?: boolean;

  isButtonEditMode?: boolean;
  onEnterButtonEditMode?: () => void;
  onExitButtonEditMode?: () => void;
  onUpdateKeySize?: (keyId: string, factor: number) => void;
  onApplyKeyProfile?: (sizes: KeySizeMap) => void;

  predictions?: string[];
  onRemoveSuggestion?: (word: string) => void;
  onToggleDrivingMode?: () => void;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ 
  onKeyPress, 
  onDelete, 
  onEnter, 
  onToggleVoice, 
  onToggleSettings,
  onSwipeLeft,
  onSwipeRight,
  onSwipeDown,
  onTraceEnd,
  onUpdateSize,
  onExitResize,
  onToggleOneHanded,
  onSwitchOneHandedSide,
  settings,
  isListening = false,
  isResizeMode = false,
  isButtonEditMode = false,
  onEnterButtonEditMode,
  onExitButtonEditMode,
  onUpdateKeySize,
  onApplyKeyProfile,
  predictions = [],
  onRemoveSuggestion,
  onToggleDrivingMode
}) => {
  const [capsLock, setCapsLock] = useState(false);
  const [isSymbolMode, setIsSymbolMode] = useState(false);
  const [isEmojiMode, setIsEmojiMode] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<Record<string, KeySizeMap>>({});

  // Gesture State
  const touchStart = useRef<{x: number, y: number} | null>(null);
  const swipePath = useRef<string>('');
  const tracePoints = useRef<Point[]>([]); // Optimized: uses recycled Points
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pinch Resize State
  const initialPinchDistance = useRef<number | null>(null);
  const initialHeight = useRef<number>(0);

  // Resize Handle State
  const resizeStartY = useRef<number | null>(null);
  const resizeStartHeight = useRef<number>(0);

  useEffect(() => {
    // Load profiles on mount
    setSavedProfiles(getSavedProfilesMap());
    // Initialize Layout Optimizer measurements
    layoutOptimizer.initialize();
    
    return () => {
        // Cleanup memory pool on unmount
        pointPool.cleanup();
    };
  }, []);

  const handleKeyPress = useCallback((keyDef: KeyDefinition) => {
    if (isButtonEditMode) return;

    if (keyDef.type === KeyType.CHARACTER) {
      if (keyDef.value) onKeyPress(keyDef.value);
      else onKeyPress(keyDef.label);
      
    } else if (keyDef.type === KeyType.FUNCTION) {
      switch (keyDef.id) {
        case 'shift': setCapsLock(prev => !prev); break;
        case 'backspace': onDelete(); break;
        case 'enter': onEnter(); break;
        case 'mode_123': setIsSymbolMode(prev => !prev); setIsEmojiMode(false); break;
        case 'abc': setIsSymbolMode(false); setIsEmojiMode(false); break;
        case 'globe': break;
        case 'mic': onToggleVoice(); break;
        case 'settings': onToggleSettings(); break;
        case 'driving_exit': onToggleDrivingMode?.(); break;
      }
    }
  }, [isButtonEditMode, onKeyPress, onDelete, onEnter, onToggleVoice, onToggleSettings, onToggleDrivingMode]);

  const handleEnterButtonEditMode = useCallback(() => {
      // Triggered by long-press on key
      if (!isButtonEditMode && onEnterButtonEditMode) {
          onEnterButtonEditMode();
      }
  }, [isButtonEditMode, onEnterButtonEditMode]);

  // Determine Layout (Memoized)
  const layout = useMemo(() => {
      if (settings.drivingMode) {
          return settings.language === 'AR' ? KEYBOARD_LAYOUT_DRIVING_AR : KEYBOARD_LAYOUT_DRIVING_EN;
      }
      if (isEmojiMode) return KEYBOARD_LAYOUT_EMOJI;
      if (isSymbolMode) {
          return settings.language === 'AR' ? KEYBOARD_LAYOUT_SYMBOLS_AR : KEYBOARD_LAYOUT_SYMBOLS;
      }
      if (settings.language === 'AR') return KEYBOARD_LAYOUT_ARABIC;
      return capsLock ? KEYBOARD_LAYOUT_UPPER : KEYBOARD_LAYOUT_LOWER;
  }, [settings.drivingMode, settings.language, isEmojiMode, isSymbolMode, capsLock]);

  // --- Dynamic Theme ---
  const styles = getThemeStyles(settings.theme, settings.dynamicColorSeed);
  
  const containerShapeClass = settings.theme === 'Material3' || settings.theme === 'Dynamic'
      ? `shadow-2xl ${SHAPE_STYLES.container} border-t border-white/10` 
      : 'rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)]';

  // --- Helper Functions for Button Size Management UI ---
  const refreshProfiles = () => {
      setSavedProfiles(getSavedProfilesMap());
  };

  const loadProfile = (name: string) => {
     handleLoadProfile(name);
     refreshProfiles();
     if (onApplyKeyProfile) {
         const loadedSizes = name in PRESET_PROFILES ? (PRESET_PROFILES as any)[name] : getSavedProfilesMap()[name];
         if (loadedSizes) onApplyKeyProfile(loadedSizes);
     }
  };

  const handleResetAll = () => {
      resetAllSizes();
      if (onApplyKeyProfile) onApplyKeyProfile({});
      refreshProfiles();
  };

  const renderSavedProfiles = () => {
    const entries = Object.entries(savedProfiles) as [string, KeySizeMap][];
    const presets = Object.entries(PRESET_PROFILES) as [string, KeySizeMap][];
    
    const allProfiles = [...presets, ...entries];

    if (allProfiles.length === 0) {
      return <div className="no-profiles-message">No profiles available.</div>;
    }

    return allProfiles.map(([name, sizes]) => (
      <div key={name} className="profile-item">
        <div className="profile-header">
          <h4>{name} {presets.find(p => p[0] === name) ? '(Preset)' : ''}</h4>
          <button className="load-profile-btn" onClick={() => loadProfile(name)}>Load</button>
        </div>
        <div className="profile-stats">
          <span>{Object.keys(sizes).length} keys</span>
          {!presets.find(p => p[0] === name) && (
              <button className="delete-profile-btn" onClick={() => { deleteProfile(name); refreshProfiles(); }}>Delete</button>
          )}
        </div>
      </div>
    ));
  };


  // --- Gesture Handlers ---
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Start Pinch
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistance.current = dist;
      initialHeight.current = settings.keyboardHeight;
      return;
    }

    // Direct Key Detection on Touch Start (Fast Input)
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const button = target?.closest('button');
    if (button) {
        // We let the native onClick/onTouchStart of Key handle the press visualization
        // But for gesture initiation, we track coordinates
    }

    if (settings.traceTyping && !isButtonEditMode && !isResizeMode) {
        touchStart.current = { x: touch.clientX, y: touch.clientY };
        swipePath.current = '';
        
        // Memory Optimization: Recycle old points if any exist (though should be empty)
        if (tracePoints.current.length > 0) {
            pointPool.recycle(tracePoints.current);
            tracePoints.current = [];
        }
        
        // Obtain new point from pool
        tracePoints.current.push(pointPool.obtain(touch.clientX, touch.clientY));
        
        // Setup Canvas
        if (canvasRef.current && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            canvasRef.current.width = rect.width;
            canvasRef.current.height = rect.height;
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, rect.width, rect.height);
        }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Throttled Pinch Resize Logic
    if (e.touches.length === 2 && initialPinchDistance.current !== null && onUpdateSize) {
        requestAnimationFrame(() => {
            if (initialPinchDistance.current) {
                const dist = Math.hypot(
                  e.touches[0].clientX - e.touches[1].clientX,
                  e.touches[0].clientY - e.touches[1].clientY
                );
                const scale = dist / initialPinchDistance.current;
                const newHeight = initialHeight.current * scale;
                const sizeType = getSizeTypeFromHeight(newHeight);
                onUpdateSize(newHeight, settings.keyboardWidth, sizeType);
            }
        });
        return;
    }

    // Trace Typing Logic
    if (settings.traceTyping && touchStart.current && !isButtonEditMode) {
        // Prevent default only if swiping to avoid scrolling page
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        
        // Use requestAnimationFrame for hit testing if possible, but elementFromPoint is fast enough usually
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const keyVal = target?.getAttribute('data-key-value');
        
        if (keyVal && (!swipePath.current.endsWith(keyVal))) {
            swipePath.current += keyVal;
        }

        // Draw Line - Optimized with Point Pool
        if (canvasRef.current && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // OBTAIN FROM POOL instead of new Object
            tracePoints.current.push(pointPool.obtain(touch.clientX, touch.clientY));
            
            // We draw in the effect loop, just update data here
        }
    }
  };

  // Canvas Drawing Helper
  useEffect(() => {
      let animFrame: number;
      const renderTrace = () => {
          if (settings.traceTyping && canvasRef.current && containerRef.current && tracePoints.current.length > 1) {
             const ctx = canvasRef.current.getContext('2d');
             const rect = containerRef.current.getBoundingClientRect();
             if (ctx) {
                 ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                 ctx.beginPath();
                 ctx.strokeStyle = settings.theme === 'Light' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(96, 165, 250, 0.6)';
                 ctx.lineWidth = 5;
                 ctx.lineCap = 'round';
                 ctx.lineJoin = 'round';
                 
                 // Draw the path
                 if (tracePoints.current.length > 0) {
                     const first = tracePoints.current[0];
                     ctx.moveTo(first.x - rect.left, first.y - rect.top);
                     
                     // Optimization: Skip some points if too dense? 
                     // For now, draw all for smoothness
                     for (let i = 1; i < tracePoints.current.length; i++) {
                         const p = tracePoints.current[i];
                         ctx.lineTo(p.x - rect.left, p.y - rect.top);
                     }
                 }
                 ctx.stroke();
             }
          }
          animFrame = requestAnimationFrame(renderTrace);
      };
      
      if (settings.traceTyping) renderTrace();
      return () => cancelAnimationFrame(animFrame);
  }, [settings.traceTyping, settings.theme]);

  const handleTouchEnd = (e: React.TouchEvent) => {
    initialPinchDistance.current = null;

    if (settings.traceTyping && touchStart.current) {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStart.current.x;
        const dy = touch.clientY - touchStart.current.y;
        
        // Simple Swipe Detection
        if (Math.abs(dx) > 50 || Math.abs(dy) > 50) {
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && onSwipeRight) onSwipeRight();
                else if (dx < 0 && onSwipeLeft) onSwipeLeft();
            } else {
                if (dy > 0 && onSwipeDown) onSwipeDown();
            }
        } else if (swipePath.current.length > 2 && onTraceEnd) {
             onTraceEnd(swipePath.current);
        }
        
        touchStart.current = null;
        swipePath.current = '';
        
        // RECYCLE POINTS TO POOL
        pointPool.recycle(tracePoints.current);
        tracePoints.current = []; // Clear reference
        
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    }
  };


  // --- Render ---

  // One-Handed Width Calculation
  const containerStyle: React.CSSProperties = {
     height: `${settings.keyboardHeight}px`,
     width: `${settings.keyboardWidth * 100}%`,
     marginLeft: settings.oneHandedMode && settings.oneHandedSide === 'right' ? 'auto' : 0,
     marginRight: settings.oneHandedMode && settings.oneHandedSide === 'left' ? 'auto' : 0,
     contain: 'strict', // Hardware acceleration hint
     // Apply dynamic styles if provided by generator
     ...(styles.inline?.keyboardBg || {})
  };
  
  if (settings.oneHandedMode) {
      containerStyle.width = '85%';
  }

  // Material Chip styles
  const chipClass = settings.theme === 'Material3' || settings.theme === 'Dynamic'
     ? 'text-[#1D192B] border border-transparent rounded-full px-4 py-1.5 font-medium shadow-sm transition-colors cursor-context-menu select-none active:bg-red-100'
     : `flex-1 py-2 px-4 rounded-lg text-sm font-medium shadow-sm transition-colors whitespace-nowrap cursor-context-menu select-none ${settings.theme === 'Light' ? 'bg-white hover:bg-gray-50 text-gray-800 active:bg-red-50' : 'bg-[#333] hover:bg-[#444] text-gray-200 active:bg-red-900/30'}`;
  
  const dynamicChipStyle = settings.theme === 'Dynamic' ? {
      backgroundColor: styles.inline?.keyFunc?.backgroundColor,
      color: 'white'
  } : settings.theme === 'Material3' ? { backgroundColor: '#E8DEF8' } : {};


  // --- Split Layout Rendering Helper ---
  const renderRow = (row: KeyDefinition[], rowIndex: number) => {
      // If NOT split, render normal row
      if (!settings.splitLayout) {
          return (
            <div key={rowIndex} className="keyboard-row flex-1">
                {row.map((keyDef) => (
                    <Key 
                        key={keyDef.id} 
                        def={keyDef}
                        onPress={(val) => isButtonEditMode ? null : onKeyPress(val)}
                        onSpecialPress={(id) => isButtonEditMode ? null : handleKeyPress({ ...keyDef, type: KeyType.FUNCTION, id } as any)}
                        hapticEnabled={settings.hapticFeedback}
                        theme={settings.theme}
                        textSizeClass={isButtonEditMode ? 'text-sm' : undefined}
                        customScale={settings.customKeySizes[keyDef.id] || 1.0}
                        isEditMode={isButtonEditMode}
                        isSelected={selectedKeyId === keyDef.id}
                        onSelect={setSelectedKeyId}
                        animationsEnabled={settings.buttonAnimations}
                        animationSpeed={settings.animationSpeed}
                        onEnterButtonEditMode={handleEnterButtonEditMode}
                    />
                ))}
            </div>
          );
      }

      // Split Logic
      const mid = Math.ceil(row.length / 2);
      const leftKeys = row.slice(0, mid);
      const rightKeys = row.slice(mid);

      // Handle Spacebar splitting specially if it's the space row
      const hasSpace = row.find(k => k.id === 'space');
      
      if (hasSpace) {
          const leftSpace = { ...hasSpace, id: 'space_l', label: 'Space', width: 2 };
          const rightSpace = { ...hasSpace, id: 'space_r', label: 'Space', width: 2 };
          
          const leftBottom = row.filter(k => k.id !== 'space' && k.id !== 'enter' && k.id !== 'period' && k.id !== 'comma'); // 123, Globe
          const rightBottom = row.filter(k => k.id === 'period' || k.id === 'comma' || k.id === 'enter');

          return (
            <div key={rowIndex} className="flex flex-1 gap-8">
                <div className="flex-1 flex gap-1">
                    {leftBottom.map(k => <Key key={k.id} def={k} onPress={onKeyPress} onSpecialPress={(id) => handleKeyPress({...k, id} as any)} theme={settings.theme} hapticEnabled={settings.hapticFeedback} />)}
                    <Key def={leftSpace} onPress={onKeyPress} onSpecialPress={()=>{}} theme={settings.theme} hapticEnabled={settings.hapticFeedback} />
                </div>
                <div className="flex-1 flex gap-1">
                    <Key def={rightSpace} onPress={onKeyPress} onSpecialPress={()=>{}} theme={settings.theme} hapticEnabled={settings.hapticFeedback} />
                    {rightBottom.map(k => <Key key={k.id} def={k} onPress={onKeyPress} onSpecialPress={(id) => handleKeyPress({...k, id} as any)} theme={settings.theme} hapticEnabled={settings.hapticFeedback} />)}
                </div>
            </div>
          );
      }

      return (
        <div key={rowIndex} className="flex flex-1 gap-8">
            <div className="flex-1 flex justify-end gap-1">
                {leftKeys.map((keyDef) => (
                    <Key 
                        key={keyDef.id} 
                        def={keyDef}
                        onPress={(val) => isButtonEditMode ? null : onKeyPress(val)}
                        onSpecialPress={(id) => isButtonEditMode ? null : handleKeyPress({ ...keyDef, type: KeyType.FUNCTION, id } as any)}
                        hapticEnabled={settings.hapticFeedback}
                        theme={settings.theme}
                        customScale={settings.customKeySizes[keyDef.id] || 1.0}
                        animationsEnabled={settings.buttonAnimations}
                    />
                ))}
            </div>
            <div className="flex-1 flex justify-start gap-1">
                {rightKeys.map((keyDef) => (
                    <Key 
                        key={keyDef.id} 
                        def={keyDef}
                        onPress={(val) => isButtonEditMode ? null : onKeyPress(val)}
                        onSpecialPress={(id) => isButtonEditMode ? null : handleKeyPress({ ...keyDef, type: KeyType.FUNCTION, id } as any)}
                        hapticEnabled={settings.hapticFeedback}
                        theme={settings.theme}
                        customScale={settings.customKeySizes[keyDef.id] || 1.0}
                        animationsEnabled={settings.buttonAnimations}
                    />
                ))}
            </div>
        </div>
      );
  };

  return (
    <div className={`virtual-keyboard ${settings.theme === 'Dynamic' ? '' : styles.keyboardBg} w-full transition-all duration-300 ease-out ${containerShapeClass}`} ref={containerRef}
         style={settings.theme === 'Dynamic' ? styles.inline?.keyboardBg : undefined}>
      
      {/* --- Resize Mode Header --- */}
      {isResizeMode && (
         <div 
           className="w-full h-8 mb-2 rounded-lg cursor-row-resize flex items-center justify-center relative"
           style={{ background: `linear-gradient(to top, ${RESIZE_UI_COLORS.handleText}, transparent)` }}
           onMouseDown={(e) => { resizeStartY.current = e.clientY; resizeStartHeight.current = settings.keyboardHeight; }}
         >
           <GripHorizontal className="text-white" />
           <div className="absolute right-2 top-0 bottom-0 flex items-center">
              <button onClick={onExitResize} className="p-1 bg-green-500 rounded text-white"><Check size={16} /></button>
           </div>
         </div>
      )}

      {/* --- Button Edit Mode / Settings UI --- */}
      {isButtonEditMode && (
          <div className="keyboard-controls">
             <div className="profiles-section">
                <h3>Saved Profiles</h3>
                <div className="profiles-list">
                    {renderSavedProfiles()}
                </div>
             </div>
             <div className="size-controls">
                <h3>Global Controls</h3>
                <div className="size-buttons">
                    <button className="size-btn reset" onClick={handleResetAll}>Reset All</button>
                    <button className="size-btn decrease" onClick={onExitButtonEditMode}>Done</button>
                </div>
             </div>
          </div>
      )}

      {/* --- Suggestions Chip Group (Material Chip) --- */}
      {predictions.length > 0 && !isButtonEditMode && !isResizeMode && (
         <div className="flex gap-2 px-4 py-2 mb-2 overflow-x-auto items-center no-scrollbar animate-suggestion-appear">
             {predictions.map((word, idx) => (
                 <button 
                   key={idx} 
                   onClick={() => onKeyPress(word + ' ')}
                   onContextMenu={(e) => {
                       e.preventDefault();
                       if (onRemoveSuggestion) onRemoveSuggestion(word);
                   }}
                   className={chipClass}
                   style={dynamicChipStyle}
                   title="Right-click/Long-press to remove"
                 >
                     {word}
                 </button>
             ))}
         </div>
      )}

      {/* --- Main Keyboard Area (ConstraintLayout Simulation) --- */}
      <div className="relative flex flex-col h-full">
          {/* Key animate-layout-enter triggers animation when layout mode changes */}
          <div className="flex flex-1 animate-layout-enter" style={containerStyle} key={settings.drivingMode ? 'driving' : isEmojiMode ? 'emoji' : isSymbolMode ? 'symbol' : 'main'}>
                {/* Left Gutter (One-Handed) */}
                {settings.oneHandedMode && settings.oneHandedSide === 'right' && (
                    <div className="w-[15%] flex flex-col gap-2 items-center justify-center bg-black/10 rounded-l-lg">
                        <button onClick={onSwitchOneHandedSide} className="p-3 bg-white/10 rounded-full"><ArrowLeftRight size={20} /></button>
                        <button onClick={onToggleOneHanded} className="p-3 bg-white/10 rounded-full"><Maximize2 size={20} /></button>
                    </div>
                )}

                {/* Keys Container */}
                <div 
                    className="keyboard-main flex-1 relative flex flex-col"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {settings.traceTyping && <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50" />}
                    
                    {layout.map((row, rowIndex) => renderRow(row, rowIndex))}
                </div>

                {/* Right Gutter (One-Handed) */}
                {settings.oneHandedMode && settings.oneHandedSide === 'left' && (
                    <div className="w-[15%] flex flex-col gap-2 items-center justify-center bg-black/10 rounded-r-lg">
                        <button onClick={onSwitchOneHandedSide} className="p-3 bg-white/10 rounded-full"><ArrowLeftRight size={20} /></button>
                        <button onClick={onToggleOneHanded} className="p-3 bg-white/10 rounded-full"><Maximize2 size={20} /></button>
                    </div>
                )}
          </div>
      </div>

      {/* --- Edit Mode Selected Key Controls --- */}
      {isButtonEditMode && selectedKeyId && (
         <div className="mt-4 p-3 bg-white/10 rounded-lg flex items-center justify-between">
             <span className="text-sm font-bold">{selectedKeyId}</span>
             <div className="flex gap-2">
                 <button 
                    onClick={() => {
                        if (onUpdateKeySize) {
                            const current = settings.customKeySizes[selectedKeyId] || 1.0;
                            const min = settings.minButtonScale ?? 0.5;
                            const next = Math.max(min, Number((current - 0.1).toFixed(1)));
                            onUpdateKeySize(selectedKeyId, next);
                        }
                    }} 
                    className="p-2 bg-red-500/20 text-red-500 rounded"
                 >
                     -
                 </button>
                 <span className="p-2">{Math.round((settings.customKeySizes[selectedKeyId] || 1.0) * 100)}%</span>
                 <button 
                    onClick={() => {
                        if (onUpdateKeySize) {
                            const current = settings.customKeySizes[selectedKeyId] || 1.0;
                            const max = settings.maxButtonScale ?? 2.0;
                            const next = Math.min(max, Number((current + 0.1).toFixed(1)));
                            onUpdateKeySize(selectedKeyId, next);
                        }
                    }} 
                    className="p-2 bg-green-500/20 text-green-500 rounded"
                 >
                     +
                 </button>
             </div>
         </div>
      )}

      {/* --- Customization Info Footer --- */}
      {isButtonEditMode && (
        <div className="customization-info">
            <div className="info-item">
            <span className="info-label">Active Profile</span>
            <span className="info-value">Custom</span>
            </div>
            <div className="info-item">
            <span className="info-label">Customized Keys</span>
            <span className="info-value">{Object.keys(settings.customKeySizes).length}</span>
            </div>
            <div className="info-item">
            <span className="info-label">Global Scale</span>
            <span className="info-value">1.0x</span>
            </div>
        </div>
      )}
    </div>
  );
};
