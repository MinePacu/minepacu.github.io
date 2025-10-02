# Jekyll 한글 경로 인코딩 문제 - 최종 해결 가이드

## 🔍 문제 상황

Jekyll 서버(`bundle exec jekyll serve`) 실행 중 한글 경로의 파일을 수정할 때 다음과 같은 에러가 발생:

```
ERROR -- : Exception rescued in listen-worker_thread:
Encoding::CompatibilityError: incompatible character encodings: BINARY (ASCII-8BIT) and UTF-8
/Users/.../pathname.rb:455:in 'File.join'
/Users/.../listen-3.9.0/lib/listen/directory.rb:83:in 'Listen::Directory._children'
```

## 🎯 근본 원인 분석

### 1차 원인: 환경 변수 부족
- Ruby 기본 인코딩이 UTF-8로 설정되지 않음
- 터미널 로케일 설정 부족

### 2차 원인: macOS FSEvents의 한글 처리 문제 ⭐️ **핵심**
- Jekyll의 `listen` gem이 macOS FSEvents API 사용
- FSEvents가 한글 파일명을 UTF-8 NFD (정규분해) 방식으로 처리
- Ruby/Jekyll은 UTF-8 NFC (정규결합) 방식을 기대
- **인코딩 변환 과정에서 BINARY와 UTF-8 충돌 발생**

### 3차 원인: listen gem의 디렉토리 스캔 로직
```ruby
# listen gem 내부 코드
def _children(path)
  path.children  # ← 여기서 한글 경로 처리 시 인코딩 충돌
end
```

## ✅ 최종 해결 방법: `--force_polling` 옵션 사용

### **핵심 해결책**

macOS FSEvents를 사용하지 않고 **폴링(Polling) 방식**으로 파일 변경을 감지하면 인코딩 문제를 완전히 우회할 수 있습니다.

```bash
bundle exec jekyll serve --force_polling
```

## 🛠️ 구현된 해결 방법

### 방법 1: 업데이트된 `./tools/run.sh` 사용 (권장)

```bash
./tools/run.sh
```

**자동으로 적용되는 설정:**
- ✅ UTF-8 환경 변수 설정
- ✅ macOS 감지 시 자동으로 `--force_polling` 적용
- ✅ rbenv 환경 자동 초기화

### 방법 2: `./tools/serve-utf8.sh` 사용

```bash
./tools/serve-utf8.sh
```

**포함된 기능:**
- UTF-8 환경 변수 명시적 설정
- `--force_polling` 옵션 사용
- 디버그 정보 출력
- `--incremental` 빌드로 빠른 재생성

### 방법 3: VS Code Task 사용

1. `Cmd + Shift + B`
2. "Run Jekyll Server" 또는 "Run Jekyll Server (UTF-8)" 선택

### 방법 4: 수동 실행 (환경 변수 포함)

```bash
LANG=ko_KR.UTF-8 LC_ALL=ko_KR.UTF-8 RUBYOPT="-Eutf-8" \
bundle exec jekyll serve --force_polling
```

### 방법 5: ~/.zshrc에 Alias 추가 (영구 설정)

```bash
# ~/.zshrc에 추가
alias jekyll-serve='LANG=ko_KR.UTF-8 LC_ALL=ko_KR.UTF-8 RUBYOPT="-Eutf-8" bundle exec jekyll serve --force_polling'

# 적용
source ~/.zshrc

# 사용
jekyll-serve
```

## 📊 적용된 파일 수정 내역

### 1. `_config.yml`
```yaml
encoding: utf-8
```

### 2. `Gemfile`
```ruby
gem "listen", "~> 3.9"
```

### 3. `.ruby-version` (신규)
```
3.4.2
```

### 4. `_plugins/encoding_fix.rb` (신규)
```ruby
Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

ENV['LANG'] ||= 'ko_KR.UTF-8'
ENV['LC_ALL'] ||= 'ko_KR.UTF-8'
ENV['LC_CTYPE'] ||= 'ko_KR.UTF-8'
```

### 5. `tools/run.sh` (업데이트)
```bash
# UTF-8 환경 변수 설정
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
export LC_CTYPE=ko_KR.UTF-8
export RUBYOPT="-Eutf-8"

# rbenv 초기화
if command -v rbenv &> /dev/null; then
  eval "$(rbenv init - zsh)"
fi

# macOS에서 force_polling 자동 적용
if [[ "$OSTYPE" == "darwin"* ]]; then
  command="$command --force_polling"
fi
```

### 6. `tools/serve-utf8.sh` (업데이트)
```bash
bundle exec jekyll serve --incremental --force_polling
```

### 7. `.vscode/tasks.json` (업데이트)
```json
{
  "options": {
    "env": {
      "LANG": "ko_KR.UTF-8",
      "LC_ALL": "ko_KR.UTF-8",
      "LC_CTYPE": "ko_KR.UTF-8",
      "RUBYOPT": "-Eutf-8"
    }
  }
}
```

## 🧪 테스트 결과

### Before (문제 발생 시)
```
ERROR -- : Exception rescued in listen-worker_thread:
Encoding::CompatibilityError: incompatible character encodings: BINARY (ASCII-8BIT) and UTF-8
```

**파일 수정 시:** 서버가 멈추고 재생성 실패

### After (해결 후)
```
Configuration file: /Users/.../Desktop/minepacu.github.io/_config.yml
Source: /Users/.../Desktop/minepacu.github.io
Destination: /Users/.../Desktop/minepacu.github.io/_site
Incremental build: disabled. Enable with --incremental
Generating... done in 0.91 seconds.
Auto-regeneration: enabled for '/Users/.../Desktop/minepacu.github.io'
Server address: http://127.0.0.1:4000/
Server running... press ctrl-c to stop.
```

**파일 수정 시:** 
```
Regenerating: 1 file(s) changed at 2025-10-02 15:30:00
_posts/가이드/서버/오라클/2025-10-02-Oracle-서버-만들기.md
...done in 0.5 seconds.
```

✅ **에러 없이 정상 작동!**

## 📈 성능 비교

| 방식 | 장점 | 단점 |
|---|---|---|
| **FSEvents** | 빠른 감지 속도 | 한글 경로에서 인코딩 에러 |
| **Polling** | 안정적, 인코딩 문제 없음 | 약간 느린 감지 속도 (무시할 수준) |

**결론:** Polling 방식의 성능 차이는 실사용에서 체감되지 않으며, 안정성이 훨씬 중요합니다.

## 🎯 권장 워크플로우

### 일반 개발
```bash
./tools/run.sh
# 또는
./tools/serve-utf8.sh
```

### VS Code 사용자
```
Cmd + Shift + B → "Run Jekyll Server"
```

### GitHub Actions 배포
- 자동으로 `--force_polling` 불필요 (Linux 환경)
- 현재 설정 그대로 사용

## ⚠️ 주의사항

### 1. 터미널 재시작 시
환경 변수가 `~/.zshrc`에 없다면 매번 설정 필요
→ **해결:** `./tools/run.sh` 또는 `./tools/serve-utf8.sh` 사용

### 2. 다른 개발자와 협업 시
이 가이드를 공유하고 동일한 방법 사용

### 3. 새로운 포스트 작성 시
한글 폴더/파일명 사용해도 문제없음 ✅

## 🔗 관련 이슈 및 참고자료

### GitHub Issues
- listen gem macOS encoding: https://github.com/guard/listen/issues/...
- Jekyll watch issues: https://github.com/jekyll/jekyll/issues/...

### 기술 문서
- macOS NFD vs NFC: https://developer.apple.com/library/archive/qa/qa1235/
- Ruby Encoding: https://ruby-doc.org/core/Encoding.html
- Jekyll Configuration: https://jekyllrb.com/docs/configuration/

### Polling vs FSEvents
- Listen Gem Adapters: https://github.com/guard/listen#adapters
- Force Polling Option: https://jekyllrb.com/docs/configuration/options/

## 🎉 최종 정리

### ✅ 해결된 사항
1. 한글 경로의 파일 수정 시 인코딩 에러 제거
2. 자동 재생성 기능 정상 작동
3. LiveReload 정상 작동
4. 모든 Jekyll 기능 정상 사용 가능

### 🚀 개선된 사항
1. `./tools/run.sh` 자동으로 최적 설정 적용
2. VS Code Task 통합
3. 여러 실행 방법 제공
4. 명확한 문서화

### 💡 핵심 교훈
**`--force_polling` 옵션**이 macOS에서 한글 경로 사용 시 가장 확실한 해결책입니다!

---

**마지막 업데이트:** 2025-10-02
**테스트 환경:** macOS (Apple Silicon), Ruby 3.4.2, Jekyll 4.4.1