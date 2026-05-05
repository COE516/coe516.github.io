---
layout: single
title: "ResponseEntity는 언제 쓰고, 언제 굳이 안 써도 될까"
date: 2026-04-12 01:51:35 +0900
categories: [api]
tags: [spring, responseentity, http, api, controller]
toc: true
excerpt: "ResponseEntity는 무조건 쓰는 도구가 아니라 상태 코드, 헤더, 조건별 응답을 직접 제어할 때 값이 커진다. 단순 200 응답만 보낼 때는 객체 반환만으로도 충분하다."
---

## 문제 상황

컨트롤러에서 응답 객체만 반환해도 동작하는데, 모든 메서드를 `ResponseEntity`로 감싸야 하는지 헷갈릴 때가 있습니다.

실무에서는 "항상 써야 하나"보다 **HTTP 응답을 직접 제어해야 하느냐**로 보는 편이 더 명확합니다.

## `ResponseEntity`가 필요한 경우

아래 상황이면 `ResponseEntity`가 자연스럽습니다.

- 상태 코드를 직접 정해야 한다.
- 헤더를 추가해야 한다.
- 조건에 따라 다른 응답을 내려야 한다.

예를 들어 생성 API는 `201 Created`가 더 잘 맞습니다.

```java
@PostMapping("/orders")
public ResponseEntity<OrderCreateResponse> createOrder(@RequestBody OrderCreateRequest request) {
    OrderCreateResponse response = orderService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

파일 다운로드처럼 헤더가 중요한 경우도 `ResponseEntity`가 편합니다.

```java
return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report.csv")
        .body(resource);
```

## 굳이 안 써도 되는 경우

항상 `200 OK`에 같은 구조의 JSON만 반환한다면 객체만 바로 반환해도 충분한 경우가 많습니다.

```java
@GetMapping("/members/{id}")
public MemberResponse getMember(@PathVariable Long id) {
    return memberService.find(id);
}
```

이 경우까지 전부 `ResponseEntity.ok(...)`로 감싸면 얻는 이점보다 코드만 조금 더 길어질 수 있습니다.

## 자주 헷갈리는 지점

### 예외 응답도 `ResponseEntity`로만 처리해야 할까

꼭 그렇지는 않습니다. 전역 예외 처리를 `@ControllerAdvice`로 이미 정리했다면, 정상 응답만 단순 반환하고 예외 응답은 공통 처리하는 쪽이 더 깔끔할 수 있습니다.

### 모든 컨트롤러에서 스타일을 통일해야 할까

네. 다만 기준은 "무조건 `ResponseEntity`"보다 **어떤 경우에 직접 제어가 필요한지**를 팀 규칙으로 맞추는 편이 낫습니다.

예를 들면 이런 식입니다.

- 단순 조회: 객체 반환
- 생성/삭제: 필요하면 `ResponseEntity`
- 헤더 제어 필요: `ResponseEntity`
- 예외 응답: 전역 예외 처리 우선

## 정리

- `ResponseEntity`는 상태 코드, 헤더, 조건별 응답을 직접 제어할 때 유용하다.
- 단순한 `200 OK` JSON 응답이면 객체만 반환해도 충분한 경우가 많다.
- 전역 예외 처리와 함께 쓰면 컨트롤러 코드를 더 단순하게 유지하기 쉽다.
- 중요한 것은 강박적으로 통일하는 것이 아니라, 팀 기준을 일관되게 가져가는 것이다.
