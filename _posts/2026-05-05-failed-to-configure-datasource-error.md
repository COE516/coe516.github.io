---
layout: single
title: "Failed to configure DataSource 에러 해결 방법"
date: 2026-05-05 01:51:35 +0900
categories: [database]
tags: [spring, datasource, jdbc, hikaricp, config]
toc: true
excerpt: "Spring Boot 시작 시 Failed to configure DataSource 에러가 날 때 가장 먼저 확인해야 할 설정 포인트를 정리한다."
---

## 문제 상황

Spring Boot를 실행했는데 시작하자마자 `Failed to configure a DataSource` 에러가 나오는 경우가 있습니다.

대부분은 DB 자체 문제가 아니라 **애플리케이션이 DB 연결 정보를 완성하지 못한 상태**에서 생깁니다.

## 먼저 볼 것

가장 흔한 원인은 아래 네 가지입니다.

- `spring.datasource.url` 누락
- username/password 누락
- JDBC 드라이버 의존성 누락
- 테스트용 DB 설정과 실제 실행 설정이 섞인 경우

특히 `application.yml`에 값이 있다고 끝이 아닙니다. profile이 달라 실제로는 다른 설정 파일이 적용되고 있을 수 있습니다.

## 점검 순서

### 1. datasource 설정 확인

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/app
    username: app
    password: secret
```

### 2. 드라이버 의존성 확인

MySQL이면 `mysql-connector-j`, PostgreSQL이면 `postgresql` 의존성이 있어야 합니다.

### 3. profile 확인

`application-dev.yml`에만 값이 있는데 실제 실행은 `prod`로 뜨는 경우가 많습니다.

### 4. 불필요한 자동 설정 여부 확인

DB를 쓰지 않는 서비스인데 JPA 의존성이 들어가 있으면 DataSource 자동 설정이 먼저 시도될 수 있습니다.

## 해결 방향

실무에서는 에러 문구보다 **현재 어떤 설정 파일과 profile이 실제로 읽혔는지** 먼저 보는 편이 빠릅니다.

- DB를 쓰는 서비스면 연결 정보를 완성한다.
- DB를 안 쓰는 서비스면 관련 의존성이나 자동 설정을 정리한다.
- 로컬과 운영 설정을 분리해 혼선을 줄인다.

## 정리

`Failed to configure DataSource`는 보통 연결 정보가 없거나, 의존성이 맞지 않거나, profile이 어긋난 경우에 발생합니다.

핵심은 이렇습니다.

- URL, 계정, 비밀번호를 먼저 본다.
- JDBC 드라이버 의존성을 확인한다.
- 실제 활성 profile을 확인한다.
- DB를 안 쓰는 애플리케이션인지도 같이 본다.
