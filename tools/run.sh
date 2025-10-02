#!/usr/bin/env bash
#
# Run jekyll serve and then launch the site

# UTF-8 인코딩 환경 변수 설정 (한글 경로 지원)
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
export LC_CTYPE=ko_KR.UTF-8
export RUBYOPT="-Eutf-8"

# rbenv 초기화 (rbenv를 사용하는 경우)
if command -v rbenv &> /dev/null; then
  eval "$(rbenv init - zsh)"
fi

prod=false
command="bundle exec jekyll s -l"
host="127.0.0.1"

help() {
  echo "Usage:"
  echo
  echo "   bash /path/to/run [options]"
  echo
  echo "Options:"
  echo "     -H, --host [HOST]    Host to bind to."
  echo "     -p, --production     Run Jekyll in 'production' mode."
  echo "     -h, --help           Print this help information."
}

while (($#)); do
  opt="$1"
  case $opt in
  -H | --host)
    host="$2"
    shift 2
    ;;
  -p | --production)
    prod=true
    shift
    ;;
  -h | --help)
    help
    exit 0
    ;;
  *)
    echo -e "> Unknown option: '$opt'\n"
    help
    exit 1
    ;;
  esac
done

command="$command -H $host"

if $prod; then
  command="JEKYLL_ENV=production $command"
fi

# Docker 환경 또는 한글 경로 사용 시 force_polling 사용
# macOS에서 한글 폴더명 사용 시 FSEvents 대신 polling 사용하여 인코딩 문제 회피
if [ -e /proc/1/cgroup ] && grep -q docker /proc/1/cgroup; then
  command="$command --force_polling"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS에서 한글 경로 문제 해결을 위해 force_polling 사용
  command="$command --force_polling"
fi

echo -e "\n> $command\n"
eval "$command"
