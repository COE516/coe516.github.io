---
layout: single
title: "Service / Repository 계층 나누는 기준"
date: 2026-05-05 01:51:35 +0900
categories: [spring]
tags: [spring, service, repository, architecture, layering]
toc: true
excerpt: "Service와 Repository를 나눌 때 중요한 건 기술보다 책임이다. 어디까지를 DB 접근으로 보고 어디부터를 비즈니스로 볼지 정리한다."
---

## 문제 상황

작은 프로젝트에서는 Service와 Repository 경계가 쉽게 흐려집니다. 조회 조건 조립, 상태 검증, 트랜잭션 처리까지 한쪽으로 몰리기 쉽습니다.

## 기본 기준

### Repository

DB와 직접 대화하는 계층입니다.

- 저장
- 조회
- 삭제
- 쿼리 실행

### Service

비즈니스 흐름을 조합하는 계층입니다.

- 여러 repository 호출 조합
- 상태 검증
- 트랜잭션 경계
- 도메인 규칙 실행

## 흔한 실수

- Repository에 비즈니스 분기까지 넣는 경우
- Service가 SQL 수준 세부 구현까지 신경 쓰는 경우

## 정리

- Repository는 데이터 접근 책임
- Service는 비즈니스 흐름 책임
- 경계가 애매하면 "이 로직이 DB 기술 세부사항인가, 업무 규칙인가"로 나눠 보면 편하다.
