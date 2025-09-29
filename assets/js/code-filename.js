/**
 * Code filename header functionality
 * Processes HTML comments to add filename headers
 */

class CodeFilenameProcessor {
  constructor() {
    this.init();
  }

  init() {
    // 더 늦은 시점에 실행하여 모든 CSS가 로드되도록 함
    const executeWhenReady = () => {
      // 약간의 지연을 두어 모든 스타일이 적용된 후 실행
      setTimeout(() => {
        this.processCodeBlocks();
        this.watchThemeChanges();
        
        // 추가로 조금 더 기다린 후 한 번 더 적용
        setTimeout(() => {
          this.applyDarkModeStyles();
        }, 500);
      }, 100);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', executeWhenReady);
    } else if (document.readyState === 'interactive') {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
          executeWhenReady();
        }
      });
    } else {
      executeWhenReady();
    }
  }

  watchThemeChanges() {
    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-mode') {
          setTimeout(() => this.applyDarkModeStyles(), 100);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode']
    });

    // Also listen for any theme toggle events
    document.addEventListener('click', (e) => {
      if (e.target.closest('.mode-toggle') || e.target.closest('[data-toggle="tooltip"]')) {
        setTimeout(() => this.applyDarkModeStyles(), 200);
      }
    });
  }

  processCodeBlocks() {
    // Find all HTML comments that specify filenames
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_COMMENT,
      null,
      false
    );

    const comments = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeValue.trim().match(/filename:\s*(.+)/)) {
        comments.push(node);
      }
    }

    comments.forEach(comment => {
      const match = comment.nodeValue.trim().match(/filename:\s*(.+)/);
      if (match) {
        const filename = match[1];
        const nextElement = this.getNextElement(comment);
        
        if (nextElement && nextElement.classList.contains('highlighter-rouge')) {
          // Check if there's already a code-header from the theme
          const existingHeader = nextElement.querySelector('.code-header');
          if (existingHeader) {
            this.modifyExistingHeader(existingHeader, filename);
          } else {
            this.addFilenameHeader(nextElement, filename);
          }
        }
      }
    });

    // Force dark mode styling for all code blocks
    this.applyDarkModeStyles();
  }

  applyDarkModeStyles() {
    // Check if we're in dark mode
    const isDarkMode = document.documentElement.getAttribute('data-mode') === 'dark';
    
    // Apply styles for both light and dark mode
    this.applyCodeBlockStyles(isDarkMode);
  }
  
  applyCodeBlockStyles(isDarkMode) {
    if (isDarkMode) {
      // Find all code-related elements and force dark background
      const selectors = [
        'pre', 'code', '.highlight', '.highlighter-rouge',
        'div[class*="language-"]', '.rouge-table', '.rouge-table td',
        '.rouge-code', '.rouge-gutter'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.classList.contains('rouge-gutter')) {
            el.style.setProperty('background-color', 'var(--highlight-bg-color)', 'important');
            el.style.setProperty('background', 'var(--highlight-bg-color)', 'important');
            el.style.setProperty('color', 'var(--highlight-lineno-color)', 'important');
          } else {
            el.style.setProperty('background-color', 'var(--highlight-bg-color)', 'important');
            el.style.setProperty('background', 'var(--highlight-bg-color)', 'important');
            el.style.setProperty('color', 'var(--highlighter-rouge-color)', 'important');
          }
        });
      });

      // 특별히 Rouge 테이블 구조 처리
      const rougeTables = document.querySelectorAll('.rouge-table');
      rougeTables.forEach(table => {
        table.style.setProperty('background-color', '#161b22', 'important');
        table.style.setProperty('background', '#161b22', 'important');
        
        const cells = table.querySelectorAll('td');
        cells.forEach(cell => {
          if (cell.classList.contains('rouge-gutter')) {
            cell.style.setProperty('background-color', '#0d1117', 'important');
            cell.style.setProperty('background', '#0d1117', 'important');
          } else {
            cell.style.setProperty('background-color', '#161b22', 'important');
            cell.style.setProperty('background', '#161b22', 'important');
          }
        });
      });

      // 특별히 #d0d0d0 배경을 가진 요소들을 찾아서 강제로 변경
      const allDivs = document.querySelectorAll('div');
      allDivs.forEach(div => {
        const computedStyle = window.getComputedStyle(div);
        const bgColor = computedStyle.backgroundColor;
        
        // #d0d0d0 = rgb(208, 208, 208) 감지
        if (bgColor === 'rgb(208, 208, 208)' || 
            bgColor === '#d0d0d0' ||
            bgColor.includes('208, 208, 208')) {
          div.style.setProperty('background-color', 'var(--highlight-bg-color)', 'important');
        }
      });

      // XPath로 찾은 특정 요소도 직접 타겟팅
      try {
        const specificElement = document.evaluate(
          '//*[@id="main-wrapper"]/div/div[1]/main/article/div[2]/div[1]/div[2]/div[2]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        
        if (specificElement) {
          specificElement.style.setProperty('background-color', 'var(--highlight-bg-color)', 'important');
          specificElement.style.setProperty('background', 'var(--highlight-bg-color)', 'important');
        }
      } catch (e) {
        // XPath evaluation failed - silently continue
      }
    } else {
      // Light mode styling
      // Ensure code blocks use proper light mode colors
      const codeBlocks = document.querySelectorAll('.code-block-with-filename');
      codeBlocks.forEach(block => {
        // Apply light mode background
        const elements = block.querySelectorAll('.highlight, .highlighter-rouge, .rouge-table, .rouge-table td');
        elements.forEach(el => {
          el.style.setProperty('background-color', 'var(--highlight-bg-color)', 'important');
          el.style.setProperty('background', 'var(--highlight-bg-color)', 'important');
        });
        
        // Ensure filename display has correct color
        const filenameDisplay = block.querySelector('.filename-display');
        if (filenameDisplay) {
          filenameDisplay.style.setProperty('color', 'var(--code-header-text-color, #24292e)', 'important');
        }
      });
    }
  }

  getNextElement(node) {
    let next = node.nextSibling;
    while (next) {
      if (next.nodeType === Node.ELEMENT_NODE) {
        return next;
      }
      next = next.nextSibling;
    }
    return null;
  }

  modifyExistingHeader(existingHeader, filename) {
    // Extract language from the existing header
    const langSpan = existingHeader.querySelector('[data-label-text]');
    const language = langSpan ? langSpan.getAttribute('data-label-text').toLowerCase() : 'text';
    
    // Create filename display element
    const filenameElement = document.createElement('span');
    filenameElement.className = 'filename-display';
    filenameElement.innerHTML = `${this.getFileIcon(language)} ${filename}`;
    
    // Set appropriate color based on current theme
    const isDarkMode = document.documentElement.getAttribute('data-mode') === 'dark';
    const textColor = isDarkMode ? 
      'var(--code-header-text, #f0f6fc)' : 
      'var(--code-header-text-color, #24292e)';
    
    filenameElement.style.cssText = `
      margin-right: 8px;
      font-family: 'Consolas', 'Monaco', 'SFMono-Regular', monospace;
      color: ${textColor};
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    `;
    
    // Insert filename at the beginning of the header
    existingHeader.insertBefore(filenameElement, existingHeader.firstChild);
    
    // Add wrapper class to the parent
    const codeDiv = existingHeader.parentElement;
    if (codeDiv && !codeDiv.classList.contains('code-block-with-filename')) {
      codeDiv.classList.add('code-block-with-filename');
    }
  }

  addFilenameHeader(codeDiv, filename) {
    // Don't process if already processed
    if (codeDiv.previousElementSibling?.classList.contains('code-filename')) {
      return;
    }

    // Extract language from class name
    const classes = Array.from(codeDiv.classList);
    const languageClass = classes.find(cls => cls.startsWith('language-'));
    const language = languageClass ? languageClass.replace('language-', '') : 'text';

    // Create filename header
    const header = document.createElement('div');
    header.className = 'code-filename';
    header.innerHTML = `
      <span class="filename-text">${this.getFileIcon(language)} ${filename}</span>
      <button class="copy-button" title="Copy code">
        <i class="fas fa-copy"></i>
      </button>
    `;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-with-filename';

    // Insert wrapper before code div
    codeDiv.parentNode.insertBefore(wrapper, codeDiv);
    
    // Move elements into wrapper
    wrapper.appendChild(header);
    wrapper.appendChild(codeDiv);

    // Add copy functionality
    const copyButton = header.querySelector('.copy-button');
    copyButton.addEventListener('click', () => this.copyCode(codeDiv, copyButton));
  }

  getFileIcon(language) {
    const icons = {
      'csharp': '<i class="fas fa-file-code" style="color: #239120;"></i>',
      'javascript': '<i class="fab fa-js-square" style="color: #f7df1e;"></i>',
      'python': '<i class="fab fa-python" style="color: #3776ab;"></i>',
      'java': '<i class="fab fa-java" style="color: #ed8b00;"></i>',
      'html': '<i class="fab fa-html5" style="color: #e34c26;"></i>',
      'css': '<i class="fab fa-css3-alt" style="color: #1572b6;"></i>',
      'json': '<i class="fas fa-file-code" style="color: #000000;"></i>',
      'bash': '<i class="fas fa-terminal" style="color: #4eaa25;"></i>',
      'shell': '<i class="fas fa-terminal" style="color: #4eaa25;"></i>'
    };
    return icons[language] || '<i class="fas fa-file-code" style="color: #666;"></i>';
  }

  async copyCode(codeDiv, button) {
    // Get text content from Rouge table or simple pre
    let text = '';
    
    const rougeTable = codeDiv.querySelector('.rouge-table');
    if (rougeTable) {
      // Extract text from Rouge table structure
      const codeRows = rougeTable.querySelectorAll('tr');
      codeRows.forEach(row => {
        const codeCell = row.querySelector('.rouge-code pre');
        if (codeCell) {
          text += codeCell.textContent + '\n';
        }
      });
      text = text.trim();
    } else {
      // Fallback to simple code extraction
      const codeElement = codeDiv.querySelector('code, pre');
      text = codeElement ? codeElement.textContent : '';
    }

    try {
      await navigator.clipboard.writeText(text);
      this.showCopyFeedback(button, true);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        this.showCopyFeedback(button, true);
      } catch (e) {
        this.showCopyFeedback(button, false);
      }
      
      document.body.removeChild(textArea);
    }
  }

  showCopyFeedback(button, success) {
    const original = button.innerHTML;
    const originalTitle = button.title;
    
    if (success) {
      button.innerHTML = '<i class="fas fa-check"></i>';
      button.title = 'Copied!';
      button.classList.add('success');
    } else {
      button.innerHTML = '<i class="fas fa-times"></i>';
      button.title = 'Failed';
      button.classList.add('error');
    }
    
    setTimeout(() => {
      button.innerHTML = original;
      button.title = originalTitle;
      button.classList.remove('success', 'error');
    }, 2000);
  }
}

// Initialize
new CodeFilenameProcessor();