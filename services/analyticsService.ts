
export interface AnalyticsEvent {
  eventName: string;
  params: Record<string, any>;
  timestamp: number;
}

/**
 * Simulates Firebase Analytics logging.
 * Logs to console and stores recent events in localStorage for potential debugging/viewing.
 */
export const logEvent = (eventName: string, params: Record<string, any>) => {
  const event: AnalyticsEvent = {
    eventName,
    params,
    timestamp: Date.now()
  };

  // In a real app, this would send data to Firebase/Google Analytics
  console.log(`[Analytics] ${eventName}:`, params);

  try {
    const history = JSON.parse(localStorage.getItem('gemkey_analytics_history') || '[]');
    history.push(event);
    // Keep last 50 events to avoid storage bloat
    if (history.length > 50) history.shift();
    localStorage.setItem('gemkey_analytics_history', JSON.stringify(history));
  } catch (e) {
    // Ignore storage errors
  }
};

/**
 * Logs a translation event with performance metrics.
 */
export const logTranslation = (
  sourceLang: string, 
  targetLang: string, 
  textLength: number, 
  durationMs: number,
  method: 'cache' | 'gemini' | 'fallback' | 'offline'
) => {
  logEvent('translation', {
    source_lang: sourceLang,
    target_lang: targetLang,
    text_length: textLength,
    duration_ms: durationMs,
    method: method
  });
};
