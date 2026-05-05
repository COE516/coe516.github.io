---
layout: single
title: "Could not autowire 문제 총정리"
date: 2026-04-25 01:51:35 +0900
categories: [spring]
tags: [spring, bean, dependency-injection, 의존성주입]
toc: true
excerpt: "Could not autowire는 대부분 빈이 없거나 여러 개인 경우다. IDE 경고와 실제 실행 오류를 구분해 어디부터 봐야 하는지 정리한다."
---

## 문제 상황

IDE에서 `Could not autowire` 경고가 보이거나, 실행 시 실제 주입 실패가 나는 경우가 있습니다. 메시지는 비슷해 보여도 원인이 한 가지는 아닙니다.

실무에서는 이 오류를 넓게 보지 말고 **빈이 없나, 여러 개인가, 스캔 범위가 틀렸나**로 먼저 좁히는 편이 빠릅니다.

## 가장 흔한 원인

- 스프링 빈으로 등록되지 않음
- component scan 범위 밖에 있음
- 같은 타입 빈이 여러 개 있음
- 인터페이스 구현체가 없음
- 테스트 환경에서 설정이 달라짐

## 먼저 구분할 것

### IDE 경고인가, 실행 오류인가

가끔 IDE만 경고를 띄우고 애플리케이션은 정상 실행되기도 합니다. 반대로 로컬 실행은 되는데 테스트 슬라이스에서는 실패할 수도 있습니다.

그래서 첫 단계는 "실제로 컨테이너가 못 찾는 것인지"를 구분하는 것입니다.

## 점검 순서

### 1. 빈 등록 여부 확인

`@Component`, `@Service`, `@Repository`, `@Configuration` 중 하나가 있는지 먼저 봅니다.

### 2. 스캔 범위 확인

메인 애플리케이션 클래스 기준으로 패키지 바깥에 있으면 등록되지 않을 수 있습니다.

### 3. 동일 타입 빈 개수 확인

구현체가 둘 이상이면 주입 대상이 모호해집니다.

```java
public interface SmsSender {
}

@Service
public class KakaoSmsSender implements SmsSender {
}

@Service
public class NaverSmsSender implements SmsSender {
}
```

이 상태에서 `SmsSender`를 바로 주입하면 선택 기준이 필요합니다.

### 4. 테스트 설정 차이 확인

`@WebMvcTest`, `@DataJpaTest`처럼 일부 빈만 올리는 테스트에서는 실제 애플리케이션과 다르게 실패할 수 있습니다.

## 해결 방향

- 빈이 없으면 등록 위치와 애노테이션을 본다.
- 빈이 여러 개면 `@Qualifier`나 명시적 구성을 검토한다.
- 스캔 범위가 다르면 패키지 구조나 설정 위치를 본다.
- 테스트에서만 깨지면 테스트 컨텍스트 범위를 먼저 본다.

## 정리

- `Could not autowire`는 대부분 몇 가지 원인으로 빨리 좁혀진다.
- IDE 경고와 실제 실행 실패를 먼저 구분하는 편이 좋다.
- 핵심은 빈이 없는지, 여러 개인지, 스캔 범위가 맞는지를 순서대로 보는 것이다.
- 막연히 애노테이션을 바꾸기보다 주입 구조를 먼저 확인하는 편이 빠르다.
