---
layout: single
title: "Bean 스코프(singleton, prototype) 이해하기"
date: 2026-05-01 01:51:35 +0900
categories: [spring]
tags: [spring, bean, scope, 빈]
toc: true
excerpt: "스프링 빈은 기본이 singleton이다. prototype을 쓸 때 무엇이 달라지는지 핵심만 정리한다."
---

## 문제 상황

스프링 빈을 만들다 보면 새 인스턴스가 매번 생기는지, 하나를 계속 쓰는지 헷갈릴 때가 있습니다.

## 기본값은 singleton

스프링 빈은 기본적으로 singleton입니다. 즉, 컨테이너 안에서 하나를 만들고 재사용합니다.

이 방식이 기본인 이유는 대부분의 서비스/리포지토리 빈이 상태를 들고 있지 않아도 되기 때문입니다.

## prototype은 언제 다를까

prototype은 요청할 때마다 새 인스턴스를 만듭니다.

하지만 여기서 자주 놓치는 점이 있습니다. singleton 빈 안에 prototype 빈을 그냥 주입하면, 실제로는 주입 시점의 한 인스턴스만 들어갑니다.

## 실무에서 중요한 포인트

- 상태를 들고 있지 않은 빈은 singleton이 기본이다.
- prototype은 생성 시점과 주입 방식을 같이 봐야 한다.
- scope 문제보다 상태 공유 문제가 더 중요할 때가 많다.

## 정리

- 기본값은 singleton
- prototype은 매번 새 객체가 필요할 때만 신중히 사용
- scope를 바꾸기 전에 정말 상태를 빈 안에 두어야 하는지도 같이 본다.
