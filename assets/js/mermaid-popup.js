/**
 * Mermaid Popup Enhancement
 * Ultra-safe single instance popup with zoom and pan capabilities for Mermaid diagrams
 * Completely prevents duplicate popups through multiple safety mechanisms
 */

// Configuration
const MERMAID_POPUP_CONFIG = {
  debug: false // Always disable debug logs in production
};

function debugLog(...args) {
  // Debug logs disabled - no console output
}

// Global state management to prevent any duplicate instances
window.MERMAID_POPUP_STATE = window.MERMAID_POPUP_STATE || {
  isActive: false,
  isInitializing: false,
  currentInstance: null,
  overlayCount: 0
};

// Ultra-safe Singleton Pattern with multiple protection layers
const MermaidPopupManager = (function() {
  let instance = null;
  let isInitialized = false;
  let initializationPromise = null;
  
  class MermaidPopup {
    constructor() {
      // Triple check to prevent any duplicate instances
      if (instance) {
        debugLog('Instance already exists - preventing duplicate');
        return instance;
      }
      
      if (window.MERMAID_POPUP_STATE.currentInstance) {
        debugLog('Global instance exists - preventing duplicate');
        return window.MERMAID_POPUP_STATE.currentInstance;
      }
      
      // Mark as initializing to prevent race conditions
      if (window.MERMAID_POPUP_STATE.isInitializing) {
        debugLog('Already initializing - waiting...');
        return null;
      }
      
      window.MERMAID_POPUP_STATE.isInitializing = true;
      
      this.currentScale = 1;
      this.minScale = 0.1;
      this.maxScale = 5;
      this.scaleStep = 0.2;
      this.isPanning = false;
      this.startX = 0;
      this.startY = 0;
      this.translateX = 0;
      this.translateY = 0;
      this.overlay = null;
      this.container = null;
      this.content = null;
      this.isVisible = false;
      this.isDestroyed = false;
      
      // Register this instance globally
      instance = this;
      window.MERMAID_POPUP_STATE.currentInstance = this;
      window.MERMAID_POPUP_STATE.isInitializing = false;
      
      debugLog('New popup instance created and registered globally');
    }

    init() {
      if (this.isDestroyed) {
        debugLog('Cannot initialize destroyed instance');
        return;
      }
      
      if (isInitialized) {
        debugLog('Already initialized, performing safety refresh');
        this.performSafetyCheck();
        this.refreshListeners();
        return;
      }
      
      debugLog('Initializing popup system with safety checks');
      this.performSafetyCheck();
      this.createSinglePopupStructure();
      this.bindEvents();
      this.refreshListeners();
      isInitialized = true;
      window.MERMAID_POPUP_STATE.isActive = true;
    }

    performSafetyCheck() {
      // Safety check 1: Remove any rogue overlays
      const rogueOverlays = document.querySelectorAll('.mermaid-popup-overlay');
      if (rogueOverlays.length > 0) {
        debugLog(`Safety check: Found ${rogueOverlays.length} rogue overlays, removing all`);
        rogueOverlays.forEach((overlay, index) => {
          overlay.remove();
          debugLog(`Removed rogue overlay ${index}`);
        });
      }
      
      // Safety check 2: Remove duplicate event listeners
      this.removeAllMermaidListeners();
      
      // Safety check 3: Reset global state
      window.MERMAID_POPUP_STATE.overlayCount = 0;
      
      debugLog('Safety check completed');
    }

    createSinglePopupStructure() {
      // Final safety check before creating
      this.performSafetyCheck();
      
      debugLog('Creating single popup structure with unique ID');
      
      // Create overlay with unique identifier
      this.overlay = document.createElement('div');
      this.overlay.className = 'mermaid-popup-overlay';
      this.overlay.style.display = 'none';
      this.overlay.setAttribute('data-popup-singleton', 'true');
      this.overlay.setAttribute('data-popup-id', `mermaid-popup-${Date.now()}`);
      
      // Create container
      this.container = document.createElement('div');
      this.container.className = 'mermaid-popup-container';
      
      // Create content area
      this.content = document.createElement('div');
      this.content.className = 'mermaid-popup-content';
      
      // Create controls
      const controls = this.createControls();
      
      // Create scale info
      const scaleInfo = document.createElement('div');
      scaleInfo.className = 'mermaid-popup-scale-info';
      scaleInfo.textContent = '100%';
      
      // Assemble structure
      this.container.appendChild(controls);
      this.container.appendChild(this.content);
      this.container.appendChild(scaleInfo);
      this.overlay.appendChild(this.container);
      
      // Add to DOM with additional safety
      const existingOverlays = document.querySelectorAll('.mermaid-popup-overlay');
      if (existingOverlays.length === 0) {
        document.body.appendChild(this.overlay);
        window.MERMAID_POPUP_STATE.overlayCount = 1;
        debugLog('Single popup structure created and added to DOM');
      } else {
        debugLog(`Warning: ${existingOverlays.length} overlays already exist, not adding new one`);
      }
    }

    createControls() {
      const controls = document.createElement('div');
      controls.className = 'mermaid-popup-controls';
      
      const buttons = [
        { text: '+', action: () => this.zoom(1), title: 'Zoom In' },
        { text: '−', action: () => this.zoom(-1), title: 'Zoom Out' },
        { text: '⌂', action: () => this.resetView(), title: 'Reset View' },
        { text: '×', action: () => this.close(), title: 'Close' }
      ];
      
      buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'mermaid-popup-btn';
        button.textContent = btn.text;
        button.title = btn.title;
        
        // Ultra-safe event handling
        button.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          e.stopImmediatePropagation();
          
          if (!this.isDestroyed && this.isVisible) {
            btn.action();
          }
        };
        
        controls.appendChild(button);
      });
      
      return controls;
    }

    bindEvents() {
      if (!this.overlay || this.isDestroyed) return;
      
      // Prevent event bubbling with maximum protection
      this.container.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
      });
      
      // Close on overlay click (background) with protection
      this.overlay.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
        
        if (e.target === this.overlay && !this.isDestroyed) {
          this.close();
        }
      });
      
      // Keyboard controls with state checking
      const keydownHandler = (e) => {
        if (!this.isVisible || this.isDestroyed) return;
        
        switch(e.key) {
          case 'Escape':
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.close();
            break;
          case '+':
          case '=':
            e.preventDefault();
            e.stopPropagation();
            this.zoom(1);
            break;
          case '-':
            e.preventDefault();
            e.stopPropagation();
            this.zoom(-1);
            break;
          case '0':
            e.preventDefault();
            e.stopPropagation();
            this.resetView();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            e.stopPropagation();
            this.pan(50, 0);
            break;
          case 'ArrowRight':
            e.preventDefault();
            e.stopPropagation();
            this.pan(-50, 0);
            break;
          case 'ArrowUp':
            e.preventDefault();
            e.stopPropagation();
            this.pan(0, 50);
            break;
          case 'ArrowDown':
            e.preventDefault();
            e.stopPropagation();
            this.pan(0, -50);
            break;
        }
      };
      
      // Store handler reference for cleanup
      this._keydownHandler = keydownHandler;
      document.addEventListener('keydown', keydownHandler);
      
      // Mouse wheel zoom with protection
      this.content.addEventListener('wheel', (e) => {
        if (this.isDestroyed) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const delta = e.deltaY > 0 ? -1 : 1;
        this.zoom(delta);
      });
      
      // Mouse pan with protection
      const mouseDownHandler = (e) => {
        if (this.isDestroyed) return;
        if (e.button === 0) { // Left mouse button
          this.isPanning = true;
          this.startX = e.clientX - this.translateX;
          this.startY = e.clientY - this.translateY;
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      };
      
      const mouseMoveHandler = (e) => {
        if (!this.isPanning || this.isDestroyed) return;
        
        this.translateX = e.clientX - this.startX;
        this.translateY = e.clientY - this.startY;
        this.updateTransform();
      };
      
      const mouseUpHandler = () => {
        if (this.isDestroyed) return;
        this.isPanning = false;
      };
      
      // Store handler references for cleanup
      this._mouseDownHandler = mouseDownHandler;
      this._mouseMoveHandler = mouseMoveHandler;
      this._mouseUpHandler = mouseUpHandler;
      
      this.content.addEventListener('mousedown', mouseDownHandler);
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
      
      // Touch support for mobile
      this.addTouchSupport();
    }

    addTouchSupport() {
      if (!this.content || this.isDestroyed) return;
      
      let lastTouchDistance = 0;
      
      const touchStartHandler = (e) => {
        if (this.isDestroyed) return;
        
        if (e.touches.length === 1) {
          // Single touch - start panning
          this.isPanning = true;
          this.startX = e.touches[0].clientX - this.translateX;
          this.startY = e.touches[0].clientY - this.translateY;
        } else if (e.touches.length === 2) {
          // Two touches - prepare for pinch zoom
          this.isPanning = false;
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          lastTouchDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
          );
        }
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };
      
      const touchMoveHandler = (e) => {
        if (this.isDestroyed) return;
        
        if (e.touches.length === 1 && this.isPanning) {
          // Single touch - pan
          this.translateX = e.touches[0].clientX - this.startX;
          this.translateY = e.touches[0].clientY - this.startY;
          this.updateTransform();
        } else if (e.touches.length === 2) {
          // Two touches - pinch zoom
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
          );
          
          if (lastTouchDistance > 0) {
            const scale = currentDistance / lastTouchDistance;
            const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.currentScale * scale));
            this.currentScale = newScale;
            this.updateTransform();
            this.updateScaleInfo();
          }
          
          lastTouchDistance = currentDistance;
        }
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };
      
      const touchEndHandler = () => {
        if (this.isDestroyed) return;
        this.isPanning = false;
        lastTouchDistance = 0;
      };
      
      // Store handler references for cleanup
      this._touchStartHandler = touchStartHandler;
      this._touchMoveHandler = touchMoveHandler;
      this._touchEndHandler = touchEndHandler;
      
      this.content.addEventListener('touchstart', touchStartHandler);
      this.content.addEventListener('touchmove', touchMoveHandler);
      this.content.addEventListener('touchend', touchEndHandler);
    }

    refreshListeners() {
      if (this.isDestroyed) return;
      
      // Remove all existing event listeners first
      this.removeAllMermaidListeners();
      
      // Add fresh event listeners with ultra-safe protection
      const mermaidElements = document.querySelectorAll('.mermaid');
      debugLog(`Adding ultra-safe listeners to ${mermaidElements.length} mermaid elements`);
      
      mermaidElements.forEach((element, index) => {
        // Create bound handler function with maximum protection
        const handler = (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Check if popup is already visible
          if (window.MERMAID_POPUP_STATE.isActive && this.isVisible) {
            debugLog(`Popup already active, ignoring click on element ${index}`);
            return;
          }
          
          // Check if this instance is valid
          if (this.isDestroyed) {
            debugLog(`Instance destroyed, ignoring click on element ${index}`);
            return;
          }
          
          debugLog(`Opening popup for element ${index} with safety checks`);
          this.show(element);
        };
        
        // Store handler reference for later removal with unique key
        element._mermaidHandler = handler;
        element._mermaidHandlerTimestamp = Date.now();
        
        // Add event listener with passive: false for maximum control
        element.style.cursor = 'zoom-in';
        element.addEventListener('click', handler, { passive: false });
        
        debugLog(`Added ultra-safe click handler to element ${index}`);
      });
    }

    removeAllMermaidListeners() {
      const mermaidElements = document.querySelectorAll('.mermaid');
      debugLog(`Removing all listeners from ${mermaidElements.length} mermaid elements`);
      
      mermaidElements.forEach((element, index) => {
        if (element._mermaidHandler) {
          element.removeEventListener('click', element._mermaidHandler);
          delete element._mermaidHandler;
          delete element._mermaidHandlerTimestamp;
          debugLog(`Removed listener from element ${index}`);
        }
        element.style.cursor = '';
      });
    }

    show(mermaidElement) {
      if (this.isDestroyed) {
        debugLog('Cannot show popup - instance destroyed');
        return;
      }
      
      debugLog('Showing popup with ultra-safe checks');
      
      // Ultimate safety check
      if (window.MERMAID_POPUP_STATE.isActive && this.isVisible) {
        debugLog('Popup already active, forcing close first');
        this.forceClose();
      }
      
      // Ensure popup structure exists
      if (!this.overlay) {
        debugLog('Popup structure missing, recreating with safety');
        this.performSafetyCheck();
        this.createSinglePopupStructure();
        this.bindEvents();
      }
      
      // Final check for multiple overlays
      const allOverlays = document.querySelectorAll('.mermaid-popup-overlay');
      if (allOverlays.length > 1) {
        debugLog(`Critical: Found ${allOverlays.length} overlays, removing all except this one`);
        allOverlays.forEach((overlay, index) => {
          if (overlay !== this.overlay) {
            overlay.remove();
            debugLog(`Removed duplicate overlay ${index}`);
          }
        });
      }
      
      // Clone the mermaid content
      const clonedContent = mermaidElement.cloneNode(true);
      clonedContent.style.cursor = 'grab';
      
      // Clear and add content
      this.content.innerHTML = '';
      this.content.appendChild(clonedContent);
      
      // Reset view
      this.resetView();
      
      // Show overlay
      this.overlay.style.display = 'block';
      this.isVisible = true;
      window.MERMAID_POPUP_STATE.isActive = true;
      document.body.style.overflow = 'hidden';
      
      // Focus for keyboard events
      this.overlay.setAttribute('tabindex', '-1');
      this.overlay.focus();
      
      debugLog('Popup shown successfully with all safety checks');
    }

    close() {
      if (this.isDestroyed) return;
      debugLog('Closing popup safely');
      this.forceClose();
    }

    forceClose() {
      if (this.overlay) {
        this.overlay.style.display = 'none';
      }
      this.isVisible = false;
      window.MERMAID_POPUP_STATE.isActive = false;
      document.body.style.overflow = '';
      debugLog('Popup force closed and state reset');
    }

    zoom(direction) {
      if (this.isDestroyed) return;
      const oldScale = this.currentScale;
      if (direction > 0) {
        this.currentScale = Math.min(this.maxScale, this.currentScale + this.scaleStep);
      } else {
        this.currentScale = Math.max(this.minScale, this.currentScale - this.scaleStep);
      }
      
      // Adjust translation to zoom towards center
      const scaleRatio = this.currentScale / oldScale;
      this.translateX *= scaleRatio;
      this.translateY *= scaleRatio;
      
      this.updateTransform();
      this.updateScaleInfo();
    }

    pan(deltaX, deltaY) {
      if (this.isDestroyed) return;
      this.translateX += deltaX;
      this.translateY += deltaY;
      this.updateTransform();
    }

    resetView() {
      if (this.isDestroyed) return;
      this.currentScale = 1;
      this.translateX = 0;
      this.translateY = 0;
      this.updateTransform();
      this.updateScaleInfo();
    }

    updateTransform() {
      if (this.content && !this.isDestroyed) {
        const transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.currentScale})`;
        this.content.style.transform = transform;
      }
    }

    updateScaleInfo() {
      if (this.container && !this.isDestroyed) {
        const scaleInfo = this.container.querySelector('.mermaid-popup-scale-info');
        if (scaleInfo) {
          scaleInfo.textContent = `${Math.round(this.currentScale * 100)}%`;
        }
      }
    }

    destroy() {
      debugLog('Destroying popup instance with complete cleanup');
      
      this.isDestroyed = true;
      
      // Remove all event listeners
      this.removeAllMermaidListeners();
      
      // Remove document event listeners
      if (this._keydownHandler) {
        document.removeEventListener('keydown', this._keydownHandler);
      }
      if (this._mouseMoveHandler) {
        document.removeEventListener('mousemove', this._mouseMoveHandler);
      }
      if (this._mouseUpHandler) {
        document.removeEventListener('mouseup', this._mouseUpHandler);
      }
      
      // Remove element event listeners
      if (this.content) {
        if (this._mouseDownHandler) {
          this.content.removeEventListener('mousedown', this._mouseDownHandler);
        }
        if (this._touchStartHandler) {
          this.content.removeEventListener('touchstart', this._touchStartHandler);
        }
        if (this._touchMoveHandler) {
          this.content.removeEventListener('touchmove', this._touchMoveHandler);
        }
        if (this._touchEndHandler) {
          this.content.removeEventListener('touchend', this._touchEndHandler);
        }
      }
      
      // Remove popup from DOM
      const allOverlays = document.querySelectorAll('.mermaid-popup-overlay');
      allOverlays.forEach((overlay, index) => {
        overlay.remove();
        debugLog(`Removed overlay ${index} during destroy`);
      });
      
      // Reset all state
      this.overlay = null;
      this.container = null;
      this.content = null;
      instance = null;
      isInitialized = false;
      
      // Reset global state
      window.MERMAID_POPUP_STATE.isActive = false;
      window.MERMAID_POPUP_STATE.isInitializing = false;
      window.MERMAID_POPUP_STATE.currentInstance = null;
      window.MERMAID_POPUP_STATE.overlayCount = 0;
      
      debugLog('Complete cleanup finished');
    }
  }

  return {
    getInstance: function() {
      // Ultra-safe instance management
      if (window.MERMAID_POPUP_STATE.isInitializing) {
        debugLog('Waiting for initialization to complete');
        return null;
      }
      
      if (window.MERMAID_POPUP_STATE.currentInstance && !window.MERMAID_POPUP_STATE.currentInstance.isDestroyed) {
        debugLog('Returning existing global instance');
        return window.MERMAID_POPUP_STATE.currentInstance;
      }
      
      if (!instance || (instance && instance.isDestroyed)) {
        debugLog('Creating new instance through ultra-safe manager');
        instance = new MermaidPopup();
      }
      
      return instance;
    },
    
    init: function() {
      // Prevent multiple simultaneous initializations
      if (initializationPromise) {
        debugLog('Initialization already in progress, waiting...');
        return initializationPromise;
      }
      
      initializationPromise = new Promise((resolve) => {
        debugLog('Manager init called with ultra-safe protection');
        
        // First destroy any existing instances completely
        this.destroy();
        
        // Wait a bit to ensure cleanup is complete
        setTimeout(() => {
          const popup = this.getInstance();
          if (popup) {
            popup.init();
            resolve(popup);
          } else {
            debugLog('Failed to create instance, retrying...');
            setTimeout(() => {
              const retryPopup = this.getInstance();
              if (retryPopup) {
                retryPopup.init();
              }
              resolve(retryPopup);
            }, 100);
          }
          initializationPromise = null;
        }, 50);
      });
      
      return initializationPromise;
    },
    
    destroy: function() {
      debugLog('Manager destroy called');
      
      // Destroy current instance
      if (instance && !instance.isDestroyed) {
        instance.destroy();
      }
      
      // Clean up global state
      if (window.MERMAID_POPUP_STATE.currentInstance && !window.MERMAID_POPUP_STATE.currentInstance.isDestroyed) {
        window.MERMAID_POPUP_STATE.currentInstance.destroy();
      }
      
      // Reset everything
      instance = null;
      isInitialized = false;
      initializationPromise = null;
      
      // Reset global state completely
      window.MERMAID_POPUP_STATE = {
        isActive: false,
        isInitializing: false,
        currentInstance: null,
        overlayCount: 0
      };
      
      debugLog('Manager destroy completed with full reset');
    },
    
    // Emergency reset function
    emergencyReset: function() {
      debugLog('EMERGENCY RESET: Clearing all popup state');
      
      // Remove ALL popup overlays from DOM
      const allOverlays = document.querySelectorAll('.mermaid-popup-overlay');
      allOverlays.forEach((overlay, index) => {
        overlay.remove();
        debugLog(`Emergency removed overlay ${index}`);
      });
      
      // Remove ALL mermaid listeners
      const allMermaidElements = document.querySelectorAll('.mermaid');
      allMermaidElements.forEach((element, index) => {
        if (element._mermaidHandler) {
          element.removeEventListener('click', element._mermaidHandler);
          delete element._mermaidHandler;
          delete element._mermaidHandlerTimestamp;
        }
        element.style.cursor = '';
        debugLog(`Emergency cleaned element ${index}`);
      });
      
      // Reset body overflow
      document.body.style.overflow = '';
      
      // Complete reset
      this.destroy();
      
      debugLog('Emergency reset completed');
    }
  };
})();

// Ultra-safe initialization system
let initTimeout = null;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

function initializeMermaidPopup() {
  debugLog(`Initializing Mermaid popup system (attempt ${initAttempts + 1})`);
  
  // Clear any existing timeout
  if (initTimeout) {
    clearTimeout(initTimeout);
  }
  
  // Emergency reset if too many attempts
  if (initAttempts >= MAX_INIT_ATTEMPTS) {
    debugLog('Max init attempts reached, performing emergency reset');
    MermaidPopupManager.emergencyReset();
    initAttempts = 0;
  }
  
  initAttempts++;
  
  // Wait a bit for DOM to be stable
  initTimeout = setTimeout(() => {
    try {
      if (typeof mermaid !== 'undefined') {
        // Use mermaid's initialization if available
        Promise.resolve(mermaid.init()).then(() => {
          return MermaidPopupManager.init();
        }).catch((error) => {
          debugLog('mermaid.init() failed:', error);
          return MermaidPopupManager.init();
        }).finally(() => {
          initAttempts = 0; // Reset on success
        });
      } else {
        debugLog('Mermaid not found, initializing anyway');
        MermaidPopupManager.init().finally(() => {
          initAttempts = 0; // Reset on success
        });
      }
    } catch (error) {
      debugLog('Initialization error:', error);
      if (initAttempts < MAX_INIT_ATTEMPTS) {
        setTimeout(initializeMermaidPopup, 1000);
      }
    }
  }, 300);
}

// DOM ready event with ultra-safe handling
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMermaidPopup);
} else {
  // DOM already loaded
  initializeMermaidPopup();
}

// Handle dynamic content changes with debouncing
if (typeof MutationObserver !== 'undefined') {
  let observerTimeout = null;
  let observerLocked = false;
  
  const observer = new MutationObserver((mutations) => {
    if (observerLocked) return;
    
    let hasNewMermaid = false;
    
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.classList && node.classList.contains('mermaid') || 
              node.querySelector && node.querySelector('.mermaid')) {
            hasNewMermaid = true;
          }
        }
      });
    });
    
    if (hasNewMermaid) {
      // Debounce the refresh
      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }
      
      observerTimeout = setTimeout(() => {
        observerLocked = true;
        debugLog('New mermaid elements detected, refreshing with safety');
        
        const instance = MermaidPopupManager.getInstance();
        if (instance && !instance.isDestroyed) {
          instance.refreshListeners();
        } else {
          debugLog('No valid instance found, reinitializing');
          MermaidPopupManager.init();
        }
        
        setTimeout(() => {
          observerLocked = false;
        }, 100);
      }, 500);
    }
  });
  
  // Start observing after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  } else {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Expose emergency reset for debugging
if (MERMAID_POPUP_CONFIG.debug) {
  window.emergencyResetMermaidPopup = () => {
    MermaidPopupManager.emergencyReset();
    setTimeout(initializeMermaidPopup, 100);
  };
  
  window.getMermaidPopupState = () => {
    return {
      globalState: window.MERMAID_POPUP_STATE,
      overlayCount: document.querySelectorAll('.mermaid-popup-overlay').length,
      mermaidElementsWithHandlers: Array.from(document.querySelectorAll('.mermaid')).filter(el => el._mermaidHandler).length
    };
  };
}
