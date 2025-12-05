
import { SizeType } from './sizeManager';

interface AppSizeData {
  sizeType: SizeType;
  heightPercent: number;
  widthPercent: number;
}

const STORAGE_KEY = 'gemkey_app_specific_sizes';
const CURRENT_APP_PKG = 'com.gemkey.web'; // Simulating the current app package name

/**
 * Saves the keyboard size configuration for a specific app context.
 */
export const saveSizeForApp = (packageName: string = CURRENT_APP_PKG, sizeType: SizeType, heightPercent: number, widthPercent: number) => {
  try {
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    store[packageName] = { sizeType, heightPercent, widthPercent };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    console.log(`[AppSpecificSizeManager] Saved size for ${packageName}:`, sizeType);
  } catch (e) {
    console.error("Failed to save app specific size", e);
  }
};

/**
 * Loads the keyboard size configuration for a specific app context.
 */
export const loadSizeForApp = (packageName: string = CURRENT_APP_PKG): AppSizeData | null => {
  try {
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return store[packageName] || null;
  } catch (e) {
    return null;
  }
};
