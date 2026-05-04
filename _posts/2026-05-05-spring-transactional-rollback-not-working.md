---
layout: single
title: "Spring @Transactional이 rollback 안 되는 이유와 동작 원리 제대로 이해하기"
date: 2026-05-05 01:18:17 +0900
categories: [dev]
tags: [spring, transactional, transaction, rollback, aop]
toc: true
excerpt: "@Transactional이 어떻게 동작하는지부터 rollback이 기대대로 일어나지 않는 대표 원인과 점검 순서까지 정리한다."
---

# Spring @Transactional이 rollback 안 되는 이유와 동작 원리 제대로 이해하기

## 개요

Spring에서 데이터 정합성을 다룰 때 `@Transactional`은 거의 기본처럼 사용됩니다. 하지만 실무에서는 분명 예외가 발생했는데도 데이터가 rollback되지 않거나, 반대로 어디까지 묶여서 커밋되는지 애매하게 느껴질 때가 많습니다.

이 글에서는 `@Transactional`이 실제로 어떻게 동작하는지 먼저 정리하고, rollback이 기대와 다르게 보이는 대표적인 이유를 예시와 함께 살펴보겠습니다. 단순히 "애노테이션만 붙이면 된다" 수준이 아니라, 왜 그런 결과가 나오는지 이해하는 데 초점을 맞추겠습니다.

## @Transactional은 무엇을 해주는가

`@Transactional`은 메서드 실행 전후에 트랜잭션 경계를 만들어 주는 선언형 트랜잭션 기능입니다.

개념적으로는 아래 흐름에 가깝습니다.

1. 메서드 호출 전에 트랜잭션 시작
2. 비즈니스 로직 실행
3. 정상 종료 시 커밋
4. 예외 발생 시 rollback 규칙을 확인한 뒤 rollback 또는 커밋

중요한 점은 `@Transactional`이 메서드 내부를 직접 바꾸는 것이 아니라, **Spring이 프록시를 통해 메서드 호출을 감싸서 동작시킨다**는 점입니다. 이 특성 때문에 self-invocation 같은 문제가 생깁니다.

## 먼저 알아야 할 기본 rollback 규칙

Spring의 기본 규칙은 생각보다 단순합니다.

- `RuntimeException`과 `Error`가 발생하면 rollback
- 체크 예외(`Exception`)는 기본적으로 rollback하지 않음

즉, 아래 코드는 예외가 발생해도 기본 설정만으로는 rollback되지 않을 수 있습니다.

```java
@Transactional
public void createOrder(OrderRequest request) throws Exception {
    orderRepository.save(Order.create(request));
    throw new Exception("checked exception");
}
```

이 메서드는 예외를 던졌다고 해서 자동으로 rollback되는 것이 아닙니다. 체크 예외까지 rollback 대상으로 포함하려면 명시적으로 지정해야 합니다.

```java
@Transactional(rollbackFor = Exception.class)
public void createOrder(OrderRequest request) throws Exception {
    orderRepository.save(Order.create(request));
    throw new Exception("checked exception");
}
```

실무에서 "분명 실패했는데 DB에는 남아 있네?"라는 상황의 첫 번째 확인 포인트가 바로 이 규칙입니다.

## rollback이 안 되는 대표적인 이유

### 1. 체크 예외를 던지고 있다

가장 흔한 원인입니다. 서비스 로직에서 외부 연동 실패나 검증 실패를 표현하려고 체크 예외를 사용하는 경우가 있는데, 이때 `rollbackFor`를 따로 지정하지 않으면 트랜잭션이 rollback되지 않습니다.

```java
@Transactional
public void registerMember(MemberCreateCommand command) throws Exception {
    memberRepository.save(new Member(command.email()));

    if (emailAlreadyUsed(command.email())) {
        throw new Exception("이미 사용 중인 이메일입니다.");
    }
}
```

이 경우 해결 방법은 보통 둘 중 하나입니다.

- 비즈니스 의미상 적절하다면 `RuntimeException` 계열 예외를 사용한다.
- 체크 예외를 유지해야 한다면 `rollbackFor`를 명시한다.

```java
@Transactional(rollbackFor = Exception.class)
public void registerMember(MemberCreateCommand command) throws Exception {
    memberRepository.save(new Member(command.email()));

    if (emailAlreadyUsed(command.email())) {
        throw new Exception("이미 사용 중인 이메일입니다.");
    }
}
```

핵심은 예외 타입과 rollback 규칙을 같이 봐야 한다는 점입니다.

### 2. 예외를 catch한 뒤 삼켜 버렸다

트랜잭션은 보통 메서드 바깥으로 예외가 전파되어야 rollback 판단을 할 수 있습니다. 그런데 내부에서 예외를 잡고 아무 일도 없었던 것처럼 끝내면 Spring 입장에서는 정상 종료로 보게 됩니다.

```java
@Transactional
public void pay(PaymentRequest request) {
    paymentRepository.save(Payment.ready(request));

    try {
        externalPgClient.approve(request);
    } catch (Exception e) {
        log.warn("PG 승인 실패", e);
    }
}
```

위 코드는 PG 승인에 실패해도 메서드가 정상 종료되므로 커밋될 수 있습니다.

이럴 때는 예외를 다시 던지거나, 정말로 예외를 잡아야 한다면 rollback을 명시적으로 표시해야 합니다.

```java
@Transactional
public void pay(PaymentRequest request) {
    paymentRepository.save(Payment.ready(request));

    try {
        externalPgClient.approve(request);
    } catch (Exception e) {
        throw new IllegalStateException("PG 승인 실패", e);
    }
}
```

또는 아래처럼 현재 트랜잭션을 rollback-only 상태로 만들 수 있습니다.

```java
import org.springframework.transaction.interceptor.TransactionAspectSupport;

@Transactional
public void pay(PaymentRequest request) {
    paymentRepository.save(Payment.ready(request));

    try {
        externalPgClient.approve(request);
    } catch (Exception e) {
        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
    }
}
```

다만 두 번째 방식은 흐름이 눈에 잘 드러나지 않기 때문에, 특별한 이유가 없다면 예외를 다시 던지는 편이 더 읽기 쉽습니다.

### 3. 같은 클래스 내부 호출이라 프록시를 타지 않았다

`@Transactional`은 프록시 기반으로 동작합니다. 그래서 **같은 클래스 내부에서 자기 자신의 메서드를 직접 호출하면 트랜잭션 AOP가 적용되지 않습니다.**

```java
@Service
public class OrderService {

    public void placeOrder(OrderRequest request) {
        saveOrder(request);
    }

    @Transactional
    public void saveOrder(OrderRequest request) {
        orderRepository.save(Order.create(request));
        throw new IllegalStateException("주문 저장 실패");
    }
}
```

겉으로 보면 `saveOrder()`에 `@Transactional`이 붙어 있으니 rollback될 것 같지만, `placeOrder()`에서 같은 객체의 메서드를 직접 호출하고 있기 때문에 프록시를 거치지 않습니다. 결과적으로 트랜잭션이 시작되지 않을 수 있습니다.

이 문제를 피하는 가장 단순한 방법은 트랜잭션 경계를 별도 빈으로 분리하는 것입니다.

```java
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderWriter orderWriter;

    public void placeOrder(OrderRequest request) {
        orderWriter.saveOrder(request);
    }
}

@Service
public class OrderWriter {

    @Transactional
    public void saveOrder(OrderRequest request) {
        orderRepository.save(Order.create(request));
        throw new IllegalStateException("주문 저장 실패");
    }
}
```

실무에서는 `@Transactional`이 붙은 메서드가 실제로 **Spring 빈 외부에서 호출되는 구조인지**를 꼭 확인해야 합니다.

### 4. public 메서드가 아니거나 프록시 적용 대상이 아니다

보편적인 Spring AOP 설정에서는 `@Transactional`이 붙어 있어도 private 메서드나 직접 호출되는 내부 메서드에는 기대한 방식으로 적용되지 않을 수 있습니다.

예를 들어 아래 코드는 의도와 다르게 동작할 가능성이 큽니다.

```java
@Transactional
private void saveAuditLog(AuditLog auditLog) {
    auditLogRepository.save(auditLog);
}
```

트랜잭션 경계는 보통 외부에서 호출되는 서비스 계층의 public 메서드에 두는 것이 가장 안전합니다. "작은 메서드에도 다 붙이면 되겠지"보다 "어디서 트랜잭션을 시작할 것인지 명확히 두자"가 더 중요합니다.

### 5. 예외가 발생했지만 다른 트랜잭션으로 분리되어 있었다

전파 속성(`propagation`)에 따라 기대한 rollback 범위가 달라질 수 있습니다. 특히 `REQUIRES_NEW`는 현재 트랜잭션과 별개의 새 트랜잭션을 시작합니다.

```java
@Transactional
public void publishArticle(ArticleCommand command) {
    articleRepository.save(Article.create(command));
    auditService.writeLog(command);
    throw new IllegalStateException("발행 실패");
}

@Transactional(propagation = Propagation.REQUIRES_NEW)
public void writeLog(ArticleCommand command) {
    auditLogRepository.save(AuditLog.from(command));
}
```

이 경우 바깥 `publishArticle()`이 rollback되어도 `writeLog()`는 이미 별도 트랜잭션에서 커밋됐을 수 있습니다.

즉, "왜 일부 데이터만 남았지?"라는 상황에서는 예외 유무뿐 아니라 **전파 속성 때문에 트랜잭션 경계가 분리된 것은 아닌지**도 봐야 합니다.

### 6. 테스트 환경에서 rollback되는 것처럼 보였거나, 반대로 안 보였다

테스트 코드에서도 착시가 생깁니다. 예를 들어 테스트 메서드 자체에 `@Transactional`이 붙어 있으면 테스트 종료 시 rollback되기 때문에, 실제 애플리케이션 런타임과 다르게 보일 수 있습니다.

또 반대로 JPA의 쓰기 지연 때문에 SQL이 즉시 실행되지 않아 "저장 안 된 것 같은데?" 또는 "이미 반영된 것 같은데?"처럼 보일 수도 있습니다.

이럴 때는 아래를 같이 확인하는 편이 좋습니다.

- 실제 예외가 어디서 발생했는지
- flush 시점이 언제인지
- 테스트 메서드의 `@Transactional` 여부
- 서비스 메서드의 트랜잭션 경계와 전파 속성

## 동작 원리를 기준으로 보면 이해가 쉬워진다

`@Transactional` 문제를 디버깅할 때는 애노테이션 자체보다 아래 세 가지를 먼저 보는 편이 빠릅니다.

1. **프록시를 탔는가**
2. **예외가 바깥까지 전파됐는가**
3. **그 예외가 rollback 대상인가**

대부분의 문제는 이 세 가지 안에서 설명됩니다.

- self-invocation이면 프록시를 타지 않음
- catch 후 무시하면 예외가 전파되지 않음
- 체크 예외면 기본 rollback 대상이 아님

즉, rollback이 안 되는 이유는 "Spring이 이상해서"가 아니라, 트랜잭션 경계와 예외 규칙이 기대와 다르게 맞물렸기 때문인 경우가 많습니다.

## 실무에서 추천하는 적용 방식

트랜잭션 관련 문제를 줄이려면 서비스 계층에서 몇 가지 기준을 일관되게 가져가는 것이 좋습니다.

### 1. 트랜잭션 경계는 서비스 public 메서드에 둔다

컨트롤러나 repository보다 서비스 메서드 단위가 비즈니스 경계를 표현하기 좋습니다. private 메서드나 내부 헬퍼에 트랜잭션을 붙여서 해결하려고 하면 디버깅이 어려워집니다.

### 2. rollback 기준이 필요한 예외는 의도를 명확히 한다

체크 예외를 쓸지, 런타임 예외로 바꿀지, `rollbackFor`를 둘지 팀 기준을 정해 두면 좋습니다.

```java
@Transactional(rollbackFor = BizCheckedException.class)
public void cancelOrder(Long orderId) throws BizCheckedException {
    orderRepository.cancel(orderId);
    throw new BizCheckedException("환불 연동 실패");
}
```

### 3. 외부 연동과 DB 작업의 경계를 섞을 때는 특히 조심한다

결제, 메일, 메시지 발행처럼 외부 시스템 호출이 섞이면 rollback만으로 전체 정합성이 해결되지 않는 경우가 많습니다. 이럴 때는 트랜잭션 범위만 키우기보다, 어느 시점에 무엇을 확정할지 명확히 설계하는 것이 더 중요합니다.

## 확인 방법

rollback 문제가 의심될 때 제가 주로 확인하는 순서는 아래와 같습니다.

### 1. 예외 타입 확인

- `RuntimeException`인가
- 체크 예외인가
- 중간에 catch해서 삼키고 있지는 않은가

### 2. 호출 구조 확인

- `@Transactional` 메서드가 다른 Spring 빈에서 호출되는가
- 같은 클래스 내부 호출은 아닌가
- private 메서드에만 붙어 있지는 않은가

### 3. 전파 속성 확인

- `REQUIRED`인지
- `REQUIRES_NEW` 등으로 분리된 트랜잭션은 없는가

### 4. 로그로 실제 트랜잭션 흐름 확인

아래와 같이 로그 레벨을 올리면 트랜잭션 시작과 종료 흐름을 보는 데 도움이 됩니다.

```yaml
logging:
  level:
    org.springframework.transaction.interceptor: TRACE
    org.springframework.orm.jpa: DEBUG
```

### 5. 통합 테스트로 재현

트랜잭션 이슈는 단위 테스트보다 통합 테스트에서 드러나는 경우가 많습니다.

```java
@SpringBootTest
class OrderServiceTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    void 주문_저장_중_런타임예외가_발생하면_rollback된다() {
        assertThatThrownBy(() -> orderService.placeOrder(new OrderRequest("item-1")))
            .isInstanceOf(IllegalStateException.class);

        assertThat(orderRepository.count()).isZero();
    }
}
```

이런 테스트가 하나 있으면 이후 리팩터링 때도 트랜잭션 경계가 깨졌는지 빠르게 확인할 수 있습니다.

## 정리

`@Transactional`은 편리하지만, 실제 동작은 프록시와 예외 규칙 위에서 돌아갑니다. 그래서 rollback이 안 될 때는 애노테이션 유무만 볼 것이 아니라 **호출 방식, 예외 전파, 예외 타입, 전파 속성**을 같이 확인해야 합니다.

정리하면 아래 네 가지는 꼭 기억해 둘 만합니다.

- 기본 rollback 대상은 `RuntimeException`과 `Error`
- 체크 예외는 기본적으로 rollback되지 않음
- 같은 클래스 내부 호출은 프록시를 타지 않을 수 있음
- 예외를 catch해서 삼키면 정상 종료로 간주될 수 있음

이 네 가지만 머리에 들어와 있어도, `@Transactional`이 왜 기대대로 동작하지 않았는지 훨씬 빠르게 좁혀갈 수 있습니다.
