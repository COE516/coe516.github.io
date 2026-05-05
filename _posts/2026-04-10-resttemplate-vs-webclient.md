---
layout: single
title: "RestTemplate vs WebClient 차이와 선택 기준"
date: 2026-04-10 01:51:35 +0900
categories: [api]
tags: [spring, api, 스프링, HTTP]
toc: true
excerpt: "RestTemplate과 WebClient는 둘 다 HTTP 호출 도구지만 실행 모델과 운영 포인트가 다르다. 선택 기준을 정리한다."
---

## 문제 상황

외부 API를 호출해야 할 때 아직도 RestTemplate을 써도 되는지, 아니면 WebClient로 바꿔야 하는지 자주 고민하게 됩니다.

## 가장 큰 차이

핵심은 실행 모델입니다.

- `RestTemplate`: 동기, 블로킹
- `WebClient`: 비동기/논블로킹 사용 가능

그래서 단순히 "최신이라서 WebClient"가 아니라, **현재 애플리케이션의 처리 방식과 맞는지**를 봐야 합니다.

## RestTemplate이 잘 맞는 경우

- 일반적인 MVC 기반 서비스
- 호출량이 많지 않음
- 코드 단순성이 우선

## WebClient가 잘 맞는 경우

- 동시 호출 수가 많음
- 타임아웃/재시도 제어가 중요함
- Reactive 스택을 쓰고 있음

## 선택할 때 주의할 점

WebClient를 쓴다고 무조건 성능이 좋아지는 것은 아닙니다. 결국 호출 대상 API가 느리면 기다리는 시간 자체는 여전히 존재합니다.

또 MVC 서비스에서 WebClient를 쓰더라도 `block()`으로 끝내면 운영상 이점이 크지 않을 수 있습니다.

## 짧은 기준

- 단순한 동기 호출이면 RestTemplate도 아직 충분하다.
- 동시성, 재시도, reactive 흐름이 중요하면 WebClient가 낫다.
- 팀이 다루기 쉬운 방식인지도 같이 본다.

## 정리

선택 기준은 기술 유행보다 현재 서비스 성격입니다.

핵심은 이렇습니다.

- MVC + 단순 호출이면 RestTemplate도 실용적이다.
- 고동시성이나 reactive 흐름이면 WebClient가 유리하다.
- WebClient를 써도 blocking 방식이면 이점이 제한적이다.
- 팀이 운영 가능한 선택이 결국 가장 좋은 선택이다.
