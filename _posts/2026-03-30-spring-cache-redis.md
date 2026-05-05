---
layout: single
title: "Spring Cache + Redis 적용 방법"
date: 2026-03-30 01:51:35 +0900
categories: [api]
tags: [spring, cache, redis, 캐시]
toc: true
excerpt: "캐시는 붙이는 것보다 언제 비우고 얼마나 오래 유지할지 정하는 일이 더 중요하다. Spring Cache와 Redis 적용 기준을 정리한다."
---

## 문제 상황

조회가 느려지면 가장 먼저 캐시를 떠올리게 됩니다.

하지만 실무에서는 `@Cacheable`을 붙이는 것보다 아래가 더 중요합니다.

- 어떤 데이터를 캐시할지
- 얼마나 오래 둘지
- 데이터가 바뀔 때 언제 비울지

이 기준 없이 캐시를 붙이면 응답은 빨라져도 오래된 데이터를 더 오래 보여주게 됩니다.

## 기본 적용 방식

Spring Cache를 쓰면 메서드 단위로 캐시를 붙일 수 있습니다.

```java
@Cacheable(cacheNames = "product", key = "#productId")
public ProductDetail getProduct(Long productId) {
    return productRepository.findDetail(productId);
}
```

Redis를 캐시 저장소로 붙이면 여러 애플리케이션 인스턴스가 같은 캐시를 공유할 수 있습니다.

## 수정 흐름은 같이 봐야 한다

조회만 캐시하고 수정 시 무효화를 빼먹으면 금방 문제가 납니다.

```java
@CacheEvict(cacheNames = "product", key = "#productId")
public void updateProduct(Long productId, UpdateProductRequest request) {
    productRepository.update(productId, request);
}
```

캐시 적용은 보통 `조회 + 수정 시 무효화`를 같이 봐야 합니다.

## 먼저 정해야 할 기준

### 1. 어떤 데이터를 캐시할지

- 자주 읽히는가
- 계산/조회 비용이 큰가
- 잠깐 오래돼도 괜찮은가

### 2. TTL을 얼마로 둘지

TTL은 성능 수치보다 **오래된 데이터를 어디까지 허용할지** 기준으로 정하는 편이 낫습니다.

### 3. 무효화 시점을 어떻게 잡을지

- 수정 즉시 비울지
- 배치로 재생성할지
- 짧은 TTL로 버틸지

이 선택이 실제 운영 품질을 많이 좌우합니다.

## 이런 데이터는 신중해야 한다

아래는 캐시를 붙일 때 더 조심해야 합니다.

- 재고처럼 최신성이 중요한 데이터
- 권한/가격처럼 사용자별 결과가 달라지는 데이터
- 키 설계를 잘못하면 데이터가 섞일 수 있는 조회

캐시는 빠르게 만드는 도구이기도 하지만, 잘못 붙이면 이상한 정합성 버그를 오래 숨깁니다.

## 정리

- Spring Cache는 적용이 쉽지만 운영 기준 없이 붙이면 위험하다.
- Redis를 쓰면 분산 환경에서 공유 캐시를 만들기 좋다.
- 핵심은 `TTL`, `키`, `무효화 시점`이다.
- 응답 속도보다 오래된 데이터를 어디까지 허용할지 먼저 정하는 편이 안전하다.
