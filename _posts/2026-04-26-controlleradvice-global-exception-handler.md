---
layout: single
title: "@ControllerAdvice로 글로벌 예외 처리하기"
date: 2026-04-26 01:51:35 +0900
categories: [api]
tags: [spring, api, error-handling, 예외처리]
toc: true
excerpt: "컨트롤러마다 try-catch를 넣기보다 글로벌 예외 처리로 응답 형식을 맞추는 방법을 정리한다."
---

## 문제 상황

컨트롤러마다 예외를 직접 잡기 시작하면 에러 응답 형식이 쉽게 제각각이 됩니다.

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

## 장점

- 응답 형식 통일
- 컨트롤러 코드 단순화
- 예외별 상태 코드 관리 쉬움

## 주의점

모든 예외를 한 메서드에서 뭉뚱그려 처리하면 오히려 원인 구분이 어려워집니다.

## 정리

- 공통 예외는 `@ControllerAdvice`로 모은다.
- 예외 종류별로 상태 코드와 메시지 정책을 분리한다.
- 컨트롤러는 정상 흐름에 집중하게 둔다.
