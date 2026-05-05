---
layout: single
title: "Spring @Async와 @Transactional을 같이 쓸 때 놓치기 쉬운 점"
date: 2026-04-08 01:44:37 +0900
categories: [spring]
tags: [spring, async, transactional, thread, propagation]
toc: true
excerpt: "@Async와 @Transactional을 함께 쓰면 같은 흐름처럼 보여도 실제로는 다른 스레드와 다른 트랜잭션으로 분리될 수 있다."
---

## 문제 상황

주문 저장은 먼저 끝내고, 메일 발송이나 후처리는 비동기로 넘기고 싶을 때가 많습니다.

그래서 아래처럼 작성하기 쉽습니다.

```java
@Transactional
public void placeOrder(OrderRequest request) {
    Order order = orderRepository.save(Order.create(request));
    notificationService.sendOrderCreated(order.getId());
}
```

```java
@Async
public void sendOrderCreated(Long orderId) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow();
    mailClient.send(order.getEmail());
}
```

겉으로는 같은 흐름처럼 보이지만, 실제로는 생각보다 다른 방식으로 동작합니다.

## 핵심은 스레드가 바뀐다는 점

`@Async`가 붙은 메서드는 별도 스레드에서 실행됩니다. 이 순간 기존 호출 스레드가 갖고 있던 트랜잭션 컨텍스트도 그대로 이어지지 않습니다.

즉 아래처럼 이해하는 편이 맞습니다.

- `placeOrder()`의 트랜잭션과
- `sendOrderCreated()`가 실행되는 시점의 작업은
- 같은 흐름처럼 보여도 같은 트랜잭션이 아니다.

그래서 비동기 메서드 안에서 원래 트랜잭션이 아직 살아 있다고 기대하면 문제가 생깁니다.

## 실무에서 생기는 문제

### 1. 아직 commit되지 않은 데이터를 기대하는 경우

비동기 작업이 너무 빨리 실행되면, 바깥 트랜잭션이 commit되기 전에 조회를 시도할 수 있습니다.

### 2. rollback과 함께 취소될 거라고 기대하는 경우

이미 비동기 작업이 큐에 실렸거나 실행을 시작했다면, 바깥 트랜잭션 rollback과 완전히 같이 움직이지 않을 수 있습니다.

### 3. Lazy 로딩 객체를 그대로 넘기는 경우

비동기 메서드에 엔티티 자체를 넘기면 세션 범위가 달라져 예기치 않은 lazy loading 문제가 생기기 쉽습니다.

## 어떻게 처리하는 게 안전할까

가장 무난한 방식은 **비동기 메서드에 최소한의 값만 넘기는 것**입니다.

```java
@Async
public void sendOrderCreated(Long orderId) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow();
    mailClient.send(order.getEmail());
}
```

이때도 "언제 실행되는가"를 분명히 해야 합니다. commit 이후에만 실행돼야 한다면 `@Async`만으로는 의도가 충분히 드러나지 않습니다.

## commit 이후 실행이 중요하다면

이럴 때는 이벤트를 발행하고 `@TransactionalEventListener`를 `AFTER_COMMIT`으로 두는 방식이 더 읽기 쉽습니다.

```java
@Transactional
public void placeOrder(OrderRequest request) {
    Order order = orderRepository.save(Order.create(request));
    eventPublisher.publishEvent(new OrderCreatedEvent(order.getId()));
}
```

이렇게 하면 "주문 저장 commit 이후에 후처리한다"는 의도가 분명해집니다.

## 정리

`@Async`와 `@Transactional`을 같이 쓸 때는 같은 요청 흐름처럼 보여도 실제 경계는 분리되어 있습니다.

핵심만 보면 이렇습니다.

- `@Async`는 다른 스레드에서 실행된다.
- 기존 트랜잭션이 그대로 전파된다고 보면 안 된다.
- rollback과 비동기 작업이 항상 같이 움직이지 않는다.
- 엔티티보다 ID 같은 단순 값 전달이 안전하다.

비동기 후처리가 commit 이후에만 실행돼야 한다면, `@Async` 하나로 해결하려 하기보다 이벤트 기반 구조가 더 자연스럽습니다.
