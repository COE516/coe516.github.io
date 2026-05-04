---
layout: single
title: "Spring Boot Health Check 구성 방법"
date: 2026-05-05 01:51:35 +0900
categories: [deployment]
tags: [spring, actuator, health-check, monitoring, deployment]
toc: true
excerpt: "헬스체크는 살아 있는지만 보는 것이 아니라, 트래픽을 받아도 되는 상태인지 구분하는 데 중요하다."
---

## 문제 상황

헬스체크를 단순히 200 응답 정도로만 두면, 실제로는 DB가 죽어 있어도 인프라가 정상 인스턴스로 오인할 수 있습니다.

## 보통 어떻게 구성하나

Spring Boot에서는 Actuator를 많이 사용합니다.

- liveness: 프로세스가 살아 있는가
- readiness: 요청을 받아도 되는가

## 왜 분리하나

앱은 살아 있지만 DB 연결이나 외부 의존성이 준비되지 않았을 수 있기 때문입니다.

## 정리

- 헬스체크는 단순 ping보다 상태 의미가 중요하다.
- liveness와 readiness를 구분한다.
- 운영 의존성을 어디까지 포함할지 정책을 정해둔다.
