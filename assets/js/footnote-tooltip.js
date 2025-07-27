/**
 * Footnote Tooltip Enhancement
 * Shows footnote content in a tooltip when hovering over footnote links
 */

class FootnoteTooltip {
  constructor() {
    this.tooltip = null;
    this.currentFootnoteLink = null;
    this.hideTimeout = null;
    this.scrollTimeout = null;
    this.isMobile = this.detectMobile();
    this.touchStartTime = 0;
    
    this.init();
  }

  detectMobile() {
    // Check for touch capability and mobile user agent
    return ('ontouchstart' in window || navigator.maxTouchPoints > 0) && 
           /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  init() {
    // Create tooltip element
    this.createTooltip();
    
    // Add event listeners to all footnote links
    this.addEventListeners();
    
    // Handle dynamic content loading
    this.observeDOMChanges();
    
    // Handle scroll events
    this.addScrollListener();
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'footnote-tooltip';
    document.body.appendChild(this.tooltip);
    
    console.log('Tooltip created and added to DOM:', this.tooltip);
    console.log('Tooltip computed styles:', window.getComputedStyle(this.tooltip));
  }

  addEventListeners() {
    const footnoteLinks = document.querySelectorAll('a.footnote');
    
    footnoteLinks.forEach(link => {
      if (link.footnoteTooltipHandler) return; // Prevent duplicate handlers
      
      const showTooltip = (e) => this.showTooltip(e, link);
      const hideTooltip = () => this.hideTooltip();
      const handleTouch = (e) => this.handleTouch(e, link);
      
      // Desktop events
      link.addEventListener('mouseenter', showTooltip);
      link.addEventListener('mouseleave', hideTooltip);
      link.addEventListener('focus', showTooltip);
      link.addEventListener('blur', hideTooltip);
      
      // Mobile touch events
      link.addEventListener('touchstart', handleTouch, { passive: false });
      link.addEventListener('click', (e) => this.handleClick(e, link), { passive: false });
      
      // Mark as having handler to prevent duplicates
      link.footnoteTooltipHandler = true;
    });
    
    // Add global touch listener to hide tooltip when touching elsewhere
    document.addEventListener('touchstart', (e) => this.handleGlobalTouch(e), { passive: true });
  }

  showTooltip(event, link) {
    console.log('showTooltip called for link:', link);
    
    // Clear any pending hide
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Get footnote ID from href
    const href = link.getAttribute('href');
    console.log('Link href:', href);
    
    if (!href || !href.startsWith('#fn:')) {
      console.log('Invalid href, returning');
      return;
    }
    
    const footnoteId = href.substring(1); // Remove #
    const footnoteElement = document.getElementById(footnoteId);
    console.log('Footnote element found:', footnoteElement);
    
    if (!footnoteElement) {
      console.log('Footnote element not found, returning');
      return;
    }

    // Extract footnote content
    const footnoteContent = this.extractFootnoteContent(footnoteElement);
    console.log('Footnote content:', footnoteContent);
    
    if (!footnoteContent) {
      console.log('No footnote content, returning');
      return;
    }

    // Update tooltip content
    this.tooltip.innerHTML = footnoteContent;
    console.log('Tooltip content updated');
    
    // Position tooltip
    this.positionTooltip(event, link);
    console.log('Tooltip positioned');
    
    // Show tooltip
    this.currentFootnoteLink = link;
    this.tooltip.classList.add('show');
    
    // Force visibility with inline styles as backup
    this.tooltip.style.display = 'block';
    this.tooltip.style.visibility = 'visible';
    this.tooltip.style.opacity = '1';
    this.tooltip.style.zIndex = '10000';
    
    console.log('Tooltip show class added and forced visible');
    
    // Final verification
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(this.tooltip);
      console.log('Final tooltip state:', {
        element: this.tooltip,
        classList: Array.from(this.tooltip.classList),
        computedStyles: {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          position: computedStyle.position,
          left: computedStyle.left,
          top: computedStyle.top,
          zIndex: computedStyle.zIndex
        },
        boundingRect: this.tooltip.getBoundingClientRect()
      });
    }, 100);
  }

  hideTooltip() {
    // Add small delay to prevent flickering
    this.hideTimeout = setTimeout(() => {
      this.tooltip.classList.remove('show');
      this.currentFootnoteLink = null;
      
      // Remove inline styles that force visibility
      this.tooltip.style.display = '';
      this.tooltip.style.visibility = '';
      this.tooltip.style.opacity = '';
      this.tooltip.style.zIndex = '';
      
      console.log('Tooltip hidden and inline styles cleared');
    }, 100);
  }

  handleTouch(event, link) {
    // Record touch start time for tap detection
    this.touchStartTime = Date.now();
    
    if (this.isMobile) {
      // Prevent default touch behavior to avoid conflicts
      event.preventDefault();
      
      // If tooltip is already shown for this link, hide it
      if (this.currentFootnoteLink === link && this.tooltip.classList.contains('show')) {
        this.hideTooltip();
        return;
      }
      
      // Hide any existing tooltip first
      if (this.currentFootnoteLink && this.currentFootnoteLink !== link) {
        this.hideTooltip();
      }
      
      // Show tooltip after a brief delay
      setTimeout(() => {
        this.showTooltip(event, link);
      }, 50);
    }
  }

  handleClick(event, link) {
    // On mobile, if we're showing a tooltip, prevent navigation
    if (this.isMobile) {
      const touchDuration = Date.now() - this.touchStartTime;
      
      // If it's a quick tap (not a long press) and tooltip is visible, prevent default navigation
      if (touchDuration < 500 && this.currentFootnoteLink === link && this.tooltip.classList.contains('show')) {
        event.preventDefault();
        return false;
      }
      
      // If tooltip is not showing, let the default behavior (navigation) happen
      if (!this.tooltip.classList.contains('show')) {
        return true;
      }
    }
  }

  handleGlobalTouch(event) {
    // Hide tooltip when touching outside of it or the current footnote link
    if (!this.isMobile || !this.tooltip.classList.contains('show')) {
      return;
    }
    
    const target = event.target;
    const isTooltip = this.tooltip.contains(target);
    const isCurrentLink = this.currentFootnoteLink && this.currentFootnoteLink.contains(target);
    
    if (!isTooltip && !isCurrentLink) {
      this.hideTooltip();
    }
  }

  extractFootnoteContent(footnoteElement) {
    // Try to get the paragraph content
    const paragraph = footnoteElement.querySelector('p');
    if (paragraph) {
      // Clone the paragraph to avoid modifying original
      const clone = paragraph.cloneNode(true);
      
      // Remove the reverse footnote link
      const reverseLink = clone.querySelector('a.reversefootnote');
      if (reverseLink) {
        reverseLink.remove();
      }
      
      // Clean up whitespace
      return clone.innerHTML.trim();
    }
    
    // Fallback: get text content
    const textContent = footnoteElement.textContent || footnoteElement.innerText;
    return textContent.replace(/↩.*$/, '').trim(); // Remove reverse link text
  }

  positionTooltip(event, link) {
    // First, temporarily show tooltip off-screen to measure its size
    this.tooltip.style.visibility = 'hidden';
    this.tooltip.style.opacity = '1';
    this.tooltip.style.left = '-9999px';
    this.tooltip.style.top = '-9999px';
    this.tooltip.classList.add('show');
    
    const linkRect = link.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    console.log('Link rect:', linkRect);
    console.log('Tooltip rect:', tooltipRect);
    console.log('Viewport:', { width: viewportWidth, height: viewportHeight });
    
    // For fixed positioning, use viewport coordinates (no scroll offset needed)
    // Default position: above the link, centered
    let left = linkRect.left + (linkRect.width / 2) - (tooltipRect.width / 2);
    let top = linkRect.top - tooltipRect.height - 10; // 10px gap
    
    console.log('Initial position:', { left, top });
    
    // Adjust horizontal position if tooltip goes off screen
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }
    
    // If tooltip goes above viewport, show below the link instead
    if (top < 10) {
      top = linkRect.bottom + 10;
      // Adjust arrow direction by toggling a class
      this.tooltip.classList.add('below');
      console.log('Positioning below link');
    } else {
      this.tooltip.classList.remove('below');
      console.log('Positioning above link');
    }
    
    console.log('Final position:', { left, top });
    
    // Apply final position and make visible
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.visibility = 'visible';
    // Don't set opacity to 0 here since we already forced it to 1 earlier
    
    console.log('Tooltip styles applied:', {
      left: this.tooltip.style.left,
      top: this.tooltip.style.top,
      visibility: this.tooltip.style.visibility,
      opacity: this.tooltip.style.opacity,
      classList: Array.from(this.tooltip.classList)
    });
  }

  observeDOMChanges() {
    // Watch for dynamically added content
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.querySelector && node.querySelector('a.footnote')) {
                shouldUpdate = true;
              }
            }
          });
        }
      });
      
      if (shouldUpdate) {
        // Small delay to ensure DOM is stable
        setTimeout(() => this.addEventListeners(), 100);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  addScrollListener() {
    // Handle scroll events to reposition tooltip if visible
    window.addEventListener('scroll', () => {
      if (this.currentFootnoteLink && this.tooltip.classList.contains('show')) {
        // Clear previous timeout
        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
        }
        
        // Debounce scroll events and reposition tooltip
        this.scrollTimeout = setTimeout(() => {
          this.positionTooltip(null, this.currentFootnoteLink);
        }, 10);
      }
    }, { passive: true });
    
    // Also handle resize events
    window.addEventListener('resize', () => {
      if (this.currentFootnoteLink && this.tooltip.classList.contains('show')) {
        this.positionTooltip(null, this.currentFootnoteLink);
      }
    }, { passive: true });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FootnoteTooltip();
  });
} else {
  new FootnoteTooltip();
}

// Export for potential external use
window.FootnoteTooltip = FootnoteTooltip;
