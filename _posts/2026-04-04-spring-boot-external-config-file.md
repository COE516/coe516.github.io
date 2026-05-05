---
layout: single
title: "Spring Boot에서 외부 설정파일 적용 방법"
date: 2026-04-04 01:51:35 +0900
categories: [deployment]
tags: [spring, config, external-config, yml, deployment]
toc: true
excerpt: "애플리케이션 내부 파일이 아니라 외부 설정파일을 읽어야 할 때 어떤 방식으로 적용하는지 핵심만 정리한다."
---

## 문제 상황

운영에서는 설정값을 jar 안에 고정하지 않고 외부 파일로 분리하고 싶은 경우가 많습니다.

## 왜 외부 파일을 쓰나

- 배포물과 설정을 분리하기 쉬움
- 환경별 설정 교체가 쉬움
- 비밀값 관리 전략과 연결하기 좋음

## 적용 방식

가장 흔한 방법은 실행 옵션으로 위치를 넘기는 것입니다.

```bash
--spring.config.location=/app/config/application-prod.yml
```

또는 추가 설정만 얹고 싶다면 `additional-location`을 사용할 수 있습니다.

## 주의할 점

- 기본 설정을 완전히 대체하는지
- 추가로 읽는 것인지
- profile 파일까지 함께 읽히는지

이 차이를 모르고 쓰면 값이 안 읽히는 것처럼 보일 수 있습니다.

## 정리

외부 설정파일의 핵심은 경로 지정 자체보다 **우선순위와 로딩 방식 이해**입니다.

- 배포물과 설정을 분리할 수 있다.
- location과 additional-location의 의미가 다르다.
- profile과 함께 어떻게 읽히는지 확인해야 한다.
