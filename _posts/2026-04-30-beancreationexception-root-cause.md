---
layout: single
title: "Spring Boot 실행 시 BeanCreationException 원인 분석"
date: 2026-04-30 01:51:35 +0900
categories: [spring]
tags: [spring, bean, exception, 빈]
toc: true
excerpt: "BeanCreationException은 시작점이 아니라 결과인 경우가 많다. 실제 원인을 찾는 순서를 정리한다."
---

## 문제 상황

애플리케이션 시작 로그에 `BeanCreationException`이 보이면 빈 생성 자체가 문제처럼 보입니다.

하지만 실무에서는 이 예외가 **진짜 원인을 감싼 바깥 껍데기**인 경우가 많습니다. 예외 이름만 보고 빈 이름, 애노테이션, 패키지 스캔부터 만지기 시작하면 오히려 시간이 더 오래 걸립니다.

## 핵심 기준

가장 먼저 볼 것은 `BeanCreationException` 자체가 아니라 `Caused by` 체인입니다.

특히 아래 원인은 시작 예외 바깥에 감겨서 보이는 경우가 많습니다.

- 설정값 바인딩 실패
- 생성자 주입 대상 없음
- 순환 참조
- 초기화 로직 내부 예외
- JPA 매핑 오류

즉 `BeanCreationException`은 원인이라기보다 **시작 실패 결과**로 보는 편이 더 맞습니다.

## 로그를 볼 때 순서

### 1. 가장 아래 `Caused by`부터 본다

로그에서 마지막에 가까운 예외가 실제 root cause인 경우가 많습니다.

예를 들어 겉으로는 이렇게 보여도,

```text
BeanCreationException
  -> UnsatisfiedDependencyException
    -> IllegalArgumentException
```

실제로 고쳐야 하는 건 맨 아래 `IllegalArgumentException`일 수 있습니다.

### 2. 어떤 빈을 만들다가 실패했는지 본다

빈 이름과 생성자 파라미터를 보면 어디서 의존성이 끊겼는지 보입니다.

이 단계에서 `NoSuchBeanDefinitionException`, 타입 불일치, 잘못된 설정 클래스 등록 문제가 자주 드러납니다.

### 3. 생성자와 초기화 코드를 본다

`@PostConstruct`나 생성자 안에서 외부 호출, 파일 읽기, 파싱을 하고 있으면 그 지점에서 터질 수 있습니다.

빈 생성 시점에는 가급적 가벼운 초기화만 두는 편이 안전합니다.

## 자주 나오는 패턴

```java
@Service
public class ReportService {
    public ReportService(ExternalClient client) {
        client.connect();
    }
}
```

이런 코드는 빈 생성 단계에서 외부 시스템 연결까지 시도합니다.

그래서 네트워크 문제, 인증 문제, 외부 서버 지연까지 모두 애플리케이션 시작 실패로 번질 수 있습니다.

## 실무에서 먼저 의심할 지점

- 설정값 이름과 타입이 실제 프로퍼티와 맞는가
- 생성자 주입 대상 빈이 스캔되거나 등록되어 있는가
- `@PostConstruct`에서 무거운 작업을 하지 않는가
- 엔티티 매핑이나 Repository 초기화 시점 오류는 없는가
- 최근 설정 파일이나 프로필 값이 바뀌지 않았는가

## 해결 방향

- 예외 이름보다 마지막 `Caused by`부터 찾는다.
- 생성자와 초기화 로직은 가볍게 유지한다.
- 외부 시스템 연결은 가능하면 빈 생성과 분리한다.
- 설정 바인딩 실패라면 값과 타입을 같이 본다.

## 정리

`BeanCreationException`은 대개 최종 증상입니다.

실무에서는 아래 순서로 보면 빠른 경우가 많습니다.

- 마지막 `Caused by`를 먼저 본다.
- 어떤 빈을 만들다가 실패했는지 확인한다.
- 생성자와 초기화 코드가 무거운지 본다.
- root cause를 찾기 전까지는 빈 이름 자체부터 고치려 들지 않는다.
