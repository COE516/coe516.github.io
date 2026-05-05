---
layout: single
title: "Could not autowire 문제 총정리"
date: 2026-04-25 01:51:35 +0900
categories: [spring]
tags: [spring, autowire, bean, dependency-injection, component-scan]
toc: true
excerpt: "Could not autowire는 대부분 빈이 없거나 여러 개인 경우다. 어디부터 봐야 하는지 짧게 정리한다."
---

## 문제 상황

IDE에서 `Could not autowire` 경고가 보이거나, 실행 시 실제 주입 실패가 나는 경우가 있습니다.

이 문제는 복잡해 보여도 대부분 원인은 몇 가지로 좁혀집니다.

## 가장 흔한 원인

- 스프링 빈으로 등록되지 않음
- component scan 범위 밖에 있음
- 같은 타입 빈이 여러 개 있음
- 인터페이스 구현체가 없음
- 테스트 환경에서 설정이 다름

## 점검 순서

### 1. 빈 등록 여부 확인

`@Component`, `@Service`, `@Repository`, `@Configuration` 중 하나가 있는지 먼저 봅니다.

### 2. 패키지 구조 확인

메인 애플리케이션 클래스 기준으로 scan 범위 밖에 있으면 등록되지 않습니다.

### 3. 동일 타입 빈 개수 확인

두 개 이상이면 `@Qualifier`나 명시적 구성 없이 주입이 모호해집니다.

### 4. IDE 경고와 실행 오류를 구분

가끔 IDE 경고만 있고 실제 실행은 정상인 경우도 있습니다. 반대로 테스트에서는 실패할 수도 있습니다.

## 예시

```java
public interface SmsSender {}

@Service
public class KakaoSmsSender implements SmsSender {}

@Service
public class NaverSmsSender implements SmsSender {}
```

이 상태에서 `SmsSender`를 바로 주입하면 어느 구현체를 써야 할지 모호합니다.

## 해결 방향

- 빈 등록 여부부터 확인한다.
- scan 범위를 의심한다.
- 구현체가 여러 개면 선택 기준을 명확히 둔다.
- 테스트 전용 설정과 실제 설정 차이도 함께 본다.

## 정리

`Could not autowire`는 대부분 구조를 잘 보면 단순합니다.

핵심은 이렇습니다.

- 빈이 없는지
- 빈이 여러 개인지
- scan 범위가 맞는지
- 실행 환경이 다른지

이 네 가지를 순서대로 보면 대부분 빠르게 해결됩니다.
