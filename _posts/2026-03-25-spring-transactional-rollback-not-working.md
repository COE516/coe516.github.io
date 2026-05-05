---
layout: single
title: "Spring @Transactional이 rollback 안 되는 이유와 동작 원리 제대로 이해하기"
date: 2026-03-25 01:18:17 +0900
categories: [spring]
tags: [spring, transactional, transaction, rollback, aop]
toc: true
excerpt: "@Transactional의 기본 동작과 rollback이 기대대로 일어나지 않는 대표 원인을 짧고 실무적으로 정리한다."
---

## 개요

`@Transactional`은 자주 쓰지만, 막상 rollback이 안 되면 이유를 바로 떠올리기 어렵습니다.

대부분의 원인은 복잡하지 않습니다. 아래 세 가지만 먼저 보면 빠르게 좁혀집니다.

1. 프록시를 탔는가
2. 예외가 밖으로 전파됐는가
3. 그 예외가 rollback 대상인가

이 글에서는 이 기준으로 `@Transactional`을 짧게 정리해보겠습니다.

## @Transactional은 어떻게 동작하나

`@Transactional`은 메서드 실행 전후에 트랜잭션 경계를 만들어 주는 선언형 기능입니다.

흐름은 보통 아래와 같습니다.

1. 메서드 호출 전에 트랜잭션 시작
2. 비즈니스 로직 실행
3. 정상 종료하면 commit
4. 예외가 발생하면 rollback 규칙에 따라 rollback 또는 commit

중요한 점은 `@Transactional`이 메서드 내부를 바꾸는 것이 아니라, **Spring 프록시가 메서드 호출을 감싸서 동작한다**는 점입니다. 그래서 호출 방식에 따라 트랜잭션이 아예 적용되지 않을 수도 있습니다.

## 기본 rollback 규칙

기본 규칙은 단순합니다.

- `RuntimeException`, `Error`는 rollback
- 체크 예외(`Exception`)는 기본적으로 rollback하지 않음

아래 코드는 예외가 발생해도 자동 rollback 대상이 아닙니다.

```java
@Transactional
public void createOrder(OrderRequest request) throws Exception {
    orderRepository.save(Order.create(request));
    throw new Exception("checked exception");
}
```

체크 예외까지 rollback하려면 명시해야 합니다.

```java
@Transactional(rollbackFor = Exception.class)
public void createOrder(OrderRequest request) throws Exception {
    orderRepository.save(Order.create(request));
    throw new Exception("checked exception");
}
```

실무에서 "분명 실패했는데 DB에는 남아 있네?"라는 상황이 나오면 가장 먼저 여기부터 확인하면 됩니다.

## rollback이 안 되는 대표적인 이유

### 1. 체크 예외를 던졌다

가장 흔한 경우입니다. 체크 예외를 쓰고 있다면 기본 설정만으로는 rollback되지 않습니다.

```java
@Transactional
public void registerMember(MemberCreateCommand command) throws Exception {
    memberRepository.save(new Member(command.email()));
    throw new Exception("이미 사용 중인 이메일입니다.");
}
```

해결 방법은 둘 중 하나입니다.

- `RuntimeException` 계열 예외로 바꾼다.
- `rollbackFor`를 명시한다.

### 2. 예외를 catch하고 끝냈다

메서드 안에서 예외를 잡고 넘겨버리면 Spring은 정상 종료로 판단할 수 있습니다.

```java
@Transactional
public void pay(PaymentRequest request) {
    paymentRepository.save(Payment.ready(request));

    try {
        externalPgClient.approve(request);
    } catch (Exception e) {
        log.warn("PG 승인 실패", e);
    }
}
```

이 코드는 외부 호출에 실패해도 commit될 수 있습니다. rollback이 필요하다면 예외를 다시 던지는 쪽이 가장 명확합니다.

```java
@Transactional
public void pay(PaymentRequest request) {
    paymentRepository.save(Payment.ready(request));

    try {
        externalPgClient.approve(request);
    } catch (Exception e) {
        throw new IllegalStateException("PG 승인 실패", e);
    }
}
```

### 3. 같은 클래스 내부에서 호출했다

`@Transactional`은 프록시 기반이라 self-invocation에 약합니다.

```java
@Service
public class OrderService {

    public void placeOrder(OrderRequest request) {
        saveOrder(request);
    }

    @Transactional
    public void saveOrder(OrderRequest request) {
        orderRepository.save(Order.create(request));
        throw new IllegalStateException("주문 저장 실패");
    }
}
```

겉으로는 `saveOrder()`에 `@Transactional`이 붙어 있지만, 같은 객체 내부 호출이라 프록시를 거치지 않을 수 있습니다. 이런 경우 트랜잭션이 시작되지 않습니다.

가장 단순한 해결 방법은 트랜잭션 경계를 다른 빈으로 분리하는 것입니다.

### 4. 트랜잭션이 분리돼 있었다

전파 속성 때문에 rollback 범위를 다르게 이해하는 경우도 많습니다. 대표적으로 `REQUIRES_NEW`는 기존 트랜잭션과 별개로 동작합니다.

```java
@Transactional
public void publishArticle(ArticleCommand command) {
    articleRepository.save(Article.create(command));
    auditService.writeLog(command);
    throw new IllegalStateException("발행 실패");
}

@Transactional(propagation = Propagation.REQUIRES_NEW)
public void writeLog(ArticleCommand command) {
    auditLogRepository.save(AuditLog.from(command));
}
```

이 경우 바깥 로직이 rollback돼도 `writeLog()`는 이미 커밋됐을 수 있습니다. 일부 데이터만 남는다면 예외뿐 아니라 전파 속성도 같이 봐야 합니다.

## 실무에서 이렇게 보면 빠르다

트랜잭션 문제가 생기면 저는 보통 아래 순서로 봅니다.

### 1. 예외 타입

- `RuntimeException`인가
- 체크 예외인가
- 중간에 catch해서 삼키고 있지는 않은가

### 2. 호출 구조

- `@Transactional` 메서드가 다른 Spring 빈에서 호출되는가
- 같은 클래스 내부 호출은 아닌가
- private 메서드에만 붙어 있지는 않은가

### 3. 전파 속성

- `REQUIRED`인지
- `REQUIRES_NEW` 같은 분리된 트랜잭션이 있는지

### 4. 로그

트랜잭션 흐름이 애매하면 로그를 켜두는 게 가장 빠릅니다.

```yaml
logging:
  level:
    org.springframework.transaction.interceptor: TRACE
    org.springframework.orm.jpa: DEBUG
```

## 정리

`@Transactional`이 기대대로 동작하지 않을 때는 애노테이션 유무보다 **호출 방식, 예외 전파, 예외 타입, 전파 속성**을 같이 봐야 합니다.

핵심만 다시 정리하면 이렇습니다.

- 기본 rollback 대상은 `RuntimeException`과 `Error`
- 체크 예외는 기본적으로 rollback되지 않음
- 같은 클래스 내부 호출은 프록시를 타지 않을 수 있음
- 예외를 catch하고 끝내면 commit될 수 있음

이 네 가지만 기억해도 rollback 문제를 훨씬 빨리 좁혀갈 수 있습니다.
