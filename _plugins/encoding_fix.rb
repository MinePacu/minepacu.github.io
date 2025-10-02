# frozen_string_literal: true
# UTF-8 인코딩 강제 설정

Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

# 환경 변수도 함께 설정
ENV['LANG'] ||= 'ko_KR.UTF-8'
ENV['LC_ALL'] ||= 'ko_KR.UTF-8'
ENV['LC_CTYPE'] ||= 'ko_KR.UTF-8'