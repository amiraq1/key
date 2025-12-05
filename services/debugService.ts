
export const DebugHelper = {
  /**
   * Runs a full diagnostic check on the Virtual Keyboard layout.
   * Logs visibility, dimensions, and key counts to the console.
   */
  runDiagnostics(): string {
    console.group("=== Keyboard Diagnostics Start ===");
    
    const container = document.querySelector('.virtual-keyboard');
    if (!container) {
      const msg = "❌ FATAL: Keyboard container (.virtual-keyboard) not found in DOM.";
      console.error(msg);
      console.groupEnd();
      return msg;
    }

    this.inspectElement("Root Container", container as HTMLElement);

    const keys = container.querySelectorAll('button');
    console.log(`ℹ️ Found ${keys.length} keys rendered.`);

    if (keys.length === 0) {
      console.warn("⚠️ WARNING: No key buttons found. Layout might be empty.");
    } else {
      // Inspect first and last key to check layout bounds
      this.inspectElement("First Key", keys[0] as HTMLElement);
      this.inspectElement("Last Key", keys[keys.length - 1] as HTMLElement);
    }

    // Check parent visibility
    let parent = container.parentElement;
    let depth = 0;
    while (parent && depth < 3) {
      this.inspectElement(`Parent Level ${depth + 1} (${parent.tagName})`, parent);
      parent = parent.parentElement;
      depth++;
    }

    console.groupEnd();
    return `Diagnostics complete. Found ${keys.length} keys. Check console for details.`;
  },

  /**
   * Logs detailed layout and style information for a specific element.
   */
  inspectElement(label: string, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;

    console.group(`${label} <${el.tagName.toLowerCase()}>`);
    console.log(`Visible: ${isVisible} (Display: ${style.display}, Visibility: ${style.visibility}, Opacity: ${style.opacity})`);
    console.log(`Dimensions: ${rect.width.toFixed(1)}px x ${rect.height.toFixed(1)}px`);
    console.log(`Position: (${rect.left.toFixed(1)}, ${rect.top.toFixed(1)})`);
    console.log(`Classes: ${el.className}`);
    
    if (rect.width === 0 || rect.height === 0) {
      console.warn("⚠️ Element has 0 dimensions!");
    }
    console.groupEnd();
  },

  /**
   * Visually highlights elements within the keyboard that have 0 width or height
   * but are technically "visible" in the DOM (not display: none).
   */
  highlightZeroSizeElements(): string {
    const container = document.querySelector('.virtual-keyboard');
    if (!container) return "Keyboard not found.";

    const allElements = container.querySelectorAll('*');
    let count = 0;

    allElements.forEach(node => {
      const el = node as HTMLElement;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      // Ignore standard hidden elements or spans that might be utility wrappers
      if (style.display !== 'none' && el.tagName !== 'SPAN' && el.tagName !== 'CANVAS') {
        if (rect.width === 0 || rect.height === 0) {
          el.style.outline = "2px solid red";
          el.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
          console.warn("Highlighted zero-size element:", el);
          count++;
        }
      }
    });

    return `Found and highlighted ${count} zero-size elements.`;
  },

  /**
   * Forces a redraw of the keyboard container (Simulation).
   */
  forceRedraw() {
    const container = document.querySelector('.virtual-keyboard') as HTMLElement;
    if (container) {
      const originalDisplay = container.style.display;
      container.style.display = 'none';
      // Force reflow
      void container.offsetHeight; 
      container.style.display = originalDisplay;
      console.log("Forced layout reflow on keyboard container.");
    }
  }
};
