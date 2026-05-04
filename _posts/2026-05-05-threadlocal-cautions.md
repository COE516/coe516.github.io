---
layout: single
title: "ThreadLocal 사용 시 주의사항"
date: 2026-05-05 01:51:35 +0900
categories: [spring]
tags: [threadlocal, thread, spring, memory, web]
toc: true
excerpt: "ThreadLocal은 편리하지만 정리를 잊으면 요청 간 값이 섞이거나 메모리 문제가 생길 수 있다."
---

## 문제 상황

요청별 사용자 정보나 trace id를 잠깐 보관하려고 ThreadLocal을 쓰는 경우가 있습니다. 편리하지만 잘못 쓰면 문제가 큽니다.

## 주의할 점

- 사용 후 제거하지 않으면 값이 남을 수 있음
- 스레드풀 환경에서는 다음 요청에 섞일 수 있음
- 비동기 작업으로 넘어가면 기대한 값이 안 이어질 수 있음

## 실무 기준

직접 ThreadLocal을 다루기보다 프레임워크가 제공하는 컨텍스트를 우선 쓰는 편이 낫습니다. 직접 쓴다면 `finally`에서 `remove()`까지 확실히 해야 합니다.

## 정리

- ThreadLocal은 편하지만 위험하다.
- 스레드풀과 함께 쓸 때 특히 조심한다.
- 값 저장보다 정리 시점을 더 중요하게 봐야 한다.
