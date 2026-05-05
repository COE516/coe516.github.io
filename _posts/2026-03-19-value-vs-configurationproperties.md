---
layout: single
title: "@Value vs @ConfigurationProperties 차이"
date: 2026-03-19 01:51:35 +0900
categories: [spring]
tags: [spring, config, 스프링, 설정]
toc: true
excerpt: "설정값 하나를 읽는 것과 설정 묶음을 객체로 관리하는 것은 다르다. @Value와 @ConfigurationProperties의 차이를 실무 기준으로 정리한다."
---

## 문제 상황

처음에는 `@Value`로도 충분해 보입니다. 하지만 메일 설정, 외부 API 설정, 캐시 설정처럼 관련 값이 늘어나기 시작하면 문자열 주입이 여기저기 흩어지고, 어떤 값이 한 묶음인지 코드만 봐서는 잘 안 보이게 됩니다.

즉 고민 포인트는 "값을 하나 읽을까"가 아니라 **설정 자체를 구조로 관리해야 하느냐**입니다.

## `@Value`가 잘 맞는 경우

설정값이 정말 한두 개고, 다른 값과 묶일 이유가 없으면 `@Value`가 가장 간단합니다.

```java
@Value("${app.name}")
private String appName;
```

예를 들면 배너 문구, 단일 토글 값, 짧은 문자열 하나를 읽는 정도입니다.

## `@ConfigurationProperties`가 잘 맞는 경우

관련 설정이 여러 개면 객체로 묶는 편이 훨씬 낫습니다.

```java
@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(String host, int port, String from) {
}
```

이렇게 두면 아래 장점이 바로 생깁니다.

- 관련 값이 한곳에 모임
- 타입이 코드에 드러남
- 설정 구조를 읽기 쉬움
- 테스트에서 주입 대상을 다루기 편함

## 실무에서 자주 갈리는 지점

### 값이 2~3개인데도 `@Value`로 계속 가는 경우

처음에는 빨라 보여도 나중에 클래스마다 같은 prefix 설정이 흩어지기 쉽습니다.

### 숫자, 시간, 리스트 설정을 문자열처럼 다루는 경우

이런 값은 나중에 파싱 실수나 기본값 처리 때문에 더 번거로워질 수 있습니다. 구조가 있는 설정일수록 객체 바인딩 쪽이 보통 더 안정적입니다.

### 설정 검증이 필요한 경우

필수값 누락, 형식 오류를 초기에 잡고 싶다면 `@ConfigurationProperties` 쪽이 더 잘 맞습니다.

## 짧은 선택 기준

- 단일 값 한두 개면 `@Value`
- 같은 prefix 아래 값이 모이면 `@ConfigurationProperties`
- 숫자, 시간, 리스트, 옵션 묶음이면 후자를 우선 검토
- 설정 검증이나 테스트 편의성까지 보면 후자가 더 유리한 경우가 많음

## 정리

- `@Value`는 작고 단순한 설정에 잘 맞는다.
- 설정이 묶음이 되기 시작하면 `@ConfigurationProperties`가 더 읽기 쉽다.
- 핵심은 애노테이션 취향보다 설정을 흩뿌릴지 구조로 관리할지의 차이다.
- 설정이 커질수록 객체 바인딩 방식이 유지보수에 훨씬 유리하다.
