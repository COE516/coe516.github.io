---
layout: single
title: "@Component, @Service, @Repository 차이"
date: 2026-05-05 01:51:35 +0900
categories: [spring]
tags: [spring, component, service, repository, stereotype]
toc: true
excerpt: "셋 다 스프링 빈이 되지만 의미는 다르다. 역할을 나누는 기준을 간단히 정리한다."
---

## 문제 상황

셋 다 결국 스프링 빈으로 등록되기 때문에 아무 데나 붙여도 되는 것처럼 보입니다. 하지만 실무에서는 역할을 구분해두는 편이 읽기 쉽고 유지보수에 유리합니다.

## 공통점

`@Component`, `@Service`, `@Repository`는 모두 component scan 대상입니다. 즉, 기본적으로는 빈 등록 역할을 합니다.

## 차이점

### @Component

가장 일반적인 형태입니다. 특정 계층 의미 없이 공통 유틸, 어댑터, 보조 컴포넌트에 자주 씁니다.

### @Service

비즈니스 로직이 있는 서비스 계층이라는 의미를 드러냅니다.

### @Repository

DB 접근 계층이라는 의미가 있고, 예외 변환 같은 스프링 기능과도 연결됩니다.

## 왜 구분이 중요할까

코드를 처음 볼 때 이 클래스가 무슨 역할인지 빨리 보입니다. 결국 애노테이션 자체보다 **의미를 드러내는 효과**가 큽니다.

## 정리

- 공통 컴포넌트면 `@Component`
- 비즈니스 로직이면 `@Service`
- 영속성/DB 접근이면 `@Repository`

셋 다 빈 등록은 되지만, 역할까지 같이 드러내는 편이 실무에서는 더 낫습니다.
