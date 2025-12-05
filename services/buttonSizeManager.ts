
import { KEYBOARD_LAYOUT_ARABIC, KEYBOARD_LAYOUT_LOWER } from '../constants';

const SIZES_STORAGE_KEY = 'gemkey_button_sizes';
const PROFILES_STORAGE_KEY = 'gemkey_size_profiles';

export type KeySizeMap = Record<string, number>;

export const PRESET_PROFILES: Record<string, KeySizeMap> = {
  'Large Touch': {
    'space': 1.3,
    'enter': 1.3,
    'backspace': 1.3,
    'shift': 1.3
  },
  'Fast Typing': {
    'space': 0.9,
    'enter': 0.9,
    'backspace': 0.9
  },
  'Arabic Focus': {
    'alef': 1.2,
    'lam': 1.2,
    'meem': 1.2,
    'noon': 1.2,
    'yeh': 1.2,
    'teh_marbuta': 1.2
  },
  'Gaming (WASD)': {
    'w': 1.3,
    'a': 1.3,
    's': 1.3,
    'd': 1.3,
    'space': 1.5
  }
};

/**
 * Saves current button sizes to local storage.
 */
export const saveButtonSizes = (sizes: KeySizeMap) => {
  try {
    localStorage.setItem(SIZES_STORAGE_KEY, JSON.stringify(sizes));
  } catch (e) {
    console.error("Failed to save button sizes", e);
  }
};

/**
 * Loads button sizes from local storage.
 */
export const loadButtonSizes = (): KeySizeMap => {
  try {
    return JSON.parse(localStorage.getItem(SIZES_STORAGE_KEY) || '{}');
  } catch (e) {
    return {};
  }
};

/**
 * Helper: Save a single button size.
 */
export const saveButtonSize = (key: string, size: number) => {
  const sizes = loadButtonSizes();
  sizes[key] = size;
  saveButtonSizes(sizes);
};

/**
 * Helper: Get a single button size.
 */
export const getButtonSize = (key: string): number => {
  const sizes = loadButtonSizes();
  return sizes[key] || 1.0;
};

/**
 * Helper: Reset all sizes.
 */
export const resetAllSizes = () => {
  localStorage.removeItem(SIZES_STORAGE_KEY);
};

/**
 * Saves a named profile.
 */
export const saveProfile = (name: string, sizes: KeySizeMap) => {
  try {
    const profiles = getSavedProfilesMap();
    profiles[name] = sizes;
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error("Failed to save profile", e);
  }
};

/**
 * Gets all saved profiles.
 */
export const getSavedProfilesMap = (): Record<string, KeySizeMap> => {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
  } catch (e) {
    return {};
  }
};

/**
 * Loads a profile into the active configuration.
 */
export const handleLoadProfile = (name: string) => {
    // Check presets
    if (PRESET_PROFILES[name]) {
        saveButtonSizes(PRESET_PROFILES[name]);
        return;
    }
    // Check saved
    const profiles = getSavedProfilesMap();
    if (profiles[name]) {
        saveButtonSizes(profiles[name]);
    }
};

/**
 * Deletes a profile.
 */
export const deleteProfile = (name: string) => {
  try {
    const profiles = getSavedProfilesMap();
    delete profiles[name];
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error("Failed to delete profile", e);
  }
};

// --- Backup & Restore ---

export const createBackup = (): string => {
  const backupData = {
    sizes: loadButtonSizes(),
    profiles: getSavedProfilesMap(),
    timestamp: Date.now(),
    version: '1.0'
  };
  return JSON.stringify(backupData, null, 2);
};

export const downloadBackup = () => {
  const json = createBackup();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `gemkey_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const restoreBackup = (json: string): boolean => {
  try {
    const data = JSON.parse(json);
    if (data.sizes) saveButtonSizes(data.sizes);
    if (data.profiles) localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(data.profiles));
    return true;
  } catch (e) {
    console.error("Invalid backup file", e);
    return false;
  }
};
