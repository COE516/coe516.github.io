---
layout: single
title: "Spring @Transactional(readOnly = true)를 쓰면 정말 안전할까"
date: 2026-03-26 01:44:37 +0900
categories: [spring]
tags: [spring, transaction, jpa, 트랜잭션]
toc: true
excerpt: "readOnly 트랜잭션을 붙였다고 해서 쓰기가 완전히 막히는 것은 아니다. 실무에서 자주 생기는 오해를 짧게 정리한다."
---

## 문제 상황

조회용 서비스에 `@Transactional(readOnly = true)`를 붙여두면 왠지 안전장치가 생긴 것처럼 느껴질 때가 있습니다.

그래서 아래처럼 읽기 전용 메서드 안에서 엔티티를 만지고도 "어차피 readOnly니까 반영 안 되겠지"라고 생각하기 쉽습니다.

```java
@Transactional(readOnly = true)
public MemberProfileResponse getProfile(Long memberId) {
    Member member = memberRepository.findById(memberId)
        .orElseThrow();

    member.changeNickname("temp-name");
    return MemberProfileResponse.from(member);
}
```

그런데 환경에 따라 예상과 다르게 update가 발생하거나, 반대로 전혀 막아주지 못해 헷갈리는 경우가 있습니다.

## 왜 이런 오해가 생길까

`readOnly = true`는 이름 그대로 "쓰기 금지"를 강제하는 기능이라기보다, **이 트랜잭션은 읽기 중심이다**라는 힌트를 주는 설정에 가깝습니다.

Spring + JPA 조합에서는 보통 아래 두 가지 효과를 기대합니다.

- flush 동작을 줄이거나
- dirty checking 비용을 줄이는 방향으로 동작하도록 유도

하지만 이건 어디까지나 구현체와 설정에 따른 최적화 성격이 강합니다. 즉, `readOnly = true`를 붙였다고 해서 모든 쓰기 시도가 예외로 막히는 것은 아닙니다.

## 실무에서 자주 생기는 착각

### 1. 쓰기가 아예 불가능하다고 생각하는 경우

가장 흔한 오해입니다. JPA 엔티티를 수정했다고 해서 항상 즉시 막히는 것은 아닙니다.

### 2. 성능 최적화가 항상 크게 된다고 생각하는 경우

조회 메서드마다 무조건 `readOnly = true`를 붙인다고 성능이 극적으로 좋아지지는 않습니다. 병목이 쿼리 자체에 있으면 readOnly보다 인덱스, fetch 전략, 쿼리 구조가 더 중요합니다.

### 3. 서비스 의도를 흐리게 만드는 경우

정말 읽기만 해야 하는 메서드인지, 아니면 조회 후 상태 변경 가능성이 있는 메서드인지 먼저 분리하는 편이 더 중요합니다.

## 어떻게 보는 게 맞을까

실무에서는 `readOnly = true`를 **쓰기 차단 장치**보다 **의도 표현 + 약한 최적화 힌트**로 보는 편이 안전합니다.

- 조회 전용 서비스라는 의도를 드러낸다.
- 불필요한 flush 가능성을 줄인다.
- 하지만 잘못된 상태 변경을 완전히 막아주지는 않는다.

즉, "readOnly니까 괜찮다"가 아니라 "정말 읽기 전용 흐름만 들어오게 설계했는가"를 먼저 봐야 합니다.

## 적용 팁

### 조회 전용 메서드에만 붙인다

```java
@Transactional(readOnly = true)
public OrderDetailResponse getOrderDetail(Long orderId) {
    Order order = orderRepository.findDetailById(orderId)
        .orElseThrow();
    return OrderDetailResponse.from(order);
}
```

### 상태 변경 메서드와 섞지 않는다

조회 후 조건에 따라 저장까지 이어지는 메서드라면 애매하게 readOnly를 붙이지 않는 편이 낫습니다.

### 쓰기 방지는 코드 구조로 해결한다

엔티티 변경이 일어나면 안 되는 흐름이라면 DTO로 변환을 빨리 끝내거나, 읽기 모델과 쓰기 모델을 분리하는 쪽이 더 확실합니다.

## 정리

`@Transactional(readOnly = true)`는 유용하지만 생각보다 만능은 아닙니다.

핵심은 이 정도로 기억하면 충분합니다.

- 쓰기를 완전히 막아주는 장치는 아니다.
- 조회 중심이라는 의도를 드러내는 데 유용하다.
- 성능 문제는 readOnly보다 쿼리와 매핑 구조가 더 큰 원인인 경우가 많다.
- 읽기 전용 흐름은 애노테이션보다 코드 구조로 지키는 편이 안전하다.
