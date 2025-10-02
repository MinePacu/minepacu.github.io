# GitHub-style Alert Blocks 사용 가이드

## 📋 개요

GitHub 스타일의 Alert/Callout 블록 기능이 구현되었습니다. 마크다운에서 특정 정보를 시각적으로 강조하여 표시할 수 있습니다.

## 🎨 지원되는 Alert 타입

### 1. **Note (참고/정보)** 📘
- **색상**: 파란색
- **용도**: 일반적인 추가 정보나 참고사항
- **아이콘**: ℹ️

```markdown
> [!NOTE]
> Useful information that users should know, even when skimming content.
```

### 2. **Tip (팁)** 💡
- **색상**: 초록색
- **용도**: 유용한 조언이나 더 나은 방법 제안
- **아이콘**: 💡

```markdown
> [!TIP]
> Helpful advice for doing things better or more easily.
```

### 3. **Important (중요)** 💜
- **색상**: 보라색
- **용도**: 목표 달성을 위해 꼭 알아야 하는 핵심 정보
- **아이콘**: 📢

```markdown
> [!IMPORTANT]
> Key information users need to know to achieve their goal.
```

### 4. **Warning (경고)** ⚠️
- **색상**: 주황색
- **용도**: 문제를 피하기 위해 즉시 주의해야 하는 정보
- **아이콘**: ⚠️

```markdown
> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.
```

### 5. **Caution (주의)** 🔴
- **색상**: 빨간색
- **용도**: 특정 행동의 위험이나 부정적 결과에 대한 조언
- **아이콘**: 🚫

```markdown
> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.
```

## 📝 사용법

### 기본 문법

```markdown
> [!TYPE]
> Your alert content here.
```

**TYPE**은 다음 중 하나여야 합니다:
- `NOTE`
- `TIP`
- `IMPORTANT`
- `WARNING`
- `CAUTION`

### 예제

#### 단일 줄
```markdown
> [!NOTE]
> 이것은 간단한 참고사항입니다.
```

#### 여러 줄
```markdown
> [!WARNING]
> 한 개의 Free Tier 당 코어 4개, 메모리 24GB까지가 무료다.
> 이 범위를 벗어나면 벗어난 만큼 요금 청구가 시작된다.
```

#### 복잡한 내용
```markdown
> [!TIP]
> Jekyll 서버를 실행할 때는 다음 명령어를 사용하세요:
> 
> ```bash
> ./tools/run.sh
> ```
> 
> 이 명령어는 자동으로 UTF-8 인코딩 문제를 해결합니다.
```

## 🎯 실제 사용 예제

### Oracle Cloud 가이드에서
```markdown
> [!WARNING]
> 한 개의 Free Tier 당 코어 4개, 메모리 24GB까지가 무료다.
> 이 범위를 벗어나면 벗어난 만큼 요금 청구가 시작된다.
```

### 맥 셋팅 가이드에서
```markdown
> [!TIP]
> Homebrew를 먼저 설치하면 다른 도구들을 쉽게 설치할 수 있습니다.
```

### 프로그래밍 튜토리얼에서
```markdown
> [!IMPORTANT]
> 이 함수는 반드시 메인 루프 이전에 호출되어야 합니다.
```

### 문제 해결 가이드에서
```markdown
> [!CAUTION]
> 이 명령어는 데이터를 복구할 수 없게 삭제합니다.
> 실행 전에 반드시 백업을 만드세요.
```

## 🌓 다크 모드 지원

Alert 블록은 자동으로 다크 모드를 지원합니다:
- 라이트 모드: 밝은 배경색과 진한 텍스트
- 다크 모드: 어두운 배경색과 밝은 텍스트

## 🔧 기술 구현

### 1. SCSS 스타일
- 파일: `_sass/components/_alerts.scss`
- 각 Alert 타입별 색상 및 아이콘 정의
- 다크 모드 자동 지원

### 2. JavaScript 처리
- 파일: `assets/js/alert-processor.js`
- 마크다운 blockquote를 Alert 블록으로 변환
- 페이지 로드 시 자동 실행

### 3. 레이아웃 통합
- 파일: `_layouts/post.html`
- 모든 포스트에 자동 적용

## 📊 브라우저 호환성

- ✅ Chrome/Edge (최신)
- ✅ Firefox (최신)
- ✅ Safari (최신)
- ✅ 모바일 브라우저

## 🎨 커스터마이징

### 색상 변경

`_sass/components/_alerts.scss` 파일에서 색상을 수정할 수 있습니다:

```scss
&.markdown-alert-note {
  border-left-color: #0969da; // 테두리 색상
  background-color: rgba(9, 105, 218, 0.1); // 배경색
  
  .markdown-alert-title {
    color: #0969da; // 제목 색상
  }
}
```

### 아이콘 변경

SVG 데이터 URL을 수정하여 아이콘을 변경할 수 있습니다:

```scss
&::before {
  background-image: url("data:image/svg+xml,...");
}
```

## 💡 팁과 베스트 프랙티스

### ✅ 좋은 사용 예

```markdown
> [!NOTE]
> 이 기능은 Jekyll 4.0 이상에서만 작동합니다.

> [!WARNING]
> 프로덕션 환경에서는 반드시 테스트를 거친 후 배포하세요.
```

### ❌ 피해야 할 사용

```markdown
> [!노트]  ❌ 한글 키워드는 작동하지 않음
> 내용

> [!note]  ❌ 소문자는 작동하지 않음
> 내용

[!NOTE]  ❌ > 없이 사용하면 작동하지 않음
내용
```

## 🔍 문제 해결

### Alert가 표시되지 않을 때

1. **문법 확인**
   - `>` 기호로 시작하는지 확인
   - `[!TYPE]` 형식이 정확한지 확인
   - TYPE이 대문자인지 확인

2. **JavaScript 로드 확인**
   - 브라우저 콘솔에서 에러 확인
   - `alert-processor.js`가 로드되는지 확인

3. **CSS 적용 확인**
   - 브라우저 개발자 도구로 스타일 확인
   - `_alerts.scss`가 컴파일되는지 확인

## 📚 참고 자료

- [GitHub Alerts 공식 문서](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts)
- Jekyll Chirpy Theme 문서
- Markdown 문법 가이드

---

**마지막 업데이트:** 2025-10-02
**버전:** 1.0.0