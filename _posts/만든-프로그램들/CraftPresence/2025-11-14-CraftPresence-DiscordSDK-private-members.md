---
title: CraftPresence - DiscordSDK - private 멤버
date: 2025-11-14 10:00:00 +0900
categories: [만든 프로그램들, CraftPresence]
tags: [craftpresence, minecraft, discord-rpc, java, problem-solving]
---

이번엔 Wrapper 안에 있는 함수들에 대해 설명해보겠습니다.

## 1. 전체 코드

```c++
//
// DiscordppWrapper.hpp
// CraftPresence

#ifndef DiscordppWrapper_hpp

#define DiscordppWrapper_hpp

#include "discordpp.h"
#include "cdiscord.h"
#include <memory>
#include <string>
#include <functional>
#include <optional>

// Swift에서 호출할 수 있는 C 스타일 함수 포인터 타입 정의
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

##  2. `variable`

### 1. `client`

```c++
std::shared_ptr<discordpp::Client> client;
```

- 역할: discordpp 라이브러리의 핵심 Client 인스턴스를 가리키는 스마트 포인터
- 생성/해제: 생성자는 `std::make_shared`[<`discordpp::Client`>](https://github.com/copilot/c/53d80d0d-d4a5-4bd7-824c-48536bbc9668)()로 초기화하고, 소멸자에서 `client.reset()`으로 해제합니다.
- 사용처: 인증, 토큰 갱신, 사용자 조회, Rich Presence 업데이트 등 모든 `discordpp` 연산에 사용됩니다.
- 주의:
    - `shared_ptr`라 참조 카운트로 소유권을 관리하지만, 멀티스레드 환경에서 `client` 자체의 스레드 안전성(`discordpp` 구현)을 확인해야 한다.
    - `client`가 `nullptr`이면 대부분의 `public/private` 메서드는 조기 실패 처리(`callback` 호출 또는 `false` 반환)를 합니다.

### 2. `applicationId`

```c++
std::string applicationId;
```

- 역할: 생성자에서 전달받는 애플리케이션 ID(보통 문자열 형태의 Discord App ID)를 그대로 저장합니다.
    - 사용: `authorize()`에서 `args.SetClientId(std::stoull(applicationId))`로 `clientId` 설정 시에도 사용될 수 있고, `numericApplicationId` 파싱 실패 시 `fallback`으로 남아있습니다.


### 3.  `numericApplicationId`

```c++
uint64_t numericApplicationId = 0;
```

- 역할: `applicationId`를 숫자로 파싱한 값(캐시)입니다.
    - 초기화/설정: 생성자에서 `applicationId`가 비어있지 않으면 `stoull`로 파싱 시도하고 성공하면 `numericApplicationId`에 저장. 실패하면 0으로 유지.
    - 사용:
        - 생성자 직후 `numericApplicationId != 0`이면 `client->SetApplicationId(numericApplicationId)`를 호출합니다.
        - `resolvedApplicationId()`에서 `numericApplicationId`가 0이 아니면 이 값을 반환하고, 0이면 `client->GetApplicationId()`를 시도합니다.
    - 주의: 파싱 예외는 try/catch로 잡아서 `numericApplicationId`를 0으로 설정합니다. 문자열이 숫자가 아닐 경우를 대비합니다.

### 4. `currentCodeVerifier`

```c++
std::optional<discordpp::AuthorizationCodeVerifier> currentCodeVerifier
```
    
- 역할: OAuth PKCE(Proof Key for Code Exchange) 흐름에서 사용되는 `AuthorizationCodeVerifier` 객체를 보관합니다.
    - 생성/사용:
        - `authorize()`에서 `client->CreateAuthorizationCodeVerifier()`를 호출해 생성하고 `currentCodeVerifier`에 저장합니다.
        - `ApplyAccessToken`(토큰 적용 성공) 시 `currentCodeVerifier.reset()`으로 해제합니다.
    - 주의:
        - `optional`로 되어 있어 생성 실패 시 현재 없음 상태를 표현합니다.
        - 내부에 PKCE 관련 challenge/verifier 문자열을 포함하므로 노출/로그에 주의해야 합니다(코드에는 일부 로그가 남음).

### 5. `currentCodeVerifierValue`

```c++
std::string currentCodeVerifierValue
```

- 역할: `currentCodeVerifier`의 `Verifier()` 값을 문자열로 저장한 것(직렬화된 PKCE verifier).
    - 사용: `authorize()` 안에서 `lambda`를 위해 값(`capturedVerifier`)을 복사해 전달합니다.
    - 이유: lambda(비동기 콜백)는 함수가 리턴된 이후에 실행될 수 있으므로, `currentCodeVerifierValue`를 캡처해 사용하거나 lambda 내부에 값을 명시적으로 캡처해야 수명 문제를 줄일 수 있습니다.
    - 정리: `applyAccessToken` 성공 시 `clear()`로 지워집니다.

### 6. `lastRefreshToken`

```c++
std::string lastRefreshToken
```

- 역할: `GetToken` 호출 성공 시 응답에서 받은 `refresh token`을 저장합니다.
    - 사용: 현재 코드에서는 `refresh token`을 단순 저장만 하고 이를 이용한 토큰 재발급 흐름 구현(예: 자동 리프레시)은 보이지 않습니다.
    - 주의:
        - `refresh token`은 민감 정보이므로 안전한 저장(예: 키체인, Keychain)·삭제가 필요합니다. 현재는 메모리(plain string)에만 보관됩니다.
        - `logout()` 구현이 비어있어 `lastRefreshToken`을 지우지 않음 — 보안상 개선 권장.

## 3. `const`, `function`

### 1. `exchangeCodeForToken()`

```c++
void exchangeCodeForToken(const std::string& code,
					      const std::string& redirectUri,
						  const std::string& codeVerifier,
						  void* context,
						  AuthorizeCallback callback);
```

- 목적: OAuth authorization code를 access token + refresh token으로 교환하는 단계(서버에 토큰 요청).
- 입력:
    - `code`: `authorize()`에서 받은 authorization code(사용자가 권한을 승인한 후 발급된 값).
    - `redirectUri`: `authorize()`에서 사용된 redirect URI(Authorize 콜백이 제공).
    - `codeVerifier`: PKCE 검증용 verifier(일반적으로 `authorize()`에서 생성한 값의 복사본, `authorize()`에서는 capturedVerifier로 전달).
    - `context`, `callback`: 외부 호출자(예: Swift)에게 결과를 알리기 위한 C 스타일 콜백 규약. (자세한 콜백 내용은 [[CraftPresence - DiscordSDK - CallBack Function#1. `AuthorizeCallback` | AuthorizeCallback]] 참조)
- 구현 세부(동작 흐름):
    1. `client` 존재 여부 확인; 없으면 `callback(context,false,"Client not initialized")` 호출.
    2. `resolvedApplicationId()`를 호출해 유효한 클라이언트 ID를 확보. 0이면 실패 처리.
    3. `codeVerifier`가 비어있으면 실패 처리("Missing PKCE verifier").
    4. `client->GetToken(clientId, code, codeVerifier, redirectUri, lambda)` 호출. GetToken 비동기 콜백에서:
        - 실패: `messageFromResult(result)`를 이용해 에러 메시지 생성 후 `callback(context,false,message.c_str())` 호출.
        - 성공: `lastRefreshToken = refreshToken` 저장, `applyAccessToken(tokenType, accessToken, context, callback)` 호출.
- 주의/특징:
    - `codeVerifier`는 외부에서 복사된 문자열(`capturedVerifier`)을 넘겨주므로 원본 `currentCodeVerifier` 객체의 수명과 무관하게 사용 가능하도록 설계되어 있음.
    - `GetToken`에서 받은 `refresh token`을 `lastRefreshToken`에 보관만 하고 추가 처리(예: 안전 저장, 자동 갱신)는 없음.
    - 에러 문자열 전달 시 `message.c_str()`를 바로 callback으로 전달하는데, 이 포인터의 수명(함수 종료 이후)을 보장하지 않으므로 호출자(예: Swift)가 즉시 복사해야 안전합니다.

### 2. `applyAccessToken()`

```c++
void applyAccessToken(discordpp::AuthorizationTokenType tokenType,
					  const std::string& accessToken,
					  void* context,
					  AuthorizeCallback callback);
```

- 목적: 획득한 access token을 discordpp client에 설정하고, 연결(connect)까지 수행한 뒤 인증 완료 콜백을 호출.
- 입력:
    - `tokenType`: 토큰의 종류(discordpp enum — OAuth 토큰/봇 토큰 등).
    - `accessToken`: 실제 액세스 토큰 문자열.
    - `context, callback`: 호출자 식별자 및 결과 콜백.
- 구현(동작 흐름):
    1. `client` 존재 여부 확인.
    2. `client->UpdateToken(tokenType, accessToken, lambda)` 호출.
    3. `UpdateToken` 콜백에서 실패 시 `messageFromResult`로 에러 메시지 생성 후 `callback(context,false,message.c_str())` 호출.
    4. 성공 시 `client->Connect()` 호출(try/catch로 예외 처리). Connect 성공하면:
        - `currentCodeVerifier.reset()` 및 `currentCodeVerifierValue.clear()`로 PKCE 관련 상태 정리.
        - `callback(context, true, nullptr)`로 인증 성공 알림.
- 주의:
    - UpdateToken과 Connect의 실패는 모두 catch/콜백으로 적절히 처리합니다.
    - Connect가 예외를 던질 수 있으므로 try/catch로 잡고 callback으로 전달합니다.
    - 접근 토큰을 client에 설정한 이후에야 Connect가 호출되므로 호출자 입장에서는 callback에서 "완전히 연결된" 상태로 보면 됩니다.
    - callback에 전달되는 문자열이 임시 객체의 c_str()인 경우 수명 문제가 발생할 수 있습니다.(앞서의 권고와 동일).

### 3. `resolvedApplicationId()`

```c++
uint64_t resolvedApplicationId() const;
```

- 목적: 사용할 수 있는 numeric application id를 제공.
- 동작:
    - `numericApplicationId != 0`이면 그 값을 반환.
    - 그렇지 않으면 client가 있으면 `client->GetApplicationId()` 호출(예외 시 0 반환).
    - 최종적으로 유효하지 않으면 0을 반환.
- 사용: `exchangeCodeForToken`에서 클라이언트 ID를 결정할 때 사용된다. 
- 주의: `client->GetApplicationId()`도 예외를 던질 수 있으므로 try/catch로 보호되어 있다.

### 4. `messageFromResult`

```c++
static std::string messageFromResult(const discordpp::ClientResult& result);
```

- 목적: `discordpp::ClientResult` 객체로부터 사람이 읽을 수 있는 오류/상태 메시지를 뽑아 std::string으로 반환.
- 동작:
    1. `result.Error()`를 먼저 가져와 message에 할당.
    2. 비어있으면 `result.ToString()` 시도.
    3. 여전히 비어있으면 "Discord SDK error"로 대체.
    4. 완성된 `std::string`을 반환.
- 사용처: `GetToken/Authorize/UpdateToken` 등 실패 시 에러 메시지 생성에 사용된다.
- 주의:
    - 이 함수는 `std::string`을 반환하므로 호출 측에서 `message.c_str()`를 바로 콜백에 넘기는 패턴은 함수 종료 후 해당 `c_str()`가 가리키는 메모리의 유효성(호스트 언어의 즉시 복사 여부)에 의존합니다. 안전성 보장이 필요합니다.