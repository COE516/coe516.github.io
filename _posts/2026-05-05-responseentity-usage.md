---
layout: single
title: "ResponseEntity 활용법 정리"
date: 2026-05-05 01:51:35 +0900
categories: [api]
tags: [spring, responseentity, http, api, controller]
toc: true
excerpt: "본문만 반환할지, 상태 코드와 헤더까지 제어할지에 따라 ResponseEntity 사용 기준이 달라진다."
---

## 문제 상황

컨트롤러에서 그냥 객체를 반환해도 되는데 굳이 `ResponseEntity`를 써야 하는지 헷갈릴 때가 있습니다.

## 언제 유용할까

다음이 필요하면 `ResponseEntity`가 자연스럽습니다.

- 상태 코드 직접 제어
- 헤더 추가
- 조건에 따른 다른 응답 반환

```java
return ResponseEntity.status(HttpStatus.CREATED).body(response);
```

## 굳이 안 써도 되는 경우

항상 200 OK와 동일한 응답 구조만 반환한다면 객체만 반환해도 충분할 수 있습니다.

## 정리

- 상태 코드와 헤더를 제어할 때 `ResponseEntity`
- 단순 응답만 보낼 때는 꼭 강제할 필요 없음
- 팀 규칙에 맞춰 일관되게 쓰는 편이 중요하다.
