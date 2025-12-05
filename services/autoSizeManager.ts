
import { SizeType, SIZE_PRESETS, calculateDimensions, DEFAULT_WIDTH_PERCENTAGE } from './sizeManager';

// Mapping Android "App Types" to Web "Screen Contexts"
type ScreenContext = 'landscape_mobile' | 'tablet_desktop' | 'portrait_mobile';

const SIZE_RULES: Record<ScreenContext, SizeType> = {
  'landscape_mobile': 'small',
  'tablet_desktop': 'large',
  'portrait_mobile': 'medium'
};

type SizeSuggestionCallback = (size: SizeType, reason: string) => void;

class AutoSizeManager {
    private isEnabled = false;
    private callback: SizeSuggestionCallback | null = null;
    private keyTimestamps: number[] = [];
    private lastSuggestion: SizeType | null = null;
    
    // Time Check Interval
    private timeCheckInterval: any = null;

    constructor() {
        // Bind methods
        this.handleResize = this.handleResize.bind(this);
    }

    /**
     * Determines current screen context based on dimensions.
     */
    private determineContext(): ScreenContext {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Desktop or Large Tablet
        if (width >= 1024 || height >= 1024) {
            return 'tablet_desktop';
        }
        
        // Landscape Mobile
        if (width > height && height < 600) {
            return 'landscape_mobile';
        }
        
        // Standard Portrait Mobile
        return 'portrait_mobile';
    }

    /**
     * Get the static recommendation based purely on screen context.
     */
    public getContextRecommendation(): SizeType {
        return SIZE_RULES[this.determineContext()];
    }

    /**
     * Enable auto-adjustment monitoring.
     */
    public enable(cb: SizeSuggestionCallback) {
        if (this.isEnabled) return;
        
        this.isEnabled = true;
        this.callback = cb;
        window.addEventListener('resize', this.handleResize);
        
        // Check time of day every minute
        this.checkTimeOfDay();
        this.timeCheckInterval = setInterval(() => this.checkTimeOfDay(), 60000);
        
        // Initial check
        this.evaluateAll();
    }

    /**
     * Disable monitoring.
     */
    public disable() {
        this.isEnabled = false;
        this.callback = null;
        window.removeEventListener('resize', this.handleResize);
        if (this.timeCheckInterval) clearInterval(this.timeCheckInterval);
        this.keyTimestamps = [];
    }

    /**
     * Report a key press to track typing speed.
     */
    public reportKeyPress() {
        if (!this.isEnabled) return;

        const now = Date.now();
        this.keyTimestamps.push(now);
        
        // Keep last 20 keystrokes for a rolling average
        if (this.keyTimestamps.length > 20) {
            this.keyTimestamps.shift();
        }

        this.analyzeTypingSpeed();
    }

    private handleResize() {
        if (!this.isEnabled) return;
        this.evaluateAll('Screen resize');
    }

    private checkTimeOfDay() {
        if (!this.isEnabled) return;
        this.evaluateAll('Time of day check');
    }

    private analyzeTypingSpeed() {
        // Need at least 5 samples to judge speed
        if (this.keyTimestamps.length < 5) return;

        // Calculate average interval between key presses
        let totalDiff = 0;
        for (let i = 1; i < this.keyTimestamps.length; i++) {
            totalDiff += (this.keyTimestamps[i] - this.keyTimestamps[i-1]);
        }
        const avgDiff = totalDiff / (this.keyTimestamps.length - 1);

        // Analyze
        // < 120ms (~100 WPM / 500 CPM) -> Very Fast -> Suggest Small (Efficiency)
        // > 400ms (~30 WPM / 150 CPM) -> Slow/Struggle -> Suggest Large (Accessibility)
        
        const context = this.determineContext();
        
        // Speed adjustments only make sense in standard portrait mode.
        // Landscape is already small, Desktop is already large.
        if (context === 'portrait_mobile') {
            if (avgDiff < 120 && this.lastSuggestion !== 'small') {
                this.suggest('small', 'Fast typing speed detected');
            } else if (avgDiff > 400 && this.lastSuggestion !== 'large') {
                this.suggest('large', 'Slow typing speed detected');
            }
        }
    }

    private evaluateAll(triggerReason: string = 'Update') {
        const context = this.determineContext();
        let recommendation = SIZE_RULES[context];
        let specificReason = `Context: ${context}`;

        // Apply Usage Rules ONLY if we are in the standard 'medium' context (Portrait Mobile)
        // We don't want to override Landscape (small) or Desktop (large) with Time/Speed rules generally
        if (context === 'portrait_mobile') {
            const hour = new Date().getHours();
            
            // Night Mode Rule (8 PM to 6 AM) -> Larger keys for visibility/comfort
            if (hour >= 20 || hour < 6) {
                recommendation = 'large';
                specificReason = 'Night time (Better visibility)';
            }
        }

        if (this.lastSuggestion !== recommendation) {
            this.suggest(recommendation, specificReason);
        }
    }

    private suggest(size: SizeType, reason: string) {
        if (!this.callback) return;
        
        console.log(`[AutoSizeManager] Suggesting ${size} due to: ${reason}`);
        this.lastSuggestion = size;
        this.callback(size, reason);
    }

    /**
     * Helper to get full dimensions for the current recommendation
     */
    public getAutoAdjustedDimensions() {
        const sizeType = this.lastSuggestion || this.getContextRecommendation();
        const heightPercent = SIZE_PRESETS[sizeType === 'custom' ? 'medium' : sizeType];
        const { height } = calculateDimensions(heightPercent, DEFAULT_WIDTH_PERCENTAGE);
        
        return {
            sizeType,
            height,
            widthPercent: DEFAULT_WIDTH_PERCENTAGE
        };
    }
}

// Export Singleton
export const autoSizeManager = new AutoSizeManager();
