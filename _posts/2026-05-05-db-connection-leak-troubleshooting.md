---
layout: single
title: "DB 커넥션 누수 문제 원인과 해결"
date: 2026-05-05 01:51:35 +0900
categories: [database]
tags: [database, connection, leak, hikaricp, troubleshooting]
toc: true
excerpt: "커넥션 풀이 자꾸 바닥난다면 단순 부하보다 누수를 의심해야 할 때가 있다. 점검 포인트를 정리한다."
---

## 문제 상황

트래픽이 많지 않은데도 커넥션 풀이 자주 고갈되면 누수 가능성을 봐야 합니다.

## 흔한 원인

- 커넥션을 열고 닫지 않음
- ResultSet/Statement 정리가 누락됨
- 긴 트랜잭션으로 커넥션을 오래 점유함
- 외부 호출까지 같은 트랜잭션 안에서 처리함

## 어떻게 볼까

- HikariCP 메트릭 확인
- 오래 걸리는 쿼리 확인
- 트랜잭션 길이 확인
- JDBC 직접 사용 코드 점검

## 정리

- 진짜 누수인지 긴 점유인지 먼저 구분한다.
- 커넥션은 짧게 쓰고 빨리 반환한다.
- DB 작업과 외부 호출을 한 트랜잭션에 오래 묶지 않는다.
