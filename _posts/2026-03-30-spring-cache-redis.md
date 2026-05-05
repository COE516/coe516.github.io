---
layout: single
title: "Spring Cache + Redis 적용 방법"
date: 2026-03-30 01:51:35 +0900
categories: [api]
tags: [spring, cache, redis, 캐시]
toc: true
excerpt: "캐시를 붙이면 빨라지지만 언제 비워야 하는지가 더 중요해진다. Spring Cache와 Redis 적용 포인트를 정리한다."
---

## 문제 상황

조회가 느려질 때 가장 먼저 캐시를 떠올리게 됩니다. 하지만 캐시는 저장보다 무효화 전략이 더 중요합니다.

## 기본 적용 방식

Spring Cache를 쓰면 메서드 단위로 캐시를 붙일 수 있습니다.

```java
@Cacheable(cacheNames = "product", key = "#productId")
public ProductDetail getProduct(Long productId) {
    return productRepository.findDetail(productId);
}
```

Redis를 캐시 저장소로 붙이면 여러 인스턴스가 같은 캐시를 공유할 수 있습니다.

## 먼저 정해야 할 것

- 어떤 데이터를 캐시할지
- TTL은 얼마로 둘지
- 수정 시 언제 비울지

## 실무에서 중요한 점

조회가 빠른 것보다 **오래된 데이터를 어디까지 허용할지**를 먼저 정해야 합니다.

## 정리

- Spring Cache는 적용이 쉽다.
- Redis를 붙이면 분산 환경에서도 쓰기 좋다.
- 핵심은 TTL과 무효화 전략이다.
