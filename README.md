# MinePacu 개발 일기

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deploy-success)](https://minepacu.github.io)
[![Jekyll](https://img.shields.io/badge/Jekyll-4.3+-blue)](https://jekyllrb.com)
[![Theme](https://img.shields.io/badge/Theme-Chirpy-brightgreen)](https://github.com/cotes2020/jekyll-theme-chirpy)

개발한 프로그램들과 개발 지식 + 잡다한 이야기가 담긴 개인 블로그입니다.

## 🚀 사이트 정보

- **URL**: [https://minepacu.github.io](https://minepacu.github.io)
- **언어**: 한국어 (ko-KR)
- **시간대**: Asia/Seoul
- **테마**: [Jekyll Theme Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy)

## 🛠️ 기술 스택

- **Static Site Generator**: Jekyll
- **Theme**: [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) by [Cotes Chung](https://github.com/cotes2020)
- **Hosting**: GitHub Pages
- **Domain**: GitHub.io subdomain

## ✨ 커스터마이징 기능

### Mermaid 다이어그램 팝업
- Mermaid 다이어그램 클릭 시 확대 팝업 기능
- 모바일/데스크톱 반응형 지원
- 줌인/줌아웃, 드래그 이동 기능

### 각주 툴팁
- 각주에 마우스 오버 시 툴팁으로 내용 미리보기
- 사용자 경험 개선

## 🚦 로컬 개발 환경

### 필요 조건
- Ruby 3.0+
- Jekyll 4.3+
- Bundler

### 설치 및 실행
```bash
# 의존성 설치
bundle install

# 개발 서버 실행
./tools/run.sh

# 또는
bundle exec jekyll serve --livereload
```

### 빌드
```bash
# 프로덕션 빌드
./tools/test.sh

# 또는
JEKYLL_ENV=production bundle exec jekyll build
```

## 📂 프로젝트 구조

```
├── _config.yml           # Jekyll 설정
├── _data/               # 데이터 파일들
├── _includes/           # 커스텀 include 파일들
│   ├── head-custom.html
│   ├── footer-custom.html
│   ├── mermaid-popup.html
│   └── footnote-tooltip.html
├── _layouts/            # 레이아웃 파일들
├── _posts/              # 블로그 포스트들
├── _sass/               # 커스텀 스타일시트
├── assets/              # 정적 리소스
│   ├── css/
│   ├── js/
│   └── img/
├── tools/               # 빌드/개발 스크립트
│   ├── run.sh
│   └── test.sh
└── README.md
```

## 🎨 커스텀 기능 상세

### 1. Mermaid 팝업 확대
- **파일**: `assets/js/mermaid-popup.js`, `assets/css/mermaid-popup.css`
- **기능**: 다이어그램 클릭 시 모달 팝업으로 확대 표시
- **지원**: 줌, 드래그, 키보드 단축키

### 2. 반응형 디자인
- **모바일**: 최소 패딩으로 최대 콘텐츠 영역 확보
- **태블릿**: 터치 친화적 패딩 적용
- **데스크톱**: 기본 Chirpy 테마 레이아웃 유지

## 📄 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE) 하에 배포됩니다.

## 🙏 크레딧

- **Jekyll Theme Chirpy**: [cotes2020/jekyll-theme-chirpy](https://github.com/cotes2020/jekyll-theme-chirpy)
- **개발자**: [Cotes Chung](https://github.com/cotes2020)

Original Chirpy theme is created by [Cotes Chung](https://github.com/cotes2020) and is licensed under the MIT License.

## 📞 연락처

- **GitHub**: [@MinePacu](https://github.com/MinePacu)
- **Twitter**: [@MinePacu_](https://x.com/MinePacu_)
- **Email**: minepacu@gmail.com

---

이 사이트는 개인 학습과 지식 공유를 목적으로 운영됩니다.
