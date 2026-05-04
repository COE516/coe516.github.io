---
layout: single
title: "트랜잭션을 Service 계층에 두는 이유"
date: 2026-05-05 01:51:35 +0900
categories: [spring]
tags: [spring, transaction, service, repository, architecture]
toc: true
excerpt: "트랜잭션을 어디에 걸어야 하는지 헷갈릴 때가 있다. 왜 Service 계층이 기본 선택이 되는지 정리한다."
---

## 문제 상황

Repository마다 `@Transactional`을 붙일지, Controller에 걸지, Service에 둘지 고민하는 경우가 있습니다.

## 왜 Service가 기본일까

트랜잭션은 보통 **하나의 비즈니스 작업 단위**를 묶는 역할을 합니다. 이 단위는 대개 Service 메서드와 가장 잘 맞습니다.

예를 들면 주문 생성은 보통 아래를 함께 묶습니다.

- 주문 저장
- 재고 차감
- 결제 상태 기록

이 흐름은 Repository 하나가 아니라 여러 작업의 조합입니다.

## Repository에 두면 생기는 문제

각 저장 로직이 따로 커밋될 수 있어 비즈니스 경계를 표현하기 어렵습니다.

## Controller에 두면 아쉬운 점

웹 진입점에 종속돼 계층 책임이 흐려집니다.

## 정리

- 트랜잭션은 비즈니스 작업 단위에 둔다.
- 그 기준으로 보면 Service 계층이 가장 자연스럽다.
- 여러 Repository를 묶는 흐름을 한 경계로 다루기 쉽다.
