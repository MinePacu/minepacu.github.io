# Quick Fix: Jekyll 한글 경로 인코딩 문제

## 🚨 문제
```
ERROR -- : Exception rescued in listen-worker_thread:
Encoding::CompatibilityError: incompatible character encodings
```

## ✅ 빠른 해결

### 가장 간단한 방법
```bash
./tools/run.sh
```

### 또는
```bash
./tools/serve-utf8.sh
```

### 수동 실행
```bash
bundle exec jekyll serve --force_polling
```

## 📖 자세한 설명
- [완전한 해결 가이드](./ENCODING_FINAL_SOLUTION.md)
- [추가 설정 방법](./ENCODING_ISSUE_GUIDE.md)

## 💡 핵심 요약
**`--force_polling` 옵션**을 사용하면 macOS에서 한글 경로 문제가 완전히 해결됩니다!