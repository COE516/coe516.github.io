---
layout: single
title: "Spring Boot에서 application.yml 설정 우선순위"
date: 2026-04-06 01:51:35 +0900
categories: [deployment]
tags: [spring, config, deployment, 설정]
toc: true
excerpt: "값은 분명 설정했는데 왜 다른 값이 읽히는지 헷갈릴 때가 있다. Spring Boot 설정 우선순위를 간단히 정리한다."
---

## 문제 상황

`application.yml`에 값을 넣어뒀는데 실행하면 다른 값이 적용되는 경우가 있습니다. 이 문제는 대부분 설정 우선순위를 정확히 모르기 때문에 생깁니다.

## 기본 이해

Spring Boot는 한 파일만 읽지 않습니다. 여러 소스에서 값을 읽고 우선순위가 높은 값으로 덮어씁니다.

대표적으로 영향을 주는 것은 아래입니다.

- 기본 `application.yml`
- profile별 설정 파일
- 환경변수
- JVM 옵션
- 커맨드라인 인자

## 실무에서 헷갈리는 경우

### 1. profile 파일이 덮어쓴 경우

`application.yml`의 값을 `application-prod.yml`이 다시 덮을 수 있습니다.

### 2. 환경변수가 더 위에 있는 경우

컨테이너 환경에서는 yml보다 환경변수가 우선되는 경우가 많습니다.

### 3. 실행 옵션으로 덮어쓴 경우

배포 스크립트나 CI 설정에서 `--spring.profiles.active`나 개별 프로퍼티를 넘기고 있을 수 있습니다.

## 확인 팁

- 현재 활성 profile을 먼저 확인한다.
- 환경변수 주입 여부를 확인한다.
- 실행 커맨드에 옵션이 있는지 본다.
- 값이 어디서 최종 결정됐는지 로그나 actuator로 추적한다.

## 정리

설정 문제는 파일 하나만 보면 잘 안 풀립니다.

핵심은 이렇습니다.

- profile별 설정이 있는지 본다.
- 환경변수와 실행 옵션을 같이 본다.
- 최종 우선순위는 yml 하나로 결정되지 않는다.
- 운영 환경일수록 파일 밖에서 값이 덮어써지는 경우가 많다.
