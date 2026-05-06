---
layout: single
title: "트랜잭션을 Service 계층에 두는 이유"
date: 2026-03-22 01:51:35 +0900
categories: [spring]
tags: [spring, transaction, 스프링, 트랜잭션]
toc: true
excerpt: "트랜잭션은 보통 비즈니스 작업 단위에 맞춰야 한다. 그래서 Controller나 Repository보다 Service 계층이 기본 선택이 되는 경우가 많다."
---

## 문제 상황

`@Transactional`을 어디에 둘지 애매할 때가 많습니다.

- Controller에 둘지
- Repository마다 붙일지
- Service에 둘지

겉보기에는 어디에 붙여도 동작할 수 있지만, 경계를 잘못 잡으면 커밋 시점이 흐려지고 로직 책임도 섞이기 쉽습니다.

## 왜 Service가 기본일까

트랜잭션은 보통 **하나의 비즈니스 작업 단위**를 묶습니다.

예를 들어 주문 생성은 보통 아래를 함께 처리합니다.

- 주문 저장
- 재고 차감
- 결제 상태 기록

이 흐름은 Repository 하나의 책임이 아니라, 여러 저장 작업과 검증을 묶은 하나의 업무입니다. 이 단위와 가장 잘 맞는 계층이 Service입니다.

## 핵심 기준

트랜잭션 위치가 애매하면 아래 기준을 먼저 봅니다.

- 하나의 업무를 함께 성공/실패시켜야 하는가
- 여러 Repository 호출을 묶는가
- 검증과 상태 변경이 한 흐름으로 움직이는가
- 웹 진입점이 바뀌어도 같은 경계를 유지해야 하는가

이 질문에 많이 걸리면 Service에 두는 편이 자연스럽습니다.

## Repository에 두면 아쉬운 점

Repository는 데이터 접근이 중심입니다.

여기에 트랜잭션 경계를 두면 각 저장 로직이 기술적으로는 동작해도, "주문 생성 전체를 한 번에 성공/실패시킨다"는 비즈니스 의미가 약해집니다.

특히 Repository 여러 개를 조합하는 순간 경계가 금방 애매해집니다.

## Controller에 두면 왜 어색할까

Controller는 웹 요청/응답을 다루는 계층입니다.

여기에 트랜잭션을 두면 웹 진입점이 바뀔 때마다 같은 업무 로직의 경계도 같이 흔들릴 수 있습니다. 같은 기능을 배치나 메시지 소비에서 재사용할 때도 구조가 덜 깔끔해집니다.

## 보통 이런 식으로 둔다

```java
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final StockRepository stockRepository;
    private final PaymentRepository paymentRepository;

    @Transactional
    public void createOrder(CreateOrderCommand command) {
        orderRepository.save(...);
        stockRepository.decrease(...);
        paymentRepository.save(...);
    }
}
```

핵심은 `save()` 자체가 아니라 `createOrder()` 전체를 한 작업으로 보는 것입니다.

## 자주 헷갈리는 포인트

### Controller에 두면 안 되나

기술적으로는 될 수 있지만, 업무 로직이 웹 계층에 묶이기 쉬워집니다.

### Repository마다 따로 두면 안 되나

각 저장은 묶일 수 있어도, 업무 전체를 한 번에 성공/실패시키는 경계는 흐려지기 쉽습니다.

### 모든 Service 메서드에 무조건 붙여야 하나

그렇지는 않습니다.

단순 조회 메서드는 별도 판단이 필요하고, 조회 전용이면 `readOnly = true`를 검토할 수 있습니다. 중요한 건 모든 메서드에 일괄 적용하는 것보다, 업무 단위가 있는 메서드에 맞게 두는 것입니다.

## 실무 기준

- 여러 Repository 호출을 묶는다면 Service에 둔다.
- 검증, 상태 변경, 저장이 함께 움직이면 Service 경계가 자연스럽다.
- Repository는 데이터 접근에 집중하게 두는 편이 유지보수에 유리하다.

## 정리

- 트랜잭션은 기술 단위보다 업무 단위에 맞춰 두는 편이 낫다.
- 그 기준으로 보면 Service 계층이 가장 자연스럽다.
- Controller는 진입점, Repository는 저장소, Service는 비즈니스 경계를 맡는 구조가 오래 가기 좋다.
- 먼저 업무 단위를 보고, 그다음 트랜잭션 위치를 정하는 편이 실수가 적다.
