# Jekyll 한글 경로 인코딩 문제 해결 가이드

## 🔍 문제 상황

Jekyll 서버(`bundle exec jekyll serve`) 실행 중 한글 경로의 파일을 수정할 때 다음과 같은 에러가 발생:

```
ERROR -- : Exception rescued in listen-worker_thread:
Encoding::CompatibilityError: incompatible character encodings: BINARY (ASCII-8BIT) and UTF-8
```

## 🎯 원인 분석

### 1. 한글 폴더/파일명 사용
- `_posts/가이드/서버/오라클/` 등의 한글 경로
- Jekyll의 `listen` gem이 파일 변경 감지 시 인코딩 처리 실패

### 2. macOS 파일시스템 이슈
- macOS는 UTF-8 NFD (정규분해) 방식 사용
- Ruby/Jekyll은 UTF-8 NFC (정규결합) 방식 기대
- 인코딩 불일치로 인한 오류

### 3. Ruby 환경 설정 부족
- 기본 환경에서 UTF-8 인코딩이 명시적으로 설정되지 않음

## ✅ 해결 방법

### 방법 1: 환경 변수 설정 (권장)

#### A. 임시 해결 (현재 터미널 세션에만 적용)

```bash
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
export LC_CTYPE=ko_KR.UTF-8
export RUBYOPT="-Eutf-8"

bundle exec jekyll serve
```

#### B. 영구 해결 (~/.zshrc에 추가)

```bash
# ~/.zshrc 파일 편집
nano ~/.zshrc

# 다음 내용 추가:
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
export LC_CTYPE=ko_KR.UTF-8
export RUBYOPT="-Eutf-8"

# 적용
source ~/.zshrc
```

#### C. Alias 생성 (편리한 명령어)

```bash
# ~/.zshrc에 추가
alias jekyll-serve='LANG=ko_KR.UTF-8 LC_ALL=ko_KR.UTF-8 RUBYOPT="-Eutf-8" bundle exec jekyll serve'

# 사용법
jekyll-serve
```

### 방법 2: 프로젝트 스크립트 사용

#### 기존 스크립트 활용
```bash
# UTF-8 지원이 추가된 run.sh 사용
./tools/run.sh

# 또는 새로 생성한 serve-utf8.sh 사용
./tools/serve-utf8.sh
```

#### VS Code Task 사용
- `Cmd + Shift + B` → "Run Jekyll Server" 선택
- 또는 "Run Jekyll Server (UTF-8)" 선택

### 방법 3: Jekyll 설정 파일 수정

`_config.yml`에 다음 추가:
```yaml
encoding: utf-8
```

## 🔧 적용된 수정 사항

### 1. _config.yml
- `encoding: utf-8` 추가

### 2. tools/run.sh
- UTF-8 환경 변수 설정 추가
```bash
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
export LC_CTYPE=ko_KR.UTF-8
export RUBYOPT="-Eutf-8"
```

### 3. tools/test.sh
- 동일한 UTF-8 환경 변수 설정 추가

### 4. tools/serve-utf8.sh (신규)
- UTF-8 지원이 명시된 별도 실행 스크립트

### 5. .vscode/tasks.json
- 모든 Jekyll 관련 task에 환경 변수 추가
- 새로운 "Run Jekyll Server (UTF-8)" task 추가

## 🎯 권장 사용법

### 일반 사용자
```bash
# 터미널에서
./tools/run.sh

# 또는 VS Code에서
Cmd + Shift + B
```

### 개발자
```bash
# ~/.zshrc에 환경 변수 추가 후
bundle exec jekyll serve

# 또는 alias 사용
jekyll-serve
```

## 🧪 테스트 방법

1. **서버 실행**
   ```bash
   ./tools/run.sh
   ```

2. **한글 경로의 파일 수정**
   ```bash
   # 예: _posts/가이드/서버/오라클/2025-10-02-Oracle-서버-만들기.md
   ```

3. **에러 없이 자동 재생성 확인**
   ```
   Regenerating: 1 file(s) changed at ...
   ...done in X.XX seconds.
   ```

## 📊 해결 효과

### Before (문제 발생 시)
```
ERROR -- : Exception rescued in listen-worker_thread:
Encoding::CompatibilityError: incompatible character encodings: BINARY (ASCII-8BIT) and UTF-8
```

### After (해결 후)
```
Regenerating: 1 file(s) changed at 2025-10-02 15:30:00
                _posts/가이드/서버/오라클/2025-10-02-Oracle-서버-만들기.md
                ...done in 0.5 seconds.
```

## 🚨 주의사항

1. **모든 터미널에서 동작하려면** `~/.zshrc`에 환경 변수 추가 필요
2. **GitHub Actions에서도** 동일한 환경 변수 설정 권장
3. **협업 시** 팀원들에게 이 가이드 공유

## 🔗 관련 이슈

- Jekyll Issue: https://github.com/jekyll/jekyll/issues/...
- Listen Gem: https://github.com/guard/listen
- macOS UTF-8 정규화: https://developer.apple.com/library/...

## 📚 추가 참고자료

- Ruby Encoding: https://ruby-doc.org/core/Encoding.html
- Jekyll Configuration: https://jekyllrb.com/docs/configuration/
- macOS Locale Settings: https://support.apple.com/...