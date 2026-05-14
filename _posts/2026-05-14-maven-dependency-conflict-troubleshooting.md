---
layout: single
title: "Maven dependency 충돌 해결 방법, 운영 이슈로 이어지기 전에 확인할 것들"
date: 2026-05-14 09:00:00 +0900
categories: [dev]
tags: [maven, dependency, java, build, 운영]
toc: true
excerpt: "Maven dependency 충돌은 빌드는 통과하는데 운영에서만 터지는 식으로 나타나기 쉽다. 실무에서 먼저 확인한 순서와 정리 방법을 짧게 정리한다."
---

## 왜 dependency 충돌이 자주 생길까

Maven 프로젝트에서는 내가 직접 선언한 라이브러리만 올라오지 않습니다. 그 라이브러리가 다시 끌고 오는 **transitive dependency**까지 함께 해석됩니다.

문제는 여기서 시작됩니다.

- 같은 라이브러리를 서로 다른 버전으로 참조하는 경우
- 오래된 레거시 모듈과 신규 라이브러리를 같이 쓰는 경우
- 팀마다 버전을 제각각 올린 공통 모듈을 섞어 쓰는 경우

즉, 코드에서는 한 번만 import한 것처럼 보여도 실제 런타임 classpath에는 예상보다 훨씬 많은 jar가 얽혀 있습니다.

## 가장 먼저 확인한 것

dependency 충돌이 의심되면 제일 먼저 **누가 어떤 버전을 끌고 오는지**부터 확인했습니다.

### 1. `mvn dependency:tree`

가장 기본이지만 가장 많이 해결해 주는 명령입니다.

```bash
mvn dependency:tree
```

특정 라이브러리만 좁혀서 보면 더 빠릅니다.

```bash
mvn dependency:tree -Dincludes=com.oracle.database.jdbc
```

여기서 확인한 포인트는 주로 이 세 가지였습니다.

- 같은 라이브러리가 여러 경로로 들어오는가
- 최종 선택된 버전이 내가 기대한 버전인가
- `omitted for conflict`가 찍히는가

### 2. IntelliJ Dependency Analyzer

트리 출력이 길어서 한눈에 안 들어올 때는 IntelliJ의 Dependency Analyzer가 꽤 편했습니다.

특히 어떤 모듈이 충돌 버전을 끌고 오는지 역추적할 때 텍스트 로그보다 빠르게 볼 수 있습니다.

### 3. `omitted for conflict` 확인

이 문구가 보이면 Maven이 충돌을 그냥 무시한 것이 아니라, **가까운 경로의 버전 하나를 선택했다**는 뜻입니다.

즉 빌드는 성공해도, 내가 의도한 버전이 아니면 런타임에서 `NoSuchMethodError`, `AbstractMethodError` 같은 예외로 이어질 수 있습니다.

## 실제로 겪었던 문제

실무에서 자주 까다로웠던 케이스는 Oracle JDBC 드라이버 충돌이었습니다.

예를 들어 신규 공통 모듈이 최신 `ojdbc`를 끌고 왔는데, 기존 배치 모듈이나 레거시 라이브러리가 다른 버전을 같이 참조하고 있던 경우입니다.

이럴 때 증상은 보통 이런 식으로 나왔습니다.

- 컴파일은 정상
- 로컬 실행도 얼핏 정상
- 운영 배포 후 특정 쿼리나 커넥션 초기화 시점에만 예외 발생

대표 예외는 아래처럼 나옵니다.

```text
java.lang.NoSuchMethodError
java.lang.AbstractMethodError
```

이 예외가 특히 헷갈리는 이유는 코드 문법 문제가 아니라 **런타임에 올라간 실제 클래스 버전 문제**이기 때문입니다.

## 로컬은 되는데 운영 서버에서만 실패한 이유

이런 케이스는 단순히 POM만 보면 안 끝나는 경우가 많았습니다.

### 1. WAS 공통 lib 충돌

운영 WAS나 서버 공통 라이브러리 디렉터리에 이미 다른 버전의 JDBC 드라이버가 들어 있는 경우가 있습니다.

애플리케이션에 포함한 jar보다 서버 쪽 classpath가 먼저 잡히면, 로컬과 전혀 다른 결과가 나옵니다.

### 2. Jenkins 빌드 환경 차이

로컬에서는 최신 의존성을 받았는데 Jenkins 에이전트는 오래된 캐시를 계속 쓰고 있으면 산출물이 달라질 수 있습니다.

특히 멀티 모듈 프로젝트나 사내 Nexus를 함께 쓰는 환경에서는 같은 버전 번호라도 실제 받아온 artifact가 다르지 않은지 확인할 필요가 있습니다.

### 3. `.m2` 캐시 문제

의존성을 자주 바꾸던 시기에는 로컬과 CI 모두 `.m2` 캐시 영향도 무시하기 어려웠습니다.

버전을 올렸는데도 이전 jar가 남아 있거나, 손상된 캐시 때문에 이상한 증상이 재현되는 경우가 있어서 필요하면 캐시 정리 후 다시 검증했습니다.

## 내가 사용한 해결 방법

### 1. 불필요한 transitive dependency exclude

충돌 원인이 명확하면 먼저 불필요한 의존성을 끊었습니다.

```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>legacy-module</artifactId>
    <version>1.2.0</version>
    <exclusions>
        <exclusion>
            <groupId>com.oracle.database.jdbc</groupId>
            <artifactId>ojdbc8</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

exclude는 효과가 빠르지만, 왜 끊는지 근거 없이 남발하면 나중에 다시 꼬이기 쉽습니다.

### 2. `dependencyManagement`로 버전 고정

여러 모듈에서 같은 라이브러리를 써야 하면 결국 이 방법이 가장 안정적이었습니다.

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.oracle.database.jdbc</groupId>
            <artifactId>ojdbc8</artifactId>
            <version>19.20.0.0</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

버전 선언 위치를 한곳으로 모아 두면, 모듈마다 다른 버전이 조용히 들어오는 일을 줄일 수 있습니다.

### 3. scope 정리

간혹 `compile`, `provided`, `runtime`, `test` scope가 뒤섞여서 더 헷갈리기도 합니다.

예를 들어 서버가 이미 제공하는 라이브러리인데 애플리케이션에도 다시 넣거나, 반대로 운영에 필요한 라이브러리를 test 쪽에만 두면 환경별 차이가 커집니다.

그래서 충돌 해결할 때는 버전만 보지 않고 scope도 같이 정리했습니다.

### 4. 공통 버전 통일

공통 모듈, 배치 모듈, 웹 모듈이 같은 라이브러리를 다르게 들고 있으면 언젠가는 다시 문제가 납니다.

한 번 충돌이 났던 라이브러리는 아예 팀 기준 버전을 정하고, 부모 POM이나 BOM에서 통일하는 편이 운영 안정성에 더 도움이 됐습니다.

## 운영 환경에서 추가로 확인한 부분

dependency tree로 원인을 찾았더라도 마지막 확인은 운영 기준으로 해야 했습니다.

- 배포 산출물에 실제 어떤 jar가 포함됐는지
- WAS 공통 lib에 중복 jar가 없는지
- Jenkins와 로컬의 Maven/JDK 버전이 같은지
- 캐시를 비운 뒤에도 같은 결과가 재현되는지

가능하면 운영과 최대한 비슷한 환경에서 한 번 더 실행해 보는 것이 가장 확실했습니다.

## 정리

- dependency 충돌은 대부분 버전 관리가 느슨해질 때 생깁니다.
- 핵심은 추측보다 `mvn dependency:tree`로 실제 해석 결과를 먼저 보는 것입니다.
- `omitted for conflict`가 보이면 그냥 넘어가지 않는 편이 좋습니다.
- 로컬에서 된다는 이유만으로 안심하지 말고, 운영 classpath 기준으로 마지막 검증을 해야 합니다.

빌드가 된다고 끝난 문제가 아니라, **런타임에 어떤 버전이 실제로 올라가느냐**가 핵심이라는 점만 놓치지 않으면 원인을 훨씬 빨리 좁힐 수 있습니다.
