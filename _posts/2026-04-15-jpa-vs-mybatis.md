---
layout: single
title: "JPA vs MyBatis 선택 기준"
date: 2026-04-15 01:51:35 +0900
categories: [database]
tags: [jpa, mybatis, database, 데이터접근]
toc: true
excerpt: "둘 중 하나가 무조건 정답은 아니다. 도메인 복잡도와 SQL 제어 필요성에 따라 선택 기준이 달라진다."
---

## 문제 상황

새 프로젝트를 시작할 때 JPA와 MyBatis 중 무엇을 고를지 항상 논쟁이 생깁니다.

## JPA가 잘 맞는 경우

- 도메인 중심 모델링이 중요함
- 객체 그래프 탐색이 많음
- CRUD 비중이 큼

## MyBatis가 잘 맞는 경우

- SQL 제어가 매우 중요함
- 복잡한 조회 쿼리가 많음
- 쿼리 튜닝 가시성이 중요함

## 실무 기준

둘 중 하나만 고집하기보다, 팀 경험과 서비스 성격을 같이 봐야 합니다.

## 정리

- CRUD 중심이면 JPA가 생산성에 유리할 수 있다.
- SQL 제어가 핵심이면 MyBatis가 직관적일 수 있다.
- 팀이 잘 다루는 기술인지도 중요하다.
