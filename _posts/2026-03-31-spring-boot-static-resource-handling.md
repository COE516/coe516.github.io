---
layout: single
title: "Spring Boot에서 static resource 처리 방식"
date: 2026-03-31 01:51:35 +0900
categories: [spring]
tags: [spring, mvc, 스프링, 정적리소스]
toc: true
excerpt: "정적 파일이 어디서 서빙되는지 모르면 CSS나 이미지 경로 문제를 자주 만나게 된다. 기본 동작을 정리한다."
---

## 문제 상황

이미지나 CSS 파일을 넣었는데 404가 나거나, 템플릿에서는 되는데 운영 경로에서만 깨지는 경우가 있습니다.

## 기본 동작

Spring Boot는 기본적으로 정적 리소스를 특정 경로에서 찾습니다.

대표적으로 아래 위치입니다.

- `classpath:/static/`
- `classpath:/public/`
- `classpath:/resources/`
- `classpath:/META-INF/resources/`

## 왜 헷갈릴까

애플리케이션 URL 매핑과 정적 리소스 경로를 같은 것으로 생각하면 쉽게 꼬입니다. 컨트롤러 경로와 정적 파일 경로는 처리 방식이 다릅니다.

## 실무 포인트

- 파일 위치를 먼저 확인한다.
- 템플릿에서 참조하는 경로가 절대경로/상대경로인지 본다.
- 캐시 전략이 필요한지 같이 본다.

## 정리

정적 리소스 문제는 대부분 복잡한 버그보다 경로 이해 문제입니다.

- 기본 탐색 위치를 안다.
- URL 경로와 파일 위치를 구분한다.
- 운영에서는 캐시 정책까지 같이 본다.
