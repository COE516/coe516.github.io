---
layout: single
title: "@Autowired vs 생성자 주입 비교"
date: 2026-05-05 01:51:35 +0900
categories: [spring]
tags: [spring, autowired, constructor, dependency-injection, bean]
toc: true
excerpt: "지금은 왜 생성자 주입이 더 자주 권장되는지, 필드 주입과 비교해 핵심만 정리한다."
---

## 문제 상황

예전 코드에는 필드 주입이 많고, 새 코드에서는 생성자 주입을 권장하는 경우가 많습니다. 왜 그런지 애매하게 느껴질 때가 있습니다.

## 생성자 주입이 좋은 이유

가장 큰 장점은 **의존성이 명확하게 드러난다**는 점입니다.

```java
@Service
public class OrderService {
    private final PaymentClient paymentClient;

    public OrderService(PaymentClient paymentClient) {
        this.paymentClient = paymentClient;
    }
}
```

이 클래스가 무엇에 의존하는지 바로 보입니다.

## 필드 주입의 아쉬운 점

- 테스트에서 대체 주입이 불편함
- final 사용이 어려움
- 객체 생성 시 필요한 의존성이 코드에 덜 드러남

## 실무 기준

특별한 이유가 없으면 생성자 주입이 가장 무난합니다. 불변성, 테스트 편의성, 가독성 모두 괜찮습니다.

## 정리

- 새 코드라면 생성자 주입을 기본으로 본다.
- 의존성이 코드에 명확히 드러난다.
- 테스트와 리팩터링이 더 편하다.
