
import { insertWord, getPredictions } from './dbService';

// Basic keyword-to-emoji map for immediate feedback
// Covers both English and Arabic common sentiment words
const EMOJI_MAP: Record<string, string[]> = {
  // English
  'happy': ['😊', '🎉', '🌟'],
  'joy': ['😂', '😁', '✨'],
  'sad': ['😢', '☹️', '🌧️'],
  'cry': ['😭', '💔', '💧'],
  'love': ['❤️', '😍', '💕'],
  'like': ['👍', '👌', '🔥'],
  'cool': ['😎', '❄️', '👍'],
  'fire': ['🔥', '⚡', '🧨'],
  'food': ['🍔', '🍕', '🌮'],
  'coffee': ['☕', '🍵', '🥐'],
  'yes': ['✅', '👍', '🙌'],
  'no': ['❌', '🚫', '👎'],
  'party': ['🎉', '🥳', '🎈'],
  
  // Arabic
  'سعيد': ['😊', '🎉', '🌟'],
  'فرح': ['😂', '😁', '✨'],
  'حزين': ['😢', '☹️', '🌧️'],
  'يبكي': ['😭', '💔', '💧'],
  'حب': ['❤️', '😍', '💕'],
  'احب': ['❤️', '😍', '💕'],
  'ممتاز': ['👍', '👌', '🔥'],
  'رائع': ['😎', '✨', '👍'],
  'نار': ['🔥', '⚡', '🧨'],
  'اكل': ['🍔', '🍕', '🌮'],
  'قهوة': ['☕', '🍵', '🥐'],
  'نعم': ['✅', '👍', '🙌'],
  'لا': ['❌', '🚫', '👎'],
  'مبروك': ['🎉', '🥳', '🎈'],
  'شكرا': ['🙏', '🌹', '✨'],
  'مرحبا': ['👋', '🤝', '✨']
};

/**
 * Learns from the user's typing patterns by updating the IndexedDB.
 * This is skipped if Incognito Mode is active.
 */
export const learnFromUser = async (text: string, isIncognito: boolean, language: string = 'EN') => {
  if (isIncognito || !text.trim()) return;

  const words = text.trim().split(/\s+/);

  for (const word of words) {
    // Clean word: remove punctuation but keep letters (including Arabic) and numbers
    const cleanWord = word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    
    if (cleanWord.length > 1) {
      await insertWord(cleanWord, language);
    }
  }
};

/**
 * Returns predictive words based on user history from IndexedDB.
 */
export const getPersonalizedPredictions = async (currentInput: string, language: string = 'EN'): Promise<string[]> => {
  if (!currentInput.trim()) return [];
  
  const words = currentInput.trim().split(/\s+/);
  // Get the partial word currently being typed
  const lastWord = words[words.length - 1].toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  
  if (!lastWord) return [];

  return await getPredictions(lastWord, language);
};

/**
 * Scans text for sentiment keywords and returns relevant emojis.
 */
export const suggestEmojisBasedOnText = (text: string): string[] => {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  // Check mostly the last few words for context
  const recentContext = words.slice(-5).join(' '); 
  
  const foundEmojis: Set<string> = new Set();

  // Check against map
  Object.keys(EMOJI_MAP).forEach(keyword => {
    if (recentContext.includes(keyword)) {
      EMOJI_MAP[keyword].forEach(e => foundEmojis.add(e));
    }
  });

  return Array.from(foundEmojis).slice(0, 4);
};
