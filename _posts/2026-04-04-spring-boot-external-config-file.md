---
layout: single
title: "Spring Boot에서 외부 설정파일 적용 방법"
date: 2026-04-04 01:51:35 +0900
categories: [deployment]
tags: [spring, config, deployment, 외부설정]
toc: true
excerpt: "애플리케이션 내부 파일이 아니라 외부 설정파일을 읽어야 할 때 어떤 방식으로 적용하는지, 우선순위 기준으로 정리한다."
---

## 문제 상황

운영에서는 설정값을 jar 안에 같이 넣기보다 외부 파일로 분리하고 싶을 때가 많습니다. 같은 배포물을 여러 환경에서 재사용해야 하거나, 민감값 주입 방식이 따로 있을 때 특히 그렇습니다.

하지만 외부 설정파일은 경로만 넘기면 끝나는 문제가 아니라 **기본 설정을 대체하는지, 추가로 얹는지**를 같이 이해해야 덜 헷갈립니다.

## 왜 외부 파일을 쓰나

보통 아래 이유가 큽니다.

- 배포물과 설정을 분리하기 쉬움
- 환경별 설정 교체가 쉬움
- 비밀값 주입 전략과 연결하기 좋음
- 운영 중 설정 위치를 명확히 관리하기 좋음

## 가장 흔한 방식

실행 옵션으로 외부 파일 위치를 넘기는 방법이 가장 많이 쓰입니다.

```bash
--spring.config.location=/app/config/application-prod.yml
```

다만 이 방식은 "기본 설정을 어디까지 대체하는가"를 같이 봐야 합니다.

## 자주 헷갈리는 부분

### `location`과 `additional-location`의 차이

이 차이를 모르고 쓰면 설정이 안 읽히는 것처럼 보일 수 있습니다.

- `location`: 지정한 위치를 기준으로 읽는 쪽에 가깝다.
- `additional-location`: 기본 설정에 추가로 얹는 용도로 쓰기 좋다.

즉 기존 `application.yml`은 유지하고 운영 설정만 덧붙이고 싶다면 `additional-location`이 더 자연스러운 경우가 많습니다.

## profile과 같이 볼 것

외부 파일만 봐서는 안 되고, 활성 profile도 함께 봐야 합니다.

예를 들어 아래처럼 실행하면:

```bash
--spring.profiles.active=prod
--spring.config.additional-location=/app/config/
```

실제로는 기본 파일, 외부 파일, `application-prod.yml` 조합이 함께 작동할 수 있습니다.

문제가 생기면 파일 내용보다 먼저 "지금 어떤 profile로 떴고, 어디서 덮어쓴 값인가"를 보는 편이 빠릅니다.

## 실무에서 자주 생기는 실수

- 외부 파일 경로만 맞으면 다 끝난다고 생각함
- `location`과 `additional-location` 차이를 구분하지 않음
- profile 파일이 같이 읽히는지 확인하지 않음
- 운영 민감값을 외부화한다고 해놓고 실제로는 기본 yml에 남겨둠

## 짧은 기준

- 기존 설정을 유지하고 덧붙일 거면 `additional-location`을 먼저 검토한다.
- 외부 파일은 경로보다 로딩 방식과 우선순위를 같이 본다.
- 설정 문제는 항상 활성 profile과 함께 본다.
- 운영에서는 값이 어디서 최종 결정되는지 추적 가능해야 한다.

## 정리

- 외부 설정파일의 핵심은 경로 지정 자체보다 로딩 방식 이해다.
- `location`과 `additional-location`은 의미가 다르다.
- profile과 우선순위를 같이 봐야 값이 왜 바뀌는지 풀린다.
- 운영 설정은 파일을 분리하는 것보다, 어디서 덮이는지 읽히게 만드는 편이 더 중요하다.
