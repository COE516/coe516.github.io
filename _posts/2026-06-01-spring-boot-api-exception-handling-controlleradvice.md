---
layout: single
title: "Spring Boot API 예외 처리, @ControllerAdvice로 표준화하기"
date: 2026-06-01 09:00:00 +0900
categories: [spring]
tags: [spring, spring-boot, api, 예외처리]
toc: true
excerpt: "컨트롤러마다 try-catch를 흩뿌리기 시작하면 API 응답 형식이 금방 흔들린다. @ControllerAdvice와 에러 코드 규칙으로 예외 처리를 표준화하는 기준을 정리한다."
---

## 문제 상황

Spring Boot API를 만들다 보면 예외 처리는 결국 한 번 정리해야 하는 시점이 옵니다.

초반에는 컨트롤러에서 `try-catch`로 바로 처리해도 크게 불편하지 않습니다.
그런데 엔드포인트가 늘어나면 아래 문제가 같이 따라옵니다.

- 컨트롤러마다 같은 예외 처리 코드 반복
- API마다 에러 응답 형식이 다름
- 내부 예외 메시지가 그대로 노출됨
- 클라이언트가 케이스별 분기 코드를 계속 늘려야 함

운영 단계에서는 이 차이가 더 크게 보입니다.
같은 종류의 실패인데 어떤 API는 문자열만 내려주고, 어떤 API는 JSON 객체를 내려주면 장애 대응이나 로그 분석도 불편해집니다.

## try-catch를 컨트롤러에 두면 생기는 문제

예를 들어 처음에는 아래처럼 작성하기 쉽습니다.

```java
@PostMapping("/users")
public ResponseEntity<?> createUser(@RequestBody UserRequest request) {
    try {
        userService.createUser(request);
        return ResponseEntity.ok("success");
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
```

이 코드가 바로 틀렸다고 보기는 어렵습니다.
문제는 이런 방식이 여러 컨트롤러로 퍼졌을 때입니다.

- 정상 응답과 실패 응답 구조가 API마다 달라짐
- `Exception`을 넓게 잡아 원인 구분이 어려워짐
- 예외 처리 정책을 바꾸려면 컨트롤러를 전부 수정해야 함

즉, 예외 처리 코드는 돌아가더라도 **정책은 중앙에 없고 구현만 흩어진 상태**가 됩니다.

## 먼저 맞춰야 할 것: 에러 응답 구조

전역 예외 처리보다 먼저 정할 것은 응답 형식입니다.

예를 들어 실패 응답을 아래처럼 통일할 수 있습니다.

```json
{
  "success": false,
  "code": "USER_001",
  "message": "사용자를 찾을 수 없습니다",
  "data": null
}
```

핵심은 형식이 화려한가가 아니라, **항상 같은 필드가 내려오는가**입니다.

보통은 아래 정도만 있어도 충분합니다.

- `success`: 성공/실패 여부
- `code`: 에러 코드
- `message`: 사용자 또는 클라이언트가 볼 메시지
- `data`: 성공 시 본문, 실패 시 `null`

## 공통 응답 객체 예시

```java
@Getter
@Builder
public class ApiResponse<T> {

    private boolean success;
    private String code;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .code("SUCCESS")
                .message("성공")
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> fail(String code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .code(code)
                .message(message)
                .data(null)
                .build();
    }
}
```

이 구조를 먼저 정해두면 컨트롤러, 서비스, 예외 처리기 모두 같은 기준으로 맞추기 쉽습니다.

## @ControllerAdvice로 전역 예외 처리 모으기

Spring Boot에서는 `@RestControllerAdvice`와 `@ExceptionHandler`로 전역 예외 처리를 묶을 수 있습니다.

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Server error", e);

        return ResponseEntity.internalServerError()
                .body(ApiResponse.fail(
                        "COMMON_500",
                        "서버 오류가 발생했습니다."
                ));
    }
}
```

이렇게 두면 컨트롤러는 정상 흐름에 집중하고, 예외 응답 정책은 한 곳에서 관리할 수 있습니다.

중요한 점은 `@ControllerAdvice`의 목적이 단순히 `try-catch`를 없애는 데 있지 않다는 것입니다.
핵심은 **응답 규칙을 중앙에서 유지하는 것**입니다.

## 비즈니스 예외는 따로 구분하는 편이 낫다

실무에서는 모든 예외를 `Exception` 하나로 처리하면 부족한 경우가 많습니다.

- 사용자를 찾을 수 없음
- 요청 상태가 이미 처리 완료임
- 권한이 없음

이런 케이스는 서버 장애라기보다 도메인 규칙 위반에 가깝습니다.
그래서 커스텀 예외와 에러 코드를 따로 두는 편이 관리하기 쉽습니다.

```java
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    USER_NOT_FOUND("USER_001", "사용자를 찾을 수 없습니다"),
    INVALID_REQUEST("VALID_001", "잘못된 요청입니다");

    private final String code;
    private final String message;
}
```

```java
@Getter
public class CustomException extends RuntimeException {

    private final ErrorCode errorCode;

    public CustomException(ErrorCode errorCode) {
        this.errorCode = errorCode;
    }
}
```

전역 처리기에서는 이 예외를 별도로 받아 응답을 맞춥니다.

```java
@ExceptionHandler(CustomException.class)
public ResponseEntity<ApiResponse<Void>> handleCustomException(CustomException e) {
    ErrorCode errorCode = e.getErrorCode();

    return ResponseEntity.badRequest()
            .body(ApiResponse.fail(
                    errorCode.getCode(),
                    errorCode.getMessage()
            ));
}
```

서비스에서는 아래처럼 명확하게 던질 수 있습니다.

```java
public User findUser(Long id) {
    return userRepository.findById(id)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
}
```

이 구조의 장점은 예외가 발생한 위치보다 **어떤 정책으로 응답할지**가 더 선명해진다는 점입니다.

## Validation 예외도 같은 형식으로 맞춘다

요청값 검증 예외도 별도로 처리하는 편이 좋습니다.

```java
@Getter
public class UserRequest {

    @NotBlank(message = "이름은 필수입니다")
    private String name;

    @Email(message = "이메일 형식이 아닙니다")
    private String email;
}
```

```java
@PostMapping("/users")
public ResponseEntity<ApiResponse<Void>> createUser(
        @Valid @RequestBody UserRequest request) {
    return ResponseEntity.ok(ApiResponse.success(null));
}
```

```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ApiResponse<Void>> handleValidationException(
        MethodArgumentNotValidException e) {

    String message = e.getBindingResult()
            .getFieldError()
            .getDefaultMessage();

    return ResponseEntity.badRequest()
            .body(ApiResponse.fail("VALID_001", message));
}
```

응답 예시는 아래처럼 맞출 수 있습니다.

```json
{
  "success": false,
  "code": "VALID_001",
  "message": "이름은 필수입니다",
  "data": null
}
```

클라이언트 입장에서는 실패 종류가 달라도 응답 구조가 같기 때문에 처리 방식이 단순해집니다.

## 에러 코드 규칙은 작게 시작해도 된다

에러 코드는 거창하게 설계하지 않아도 됩니다.
다만 접두어 정도는 초반에 맞춰두는 편이 좋습니다.

| Prefix | 의미 |
| --- | --- |
| USER | 사용자 관련 |
| AUTH | 인증/인가 |
| VALID | 요청 검증 |
| COMMON | 공통 서버 오류 |

예를 들면 아래처럼 관리할 수 있습니다.

- `USER_001`: 사용자 없음
- `AUTH_001`: 로그인 필요
- `AUTH_002`: 권한 없음
- `VALID_001`: 요청값 오류
- `COMMON_500`: 서버 오류

운영에서 에러 로그를 볼 때도 코드 기준으로 묶기가 쉬워집니다.

## 실무에서 같이 보는 기준

전역 예외 처리만 넣는다고 구조가 자동으로 좋아지지는 않습니다.
보통은 아래 기준을 같이 봅니다.

- HTTP 상태 코드는 의미에 맞게 사용하기
- 내부 구현 예외 메시지를 그대로 외부에 노출하지 않기
- 도메인 예외와 예상 못 한 시스템 예외를 분리하기
- Validation 오류도 공통 응답 형식으로 맞추기

특히 `500` 계열은 사용자 메시지와 내부 로그를 분리해서 보는 편이 안전합니다.
사용자에게는 일반화된 메시지를 주고, 실제 원인은 서버 로그에서 확인하는 방식이 흔합니다.

## 정리

Spring Boot API 예외 처리에서 중요한 것은 예외를 어디서 잡느냐보다 **응답 정책을 얼마나 일관되게 유지하느냐**입니다.

정리하면 아래 네 가지부터 맞추면 됩니다.

- 컨트롤러마다 `try-catch`를 반복하지 않기
- `@RestControllerAdvice`로 예외 처리 정책 모으기
- 공통 응답 객체로 형식 통일하기
- 에러 코드 규칙을 작게라도 정해두기

프로젝트 초반에는 단순해 보여도, API가 늘어나면 예외 처리의 일관성이 운영 비용 차이로 이어집니다.
그래서 작은 서비스라도 예외 응답 규칙은 초반에 먼저 잡아두는 편이 훨씬 낫습니다.
