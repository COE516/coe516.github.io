---
layout: single
title: "Circular dependency 오류 해결 방법"
date: 2026-05-05 01:51:35 +0900
categories: [spring]
tags: [spring, dependency-injection, circular-dependency, bean, design]
toc: true
excerpt: "순환 참조 오류는 주입 방식보다 설계 신호에 가깝다. 왜 생기고 어떻게 끊을지 정리한다."
---

## 문제 상황

서비스를 나누다 보면 어느 순간 A가 B를 주입받고, B도 다시 A를 주입받는 구조가 생깁니다. 예전에는 어찌어찌 동작하던 코드가 Spring Boot 버전이 올라가면서 바로 실패하는 경우도 많습니다.

## 왜 문제일까

순환 참조는 단순히 스프링이 까다로운 것이 아니라, **책임 경계가 흐려졌다는 신호**인 경우가 많습니다.

예를 들면 이런 구조입니다.

```java
@Service
class OrderService {
    private final PaymentService paymentService;
}

@Service
class PaymentService {
    private final OrderService orderService;
}
```

두 서비스가 서로를 알아야 한다는 건 보통 역할이 잘못 섞였다는 뜻입니다.

## 흔한 원인

- 두 서비스가 같은 비즈니스 흐름을 양쪽에서 다 처리함
- 조회와 상태 변경 책임이 섞임
- 공통 로직을 분리하지 않고 서로 호출함

## 해결 방법

### 1. 공통 책임을 별도 서비스로 분리

가장 흔한 해결책입니다.

### 2. 방향성을 한쪽으로 고정

한 서비스가 다른 서비스를 호출하는 방향만 남기고 역방향 호출을 제거합니다.

### 3. 이벤트로 분리

강하게 묶이지 않아도 되는 후처리라면 이벤트로 끊는 편이 자연스럽습니다.

## 임시 우회는 조심

`@Lazy`로 막을 수는 있어도 구조 문제까지 해결되지는 않습니다. 급한 장애 대응이 아니라면 설계 정리를 먼저 보는 편이 낫습니다.

## 정리

순환 참조는 주입 기술 문제가 아니라 설계 문제인 경우가 많습니다.

핵심은 이렇습니다.

- 서로가 서로를 알아야 하는지 먼저 의심한다.
- 공통 책임을 분리한다.
- 호출 방향을 한쪽으로 정리한다.
- `@Lazy`는 임시 우회로만 본다.
