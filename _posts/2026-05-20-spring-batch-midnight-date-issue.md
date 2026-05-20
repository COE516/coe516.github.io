---
layout: single
title: "Spring Batch 자정 넘김 날짜 버그 원인과 해결"
date: 2026-05-20 09:00:00 +0900
categories: [spring]
tags: [spring, batch, 운영, 날짜]
toc: true
excerpt: "23:30에 시작한 배치가 자정을 넘기며 같은 실행 안에서 날짜 기준이 바뀌는 문제가 있었다. 원인은 중간중간 LocalDateTime.now()를 다시 호출한 구조였다."
---

## 문제 상황

운영 배치는 평소에는 멀쩡하다가 **특정 날만 이상하게 동작하는 경우**가 있습니다.

이번 사례는 23:30에 시작하는 법인카드 수집 배치에서 발생한 날짜 계산 버그입니다.

- 날짜 기준으로 조회하는 배치
- 처리 시간이 자정을 넘길 수 있는 구조
- 코드 중간중간 `LocalDateTime.now()` 호출

이 조건이 겹치면 자정 이전에 시작한 배치가 자정을 지나 끝날 때, 같은 실행 안에서도 날짜 기준이 달라질 수 있습니다.

## 평소에는 왜 안 보였을까

배치 흐름은 단순했습니다.

```text
23:30 배치 시작
  ↓
기준 일자 데이터 조회
  ↓
GW 적재
```

예를 들어 `2026-03-16 23:30`에 시작했다면, 배치 전체가 `2026-03-16` 기준으로 동작해야 정상입니다.

대부분의 날에는 처리 시간이 길지 않아 문제 없이 끝났습니다.

## 자정 넘김 이슈가 생긴 이유

문제는 처리 시간이 길어진 날이었습니다.

```text
23:30 시작
23:55 일부 처리 완료
00:03 아직 처리 중
```

이때 일부 로직이 현재 시간을 다시 읽고 있었습니다.

```java
LocalDate recvDate = LocalDateTime.now().toLocalDate();
```

자정을 넘기기 전과 후의 값은 당연히 달라집니다.

- `2026-03-16 23:58` -> `2026-03-16`
- `2026-03-17 00:03` -> `2026-03-17`

즉, **같은 배치 안에서 날짜 기준이 바뀐 것**입니다.

## 실제로 어떤 문제가 생겼나

운영에서는 한 배치 안에서 데이터 기준이 섞였습니다.

- 일부 건: `RECV_DATE = 2026-03-16`
- 일부 건: `RECV_DATE = 2026-03-17`

결과적으로:

- 특정 일자 데이터 누락
- 일부 승인내역 미수집
- 운영 재수집 필요

배치가 실패하지 않고 끝났기 때문에 더 찾기 어려웠습니다. **정상 종료됐지만 데이터만 틀린 상태**였기 때문입니다.

## 원인은 `now()`를 기준값처럼 쓴 구조

문제는 `now()` 자체보다, 배치 전체의 기준 시간이 고정돼 있지 않았다는 점이었습니다.

```java
for (Card card : cardList) {
    LocalDate recvDate = LocalDateTime.now().toLocalDate();
    collect(card, recvDate);
}
```

이 구조는 처리 시간이 길어질수록 위험합니다.

- 대량 데이터
- 외부 API 호출
- 느린 DB 응답
- retry 로직

이런 조건이 있으면 루프 도중 자정을 넘길 수 있고, 그 순간부터 일부는 배치 시작일 기준, 일부는 다음 날 기준으로 처리될 수 있습니다.

## 해결 방법

해결은 단순했습니다. 배치 시작 시각을 한 번만 구하고, 이후에는 그 값만 사용하도록 바꿨습니다.

```java
LocalDateTime batchStartTime = LocalDateTime.now();
LocalDate recvDate = batchStartTime.toLocalDate();
```

변경 전후는 아래처럼 정리됩니다.

```java
// 변경 전
LocalDate recvDate = LocalDateTime.now().toLocalDate();

// 변경 후
LocalDate recvDate = batchStartTime.toLocalDate();
```

필요하면 컨텍스트로 묶어도 됩니다.

```java
public class BatchContext {

    private final LocalDateTime batchTime;

    public BatchContext(LocalDateTime batchTime) {
        this.batchTime = batchTime;
    }

    public LocalDate getRecvDate() {
        return batchTime.toLocalDate();
    }
}
```

이렇게 바꾸면 자정 이전에 시작한 배치가 `00:30`까지 이어져도 기준 날짜는 끝까지 동일합니다.

## 테스트에서 놓치기 쉬운 이유

이 버그는 개발 환경에서 잘 재현되지 않습니다.

보통은 낮 시간에 테스트하므로 `now()`를 여러 번 호출해도 날짜가 바뀌지 않기 때문입니다.

재현하려면 최소한 아래 시나리오가 필요합니다.

- `23:59` 시작
- `00:01` 이후에도 처리 계속
- 같은 실행 안에서 날짜 계산 반복

## 점검 포인트

배치 코드를 볼 때는 아래 패턴을 먼저 확인하는 편이 좋습니다.

```java
LocalDateTime.now()
new Date()
Calendar.getInstance()
```

핵심은 API 종류가 아니라 **한 실행 안에서 시간을 다시 읽고 있는가**입니다.

배치라면 가능하면 아래처럼 가져가는 편이 안전합니다.

- Job 시작 시각을 한 번만 구한다.
- 수집 대상 일자를 Job Parameter나 Context로 고정한다.

## 정리

- 자정 근처에 시작하는 배치는 날짜 기준이 흔들리기 쉽습니다.
- `LocalDateTime.now()`를 중간중간 다시 호출하면 같은 배치 안에서도 결과가 달라질 수 있습니다.
- 배치에서는 현재 시간보다 **배치 시작 시간**을 기준으로 잡는 편이 안전합니다.
- 운영 이슈를 줄이려면 날짜 계산 로직부터 고정값 기반으로 보는 것이 좋습니다.

핵심은 자정 이전에 시작한 배치가 자정을 지나 끝나더라도, 같은 기준 날짜로 끝까지 처리돼야 한다는 점이었습니다.
