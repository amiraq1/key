
import React from 'react';

export enum KeyType {
  CHARACTER = 'CHARACTER',
  FUNCTION = 'FUNCTION', // Shift, Backspace, Enter, Globe, Mic, Settings
  SPACER = 'SPACER'
}

export interface KeyDefinition {
  id: string;
  label: string;
  value?: string; // The actual character to insert
  type: KeyType;
  width?: number; // Relative width (1 is standard key)
  icon?: React.ReactNode;
}

export type KeyboardRow = KeyDefinition[];

export interface AIState {
  isLoading: boolean;
  error: string | null;
  suggestion: string | null;
}

export enum ToneType {
  PROFESSIONAL = 'Professional',
  CASUAL = 'Casual',
  POETIC = 'Poetic',
  CONCISE = 'Concise'
}

export type Theme = 'Dark' | 'Light' | 'Blue' | 'Green' | 'Custom' | 'Material3' | 'Dynamic' | 'Auto';

export type SupportedLanguage = 'auto' | 'ar' | 'en' | 'fr' | 'es' | 'de' | 'ru' | 'tr' | 'fa' | 'ur' | 'hi';

export type SizeType = 'small' | 'medium' | 'large' | 'full' | 'custom';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
}

export interface KeyboardSettings {
  hapticFeedback: boolean;
  soundEnabled: boolean;
  language: 'EN' | 'AR';
  traceTyping: boolean;
  incognitoMode: boolean;
  encryptKeystrokes: boolean;
  theme: Theme;
  drivingMode: boolean;
  
  // Size Management
  keyboardHeight: number; // in pixels
  keyboardWidth: number;  // percentage 0.0 - 1.0
  sizeType: SizeType;
  showResizeHandle: boolean;
  showQuickControls: boolean;
  autoAdjustSize: boolean;
  customKeySizes: Record<string, number>; // keyId -> scale factor (e.g. 1.0, 1.2, 0.8)
  
  // Foldable Support
  splitLayout: boolean; // For foldable/tablet devices
  
  // Advanced Button Size Settings
  minButtonScale: number;
  maxButtonScale: number;
  buttonAnimations: boolean;
  animationSpeed: AnimationSpeed;

  // Cloud Sync (Google Drive)
  googleUser: GoogleUser | null;
  cloudSyncEnabled: boolean;
  lastCloudSync: number | null;

  // One-Handed Mode
  oneHandedMode: boolean;
  oneHandedSide: 'left' | 'right';

  // Translation Settings
  translationSource: SupportedLanguage;
  translationTarget: SupportedLanguage;
  realTimeTranslation: boolean;
  autoDetectLanguage: boolean;
  offlineMode: boolean;
  cacheTranslations: boolean;

  // Dynamic Color (Material You)
  dynamicColorSeed: string; // Hex color

  // Debugging & Monitoring
  showDebugOverlay: boolean;
}