---
layout: single
title: "HikariCP 커넥션 풀 설정 및 튜닝 포인트"
date: 2026-05-05 01:51:35 +0900
categories: [database]
tags: [spring, hikaricp, datasource, pool, database]
toc: true
excerpt: "HikariCP는 기본값도 좋지만 트래픽과 DB 특성에 따라 확인해야 할 포인트가 있다. 과하게 만지기 전 봐야 할 기준을 정리한다."
---

## 문제 상황

응답이 느려졌다고 해서 커넥션 풀 크기부터 크게 늘리는 경우가 많습니다. 하지만 풀 설정은 많을수록 좋은 값이 아니라 DB와 애플리케이션 처리량에 맞아야 합니다.

## 먼저 알아둘 점

HikariCP는 기본값이 꽤 괜찮습니다. 그래서 초기에 중요한 건 미세 튜닝보다 **병목이 진짜 커넥션 풀인지 확인하는 것**입니다.

## 자주 보는 설정

- `maximumPoolSize`
- `minimumIdle`
- `connectionTimeout`
- `idleTimeout`
- `maxLifetime`

## 튜닝할 때 주의점

### 1. maximumPoolSize를 무작정 키우지 않는다

애플리케이션이 많이 잡는다고 DB가 무한히 처리해주지는 않습니다.

### 2. maxLifetime은 DB 쪽 타임아웃보다 짧게

DB가 먼저 연결을 끊기 전에 애플리케이션이 정리하게 두는 편이 안전합니다.

### 3. timeout 값은 장애 탐지 속도와 연결된다

너무 길면 장애 감지가 늦고, 너무 짧으면 순간 부하에도 실패가 늘어납니다.

## 예시

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      connection-timeout: 3000
      max-lifetime: 1700000
```

## 정리

HikariCP 튜닝의 핵심은 많이 바꾸는 것이 아니라 병목을 정확히 보는 것입니다.

- 먼저 실제 병목인지 확인한다.
- 풀 크기는 DB 처리량과 같이 본다.
- 수명과 타임아웃 값은 DB 설정과 맞춘다.
- 기본값을 크게 벗어나기 전 이유가 분명해야 한다.
