---
title: CraftPresence - AppleMusicPresence
date: 2025-11-15 11:00:00 +0900
categories: [만든 프로그램들, CraftPresence]
tags: [craftpresence, discord-rpc]
---

이 문서는 `CraftPresence/CraftPresence/AppleMusicPresence.swift` 파일의 역할, 구조, 메서드, 상태 및 동작 흐름을 설명합니다.  
간단히 말씀드리면, 이 파일은 macOS의 Music 앱(Apple Music) 재생 정보를 주기적으로 가져와 앱 내부 상태로 업데이트하고, 필요 시 Discord Rich Presence로 동기화하는 단일 책임의 매니저 클래스(`AppleMusicPresenceManager`)를 제공합니다.

---

## 개요 (한줄 요약)
Apple Music의 재생 상태(트랙/아티스트/앨범/재생 위치/재생시간/앨범 아트)를 AppleScript(osascript)를 통해 주기적으로 읽고, 이를 로컬 상태로 유지하며 Discord SDK를 통해 Rich Presence로 업데이트합니다. 앨범 아트 URL은 캐싱하여 API 호출을 줄입니다.

---

## 주요 기능
- Music.app이 실행 중인지 및 현재 재생중인 트랙 정보를 주기적으로 조회
- 트랙 변경 시(또는 일정 주기마다) Discord Rich Presence 업데이트
- 앨범 아트(로컬/원격) 취득 및 캐싱
- Discord SDK의 초기화 및 presence 제거 처리
- 앱 내 관찰 가능한(Observable) 상태 제공 (SwiftUI 바인딩 가능)

---

## 클래스 요약
클래스: `AppleMusicPresenceManager`  
어노테이션: `@MainActor`, `ObservableObject`  
싱글톤: `static let shared`

### 퍼블릭 Published 프로퍼티 (UI 바인딩용)
- `isEnabled: Bool`  
  - true -> 모니터링 시작, false -> 모니터링 중지
- `currentTrack: String` — 현재 트랙 제목
- `currentArtist: String` — 현재 아티스트
- `currentAlbum: String` — 현재 앨범
- `isPlaying: Bool` — 재생중 여부
- `discordStatus: String` — Discord SDK/업데이트 상태 표시 문자열
- `albumArtwork: NSImage?` — 로컬/API에서 읽어온 앨범 아트 이미지
- `albumArtworkURL: String?` — 앨범 아트의 원격 URL(또는 식별자)

---

## 내부 상태(프라이빗)
- `monitorTimer: Timer?` — Music.app 상태를 2초마다 확인
- `updateTimer: Timer?` — Discord 업데이트를 15초마다 트리거(추가 rate limiting)
- `runner: ScriptRunner` — AppleScript 실행기
- `lastUpdateTime: Date?` — 마지막 Discord 업데이트 시각(레이트리밋용)
- `minimumUpdateInterval: TimeInterval = 15.0` — 최소 Discord 업데이트 간격
- `isDiscordConfigured: Bool` — Discord SDK 초기화 여부
- `currentPosition: TimeInterval` — 현재 트랙 위치(초)
- `totalDuration: TimeInterval` — 트랙 전체 길이(초)
- `artworkURLCache: [String: String]` — "artist|album|track" 형태의 키 -> URL 캐시
- `lastArtworkFetchTrack: String` — 마지막으로 artwork URL을 가져온 트랙 문자열(중복 호출 방지)

---

## 주요 메서드 및 동작 흐름

### startMonitoring()

```swift
func startMonitoring() {
    guard monitorTimer == nil else { return }
        
        // Discord SDK 설정 확인 및 초기화
    Task {
        await ensureDiscordConfigured()
           
        // 즉시 한 번 실행
        await fetchNowPlaying()
            
        // 2초마다 Music.app 상태 확인
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.monitorTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) 
            { [weak self] _ in
                guard let self else { return }
                Task { await self.fetchNowPlaying() }
             }
            RunLoop.main.add(self.monitorTimer!, forMode: .common)
                
            // Discord 업데이트는 15초마다
            self.updateTimer = Timer.scheduledTimer(withTimeInterval: 15.0, repeats: true) { [weak self] _ in
                guard let self else { return }
                Task { await self.updateDiscordIfNeeded() }
            }
            RunLoop.main.add(self.updateTimer!, forMode: .common)
        }
    }
}
```

- `isEnabled`가 true로 바뀌면 호출됨.
- `ensureDiscordConfigured()`를 비동기적으로 호출하여 Discord SDK 초기화.
- `fetchNowPlaying()`을 즉시 호출하여 현재 상태를 초기화.
- 메인 런루프에 두 개의 타이머를 등록:
  - monitorTimer: 2초 주기로 `fetchNowPlaying()` 호출.
  - updateTimer: 15초 주기로 `updateDiscordIfNeeded()` 호출.
- 타이머들은 common 모드로 RunLoop에 추가됨(앱 UI/스크롤 동작 중에도 동작하도록).

### stopMonitoring()

```swift
    func stopMonitoring() {
        monitorTimer?.invalidate()
        monitorTimer = nil
        updateTimer?.invalidate()
        updateTimer = nil
        
        // Discord presence 제거
        Task {
            try? await DiscordSDKManager.shared.clearActivity()
        }
        
        currentTrack = ""
        currentArtist = ""
        currentAlbum = ""
        isPlaying = false
        discordStatus = "Not Connected"
        albumArtwork = nil
        albumArtworkURL = nil
    }
```

- 타이머 무효화 및 해제.
- Discord presence 제거를 시도(비동기).
- 로컬 상태(currentTrack, currentArtist, currentAlbum, albumArtwork, albumArtworkURL 등)를 초기화하고 `isPlaying`을 false로 설정.
- `discordStatus`를 "Not Connected"로 설정.

### ensureDiscordConfigured() (private)

```swift
    private func ensureDiscordConfigured() async {
        guard !isDiscordConfigured else {
            discordStatus = "Configured"
            return
        }
        
        discordStatus = "Configuring..."
        
        await MainActor.run {
            DiscordSDKManager.shared.configure(autoAuthorize: false)
        }
        
        isDiscordConfigured = true
        discordStatus = "Configured"
        print("✅ Discord SDK configured (authorization optional)")
    }
```

- `isDiscordConfigured`가 false일 때 DiscordSDKManager의 `configure(autoAuthorize: false)`를 호출하여 SDK 초기화.
- 그 상태를 업데이트(`discordStatus = "Configuring..."` → `"Configured"`).
- 이 메서드는 Discord SDK 초기화 작업을 보장함.

### fetchNowPlaying() (private)

```swift
    private func fetchNowPlaying() async {
        let lines: [String] = [
            "tell application \"System Events\"",
            "set musicRunning to exists (process \"Music\")",
            "end tell",
            "if musicRunning is false then return \"NOT_RUNNING\"",
            "tell application \"Music\"",
            "if player state is playing then",
            "set t to name of current track",
            "set ar to artist of current track",
            "set al to album of current track",
            "set pos to player position",
            "set dur to duration of current track",
            "-- Get artwork - simplified approach",
            "set artB64 to \"\"",
            "set artInfo to \"none\"",
            "try",
            "set tr to current track",
            "set artCount to 0",
            "try",
            "set artCount to count of artworks of tr",
            "end try",
            "set artInfo to \"count:\" & artCount",
            "if artCount > 0 then",
            "try",
            "set tmpPath to \"/tmp/np_art_\" & (random number from 10000 to 99999) & \".jpg\"",
            "set artData to data of artwork 1 of tr",
            "set outFile to open for access POSIX file tmpPath with write permission",
            "set eof of outFile to 0",
            "write artData to outFile",
            "close access outFile",
            "set artB64 to do shell script \"base64 -i '\" & tmpPath & \"' | tr -d '\\\\n'\"",
            "set fileSize to do shell script \"wc -c < '\" & tmpPath & \"'\"",
            "set artInfo to artInfo & \",bytes:\" & fileSize",
            "do shell script \"rm -f '\" & tmpPath & \"'\"",
            "on error errMsg",
            "set artInfo to artInfo & \",err:\" & errMsg",
            "try",
            "close access POSIX file tmpPath",
            "end try",
            "try",
            "do shell script \"rm -f '\" & tmpPath & \"'\"",
            "end try",
            "end try",
            "end if",
            "on error mainErr",
            "set artInfo to \"error:\" & mainErr",
            "end try",
            "return t & \"||\" & ar & \"||\" & al & \"||\" & (pos as text) & \"||\" & (dur as text) & \"||\" & artB64 & \"||\" & artInfo",
            "else",
            "return \"NOT_PLAYING\"",
            "end if",
            "end tell"
        ]
        
        do {
            let output = try await runner.runWithOsascript(lines: lines)
            
            if output == "NOT_RUNNING" || output == "NOT_PLAYING" {
                // 재생 중이 아님
                if isPlaying {
                    isPlaying = false
                    albumArtwork = nil
                    Task { try? await DiscordSDKManager.shared.clearActivity() }
                }
                return
            }
            
            let parts = output.components(separatedBy: "||")
            guard parts.count >= 5 else { return }
            
            let track = parts[0]
            let artist = parts[1]
            let album = parts[2]
            let position = TimeInterval(parts[3]) ?? 0
            let duration = TimeInterval(parts[4]) ?? 0
            
            // 상태 업데이트
            let trackChanged = (track != currentTrack || artist != currentArtist)
            currentTrack = track
            currentArtist = artist
            currentAlbum = album
            currentPosition = position
            totalDuration = duration
            isPlaying = true
            
            // 앨범 아트 처리
            if parts.count >= 6 {
                let artB64 = parts[5].trimmingCharacters(in: CharacterSet.whitespacesAndNewlines)
                
                if !artB64.isEmpty {
                    if let artData = Data(base64Encoded: artB64, options: .ignoreUnknownCharacters) {
                        if let image = NSImage(data: artData) {
                            albumArtwork = image
                        }
                    }
                }
                
                // Check cache first to avoid repeated API calls
                let cacheKey = "\(artist)|\(album)|\(track)"
                
                if let cachedURL = artworkURLCache[cacheKey] {
                    // Use cached URL
                    albumArtworkURL = cachedURL
                    print("📦 Using cached artwork URL")
                } else if trackChanged || lastArtworkFetchTrack != track {
                    // Only fetch artwork URL if track changed to reduce API calls
                    if let artworkURL = await MediaRemoteHelper.shared.fetchArtworkURL(
                        artist: artist,
                        album: album,
                        track: track
                    ) {
                        albumArtworkURL = artworkURL
                        artworkURLCache[cacheKey] = artworkURL
                        lastArtworkFetchTrack = track
                    } else if let albumURL = await MediaRemoteHelper.shared.fetchAlbumArtworkURL(
                        artist: artist,
                        album: album
                    ) {
                        albumArtworkURL = albumURL
                        artworkURLCache[cacheKey] = albumURL
                        lastArtworkFetchTrack = track
                    } else {
                        albumArtworkURL = nil
                    }
                }
                
                // If we don't have local artwork, try to fetch it for display
                if albumArtwork == nil && trackChanged {
                    if let apiImage = await MediaRemoteHelper.shared.fetchArtworkFromAPI(
                        artist: artist,
                        album: album,
                        track: track
                    ) {
                        albumArtwork = apiImage
                    } else if let albumImage = await MediaRemoteHelper.shared.fetchAlbumArtwork(
                        artist: artist,
                        album: album
                    ) {
                        albumArtwork = albumImage
                    }
                }
            } else {
                albumArtwork = nil
                albumArtworkURL = nil
            }
            
            // 트랙이 바뀌었으면 즉시 Discord 업데이트
            if trackChanged {
                await updateDiscordPresence()
            }
            
        } catch {
            print("Failed to fetch now playing: \(error)")
        }
    }
```

- AppleScript 여러 라인으로 구성된 스크립트를 `ScriptRunner.runWithOsascript(lines:)`로 실행.
- 스크립트의 역할:
  - System Events로 Music 프로세스의 존재 여부 확인.
  - Music 앱의 player state가 `playing`이면 현재 트랙의 name, artist, album, player position, duration을 읽음.
  - (현재 구현) 트랙의 첫 번째 artwork를 임시 파일로 쓰고 base64 인코딩한 문자열을 반환(artB64).
  - 결과 문자열은 "t||ar||al||pos||dur||artB64||artInfo" 형식으로 반환.
  - Music이 실행되지 않거나 재생중이 아니면 "NOT_RUNNING" 또는 "NOT_PLAYING" 반환.
- Swift 측에서 반환값을 `||`로 분리해서 파싱:
  - track, artist, album, position, duration 읽기.
  - `trackChanged`를 이전 값과 비교하여 결정(현재는 track 또는 artist가 바뀌면 변경으로 간주).
  - albumArtwork(base64 -> Data -> NSImage) 복원 시도.
  - artworkURL 캐시 조회/갱신:
    - 캐시 키: "\(artist)|\(album)|\(track)" (현재는 간단한 문자열 키)
    - 캐시에 없으면 `MediaRemoteHelper.shared.fetchArtworkURL` 또는 `fetchAlbumArtworkURL`로 원격 URL 시도.
    - 로컬 이미지가 없고 트랙이 바뀌었을 때 `fetchArtworkFromAPI` 또는 `fetchAlbumArtwork`로 이미지 요청.
  - 트랙이 바뀌면 `updateDiscordPresence()` 즉시 호출.

- NOT_RUNNING / NOT_PLAYING 처리:
  - 현재는 `isPlaying`이 true였을 때만 `isPlaying = false`, `albumArtwork = nil`, 그리고 Discord의 clearActivity() 호출.
  - 그 외의 로컬 텍스트 상태(예: `currentTrack`)는 그대로 남는 흐름.

### updateDiscordIfNeeded() (private)

```swift
    private func updateDiscordIfNeeded() async {
        guard isPlaying else { return }
        
        // Rate limiting 체크
        if let last = lastUpdateTime,
           Date().timeIntervalSince(last) < minimumUpdateInterval {
            return
        }
        
        await updateDiscordPresence()
    }
```

- `isPlaying`이 true인 경우에만 동작.
- `lastUpdateTime`을 확인하여 `minimumUpdateInterval`(기본 15초)보다 짧게는 업데이트하지 않음(레이트 리밋).

### updateDiscordPresence() (private)

```swift
    private func updateDiscordPresence() async {
        guard isPlaying else { return }
        guard isDiscordConfigured else {
            print("⚠️ Discord SDK not configured yet")
            return
        }
        
        // 타임스탬프 계산 (Date 객체로 변환)
        let now = Date()
        let startDate = now.addingTimeInterval(-currentPosition)
        let endDate = now.addingTimeInterval(totalDuration - currentPosition)
        
        do {
            try await DiscordSDKManager.shared.updateActivity(
                name: "Apple Music",
                state: currentArtist.isEmpty ? "Unknown Artist" : currentArtist,
                details: currentTrack.isEmpty ? "Unknown Track" : currentTrack,
                largeImageKey: albumArtworkURL ?? "",  // 앨범 아트 URL 사용
                smallImageKey: "",
                start: startDate,
                end: endDate,
                activityType: .listening
            )
            
            lastUpdateTime = Date()
            discordStatus = "Active"
            print("✅ Discord presence updated: \(currentTrack) - \(currentArtist)")
            if let artURL = albumArtworkURL {
                print("   Album artwork: \(artURL)")
            }
        } catch {
            discordStatus = "Update Failed"
            print("❌ Failed to update Discord presence: \(error)")
        }
    }
```

- `isPlaying` && `isDiscordConfigured`가 true여야 동작.
- 현재 재생 위치(`currentPosition`)와 전체 길이(`totalDuration`)를 사용하여 시작/종료 타임스탬프 계산:
  - `start = now - currentPosition`
  - `end = now + (totalDuration - currentPosition)`
- `DiscordSDKManager.shared.updateActivity(...)` 호출:
  - name: "Apple Music"
  - state: artist (비어있으면 "Unknown Artist")
  - details: track (비어있으면 "Unknown Track")
  - largeImageKey: `albumArtworkURL ?? ""` (현재는 URL 문자열 전달 형태)
  - smallImageKey: "" (비어있음)
  - start / end / activityType: .listening
- 성공 시 `lastUpdateTime` 갱신 및 `discordStatus = "Active"`.
- 실패 시 `discordStatus = "Update Failed"` 및 에러 로그 출력.

---

## 의존성 / 외부 컴포넌트
- ScriptRunner: AppleScript(osascript)를 실행하는 유틸리티(파싱된 결과 문자열을 반환).
- MediaRemoteHelper: 앨범 아트 URL/이미지 등을 가져오는 헬퍼(로컬/원격 API 제공).
- DiscordSDKManager: Discord SDK 초기화 및 presence 업데이트/제거를 담당하는 싱글톤 래퍼.
- AppKit(NSImage) 사용: macOS 전용 UI 타입을 사용하므로 #if os(macOS)로 감싸져 있음.

---

## 사용 예시
SwiftUI 등에서 관찰(Observe)하여 사용할 수 있습니다:
```swift
// 접근
let manager = AppleMusicPresenceManager.shared
// 모니터링 시작
manager.isEnabled = true
// 모니터링 중지
manager.isEnabled = false
```
UI에서는 `@ObservedObject` 또는 `@StateObject`로 바인딩하여 `currentTrack`, `currentArtist`, `albumArtwork` 등을 표시할 수 있습니다.