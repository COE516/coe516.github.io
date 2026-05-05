---
layout: single
title: "Spring Boot 실행 시 BeanCreationException 원인 분석"
date: 2026-04-30 01:51:35 +0900
categories: [spring]
tags: [spring, bean, startup, exception, dependency-injection]
toc: true
excerpt: "BeanCreationException은 시작점이 아니라 결과인 경우가 많다. 실제 원인을 찾는 순서를 정리한다."
---

## 문제 상황

애플리케이션 시작 로그에 `BeanCreationException`이 보이면 빈 생성 자체가 문제처럼 보입니다. 하지만 실무에서는 이 예외가 **진짜 원인을 감싼 바깥 껍데기**인 경우가 많습니다.

## 먼저 봐야 하는 것

가장 중요한 건 `Caused by` 체인입니다.

`BeanCreationException`만 보고 빈 이름만 바꾸거나 애노테이션을 만지는 식으로 접근하면 보통 시간을 많이 씁니다.

실제 원인은 아래 쪽에 숨어 있는 경우가 많습니다.

- 설정값 바인딩 실패
- 생성자 주입 대상 없음
- 순환 참조
- 초기화 로직 내부 예외
- JPA 매핑 오류

## 보는 순서

### 1. 가장 아래 `Caused by` 찾기

로그에서 마지막에 가까운 root cause를 먼저 봅니다.

### 2. 어떤 빈을 만들다가 실패했는지 확인

빈 이름과 생성자 파라미터를 보면 의존성 방향이 보입니다.

### 3. 초기화 코드 확인

`@PostConstruct`나 생성자 안에서 외부 호출, 파일 읽기, 파싱을 하고 있다면 그 지점에서 터질 수 있습니다.

## 흔한 패턴

```java
@Service
public class ReportService {
    public ReportService(ExternalClient client) {
        client.connect();
    }
}
```

이런 코드는 빈 생성 단계에서 외부 의존성까지 건드려 버려서 시작 실패 원인이 커집니다.

## 해결 방향

- root cause부터 찾는다.
- 생성자/초기화 로직을 가볍게 유지한다.
- 외부 시스템 연결은 빈 생성과 분리한다.
- 설정 바인딩 실패라면 값과 타입을 같이 본다.

## 정리

`BeanCreationException`은 대개 최종 증상입니다.

핵심은 이렇습니다.

- 예외 이름보다 `Caused by`를 먼저 본다.
- 어떤 빈을 만들다가 실패했는지 추적한다.
- 생성자와 초기화 코드에 무거운 로직을 넣지 않는다.
- root cause를 찾기 전까지는 빈 자체를 의심하지 않는 편이 빠르다.
