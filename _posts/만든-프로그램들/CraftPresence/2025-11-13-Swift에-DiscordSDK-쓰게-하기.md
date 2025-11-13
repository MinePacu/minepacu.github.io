---
title: CraftPresence - DiscordSDK 준비 - 콜백 함수
date: 2025-11-13 10:00:00 +0900
categories: [만든 프로그램들, CraftPresence]
tags: [craftpresence, minecraft, discord-rpc, java, problem-solving]
---


맥에서 디스크도의 Rich Presence를 관리할 수 있는 프로그램을 만드는 중이다.
이 기능을 구현하려면 DiscordSDK를 사용해야 하는데, 디스코드의 SDK는 세 가지로 구성된다.

- Discord Social SDK : 게임이나 앱에 디스코드의 소셜 기능들을 추가하는데 사용한다.
- The Embedded SDK : 디스코드 내부에서 사용되는 앱을 만들 때 사용한다.
- Game SDK : 오프 플랫폼 게임이나 앱을 만들고 이를 Discord에 통합하고 싶을 때 사용한다.

지금은 Discord Social SDK를 활용해서 만들어보고자 한다.

그런데 문제가 있다.
내가 만드려는 앱은 맥에서 돌아가는 프로그램이라 Swift 기반으로 작성해야 하는대, Discord Social SDK는 C++로 작성되어 있다.

그래서 C++로 되어 있는 Discord Social SDK에서 Swift에서도 쓸 수있게 하기 위한 Wrapper를 만든다.

## 1. 전체 코드
```c++
//
//  DiscordppWrapper.hpp
//  CraftPresence

#ifndef DiscordppWrapper_hpp
#define DiscordppWrapper_hpp

#include "discordpp.h"
#include "cdiscord.h"
#include <memory>
#include <string>
#include <functional>
#include <optional>

// Swift에서 호출할 수 있는 C 스타일 함수 포인터 타입 정의
typedef void (*AuthorizeCallback)(void* context, bool success, const char* error);
typedef void (*LogoutCallback)(void* context, bool success, const char* error);
typedef void (*UserCallback)(void* context, bool success, const char* id, const char* username, const char* error);
typedef void (*ActivityCallback)(void* context, bool success, const char* error);

class DiscordppWrapper {
private:
    std::shared_ptr<discordpp::Client> client;
    std::string applicationId;
    uint64_t numericApplicationId = 0;
    std::optional<discordpp::AuthorizationCodeVerifier> currentCodeVerifier;
    std::string currentCodeVerifierValue;
    std::string lastRefreshToken;

public:
    DiscordppWrapper(const std::string& appId);
    ~DiscordppWrapper();
    
    bool isAuthorized() const;
    bool isConnected() const;
    void authorize(void* context, AuthorizeCallback callback);
    void logout(void* context, LogoutCallback callback);
    void getCurrentUser(void* context, UserCallback callback);
    void updateActivity(const std::string& name,
                       const std::string& state,
                       const std::string& details,
                       const std::string& largeImageKey,
                       const std::string& smallImageKey,
                       int64_t startTimestamp,
                       int64_t endTimestamp,
                       int32_t activityType,
                       void* context,
                       ActivityCallback callback);
    void clearActivity(void* context, ActivityCallback callback);
    void runCallbacks();

private:
    void exchangeCodeForToken(const std::string& code,
                              const std::string& redirectUri,
                              const std::string& codeVerifier,
                              void* context,
                              AuthorizeCallback callback);
    void applyAccessToken(discordpp::AuthorizationTokenType tokenType,
                          const std::string& accessToken,
                          void* context,
                          AuthorizeCallback callback);
    uint64_t resolvedApplicationId() const;
    static std::string messageFromResult(const discordpp::ClientResult& result);
};


#endif /* DiscordppWrapper_hpp */

```

### 1. 콜백 함수 정의
```c++
// Swift에서 호출할 수 있는 C 스타일 함수 포인터 타입 정의
typedef void (*AuthorizeCallback)(void* context, bool success, const char* error);
typedef void (*LogoutCallback)(void* context, bool success, const char* error);
typedef void (*UserCallback)(void* context, bool success, const char* id, const char* username, const char* error);
typedef void (*ActivityCallback)(void* context, bool success, const char* error);
```
이 함수들은 C 스타일의 비동기 알림 함수 시그니처로 **비동기 작업 완료 시 호출해서 호출자(Swift 등)에게 결과(success/failure)와 관련 데이터를 전달**하도록 설계되어 있습니다. **모든 콜백은 호출자 식별용 context 포인터와 성공 여부, 에러(또는 추가 데이터)를 전달한다.**

### 2. 공통 규칙
- 시그니처 형식: `void (CallbackName)(void context, ...)`
    - `void* context`: 호출자가 전달한 임의 포인터(식별자). 콜백이 호출될 때 다시 전달되어 호출자 쪽에서 어떤 요청에 대한 응답인지 구분하거나 상태를 복원하는 데 사용한다.
    - `bool success`: 작업 성공 여부(true면 성공, false면 실패).
    - `const char* error`: 실패 시(또는 상태 메시지) C 문자열. 성공이면 보통 `nullptr`로 전달된다. (현재 구현도 이 규칙을 따름).
- 동작: 모든 콜백은 반환값이 `void`이므로 “알림 전용”으로 사용된다. 콜백 내부에서 추가 작업(예: UI 업데이트)을 하려면 호출 스레드가 UI 스레드인지 확인하고 필요시 메인 스레드로 디스패치해야 한다.
- 중요 규칙:
    - `context` 포인터의 유효기간은 호출자가 책임져야 한다. — 콜백이 호출될 때까지 포인터가 유효해야 한다.
    - `const char*`로 전달되는 문자열의 메모리 소유권을 반드시 확인해야 한다. 현재 구현은 로컬 `std::string::c_str()` 같은 임시 버퍼 포인터를 넘기는 경우가 있어(위험) 호출자가 즉시 복사하지 않으면 댕글링 포인터가 될 수 있다. 안전한 방법(권장)은 C++에서 `strdup`로 복사해서 전달하거나, 또는 브리지 레이어에서 안전하게 복사한 뒤 호출자에게 전달하고 해제 규칙을 문서화하는 것이다. 이 부분은 추후에 개선해랴 할 부분이 될 것으로 보인다.

### 3. 각 콜백 타입 설명 

#### 1. `AuthorizeCallback`
```c++
typedef void (AuthorizeCallback)(void context, bool success, const char* error);
```
- 역할: OAuth 인증/인가(authorize) 흐름이 끝났을 때 호출된다.
- Aruguments:
    - `context`: 호출자가 authorize() 호출 시 전달한 포인터(예: 요청 식별자나 Swift 객체 포인터).
    - `success`: 인증 성공 여부(true면 액세스 토큰이 적용되고 Discord에 연결됨).
    - `error`: 실패 시 원인 문자열(성공 시 nullptr).
- 주의: 성공 시 access token 적용/연결까지 완료된 뒤 콜백이 호출된다.(구현 참조). `error` 문자열의 소유권/생명주기를 확인할 것.

#### 2. `LogoutCallback`
```c++
typedef void (LogoutCallback)(void context, bool success, const char* error);
```
- 역할: logout 요청의 완료를 알린다.
- Aruguments: `AuthorizeCallback`와 동일한 구조.
- 현재 구현: 실제로는 즉시 `success=true`를 반환만 하고 별도의 토큰 무효화/Disconnect 처리를 하지 않는다. (개선 권장)

#### 3. `UserCallback`
```c++
typedef void (UserCallback)(void context, bool success, const char* id, const char* username, const char* error);
```
- 역할: 현재 로그인된 사용자 정보를 조회(getCurrentUser)의 결과를 반환합니다.
- Aruguments:
    - `context`: 호출자가 전달한 포인터.
    - `success`: 조회 성공 여부.
    - `id`: 성공 시 사용자 ID(숫자)를 문자열로 변환한 C 문자열(성공 시 유효, 실패 시 nullptr).
    - `username`: 성공 시 사용자명 C 문자열(성공 시 유효, 실패 시 nullptr).
    - `error`: 실패 시 에러 문자열(성공 시 nullptr).
- 주의: 구현은 로컬 `std::string`의 `c_str()`을 넘겨준다. Swift에서 받으면 즉시 `String(cString:)`으로 복사해야 하며, C++이 전달한 포인터가 유효하지 않을 수 있으므로 안전 복사 또는 C++에서 `strdup`로 전달하는 방식을 권장한다.

#### 4. `ActivityCallback`
```c++
typedef void (ActivityCallback)(void context, bool success, const char* error);
```
- 역할: `updateActivity`나 `clearActivity` 호출의 완료 여부를 알립니다.
- Aruguments: `context`, `success`, `error`(실패 메시지 or `nullptr`).
- 주의: 실패 시 `result.Error().c_str()`를 그대로 전달하는 경우 소유권 문제(임시 포인터)가 있으니 앞서 설명한 대책 필요.
