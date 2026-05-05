---
layout: single
title: "Spring TransactionalEventListener는 언제 실행될까"
date: 2026-03-24 01:44:37 +0900
categories: [spring]
tags: [spring, event, transaction, after-commit, domain-event]
toc: true
excerpt: "이벤트는 발행했는데 왜 바로 실행되지 않거나 rollback과 함께 사라지는지 헷갈릴 때가 있다. TransactionalEventListener의 실행 시점을 정리한다."
---

## 문제 상황

주문 저장이 끝난 뒤에만 알림을 보내고 싶어서 이벤트를 붙이는 경우가 많습니다.

```java
@Transactional
public void placeOrder(OrderRequest request) {
    Order order = orderRepository.save(Order.create(request));
    eventPublisher.publishEvent(new OrderCreatedEvent(order.getId()));
}
```

```java
@TransactionalEventListener
public void handle(OrderCreatedEvent event) {
    notificationService.send(event.orderId());
}
```

이때 흔한 질문이 하나 생깁니다. 이벤트를 발행했는데 왜 바로 실행되지 않거나, rollback이 나면 왜 동작하지 않을까?

## 일반 이벤트 리스너와 다른 점

`@EventListener`는 이벤트가 발행되면 그 시점에 바로 처리됩니다.

반면 `@TransactionalEventListener`는 **현재 트랜잭션의 생명주기에 맞춰 실행 시점을 조정**합니다. 그래서 이름 그대로 트랜잭션과 연결된 이벤트 리스너라고 보면 됩니다.

기본값은 `AFTER_COMMIT`입니다.

즉, 별도 설정 없이 사용하면 보통 아래 의미가 됩니다.

- 트랜잭션이 정상 commit되면 실행
- rollback되면 실행되지 않음

## 왜 이게 중요한가

실무에서는 "DB 저장은 실패했는데 메일은 보내졌다" 같은 불일치를 줄이는 게 중요합니다.

`AFTER_COMMIT` 리스너를 쓰면 적어도 **commit이 끝난 뒤에만 후처리를 시작한다**는 의도가 코드에서 바로 보입니다.

## 자주 헷갈리는 포인트

### 이벤트 발행 시점에 바로 실행된다고 생각하는 경우

`publishEvent()`를 호출했다고 해서 그 줄에서 바로 모든 후처리가 끝난다고 보면 안 됩니다. `TransactionalEventListener`는 phase에 따라 나중에 실행될 수 있습니다.

### rollback인데도 실행될 거라고 기대하는 경우

기본값이 `AFTER_COMMIT`이면 rollback 시 실행되지 않는 것이 정상입니다.

### 트랜잭션 밖에서 발행했는데 왜 동작이 다르지?

현재 트랜잭션이 없는 상황에서 발행하면 기대와 다른 실행 흐름이 나올 수 있습니다. 그래서 이런 리스너는 보통 "트랜잭션 안에서 발행되는 이벤트"라는 전제가 있어야 읽기 쉽습니다.

## 어떻게 쓰는 게 좋은가

의도가 commit 이후 후처리라면 phase를 명시해두는 편이 더 분명합니다.

```java
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void handle(OrderCreatedEvent event) {
    notificationService.send(event.orderId());
}
```

코드를 처음 보는 사람도 "이건 저장 완료 이후에만 돈다"는 걸 바로 이해할 수 있습니다.

## 언제 잘 맞을까

아래 같은 작업에 특히 잘 맞습니다.

- 메일 발송
- 알림 전송
- 외부 시스템 후속 호출
- 감사 로그 저장 시작점 분리

반대로 "DB 저장과 완전히 한 몸처럼 묶여야 하는 작업"이라면 이벤트로 분리하기 전에 정말 비동기/후처리여도 되는지 먼저 보는 편이 낫습니다.

## 정리

`@TransactionalEventListener`를 쓰면 이벤트 실행 시점을 트랜잭션과 함께 읽을 수 있습니다.

핵심은 이렇습니다.

- 일반 이벤트 리스너와 실행 시점이 다르다.
- 기본값은 `AFTER_COMMIT`이다.
- rollback되면 실행되지 않는 것이 자연스럽다.
- commit 이후 후처리 의도를 드러낼 때 특히 좋다.

이벤트 기반 구조에서 중요한 건 "이벤트를 발행했는가"보다 "언제 실행되도록 설계했는가"입니다.
