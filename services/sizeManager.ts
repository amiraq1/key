
import { KeyboardSettings } from '../types';

export type SizeType = 'small' | 'medium' | 'large' | 'full' | 'custom';

export const SIZE_PRESETS = {
  small: 0.25,   // 25% of screen height
  medium: 0.35,  // 35% of screen height
  large: 0.45,   // 45% of screen height
  full: 0.60     // 60% of screen height
};

export const DEFAULT_WIDTH_PERCENTAGE = 1.0; // 100% width

export const MIN_HEIGHT_PERCENT = 0.15;
export const MAX_HEIGHT_PERCENT = 0.60;
export const MIN_WIDTH_PERCENT = 0.80;
export const MAX_WIDTH_PERCENT = 1.0;

export const calculateDimensions = (
  heightPercentage: number, 
  widthPercentage: number
): { height: number, width: number } => {
  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;

  return {
    height: Math.floor(screenHeight * heightPercentage),
    width: Math.floor(screenWidth * widthPercentage)
  };
};

export const getTextSizeClass = (sizeType: SizeType): string => {
  switch (sizeType) {
    case 'small': return 'text-base';
    case 'medium': return 'text-xl';
    case 'large': return 'text-2xl';
    case 'full': return 'text-3xl';
    case 'custom': return 'text-xl';
    default: return 'text-xl';
  }
};

export const getSizeTypeFromHeight = (heightPx: number): SizeType => {
  const h = window.innerHeight;
  const ratio = heightPx / h;

  // Simple proximity check
  if (Math.abs(ratio - SIZE_PRESETS.small) < 0.05) return 'small';
  if (Math.abs(ratio - SIZE_PRESETS.medium) < 0.05) return 'medium';
  if (Math.abs(ratio - SIZE_PRESETS.large) < 0.05) return 'large';
  if (Math.abs(ratio - SIZE_PRESETS.full) < 0.05) return 'full';
  
  return 'custom';
};
