---
title: "Alert Blocks 테스트 - GitHub 스타일 경고/팁 블록"
date: 2025-10-02 16:10 +0900
categories: [가이드, 개발환경]
tags: [development]
---

이 포스트는 GitHub 스타일의 Alert Blocks 기능을 테스트하기 위한 예제입니다.

## Alert 타입별 예제

### 1. Note (참고)

> [!NOTE]
> 이것은 Note 타입의 Alert입니다. 사용자가 알아두면 좋은 유용한 정보를 표시할 때 사용합니다.

### 2. Tip (팁)

> [!TIP]
> 이것은 Tip 타입의 Alert입니다. 더 나은 방법이나 유용한 조언을 제공할 때 사용합니다.
> 
> 여러 줄로 작성할 수도 있습니다.

### 3. Important (중요)

> [!IMPORTANT]
> 이것은 Important 타입의 Alert입니다. 
> 목표를 달성하기 위해 반드시 알아야 하는 핵심 정보를 강조할 때 사용합니다.

### 4. Warning (경고)

> [!WARNING]
> 이것은 Warning 타입의 Alert입니다.
> 문제를 피하기 위해 즉시 주의가 필요한 정보를 표시합니다.

### 5. Caution (주의)

> [!CAUTION]
> 이것은 Caution 타입의 Alert입니다.
> 위험이나 부정적인 결과에 대해 경고할 때 사용합니다.
> 
> 가장 강력한 경고 수준입니다.

## 실제 사용 예제

### Jekyll 서버 실행하기

Jekyll 서버를 실행하기 전에 다음 사항들을 확인하세요:

> [!NOTE]
> Jekyll 4.0 이상 버전이 필요합니다. 버전 확인: `jekyll --version`

> [!TIP]
> UTF-8 인코딩 문제를 피하려면 `./tools/run.sh` 스크립트를 사용하세요.

서버 실행 명령어:

<!-- filename: terminal -->
```bash
./tools/run.sh
```

> [!WARNING]
> 한글 경로를 사용하는 경우 `--force_polling` 옵션이 자동으로 적용됩니다.

> [!CAUTION]
> `bundle exec jekyll clean` 명령어는 `_site` 폴더의 모든 내용을 삭제합니다.
> 중요한 파일이 있다면 먼저 백업하세요.

## 코드와 함께 사용

> [!IMPORTANT]
> 다음 코드는 반드시 `_config.yml` 파일에 추가해야 합니다:
> 
> ```yaml
> encoding: utf-8
> ```

> [!TIP]
> VS Code를 사용한다면 `Cmd + Shift + B`로 Jekyll 서버를 빠르게 실행할 수 있습니다.

## 복잡한 내용과 함께

### Oracle Cloud Free Tier

Oracle Cloud의 무료 티어를 사용할 때 주의사항:

> [!NOTE]
> Oracle Cloud Infrastructure는 다음과 같은 무료 티어를 제공합니다:
> - VM.Standard.A1.Flex: 4 OCPU
> - 메모리: 24GB RAM
> - 스토리지: 200GB Block Volume

> [!WARNING]
> 무료 티어 한도:
> - **CPU**: 최대 4 코어
> - **메모리**: 최대 24GB
> - **이 범위를 초과하면 요금이 청구됩니다**

> [!CAUTION]
> 리전 선택 시 주의사항:
> 
> 1. 한국 리전은 가입이 매우 어려움
> 2. 일본 리전 추천
> 3. 가입 실패 시 24시간 후 재시도

## 다크 모드 테스트

이 Alert 블록들은 다크 모드에서도 자동으로 적절한 색상으로 표시됩니다.

> [!NOTE]
> 다크 모드에서는 더 어두운 배경색과 밝은 텍스트를 사용합니다.

> [!TIP]
> 브라우저의 다크 모드 설정을 변경하여 테스트해보세요.

## 중첩된 내용

> [!IMPORTANT]
> Alert 블록 안에 다양한 마크다운 요소를 사용할 수 있습니다:
> 
> - 리스트 항목 1
> - 리스트 항목 2
> - 리스트 항목 3
> 
> **굵은 텍스트**와 *기울임 텍스트*도 가능합니다.
> 
> `인라인 코드`도 사용할 수 있습니다.

## 결론

> [!TIP]
> Alert Blocks를 적절히 활용하면 독자의 주의를 효과적으로 끌 수 있습니다.
> 하지만 너무 많이 사용하면 오히려 역효과가 날 수 있으니 적절히 사용하세요.

> [!NOTE]
> 더 자세한 사용법은 [Alert Blocks 가이드](/docs/ALERT_BLOCKS_GUIDE.md)를 참고하세요.
