---
layout: single
title: "Open Session In View를 켠 채로 두면 생기는 문제"
date: 2026-03-28 01:44:37 +0900
categories: [spring]
tags: [spring, jpa, 스프링, 지연로딩]
toc: true
excerpt: "OSIV는 편할 때가 많지만 조회 쿼리가 어디서 발생하는지 흐려지기 쉽다. 왜 문제로 이어지는지 짧게 정리한다."
---

## 문제 상황

처음에는 잘 동작하는 것처럼 보이는데, 운영에 들어가면 컨트롤러나 응답 직렬화 과정에서 예상하지 못한 쿼리가 나가는 경우가 있습니다.

대표적으로 이런 코드입니다.

```java
@GetMapping("/orders/{id}")
public OrderResponse getOrder(@PathVariable Long id) {
    Order order = orderService.findById(id);
    return OrderResponse.from(order);
}
```

서비스에서는 주문만 조회했다고 생각했는데, 응답 DTO를 만드는 시점에 연관 엔티티가 lazy loading되면서 쿼리가 추가로 실행될 수 있습니다.

## 왜 이런 일이 가능할까

OSIV(Open Session In View)가 켜져 있으면 요청이 끝날 때까지 영속성 컨텍스트가 열려 있습니다.

그래서 서비스 계층을 벗어난 뒤에도 lazy loading이 가능해집니다. 이게 처음에는 편합니다. 하지만 동시에 **쿼리가 어디서 발생하는지 흐리게 만든다**는 문제가 생깁니다.

## 실무에서 불편한 점

### 1. 쿼리 위치가 예측되지 않는다

조회는 서비스에서 끝난 줄 알았는데, 컨트롤러나 직렬화 과정에서 추가 쿼리가 발생할 수 있습니다.

### 2. N+1을 늦게 발견한다

개발 중에는 "잘 나오네" 하고 지나가기 쉽지만, 실제 데이터가 많아지면 응답 생성 과정에서 N+1이 드러납니다.

### 3. 계층 경계가 흐려진다

서비스 계층에서 필요한 데이터를 다 준비해야 하는데, OSIV가 켜져 있으면 나중에 필요할 때 꺼내 쓰는 방식으로 코드가 흘러가기 쉽습니다.

## 무조건 꺼야 할까

항상 그런 것은 아닙니다. 단순한 프로젝트에서는 개발 편의성이 분명 있습니다.

다만 서비스 규모가 커지고 쿼리 제어가 중요해지면, 보통은 OSIV를 끄고 서비스 계층에서 필요한 조회를 명확히 끝내는 쪽이 유지보수에 유리합니다.

## 어떤 방식이 더 읽기 좋을까

핵심은 응답에 필요한 데이터를 서비스 계층에서 분명하게 준비하는 것입니다.

```java
@Transactional(readOnly = true)
public OrderResponse getOrderDetail(Long orderId) {
    Order order = orderRepository.findDetailById(orderId)
        .orElseThrow();
    return OrderResponse.from(order);
}
```

이렇게 하면 쿼리가 어디서 실행되는지 추적하기 쉬워지고, fetch join이나 projection 전략도 함께 다루기 편해집니다.

## 정리

OSIV는 편리하지만 쿼리 위치를 흐리게 만들 수 있습니다.

핵심만 정리하면 이렇습니다.

- lazy loading이 서비스 바깥에서도 일어날 수 있다.
- 컨트롤러나 직렬화 중 추가 쿼리가 나갈 수 있다.
- N+1을 늦게 발견하기 쉽다.
- 규모가 커질수록 서비스 계층에서 조회를 끝내는 습관이 중요하다.

처음에는 편의성이 장점이지만, 운영 단계에서는 "왜 여기서 쿼리가 나가지?"라는 질문을 자주 만들 수 있는 설정이기도 합니다.
