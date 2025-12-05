
import React, { useState, useEffect, useRef } from 'react';
import { KeyDefinition, KeyType, Theme, AnimationSpeed } from '../types';
import { THEME_STYLES, SHAPE_STYLES, TYPOGRAPHY_STYLES } from '../constants';
import { layoutOptimizer } from '../services/layoutOptimizer';

interface KeyProps {
  def: KeyDefinition;
  onPress: (val: string) => void;
  onSpecialPress: (id: string) => void;
  hapticEnabled?: boolean;
  theme: Theme;
  textSizeClass?: string;
  customScale?: number;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  animationsEnabled?: boolean;
  animationSpeed?: AnimationSpeed;
  onEnterButtonEditMode?: () => void;
}

export const Key: React.FC<KeyProps> = React.memo(({ 
  def, 
  onPress, 
  onSpecialPress, 
  hapticEnabled = true, 
  theme, 
  textSizeClass = 'text-xl',
  customScale = 1.0,
  isEditMode = false,
  isSelected = false,
  onSelect,
  animationsEnabled = true,
  animationSpeed = 'normal',
  onEnterButtonEditMode
}) => {
  const [isActive, setIsActive] = useState(false);
  const styles = THEME_STYLES[theme] || THEME_STYLES['Dark'];
  
  // Continuous Backspace & Long Press Logic
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  // Trigger vibration if enabled
  const triggerHaptic = () => {
    if (hapticEnabled && navigator.vibrate) {
      navigator.vibrate(10); // Short, sharp vibration
    }
  };

  const handlePressAction = () => {
    triggerHaptic();
    if (def.type === KeyType.CHARACTER) {
      onPress(def.value || def.label);
    } else if (def.type === KeyType.FUNCTION) {
      onSpecialPress(def.id);
    }
  };

  const handleStart = (e: React.SyntheticEvent) => {
    if (isEditMode) {
       e.preventDefault();
       if (onSelect) onSelect(def.id);
       return;
    }
    
    // Prevent default to stop focus stealing, but allow touch actions
    if (e.type === 'mousedown') e.preventDefault();
    
    setIsActive(true);
    handlePressAction();

    // Continuous backspace support
    if (def.id === 'backspace') {
      // Clear any existing timers
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Start delay before rapid delete
      timerRef.current = window.setTimeout(() => {
        intervalRef.current = window.setInterval(() => {
          triggerHaptic();
          onSpecialPress(def.id);
        }, 50); // 50ms interval for rapid delete
      }, 400); // 400ms delay before start
    }

    // Long Press for Button Edit Mode
    if (!isEditMode && onEnterButtonEditMode) {
        longPressTimerRef.current = window.setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50); // Distinct haptic
            onEnterButtonEditMode();
            if (onSelect) onSelect(def.id); // Auto-select this key
        }, 600); // 600ms hold
    }
  };

  const handleEnd = () => {
    setIsActive(false);
    
    // Clear backspace timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Clear long press timer
    if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  // Use LayoutOptimizer to get cached style object
  // This ensures stable reference for React.memo
  const flexStyle = layoutOptimizer.getFlexStyle(def.width || 1, customScale);

  if (def.type === KeyType.SPACER) {
    return <div style={flexStyle} className="h-full" />;
  }

  // Calculate duration class
  let durationClass = 'duration-150'; // normal
  if (!animationsEnabled) durationClass = 'duration-0';
  else if (animationSpeed === 'slow') durationClass = 'duration-300';
  else if (animationSpeed === 'fast') durationClass = 'duration-75';

  // Base styles: relative positioning for ripple containment
  // active:scale-95 simulates the "press" physical movement, typical of Material Buttons
  const baseClasses = `
    relative w-full h-full flex items-center justify-center 
    font-medium transition-all ${durationClass} select-none overflow-hidden
    ${TYPOGRAPHY_STYLES.keyLabel} ${textSizeClass}
    active:scale-95 transform-gpu
    will-change-transform contain-content
  `;
  
  // Shape determination
  let shapeClass = SHAPE_STYLES.key;
  if (def.id === 'space' || def.id === 'enter') shapeClass = SHAPE_STYLES.keyLarge;
  else if (def.id === 'shift' || def.id === 'backspace') shapeClass = SHAPE_STYLES.keySpecial;

  // Edit mode styles
  const editModeClasses = isEditMode 
      ? `border-2 border-dashed ${isSelected ? 'border-yellow-400 bg-yellow-900/40 z-50' : 'border-gray-500 hover:bg-white/10'}`
      : '';

  // Determine animation style
  const pressAnimation = isActive && animationsEnabled ? 'animate-key-press' : '';

  return (
    <div 
      className={`relative h-full mx-[2px] mb-1.5 flex justify-center items-end transition-all ${durationClass}`}
      style={flexStyle}
    >
      {/* Key Preview Bubble (Android "keyPreviewLayout") */}
      {isActive && !isEditMode && def.type === KeyType.CHARACTER && (
        <div className="absolute -top-[70px] left-1/2 transform -translate-x-1/2 z-50 pointer-events-none drop-shadow-2xl animate-suggestion-appear">
           <div className="relative flex flex-col items-center">
              <div className={`w-16 h-20 rounded-lg flex items-center justify-center text-4xl font-bold shadow-2xl ${styles.preview}`}>
                {def.label}
              </div>
              {/* Arrow pointer */}
              <div className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] mt-[-1px]`} 
                   style={{ borderTopColor: theme === 'Custom' ? 'black' : (theme === 'Dark' ? '#454545' : styles.preview.split(' ')[0].replace('bg-', '')) }}></div>
           </div>
        </div>
      )}

      {/* Selection Indicator (Edit Mode) */}
      {isEditMode && isSelected && (
         <div className="absolute -top-3 -right-3 z-50 bg-yellow-400 text-black w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
         </div>
      )}

      <button
        className={`
          ${baseClasses}
          ${shapeClass}
          ${def.type === KeyType.FUNCTION ? styles.keyFunc : styles.keyChar}
          ${isActive ? styles.keyActive : ''}
          ${editModeClasses}
          ${pressAnimation}
          key-element
          group
        `}
        data-key-value={def.type === KeyType.CHARACTER ? (def.value || def.label) : undefined}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onContextMenu={(e) => { e.preventDefault(); if (onEnterButtonEditMode && !isEditMode) onEnterButtonEditMode(); }}
        type="button"
        aria-label={def.label}
      >
        {/* Content Z-Index to stay above ripple */}
        <span className="relative z-10">{def.icon ? def.icon : def.label}</span>
        
        {/* Material Ripple Overlay (State Layer) */}
        {!isEditMode && (
          <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
             {/* State Layer: Hover 8%, Focus/Press 12% */}
             <span className="absolute inset-0 bg-current opacity-0 group-hover:opacity-[0.08] group-active:opacity-[0.12] transition-opacity duration-200" />
          </span>
        )}
      </button>
    </div>
  );
});
