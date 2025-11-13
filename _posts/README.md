# _posts 폴더 구조 가이드

## 📂 폴더 구조

```
_posts/
├── 만든-프로그램들/
│   ├── CustomWindow/
│   │   └── YYYY-MM-DD-제목.md
│   ├── CraftPresence/
│   │   └── YYYY-MM-DD-제목.md
│   └── README.md
├── 가이드/
│   ├── 개발환경/
│   │   └── YYYY-MM-DD-제목.md
│   ├── 서버/
│   │   └── 오라클/
│   │       └── YYYY-MM-DD-제목.md
│   └── README.md
├── 일지/
│   └── YYYY-MM-DD-제목.md
└── 프로그램/
    └── 개발일지/
        └── YYYY-MM-DD-제목.md
```

## 📋 카테고리별 가이드

### 1. 만든 프로그램들 (만든-프로그램들/)

직접 개발한 프로그램들의 **개발 과정**, **기능 구현 방법**, **문제 해결 과정**을 다룹니다.

#### CustomWindow/
```yaml
---
title: CustomWindow - 창 드래그 기능 구현
date: 2025-11-13 10:00:00 +0900
categories: [만든 프로그램들, CustomWindow]
tags: [customwindow, wpf, csharp, development, problem-solving]
---
```

**권장 태그:**
- `customwindow` (필수)
- `wpf`, `csharp`, `dotnet`, `winui3`
- `development`, `debugging`, `problem-solving`
- `feature-implementation`, `ui-design`

#### CraftPresence/
```yaml
---
title: CraftPresence - Discord RPC 연동
date: 2025-11-13 10:00:00 +0900
categories: [만든 프로그램들, CraftPresence]
tags: [craftpresence, minecraft, discord-rpc, java]
---
```

**권장 태그:**
- `craftpresence` (필수)
- `minecraft`, `forge`, `fabric`
- `discord-rpc`, `discord`
- `java`, `development`

### 2. 가이드 (가이드/)

각종 설정 및 사용 가이드를 다룹니다.

#### 개발환경/ (가이드/개발환경/)
```yaml
---
title: macOS 개발 환경 셋팅
date: 2025-11-13 10:00:00 +0900
categories: [가이드, 개발환경]
tags: [mac-setup, development-environment, homebrew]
---
```

#### 서버/오라클/ (가이드/서버/오라클/)
```yaml
---
title: Oracle Cloud 무료 서버 만들기
date: 2025-11-13 10:00:00 +0900
categories: [가이드, 서버, 오라클]
tags: [oracle, cloud, server-setup, free-tier]
---
```

### 3. 일지 (일지/)

개인적인 일상 또는 잡다한 기록을 다룹니다.

```yaml
---
title: 오늘의 일지
date: 2025-11-13 10:00:00 +0900
categories: [일지]
tags: [diary, daily]
---
```

### 4. 프로그램/개발일지 (프로그램/개발일지/)

> ⚠️ **참고**: 이 카테고리는 레거시입니다. 
> 새로운 포스트는 `만든-프로그램들/` 하위 카테고리를 사용하세요.

```yaml
---
title: 개발 일지 - 날짜
date: 2025-11-13 10:00:00 +0900
categories: [프로그램, 개발일지]
tags: [diary, development]
---
```

## 📝 파일명 규칙

모든 포스트 파일은 다음 형식을 따라야 합니다:

```
YYYY-MM-DD-제목.md
```

**예시:**
- `2025-11-13-CustomWindow-창-드래그-구현.md`
- `2025-11-13-Oracle-서버-생성-가이드.md`
- `2025-11-13-개발-일지-1.md`

## 🏷️ 태그 네이밍 규칙

1. **모두 소문자** 사용
2. **단어 구분**은 하이픈(`-`) 사용
3. **일관성** 유지

**좋은 예시:**
```yaml
tags: [customwindow, wpf, problem-solving, feature-implementation]
```

**나쁜 예시:**
```yaml
tags: [CustomWindow, WPF, Problem Solving, featureImplementation]
```

## 🔍 카테고리 vs 태그

### 카테고리 (Categories)
- **계층적 구조** 표현
- **2단계까지** 권장 (최대 3단계)
- 포스트의 **주제 분류**

```yaml
categories: [만든 프로그램들, CustomWindow]
```

### 태그 (Tags)
- **키워드** 중심
- **개수 제한 없음**
- 포스트의 **세부 주제** 표현

```yaml
tags: [customwindow, wpf, csharp, debugging, problem-solving]
```

## ✅ Front Matter 체크리스트

포스트를 작성할 때 다음 항목들을 확인하세요:

```yaml
---
title: 명확하고 구체적인 제목              # ✅ 필수
date: YYYY-MM-DD HH:MM:SS +0900          # ✅ 필수
categories: [카테고리1, 카테고리2]         # ✅ 필수
tags: [tag1, tag2, tag3]                 # ✅ 권장
description: 포스트 요약 (선택사항)        # ⭐ 선택
mermaid: true                            # ⭐ 다이어그램 사용시
math: true                               # ⭐ 수식 사용시
---
```

## 📚 참고 자료

- [Jekyll 공식 문서](https://jekyllrb.com/docs/posts/)
- [Chirpy Theme 문서](https://github.com/cotes2020/jekyll-theme-chirpy)
- [Markdown 작성 가이드](/alert-guide/)
