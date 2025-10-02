/**
 * GitHub-style Alert/Callout blocks processor
 * Converts blockquotes with [!TYPE] syntax to styled alert boxes
 */

class AlertProcessor {
  constructor() {
    this.alertTypes = {
      'NOTE': { title: 'Note', class: 'note' },
      'TIP': { title: 'Tip', class: 'tip' },
      'IMPORTANT': { title: 'Important', class: 'important' },
      'WARNING': { title: 'Warning', class: 'warning' },
      'CAUTION': { title: 'Caution', class: 'caution' }
    };
    
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.processAlerts());
    } else {
      this.processAlerts();
    }
  }

  processAlerts() {
    // Find all blockquotes
    const blockquotes = document.querySelectorAll('blockquote');
    
    blockquotes.forEach(blockquote => {
      const firstChild = blockquote.firstElementChild;
      if (!firstChild || firstChild.tagName !== 'P') return;
      
      const text = firstChild.textContent.trim();
      
      // Check for [!TYPE] pattern
      const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
      if (!match) return;
      
      const alertType = match[1].toUpperCase();
      const alertInfo = this.alertTypes[alertType];
      if (!alertInfo) return;
      
      // Remove the [!TYPE] marker from content
      const content = text.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '');
      firstChild.textContent = content;
      
      // Create alert structure
      const alertDiv = document.createElement('div');
      alertDiv.className = `markdown-alert markdown-alert-${alertInfo.class}`;
      
      // Create title
      const titleDiv = document.createElement('p');
      titleDiv.className = 'markdown-alert-title';
      titleDiv.textContent = alertInfo.title;
      
      // Create content wrapper
      const contentDiv = document.createElement('div');
      contentDiv.className = 'markdown-alert-content';
      
      // Move all blockquote children to content
      while (blockquote.firstChild) {
        contentDiv.appendChild(blockquote.firstChild);
      }
      
      // Build alert structure
      alertDiv.appendChild(titleDiv);
      alertDiv.appendChild(contentDiv);
      
      // Replace blockquote with alert
      blockquote.parentNode.replaceChild(alertDiv, blockquote);
    });
  }
}

// Initialize
new AlertProcessor();
