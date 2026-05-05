---
layout: single
title: "@ControllerAdvice로 글로벌 예외 처리하기"
date: 2026-04-26 01:51:35 +0900
categories: [api]
tags: [spring, api, error-handling, 예외처리]
toc: true
excerpt: "컨트롤러마다 try-catch를 넣기보다 글로벌 예외 처리로 응답 형식을 맞추는 방법을 실무 기준으로 정리한다."
---

## 문제 상황

컨트롤러마다 예외를 직접 잡기 시작하면 에러 응답 형식이 금방 제각각이 됩니다. 어떤 곳은 `400`, 어떤 곳은 `500`, 어떤 곳은 문자열만 내려가면 클라이언트도 예외 케이스를 계속 따로 처리해야 합니다.

그래서 실무에서는 예외를 "어디서 잡을까"보다 **응답 정책을 어디서 통일할까**로 보는 편이 더 중요합니다.

## 왜 글로벌 처리로 가나

`@ControllerAdvice`를 쓰면 공통 예외 응답 정책을 한 곳에 모을 수 있습니다.

```java
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handle(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
    }
}
```

이렇게 두면 컨트롤러는 정상 흐름에 집중하고, 예외 응답 형식은 공통 규칙으로 관리할 수 있습니다.

## 언제 특히 효과가 큰가

- API가 여러 개라 응답 형식이 쉽게 흔들릴 때
- 검증 오류, 비즈니스 오류, 서버 오류를 구분해야 할 때
- 프런트엔드나 다른 소비자가 에러 코드를 기준으로 처리할 때

## 자주 놓치는 부분

### 모든 예외를 한 번에 뭉뚱그려 처리하는 경우

이렇게 하면 응답은 통일돼도 원인 구분이 약해집니다. `IllegalArgumentException`, 도메인 예외, 예상 못 한 시스템 예외는 분리하는 편이 낫습니다.

### 컨트롤러에서 다시 try-catch를 남발하는 경우

전역 처리로 가져갔다면 컨트롤러는 정말 필요한 경우만 직접 잡는 편이 낫습니다.

### 메시지만 맞추고 상태 코드는 흐리는 경우

에러 본문뿐 아니라 어떤 예외를 `400`, `404`, `409`, `500`으로 볼지도 같이 정해야 일관성이 생깁니다.

## 짧은 기준

- 공통 예외 응답은 `@ControllerAdvice`로 모은다.
- 예외 종류별로 상태 코드 정책을 나눈다.
- 컨트롤러는 정상 흐름에 집중하게 둔다.
- 전역 처리의 목적은 try-catch 제거보다 응답 일관성 유지다.

## 정리

- 글로벌 예외 처리는 API 응답 형식을 맞추는 데 가장 효과적이다.
- 중요한 것은 한곳에 모으는 것보다 예외 종류별 정책을 분명히 두는 것이다.
- 컨트롤러가 예외 처리까지 다 떠안기 시작하면 코드가 빨리 지저분해진다.
- 실무에서는 정상 흐름과 예외 응답 정책을 분리하는 편이 훨씬 관리하기 쉽다.
