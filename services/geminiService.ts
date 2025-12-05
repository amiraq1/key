
import { GoogleGenAI } from "@google/genai";
import { ToneType, SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { getCachedTranslation, cacheTranslation } from './dbService';
import { logTranslation } from './analyticsService';

let genAI: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.warn("API_KEY not found in environment variables.");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI", error);
}

const MODEL_NAME = 'gemini-2.5-flash';
const FALLBACK_API_BASE = "https://api.mymemory.translated.net/get";

export const completeText = async (currentText: string): Promise<string> => {
  if (!genAI || !currentText.trim()) return "";
  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: `You are a helpful writing assistant. Complete the following sentence or paragraph naturally. 
      Only provide the completion, starting from where the user left off. Do not repeat the user's text.
      Keep it brief (max 2 sentences).
      
      User text: "${currentText}"`,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error completing text:", error);
    throw error;
  }
};

export const fixGrammar = async (text: string): Promise<string> => {
  if (!genAI || !text.trim()) return text;
  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: `Correct the grammar and spelling of the following text. Return ONLY the corrected text.
      
      Text: "${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Error fixing grammar:", error);
    throw error;
  }
};

export const changeTone = async (text: string, tone: ToneType): Promise<string> => {
  if (!genAI || !text.trim()) return text;
  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: `Rewrite the following text to have a ${tone} tone. Return ONLY the rewritten text.
      
      Text: "${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Error changing tone:", error);
    throw error;
  }
};

export const decipherSwipe = async (swipePath: string, context: string, language: string): Promise<string> => {
  if (!genAI || !swipePath.trim()) return "";
  try {
    if (swipePath.length < 3) return swipePath;
    const langName = language === 'AR' ? 'Arabic' : 'English';
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: `The user is using a gesture typing keyboard.
      Trace: "${swipePath}". Context: "${context}". Language: ${langName}.
      Return ONLY the single most likely word.`,
    });
    return response.text?.trim().split(' ')[0] || "";
  } catch (error) {
    return [...new Set(swipePath.split(''))].join('');
  }
};

export const detectLanguage = async (text: string): Promise<string> => {
  if (!genAI || !text.trim()) return "unknown";
  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: `Identify the language of the following text. Return ONLY the 2-letter ISO code.
      Text: "${text}"`,
    });
    return response.text?.trim().toLowerCase().slice(0, 2) || "unknown";
  } catch (error) {
    return "unknown";
  }
};

const fallbackTranslate = async (text: string, source: string, target: string): Promise<string> => {
  try {
    const src = source === 'auto' ? 'Autodetect' : source;
    const langpair = `${src}|${target}`;
    const url = new URL(FALLBACK_API_BASE);
    url.searchParams.append("q", text);
    url.searchParams.append("langpair", langpair);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Fallback API error: ${response.status}`);
    const data = await response.json();
    return data.responseData?.translatedText || text;
  } catch (error) {
    throw error;
  }
};

interface TranslateOptions {
  useCache?: boolean;
  isOffline?: boolean;
}

/**
 * Translates text with caching and offline support.
 */
export const translateText = async (
  text: string, 
  sourceLang: SupportedLanguage = 'auto', 
  targetLang: SupportedLanguage = 'en',
  options: TranslateOptions = {}
): Promise<string> => {
  if (!text.trim()) return text;
  
  const startTime = Date.now();
  const { useCache = false, isOffline = false } = options;

  // 1. Check Cache
  if (useCache || isOffline) {
    const cached = await getCachedTranslation(text, sourceLang, targetLang);
    if (cached) {
      logTranslation(sourceLang, targetLang, text.length, Date.now() - startTime, 'cache');
      return cached;
    }
    
    // If offline and not in cache, we can't do much
    if (isOffline) {
       logTranslation(sourceLang, targetLang, text.length, Date.now() - startTime, 'offline');
       return text + " [OFFLINE]";
    }
  }

  // 2. Try Gemini
  let result = "";
  let method: 'gemini' | 'fallback' = 'gemini';

  if (genAI) {
    try {
      const sourceLabel = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)?.label || 'Auto-Detect';
      const targetLabel = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.label || 'English';

      const prompt = sourceLang === 'auto' 
        ? `Translate into ${targetLabel}. Auto-detect source. Return ONLY text.`
        : `Translate from ${sourceLabel} to ${targetLabel}. Return ONLY text.`;

      const response = await genAI.models.generateContent({
        model: MODEL_NAME,
        contents: `${prompt} Text: "${text}"`,
      });
      result = response.text?.trim() || "";
    } catch (geminiError) {
      console.warn("Gemini translation failed.", geminiError);
    }
  }

  // 3. Fallback
  if (!result) {
    try {
      method = 'fallback';
      result = await fallbackTranslate(text, sourceLang, targetLang);
    } catch (fallbackError) {
      console.error("All translation services failed.");
      return text;
    }
  }

  // 4. Cache Result & Log
  if (result && result !== text) {
    if (useCache) {
      await cacheTranslation(text, result, sourceLang, targetLang);
    }
    logTranslation(sourceLang, targetLang, text.length, Date.now() - startTime, method);
  }

  return result;
};

export const extractTextFromImage = async (base64Data: string, mimeType: string): Promise<string> => {
  if (!genAI || !base64Data) return "";
  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Extract all legible text. Return ONLY the text." }
        ]
      }
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw error;
  }
};
