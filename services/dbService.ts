
export interface WordEntity {
  id?: number;
  word: string;
  frequency: number;
  language: string;
}

export interface TranslationEntity {
  id?: number;
  source: string;
  target: string;
  original: string;
  translated: string;
  timestamp: number;
}

export interface ClipboardEntity {
  id?: number;
  text: string;
  timestamp: number;
  isPinned: boolean;
}

const DB_NAME = 'gemkey_db';
const STORE_WORDS = 'words';
const STORE_TRANSLATIONS = 'translations';
const STORE_CLIPBOARD = 'clipboard';
const VERSION = 3; // Upgraded version for clipboard store

/**
 * Opens and upgrades the IndexedDB instance.
 */
const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      
      // Store 1: Words (for predictions)
      if (!db.objectStoreNames.contains(STORE_WORDS)) {
        const store = db.createObjectStore(STORE_WORDS, { keyPath: 'id', autoIncrement: true });
        store.createIndex('lang_word', ['language', 'word'], { unique: true });
      }

      // Store 2: Translations (for cache)
      if (!db.objectStoreNames.contains(STORE_TRANSLATIONS)) {
        const tStore = db.createObjectStore(STORE_TRANSLATIONS, { keyPath: 'id', autoIncrement: true });
        tStore.createIndex('lookup', ['source', 'target', 'original'], { unique: true });
      }

      // Store 3: Clipboard History
      if (!db.objectStoreNames.contains(STORE_CLIPBOARD)) {
        const cStore = db.createObjectStore(STORE_CLIPBOARD, { keyPath: 'id', autoIncrement: true });
        cStore.createIndex('text', 'text', { unique: true }); // Prevent exact duplicates
        cStore.createIndex('timestamp', 'timestamp');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- Word / Prediction Logic ---

export const insertWord = async (word: string, language: string) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_WORDS, 'readwrite');
    const store = tx.objectStore(STORE_WORDS);
    const index = store.index('lang_word');

    return new Promise<void>((resolve, reject) => {
      const getReq = index.get([language, word]);

      getReq.onsuccess = () => {
        const existing: WordEntity = getReq.result;
        if (existing) {
          existing.frequency += 1;
          store.put(existing);
        } else {
          store.add({ word, language, frequency: 1 });
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (error) {
    console.error("DB Error inserting word:", error);
  }
};

export const getPredictions = async (prefix: string, language: string): Promise<string[]> => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_WORDS, 'readonly');
    const store = tx.objectStore(STORE_WORDS);
    const index = store.index('lang_word');
    
    const lower = [language, prefix];
    const upper = [language, prefix + '\uffff'];
    const range = IDBKeyRange.bound(lower, upper);

    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      const results: WordEntity[] = [];
      
      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          const topWords = results
            .filter(w => w.word.toLowerCase() !== prefix.toLowerCase())
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5)
            .map(w => w.word);
          resolve(topWords);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("DB Error getting predictions:", error);
    return [];
  }
};

// --- Translation Cache Logic ---

export const getCachedTranslation = async (original: string, source: string, target: string): Promise<string | null> => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_TRANSLATIONS, 'readonly');
    const index = tx.objectStore(STORE_TRANSLATIONS).index('lookup');
    
    return new Promise((resolve) => {
      // Normalize input
      const req = index.get([source, target, original.trim()]);
      req.onsuccess = () => {
        const res: TranslationEntity = req.result;
        resolve(res ? res.translated : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

export const cacheTranslation = async (original: string, translated: string, source: string, target: string) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_TRANSLATIONS, 'readwrite');
    const store = tx.objectStore(STORE_TRANSLATIONS);
    
    store.add({
      source,
      target,
      original: original.trim(),
      translated,
      timestamp: Date.now()
    });
  } catch (e) {
    // Ignore duplicate errors (constraint violations)
  }
};

export const clearTranslationCache = async () => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_TRANSLATIONS, 'readwrite');
    const store = tx.objectStore(STORE_TRANSLATIONS);
    store.clear();
  } catch (e) {
    console.error("Failed to clear cache", e);
  }
};

export const getTranslationCacheSize = async (): Promise<number> => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_TRANSLATIONS, 'readonly');
    const store = tx.objectStore(STORE_TRANSLATIONS);
    const countRequest = store.count();

    return new Promise((resolve) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => resolve(0);
    });
  } catch (e) {
    return 0;
  }
};

// --- Clipboard History Logic ---

export const addClipboardItem = async (text: string) => {
  if (!text.trim()) return;
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_CLIPBOARD, 'readwrite');
    const store = tx.objectStore(STORE_CLIPBOARD);
    const index = store.index('text');

    return new Promise<void>((resolve) => {
      // Check if text already exists
      const getReq = index.get(text);
      getReq.onsuccess = () => {
        const existing: ClipboardEntity = getReq.result;
        if (existing) {
          // Update timestamp to move to top
          existing.timestamp = Date.now();
          store.put(existing);
        } else {
          store.add({ text, timestamp: Date.now(), isPinned: false });
        }
        resolve();
      };
      getReq.onerror = () => {
        // Fallback add
        store.add({ text, timestamp: Date.now(), isPinned: false });
        resolve();
      }
    });
  } catch (e) {
    console.error("Failed to add clip", e);
  }
};

export const getClipboardItems = async (): Promise<ClipboardEntity[]> => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_CLIPBOARD, 'readonly');
    const store = tx.objectStore(STORE_CLIPBOARD);
    const index = store.index('timestamp');

    return new Promise((resolve) => {
      const request = index.openCursor(null, 'prev'); // Newest first
      const results: ClipboardEntity[] = [];
      
      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          // Sort: Pinned first, then by timestamp descending
          results.sort((a, b) => {
            if (a.isPinned === b.isPinned) return b.timestamp - a.timestamp;
            return a.isPinned ? -1 : 1;
          });
          resolve(results);
        }
      };
    });
  } catch (e) {
    return [];
  }
};

export const togglePinClipboardItem = async (id: number) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_CLIPBOARD, 'readwrite');
    const store = tx.objectStore(STORE_CLIPBOARD);
    
    const item: ClipboardEntity = await new Promise((resolve) => {
      store.get(id).onsuccess = (e) => resolve((e.target as IDBRequest).result);
    });

    if (item) {
      item.isPinned = !item.isPinned;
      store.put(item);
    }
  } catch (e) {
    console.error("Failed to toggle pin", e);
  }
};

export const deleteClipboardItem = async (id: number) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_CLIPBOARD, 'readwrite');
    const store = tx.objectStore(STORE_CLIPBOARD);
    store.delete(id);
  } catch (e) {
    console.error("Failed to delete clip", e);
  }
};

export const clearClipboard = async () => {
   try {
    const db = await getDB();
    const tx = db.transaction(STORE_CLIPBOARD, 'readwrite');
    const store = tx.objectStore(STORE_CLIPBOARD);
    store.clear();
  } catch (e) {
    console.error("Failed to clear clipboard", e);
  }
};
