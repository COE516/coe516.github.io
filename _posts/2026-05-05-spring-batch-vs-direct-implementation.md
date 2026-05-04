---
layout: single
title: "Batch 처리 (Spring Batch vs 직접 구현)"
date: 2026-05-05 01:51:35 +0900
categories: [spring]
tags: [spring, batch, job, scheduler, backend]
toc: true
excerpt: "배치 작업을 직접 돌릴지 Spring Batch를 도입할지는 작업 복잡도와 운영 요구사항에 따라 달라진다."
---

## 문제 상황

정산, 집계, 대량 데이터 처리 작업을 만들 때 단순 스케줄러로 충분한지, Spring Batch까지 가야 하는지 고민하게 됩니다.

## 직접 구현이 괜찮은 경우

- 작업이 단순함
- 재시작/재처리 요구가 크지 않음
- 단계 분리가 필요 없음

## Spring Batch가 좋은 경우

- 실패 지점부터 재시작해야 함
- chunk 처리 필요
- step 단위 관리 필요
- 실행 이력 관리가 중요함

## 정리

- 간단한 주기성 작업이면 직접 구현도 가능
- 운영 기능이 중요해질수록 Spring Batch가 유리
- 도입 비용보다 재처리 요구사항을 먼저 본다.
