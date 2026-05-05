---
layout: single
title: "DB 커넥션 누수처럼 보일 때 먼저 구분할 것들"
date: 2026-04-24 01:51:35 +0900
categories: [database]
tags: [database, hikaricp, troubleshooting, 커넥션풀]
toc: true
excerpt: "커넥션 풀이 자주 바닥난다고 해서 모두 누수는 아니다. 진짜 누수인지, 오래 점유한 것인지 먼저 구분해야 원인을 빨리 좁힐 수 있다."
---

## 문제 상황

트래픽이 아주 높지 않은데도 커넥션 풀이 자주 고갈되면 보통 "누수 아닌가?"부터 떠올리게 됩니다.

그런데 실무에서는 진짜 누수보다 **커넥션을 너무 오래 잡고 있는 경우**가 더 흔합니다. 둘을 구분하지 않으면 원인 분석이 계속 빗나갑니다.

## 먼저 구분할 것: 누수인가, 긴 점유인가

대략 아래처럼 나눠서 보면 빠릅니다.

- **진짜 누수**: 커넥션을 열고 반환하지 않아서 풀로 돌아오지 않음
- **긴 점유**: 결국 반환은 되지만, 쿼리나 트랜잭션이 오래 걸려 풀을 오래 붙잡음

증상은 비슷합니다. 둘 다 active connection 수가 높아지고 대기 시간이 늘어납니다. 그래서 "풀이 꽉 찼다"는 현상만으로는 바로 누수라고 단정하기 어렵습니다.

## 실무에서 먼저 보는 순서

### 1. HikariCP 메트릭

먼저 active, idle, pending 같은 메트릭을 봅니다.

- active가 오래 높게 유지되는가
- idle이 거의 회복되지 않는가
- pending이 피크 구간마다 같이 치솟는가

계속 꽉 찬 상태라면 누수일 수도 있지만, 특정 시점의 느린 작업 때문에 몰리는 상황일 수도 있습니다.

### 2. 느린 쿼리와 긴 트랜잭션

다음으로는 DB 쿼리 시간과 트랜잭션 길이를 봅니다.

특히 아래 패턴이 많습니다.

- 쿼리 자체가 느림
- 한 트랜잭션 안에서 너무 많은 작업을 처리함
- 외부 API 호출까지 같은 트랜잭션에 묶음
- 배치성 작업이 짧은 간격으로 겹침

이 경우는 누수라기보다 "반환이 늦는 문제"에 가깝습니다.

### 3. JDBC 직접 사용 코드

JPA나 Spring JdbcTemplate을 쓰면 닫힘 처리를 프레임워크가 많이 맡아주지만, 직접 `Connection`, `Statement`, `ResultSet`을 다루는 코드는 여전히 점검 대상입니다.

```java
Connection connection = dataSource.getConnection();
PreparedStatement statement = connection.prepareStatement(sql);
ResultSet resultSet = statement.executeQuery();
```

이런 코드가 있다면 아래를 먼저 확인합니다.

- 예외가 나도 닫히는가
- `try-with-resources`를 쓰는가
- 반환 전에 외부 호출이나 긴 후처리를 하지 않는가

## Hikari leak detection은 힌트로만 본다

문제 재현이 애매하면 leak detection 로그를 잠깐 켜서 힌트를 얻을 수 있습니다.

```yaml
spring:
  datasource:
    hikari:
      leak-detection-threshold: 2000
```

다만 이 설정은 "오래 잡고 있었다"는 신호에 가깝습니다. 로그가 떴다고 해서 곧바로 진짜 누수라고 결론 내리기보다, 그 시점의 쿼리와 트랜잭션 흐름을 같이 봐야 합니다.

## 자주 나오는 원인

- `try-with-resources` 없이 JDBC 객체를 직접 다룸
- 트랜잭션 안에서 외부 HTTP 호출까지 수행함
- 대량 처리 작업이 한 번에 너무 많은 row를 오래 잡음
- 느린 쿼리 때문에 반환은 되지만 풀 점유 시간이 과도하게 길어짐

## 정리

- 커넥션 풀이 바닥난다고 해서 바로 누수라고 단정하지 않는다.
- 먼저 진짜 누수인지, 긴 점유인지부터 구분해야 한다.
- Hikari 메트릭, 느린 쿼리, 긴 트랜잭션을 같이 봐야 한다.
- 직접 JDBC를 다루는 구간과 트랜잭션 안의 외부 호출은 가장 먼저 의심할 만하다.
