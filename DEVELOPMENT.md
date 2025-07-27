# Development Guide

## Setup

### Prerequisites
- Ruby (with Bundler)
- Node.js (with npm)

### Installation
```bash
# Install Ruby dependencies
bundle install

# Install Node.js dependencies  
npm install
```

## Development Commands

### Jekyll Development
```bash
# Start Jekyll server with live reload
bundle exec jekyll serve --livereload

# Build site for production
bundle exec jekyll build
```

### Asset Development
```bash
# Watch and rebuild JavaScript files
npm run watch:js

# Watch and rebuild CSS files
npm run watch:css

# Watch both JS and CSS
npm run watch

# Build all assets for production
npm run build
```

### Code Quality
```bash
# Lint JavaScript files
npm run lint

# Auto-fix JavaScript issues
npm run lint:fix

# Clean generated files
npm run clean
```

## Project Structure

```
├── _javascript/           # Source JavaScript files
├── assets/js/            # Built JavaScript files
├── assets/css/           # CSS files
├── _sass/               # Sass source files
├── _includes/           # Jekyll includes
├── _layouts/            # Jekyll layouts
├── _posts/              # Blog posts
├── .well-known/         # Web standards files
├── package.json         # Node.js configuration
├── rollup.config.js     # JavaScript build configuration
└── _config.yml          # Jekyll configuration
```

## Features

### Mermaid Popup
- Click any Mermaid diagram to open in popup
- Zoom with mouse wheel or +/- buttons
- Pan with mouse drag or arrow keys
- Mobile touch support (pinch zoom, drag)
- ESC or outside click to close

### Build System
- Rollup for JavaScript bundling
- Sass for CSS preprocessing
- ESLint for code linting
- Watch mode for development

### PWA Support
- Service Worker for offline functionality
- Web App Manifest
- Chrome DevTools integration

## Troubleshooting

### Common Issues

1. **npm run watch:js fails**: Ensure Node.js is installed and run `npm install`
2. **Jekyll serve fails**: Ensure Ruby and Bundler are installed and run `bundle install`
3. **Mermaid popups don't work**: Check browser console for JavaScript errors
4. **Assets not loading**: Run `npm run build` to regenerate assets

### Debug Mode
- Mermaid popup debug logs are enabled on localhost
- Use browser DevTools console to see debug information
