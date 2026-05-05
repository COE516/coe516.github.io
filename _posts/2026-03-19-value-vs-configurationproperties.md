---
layout: single
title: "@Value vs @ConfigurationProperties 차이"
date: 2026-03-19 01:51:35 +0900
categories: [spring]
tags: [spring, config, 스프링, 설정]
toc: true
excerpt: "설정값 하나를 읽는 것과 설정 묶음을 객체로 관리하는 것은 다르다. @Value와 @ConfigurationProperties의 차이를 정리한다."
---

## 문제 상황

설정값을 읽을 때 `@Value`만 계속 쓰다 보면 문자열 파싱, 기본값 처리, 관련 값 묶음 관리가 점점 불편해집니다.

## @Value가 잘 맞는 경우

작은 설정값 하나를 바로 읽을 때는 간단합니다.

```java
@Value("${app.name}")
private String appName;
```

짧고 빠르게 쓸 수 있다는 장점이 있습니다.

## @ConfigurationProperties가 좋은 경우

관련 설정이 여러 개일 때는 객체로 묶는 편이 훨씬 읽기 쉽습니다.

```java
@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(String host, int port, String from) {}
```

이렇게 하면 타입 안정성과 구조가 좋아집니다.

## 실무 기준

- 한두 개 값이면 `@Value`
- 묶음 설정이면 `@ConfigurationProperties`
- 숫자, 시간, 리스트처럼 구조가 있는 값은 후자가 더 낫다.

## 왜 후자가 자주 권장될까

설정이 커질수록 `@Value`는 필드마다 흩어지고, 어디에 어떤 값이 필요한지 한눈에 안 보입니다.

반면 `@ConfigurationProperties`는 설정 구조 자체를 코드로 드러낼 수 있습니다.

## 정리

둘 중 누가 더 우월하냐보다 상황이 다릅니다.

핵심은 이렇습니다.

- 간단한 단일 값은 `@Value`
- 관련 설정 묶음은 `@ConfigurationProperties`
- 설정이 커질수록 객체 바인딩 방식이 유지보수에 유리하다.
