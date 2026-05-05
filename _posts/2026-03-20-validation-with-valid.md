---
layout: single
title: "Validation(@Valid) 제대로 사용하는 방법"
date: 2026-03-20 01:51:35 +0900
categories: [api]
tags: [spring, validation, valid, dto, api]
toc: true
excerpt: "@Valid는 편리하지만 형식 검증과 비즈니스 검증을 분리해서 써야 효과적이다. 기본 사용 기준을 정리한다."
---

## 문제 상황

`@Valid`를 붙여두면 검증이 끝난 것처럼 느껴질 때가 있습니다. 하지만 실제로는 요청 형식 검증에 더 가깝습니다.

## 잘 맞는 사용처

- 필수값 검증
- 문자열 길이 검증
- 이메일/숫자 형식 검증

```java
public record MemberCreateRequest(
    @NotBlank String name,
    @Email String email
) {}
```

## 한계

- 중복 이메일 여부
- 주문 상태 검증
- 권한 검증

이런 규칙은 `@Valid`만으로 처리하기 어렵습니다.

## 실무 기준

- 형식 검증은 DTO에서
- 비즈니스 검증은 Service에서
- 예외 응답은 `@ControllerAdvice`로 통일

## 정리

`@Valid`는 좋지만 만능은 아닙니다.

- 요청 형식 검증에 강하다.
- 비즈니스 규칙까지 대신해주지 않는다.
- 계층별 책임을 나눠 쓰는 편이 깔끔하다.
