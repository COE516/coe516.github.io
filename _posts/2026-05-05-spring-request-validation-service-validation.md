---
layout: single
title: "Spring 검증 로직은 Controller에서 끝내야 할까 Service에서도 해야 할까"
date: 2026-05-05 01:44:37 +0900
categories: [spring]
tags: [spring, validation, controller, service, api]
toc: true
excerpt: "요청 검증을 어디까지 Controller에서 하고, 어떤 규칙은 Service에서 다시 확인해야 하는지 경계를 짧게 정리한다."
---

## 문제 상황

`@Valid`를 붙여두면 요청 검증이 어느 정도 해결되기 때문에, 검증 책임을 전부 Controller에 두고 싶어질 때가 있습니다.

```java
@PostMapping("/members")
public void create(@Valid @RequestBody MemberCreateRequest request) {
    memberService.create(request);
}
```

하지만 실무에서는 Controller 검증만으로 끝나지 않는 경우가 많습니다.

## Controller 검증이 잘하는 일

Controller 레벨 검증은 **요청 형식**을 빠르게 걸러내는 데 좋습니다.

예를 들면 이런 것들입니다.

- 필수값 누락
- 문자열 길이
- 이메일 형식
- 숫자 범위

이런 규칙은 요청을 받자마자 막는 편이 자연스럽고, 에러 응답도 만들기 쉽습니다.

## Service에서도 검증이 필요한 이유

비즈니스 규칙은 보통 Service에서 다시 확인해야 합니다.

예를 들면 아래 같은 것들입니다.

- 이미 가입된 이메일인지
- 주문 상태가 취소 가능한 상태인지
- 재고가 실제로 충분한지
- 현재 사용자에게 수정 권한이 있는지

이런 규칙은 요청 JSON 형식만 보고는 판단할 수 없습니다. DB 조회, 현재 상태, 권한 정보가 같이 필요하기 때문입니다.

## 흔한 실수

### 1. 비즈니스 규칙까지 DTO 애노테이션으로 밀어 넣는 경우

요청 객체가 너무 무거워지고, 검증 로직이 여러 엔드포인트에서 재사용되기 어려워집니다.

### 2. Service 검증을 생략하는 경우

나중에 배치, 메시지 소비자, 내부 API 같은 다른 진입점이 생기면 Controller 검증만으로는 규칙을 지킬 수 없습니다.

### 3. 같은 검증을 중복해서 쓰는 경우

형식 검증과 비즈니스 검증의 책임이 섞이면 코드가 길어지고 에러 메시지도 일관성을 잃기 쉽습니다.

## 경계를 이렇게 나누면 편하다

저는 보통 아래 기준으로 나눕니다.

### Controller
- 형식 검증
- 필수값 검증
- 타입/범위 검증

### Service
- 상태 검증
- 중복 검증
- 권한 검증
- 저장 직전의 비즈니스 규칙 검증

이렇게 나누면 각 계층의 역할이 명확해집니다.

## 예시

```java
public void create(MemberCreateRequest request) {
    if (memberRepository.existsByEmail(request.email())) {
        throw new IllegalStateException("이미 가입된 이메일입니다.");
    }

    memberRepository.save(new Member(request.email(), request.name()));
}
```

이 검증은 `@Email`이나 `@NotBlank`로는 대체할 수 없습니다. 결국 Service에서 다시 확인해야 하는 규칙입니다.

## 정리

검증을 어디서 할지 헷갈리면 형식과 비즈니스 규칙을 나눠서 보면 됩니다.

핵심은 이렇습니다.

- Controller는 요청 형식을 검증한다.
- Service는 비즈니스 규칙을 검증한다.
- 다른 진입점이 생겨도 지켜져야 하는 규칙은 Service에 둔다.
- 모든 검증을 한 계층에 몰아넣으면 코드가 금방 지저분해진다.

`@Valid`가 편리한 건 맞지만, 그것만으로 도메인 규칙까지 지켜주지는 않습니다.
