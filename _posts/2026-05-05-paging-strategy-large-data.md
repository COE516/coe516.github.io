---
layout: single
title: "대용량 데이터 처리 시 페이징 전략"
date: 2026-05-05 01:51:35 +0900
categories: [database]
tags: [database, paging, pagination, query, performance]
toc: true
excerpt: "데이터가 많아질수록 offset 기반 페이징이 느려질 수 있다. 대용량 처리에서 어떤 기준으로 전략을 고를지 정리한다."
---

## 문제 상황

처음에는 `page`, `size`만 있으면 충분해 보이지만, 데이터가 많아지면 뒤쪽 페이지로 갈수록 응답이 느려질 수 있습니다.

## 대표 전략

### offset 기반

구현이 쉽고 일반적인 목록 화면에 잘 맞습니다.

### no-offset / keyset 기반

마지막 기준값을 이용해 다음 페이지를 가져옵니다. 큰 데이터셋에서 유리할 수 있습니다.

## 어떤 때 고민할까

- 무한 스크롤
- 최신순 정렬이 많은 목록
- 수백만 건 이상 테이블

## 정리

- 일반 관리 화면은 offset도 충분하다.
- 대용량/무한 스크롤은 keyset을 고려한다.
- UX 요구사항과 쿼리 비용을 같이 봐야 한다.
