#!/bin/bash
# Jekyll 서버 실행 스크립트 (인코딩 문제 해결)

# UTF-8 인코딩 환경 변수 설정
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
export LC_CTYPE=ko_KR.UTF-8

# Ruby 인코딩 설정
export RUBYOPT="-Eutf-8"

# rbenv 초기화 (rbenv를 사용하는 경우)
if command -v rbenv &> /dev/null; then
  eval "$(rbenv init - zsh)"
fi

echo "================================"
echo "Jekyll Server with UTF-8 Support"
echo "================================"
echo "LANG: $LANG"
echo "LC_ALL: $LC_ALL"
echo "RUBYOPT: $RUBYOPT"
echo "Ruby Version: $(ruby -v)"
echo "Using: force_polling (for Korean path compatibility)"
echo "================================"
echo ""

# Jekyll 서버 실행 (force_polling으로 인코딩 문제 회피)
bundle exec jekyll serve --incremental --force_polling

echo ""
echo "Jekyll server stopped."