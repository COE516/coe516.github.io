---
layout: single
title: "Spring Boot에서 static resource 처리 방식"
date: 2026-03-31 01:51:35 +0900
categories: [spring]
tags: [spring, mvc, 스프링, 정적리소스]
toc: true
excerpt: "정적 파일이 어디서 서빙되는지 모르면 CSS, JS, 이미지 경로 문제를 자주 만나게 된다. Spring Boot의 기본 동작과 자주 틀리는 지점을 정리한다."
---

## 문제 상황

이미지나 CSS 파일을 넣었는데 404가 나거나, 로컬에서는 되는데 운영 경로에서만 깨지는 경우가 있습니다.

이럴 때 코드를 먼저 의심하기 쉽지만, 실제로는 정적 리소스 위치와 URL 경로를 헷갈린 경우가 많습니다.

## 기본 탐색 위치

Spring Boot는 기본적으로 아래 경로에서 정적 리소스를 찾습니다.

- `classpath:/static/`
- `classpath:/public/`
- `classpath:/resources/`
- `classpath:/META-INF/resources/`

예를 들어 `src/main/resources/static/css/app.css`에 파일이 있으면 보통 `/css/app.css`로 접근합니다.

## 왜 자주 헷갈릴까

정적 리소스는 컨트롤러처럼 매핑되지 않습니다.

예를 들어 `/users`는 컨트롤러가 처리할 수 있지만, `/css/app.css`는 리소스 핸들러가 파일을 찾아 서빙합니다. 이 둘을 같은 방식으로 생각하면 경로가 쉽게 꼬입니다.

## 자주 보는 문제

### 1. 파일 위치가 잘못된 경우

`src/main/resources/static/` 아래가 아니라 다른 디렉터리에 넣으면 기본 설정으로는 못 찾습니다.

### 2. 템플릿에서 경로를 잘못 쓴 경우

상대 경로로 적으면 현재 URL에 따라 깨질 수 있습니다.

```html
<link rel="stylesheet" href="/css/app.css">
```

처럼 절대 경로 기준으로 보는 편이 덜 헷갈립니다.

### 3. 운영 환경에서 컨텍스트 경로를 놓친 경우

애플리케이션이 루트(`/`)가 아니라 다른 context path 아래에서 뜨면, 하드코딩한 리소스 경로가 예상과 다르게 보일 수 있습니다.

## 실무에서 먼저 보는 순서

정적 리소스가 안 보이면 보통 이 순서로 확인합니다.

- 파일이 기본 탐색 위치에 있는가
- 브라우저가 요청한 URL이 정확한가
- 템플릿에서 상대 경로를 쓰고 있지 않은가
- 운영 환경에서 캐시나 context path 영향은 없는가

특히 브라우저 개발자 도구의 Network 탭에서 실제 요청 URL과 상태 코드를 먼저 보는 편이 빠릅니다.

## 정리

- Spring Boot는 정적 리소스를 정해진 classpath 위치에서 찾는다.
- 컨트롤러 URL과 정적 파일 경로는 처리 방식이 다르다.
- 404가 나면 코드보다 `파일 위치`, `참조 경로`, `실제 요청 URL`부터 확인하는 편이 빠르다.
