---
layout: single
title: "Failed to configure DataSource 에러 해결 방법"
date: 2026-04-19 01:51:35 +0900
categories: [database]
tags: [spring, datasource, config, 데이터소스]
toc: true
excerpt: "Spring Boot 시작 시 Failed to configure DataSource 에러가 날 때 가장 먼저 확인해야 할 설정 포인트를 실무 기준으로 정리한다."
---

## 문제 상황

Spring Boot를 실행했는데 시작하자마자 `Failed to configure a DataSource` 에러가 나오는 경우가 있습니다. 메시지는 DataSource 문제처럼 보이지만, 실제로는 **애플리케이션이 DB 연결 정보를 완성하지 못한 상태**인 경우가 대부분입니다.

즉 DB가 죽었는지 보기 전에, 먼저 스프링이 무엇을 읽었고 무엇을 못 읽었는지부터 봐야 합니다.

## 가장 흔한 원인

- `spring.datasource.url` 누락
- username/password 누락
- JDBC 드라이버 의존성 누락
- profile이 달라 실제 설정 파일이 안 읽힘
- DB를 안 쓰는 앱인데 관련 자동 설정이 켜짐

## 먼저 볼 것

### 1. datasource 설정이 실제로 완성됐는가

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/app
    username: app
    password: secret
```

파일에 값이 있는지만 보지 말고, 현재 실행 환경에서 이 값이 실제로 읽혔는지 확인해야 합니다.

### 2. JDBC 드라이버 의존성이 있는가

MySQL이면 `mysql-connector-j`, PostgreSQL이면 `postgresql` 의존성이 있어야 합니다. URL만 맞아도 드라이버가 없으면 시작 단계에서 막힙니다.

### 3. 활성 profile이 무엇인가

`application-dev.yml`에만 값이 있는데 실제 실행은 `prod`로 떠 있으면, 파일은 있어도 없는 것처럼 동작합니다.

### 4. 원래 DB가 필요한 애플리케이션이 맞는가

DB를 안 쓰는 서비스인데 JPA 의존성이 들어가 있으면 DataSource 자동 설정이 먼저 시도되면서 같은 오류가 날 수 있습니다.

## 실무에서 자주 꼬이는 부분

- 설정은 dev 파일에만 있는데 prod로 실행함
- 환경변수로 덮어쓰는 값을 놓침
- 드라이버 의존성을 직접 빼먹음
- 테스트용 H2 설정과 실제 설정이 섞임
- DB를 안 쓰는데 관련 starter가 남아 있음

## 짧은 점검 순서

1. 활성 profile을 확인한다.
2. datasource url, 계정, 비밀번호가 실제로 읽히는지 본다.
3. JDBC 드라이버 의존성을 확인한다.
4. DB를 안 쓰는 앱이면 자동 설정 대상 자체를 다시 본다.

## 정리

- `Failed to configure DataSource`는 대부분 연결 정보나 의존성, profile 문제다.
- 에러 문구보다 실제로 어떤 설정이 읽혔는지를 먼저 보는 편이 빠르다.
- URL, 계정, 드라이버, profile을 순서대로 보면 대부분 빨리 좁혀진다.
- DB를 안 쓰는 애플리케이션이라면 자동 설정 자체가 불필요한지도 같이 봐야 한다.
