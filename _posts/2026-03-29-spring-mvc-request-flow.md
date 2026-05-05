---
layout: single
title: "Spring MVC 요청 처리 흐름 (DispatcherServlet 중심)"
date: 2026-03-29 01:51:35 +0900
categories: [spring]
tags: [spring, mvc, 스프링, 웹]
toc: true
excerpt: "요청이 Controller까지 어떻게 도착하는지 흐름을 알고 있으면 필터, 인터셉터, 예외 처리도 같이 이해하기 쉬워진다."
---

## 문제 상황

필터는 어디서 실행되는지, 인터셉터는 언제 도는지, 예외 처리는 누가 잡는지 헷갈리는 경우가 많습니다.

## 큰 흐름

Spring MVC 요청은 보통 아래 순서로 봅니다.

1. 클라이언트 요청 도착
2. 필터 통과
3. `DispatcherServlet` 진입
4. HandlerMapping으로 컨트롤러 찾기
5. HandlerAdapter로 메서드 실행
6. 응답 반환
7. 뷰 렌더링 또는 JSON 직렬화

## 왜 DispatcherServlet이 중요할까

Spring MVC의 중심이기 때문입니다. 컨트롤러를 직접 호출하지 않고, 요청을 어디로 보낼지 결정하고 주변 기능을 연결해 줍니다.

## 같이 이해하면 좋은 것

- 필터: 서블릿 앞단
- 인터셉터: 스프링 MVC 내부
- 예외 처리기: 컨트롤러 실행 이후 예외 처리

## 정리

요청 흐름을 알면 스프링 웹 구조가 훨씬 단순해집니다.

- 필터와 인터셉터 위치를 구분한다.
- DispatcherServlet이 MVC 흐름의 중심이다.
- 컨트롤러 실행 전후 확장 포인트를 함께 이해하면 좋다.
