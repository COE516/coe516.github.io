---
layout: single
title: "Spring Boot에서 프로파일(dev/prod) 분리 방법"
date: 2026-05-05 01:51:35 +0900
categories: [deployment]
tags: [spring, profile, dev, prod, config]
toc: true
excerpt: "dev와 prod 설정을 분리하지 않으면 로컬 편의 설정이 운영까지 따라가기 쉽다. 실무적인 분리 기준을 정리한다."
---

## 문제 상황

로컬에서 편하게 쓰던 설정이 운영에도 그대로 들어가면 로그 레벨, DB 연결, 외부 URL, 캐시 정책까지 같이 꼬일 수 있습니다.

## 기본 원칙

프로파일 분리는 단순히 파일을 나누는 작업이 아니라 **환경별로 달라져야 하는 값만 분리하는 작업**입니다.

보통은 이렇게 가져갑니다.

- `application.yml`: 공통값
- `application-dev.yml`: 로컬/개발값
- `application-prod.yml`: 운영값

## 어떤 값을 나누나

- datasource 정보
- 로그 레벨
- 외부 API 주소
- 캐시 사용 여부
- 배치/스케줄 활성화 여부

반대로 모든 값을 환경 파일에 중복으로 넣기 시작하면 관리가 더 어려워집니다.

## 실행 시 주의점

활성 profile을 명확히 해야 합니다.

```bash
--spring.profiles.active=prod
```

운영에서는 파일보다 환경변수나 배포 설정으로 profile을 고정하는 경우가 많습니다.

## 실무 팁

- 공통값은 기본 파일에 둔다.
- 환경 차이가 있는 값만 profile 파일로 보낸다.
- 비밀값은 yml보다 외부 주입 방식을 우선한다.

## 정리

프로파일 분리는 "파일을 많이 만드는 것"보다 "환경별 차이를 분명히 하는 것"이 핵심입니다.

- 공통값과 환경값을 나눈다.
- 운영 민감값은 외부 주입을 우선한다.
- 활성 profile이 실제로 무엇인지 항상 확인한다.
