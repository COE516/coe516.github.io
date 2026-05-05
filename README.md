# Developer Jy.Kang's Blog

개인 기술 블로그 저장소입니다.
Jekyll과 GitHub Pages를 기반으로 운영하고 있으며, Minimal Mistakes 테마를 사용합니다.

## 로컬 실행

```bash
bundle install
bundle exec jekyll serve
```

브라우저에서 `http://127.0.0.1:4000`으로 확인할 수 있습니다.

## 디렉터리 구조

- `_posts/` : 블로그 글
- `_pages/` : 소개, 카테고리, 태그 같은 고정 페이지
- `_data/navigation.yml` : 상단 메뉴 설정
- `assets/` : 이미지, CSS, JS 같은 정적 파일
- `_includes/`, `_layouts/`, `_sass/` : 테마 커스터마이징 파일
- `_config.yml` : 사이트 전역 설정

## 글 작성 규칙

포스트 파일은 아래 형식을 따릅니다.

```text
_posts/YYYY-MM-DD-slug.md
```

예시:

```text
_posts/2026-05-05-api-response-format-strategy.md
```

기본 front matter 예시는 다음과 같습니다.

```yaml
---
layout: single
title: "글 제목"
date: 2026-05-05 01:51:35 +0900
categories: [api]
tags: [api, backend]
toc: true
excerpt: "글 요약"
---
```

## 페이지 구조

- `/` : 홈
- `/about/` : 블로그 소개
- `/categories/` : 카테고리 아카이브
- `/tags/` : 태그 아카이브

## 운영 메모

- permalink는 `_config.yml` 기준으로 `/:categories/:title/` 형식을 사용합니다.
- 카테고리와 태그는 아카이브 페이지 구성에 사용됩니다.
- 생성 결과물인 `_site/`는 저장소에 포함하지 않습니다.

## 참고

이 저장소는 블로그 운영 기준으로 정리되어 있으며, 글 작성과 페이지 관리에 필요한 파일만 유지하는 것을 기준으로 합니다.
