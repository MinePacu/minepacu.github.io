# Jekyll UTF-8 Support Configuration
# Add these lines to your ~/.zshrc file

# UTF-8 Locale Settings
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
export LC_CTYPE=ko_KR.UTF-8

# Ruby Encoding
export RUBYOPT="-Eutf-8"

# Usage:
# 1. Copy these lines to your ~/.zshrc file
# 2. Run: source ~/.zshrc
# 3. Restart your terminal or run Jekyll server

# Alternative: Create an alias for Jekyll serve
alias jekyll-serve='LANG=ko_KR.UTF-8 LC_ALL=ko_KR.UTF-8 RUBYOPT="-Eutf-8" ~/.rbenv/shims/bundle exec jekyll serve'