---
title: "[251118] 개발 일지 - Github Actions 입문 + 문제 해결기"
date: 2025-11-18 15:16 +0900
categories: [프로그램, 일지]
tags: [diary]
---

이번엔 어느 시스템에서든 바로 빌드된 파일들을 받아볼 수 있도록 하기 위해 Github Actions를 활용해보기로 했다.
~~사실 처음에는 arm64 기반의 리눅스에서 docker로 빌드해보려 했지만 리눅스에서 Windows 용 종속성을 가져오지 못해서 말아먹었더.~~

처음부터 바로 코드를 짜 보기에는 막막해서 AI에서 베이스 설정을 지시했다. 모델은 Gemini 2.5 Pro를 사용했다. 처음 코드는 다음과 같았다.

```yml
# 1. Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /source

# 솔루션 파일 복사
COPY CustomWindow.sln .

# NuGet 복원에 필요한 모든 프로젝트 파일들을 정확한 경로를 사용하여 복사합니다.
COPY ["CustomWindow/CustomWindow/", "./CustomWindow/CustomWindow/"]
COPY ["CustomWindow/CustomWindow.Tests/", "./CustomWindow/CustomWindow.Tests/"]
COPY ["CustomWindow/CustomWindow (Package)/", "./CustomWindow/CustomWindow (Package)/"]
COPY ["CustomWindow/BorderService_test_winrt2/", "./CustomWindow/BorderService_test_winrt2/"]

# --- 핵심 수정 부분 (1) ---
# EnableWindowsTargeting=true 속성을 추가하여 Linux 환경에서 Windows 타겟 프로젝트의 restore를 허용합니다.
RUN dotnet restore "CustomWindow.sln" /p:EnableWindowsTargeting=true

# 나머지 모든 소스 코드를 복사합니다.
COPY . .

# --- 핵심 수정 부분 (2) ---
# publish 시에도 EnableWindowsTargeting=true 속성이 필요합니다.
# 또한, 결과물이 Windows용이므로 Runtime Identifier를 'win-x64'로 변경해야 합니다.
RUN dotnet publish "CustomWindow.sln" -c Release -o /app/publish --no-restore -r win-x64 /p:EnableWindowsTargeting=true /p:maxcpucount
```


## 종속성

하지만 이 코드는 빌드 과정에서 다음과 같은 오류를 출력했다.

```code
"D:\a\CustomWindow\CustomWindow\CustomWindow.sln" (default target) (1) -> "D:\a\CustomWindow\CustomWindow\CustomWindow\CustomWindow (Package)\CustomWindow (Package).wapproj" (default target) (2) -> "D:\a\CustomWindow\CustomWindow\CustomWindow\CustomWindow\CustomWindow.csproj" (publish target) (3:5) -> (ResolveReadyToRunCompilers target) -> C:\Program Files\dotnet\sdk\9.0.306\Sdks\Microsoft.NET.Sdk\targets\Microsoft.NET.Publish.targets(409,5): error NETSDK1094: Unable to optimize assemblies for performance: a valid runtime package was not found. Either set the PublishReadyToRun property to false, or use a supported runtime identifier when publishing. When targeting .NET 6 or higher, make sure to restore packages with the PublishReadyToRun property set to true. [D:\a\CustomWindow\CustomWindow\CustomWindow\CustomWindow\CustomWindow.csproj] "D:\a\CustomWindow\CustomWindow\CustomWindow.sln" (default target) (1) -> "D:\a\CustomWindow\CustomWindow\CustomWindow\BorderService_test_winrt2\BorderService_test_winrt2\BorderService_test_winrt2.vcxproj" (default target) (5) -> (_CheckWindowsSDKInstalled target) -> C:\Program Files\Microsoft Visual Studio\2022\Enterprise\MSBuild\Microsoft\VC\v170\Microsoft.Cpp.WindowsSDK.targets(46,5): error MSB8036: The Windows SDK version 10.0.22621.0 was not found. Install the required version of Windows SDK or change the SDK version in the project property pages or by right-clicking the solution and selecting "Retarget solution". [D:\a\CustomWindow\CustomWindow\CustomWindow\BorderService_test_winrt2\BorderService_test_winrt2\BorderService_test_winrt2.vcxproj]
```

오류 내용들을 요약하면 다음과 같다.

1. **Error `NETSDK1094` (Unable to optimize assemblies for performance):**
    
    - **내용:** `.wapproj`(패키징 프로젝트)가 프로젝트를 빌드 후 게시(Publish)하려고 할 때, ReadyToRun(R2R) 최적화를 시도하지만 필요한 런타임 패키지를 찾지 못해 발생하는 오류입니다.
    - **중요도:** 높음. **빌드 실패의 직접적인 원인 중 하나입니다.** CI/CD 환경에서는 R2R 최적화를 명시적으로 끄거나, 런타임 식별자(RID)를 정확히 제공해야 합니다.
2. **Error `MSB8036` (The Windows SDK version 10.0.22621.0 was not found):**
    
    - **내용:** C++ 프로젝트(`BorderService_test_winrt2.vcxproj`)가 빌드되기 위해 특정 버전의 Windows SDK(`10.0.22621.0`)를 필요로 하지만, GitHub Actions의 `windows-latest` 가상머신에 해당 버전이 설치되어 있지 않다는 오류입니다.
    - **중요도:** 높음. **빌드 실패의 또 다른 직접적인 원인입니다.** GitHub Actions 워크플로우에 이 특정 버전의 SDK를 설치하는 단계를 추가해야 합니다.

여기서 AI는 다음과 같은 해결 방안을 제시해 코드를 고쳤다.
1. C++ 프로젝트가 요구하는 **특정 버전의 Windows SDK를 설치**하는 단계를 추가합니다.
2. `msbuild` 명령어에 **ReadyToRun 최적화를 끄는 속성**(`PublishReadyToRun=false`)을 추가합니다.

```yml
name: Build CustomWindow on Windows

on:
  push:
    branches: [ master, main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    # --- 핵심 수정 부분 (1) ---
    # C++ 프로젝트(MSB8036)에 필요한 특정 Windows SDK 설치
    - name: Install specific Windows SDK
      run: |
        Add-WindowsCapability -Online -Name "Tools.Development.Desktop.Sdk.10.0.22621"
      shell: pwsh

    - name: Setup MSBuild
      uses: microsoft/setup-msbuild@v2

    - name: Restore NuGet packages
      run: msbuild -t:restore CustomWindow.sln

    # --- 핵심 수정 부분 (2) ---
    # PublishReadyToRun=false 속성을 추가하여 NETSDK1094 오류 해결
    - name: Build Solution
      run: msbuild CustomWindow.sln -p:Configuration=Release -p:Platform=x64 -p:PublishReadyToRun=false

    - name: Upload build artifacts
      # 빌드 결과물 경로를 좀 더 일반적인 솔루션 레벨의 출력 경로로 변경합니다.
      # 패키징 프로젝트(.wapproj)의 결과물은 AppPackages 폴더에 생성될 가능성이 높습니다.
      uses: actions/upload-artifact@v4
      with:
        name: windows-build-artifacts
        path: CustomWindow/CustomWindow (Package)/AppPackages/
```

여기서 AI는 한 가지를 실수를 하게 된다. 이거 고친다고 Commit만 20번 정도했는데, 일일히 그 과정을 다 설명하기엔 너무 길어져버리니, 실수한 것을 설명해보겠다.

1. GitHub Actions에서 제공하는 가상 머신에는 SDK 수동 설치를 지원하지 않는다.
	- 이게 왜인지는 모르겠는데, yml 파일로는 SDK 수동 설치가 불가능하다. 해도 MSB8036 에러를 다시 띄워버린다. 설치 자체는 통과하는데 아무리 해도 인식을 못한다.
	- 이걸 모르고, 계속 다른 방법의 설치 코드를 사용하려 한다.

해결 방법은 다음과 같다.

- 윈도우 최신에서 작동하는 것이 아닌 한 버전 아래(2022) 버전에서 빌드하도록 한다.
	- Github에서 공식으로 운영하는 Actions의 리포지토리 중 [runner-images](https://github.com/actions/runner-images) 라는 리포지토리가 있다. 이 리포지토리는 Actions에서 사용하는 다양한 SDK를 미리 설치해두는 곳이라고 보면 된다.
	- 그런데 최신인 `windows-lastest` (WIndows Server 2025) 에는 Windows SDK 의 빌드 버전이 10.0.26100.0 버전 하나만 지원한다. 자세한 건 [문서](https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-Readme.md#installed-windows-sdks) 를 참조하면 된다.
	- 그래서 한 버전 아래인 `windows-2022` (Windows Server 2022) 로 가면 아래와 같이 지원 범위가 넓어진다. (이 부분은 [이 문서](https://github.com/actions/runner-images/blob/main/images/windows/Windows2022-Readme.md#installed-windows-sdks) 부분을 참조하면 된다.)
		- 10.0.17763.0
		- 10.0.19041.0
		- 10.0.22621.0
		- 10.0.26100.0
	- 이걸 이용하면 따로 설치 절차를 거치지 않아도 문제를 해결할 수 있다.

그래서 이 문제는 약 20번 정도의 시도 끝에 해결했는데, 문제가 하나 또 있다.

```code
D:\a\CustomWindow\CustomWindow\CustomWindow\BorderService_test_winrt2\BorderService_test_winrt2\BorderService_test_winrt2.vcxproj(142,5): error : 이 프로젝트는 이 컴퓨터에 없는 NuGet 패키지를 참조합니다. 해당 패키지를 다운로드하려면 NuGet 패키지 복원을 사용하십시오. 자세한 내용은 http://go.microsoft.com/fwlink/?LinkID=322105를 참조하십시오. 누락된 파일은 ..\packages\Microsoft.Windows.CppWinRT.2.0.220531.1\build\native\Microsoft.Windows.CppWinRT.props입니다.
```

디버그 로그는 저렇게 나오는데, 실제로 문제를 분석하면, 이렇다.
- 패키지는 프로젝트 파일에서 결정한다.
	- 프로젝트 파일에서 `./packages/Microsoft.Windows.CppWinRT..` 를 요구한다.
	- 따라서 여기의 경우, 경로는 {{$ reporoot.workflow }}/CustomWindow/BorderService_test_winrt2/packages/... 이여야 한다.
- yml 파일에서는 working directory를 따로 지정하지 않았으므로, {{ $ reporoot }} 에서 시작한다.

그래서 해결 방법은
- `nuget restore CustomWindow.sln` 에서 `nuget` 명령은 `PackageDirectory`라는 옵셥을 제공한다. 이를 이용해 패키지 설치 경로를 요구 사항에 맞춘다.

따라서 약 44번의 시도 끝에 완성된 코드는 다음과 같다.

```yml
name: Build CustomWindow on Windows

on:
  push:
    branches: [ master, main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-2022

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    # - name: Setup MSVC environment
    #  shell: cmd
    #  run: |
    #    call "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvarsall.bat" x64 10.0.22621.0
    - name: Setup MSBuild
      uses: microsoft/setup-msbuild@v2
      
    - name: Setup MSVC environment
      uses: ilammy/msvc-dev-cmd@v1

    - name: Debug paths – print solution directory
      run: |
        echo "== Solution Directory =="
        echo "${{ github.workspace }}"
        echo "Directory content:"
        Get-ChildItem -Path "${{ github.workspace }}"

    - name: Debug paths – print subfolders recursively
      run: |
        echo "== Full Directory Tree =="
        Get-ChildItem -Path "${{ github.workspace }}" -Recurse

    - name: Debug paths – check project folder
      run: |
        echo "== BorderService_test_winrt2 Project Folder =="
        Get-ChildItem -Path "${{ github.workspace }}\CustomWindow\BorderService_test_winrt2\BorderService_test_winrt2"

    - name: Debug paths – check packages folder in repo root
      run: |
        echo "== packages (root) =="
        if (Test-Path "${{ github.workspace }}\packages") {
          Get-ChildItem -Path "${{ github.workspace }}\packages" -Recurse
        } else {
          echo "packages folder does NOT exist in repo root"
        }

    - name: Debug paths – check packages folder in solution folder
      run: |
        echo "== packages (solution folder) =="
        if (Test-Path "${{ github.workspace }}\CustomWindow\packages") {
          Get-ChildItem -Path "${{ github.workspace }}\CustomWindow\packages" -Recurse
        } else {
          echo "packages folder does NOT exist in solution folder"
        }

    - name: Debug paths – check packages folder next to vcxproj
      run: |
        echo "== packages (next to project) =="
        if (Test-Path "${{ github.workspace }}\CustomWindow\BorderService_test_winrt2\packages") {
          Get-ChildItem -Path "${{ github.workspace }}\CustomWindow\BorderService_test_winrt2\packages" -Recurse
        } else {
          echo "packages folder does NOT exist next to the project (.vcxproj)"
        }

    - name: Debug paths – search for CppWinRT
      run: |
        echo "== Searching for CppWinRT =="
        Get-ChildItem -Path "${{ github.workspace }}" -Recurse -ErrorAction SilentlyContinue |
          Where-Object { $_.FullName -match "Microsoft.Windows.CppWinRT" } |
          Select-Object FullName

    - name: Restore NuGet packages   
      run: nuget restore CustomWindow.sln -PackagesDirectory CustomWindow/BorderService_test_winrt2/packages

    # --- 핵심 수정 부분 (2) ---
    # PublishReadyToRun=false 속성을 추가하여 NETSDK1094 오류 해결
    - name: Build Solution
      run: msbuild CustomWindow.sln -p:Configuration=Release -p:Platform=x64 -p:PublishReadyToRun=false

    - name: Debug paths – print subfolders recursively
      run: |
        echo "== Full Directory Tree =="
        Get-ChildItem -Path "CustomWindow/CustomWindow/bin/x64/Release/net8.0-windows10.0.19041.0/win-x64" -Recurse
        
    - name: Copy C++ executable to .NET output directory
      run: |
        # C# 프로젝트의 출력 폴더 경로를 찾습니다.
        $destDir = (Resolve-Path -Path "CustomWindow/CustomWindow/bin/x64/Release/net8.0-windows10.0.19041.0/win-x64").Path
        
        # C++ 프로젝트의 실행 파일 경로를 지정합니다.
        $sourceFile = "x64/Release/BorderService_test_winrt2.exe"
        
        # 파일을 복사합니다.
        Copy-Item -Path $sourceFile -Destination $destDir
        
        # 확인을 위해 로그를 출력합니다.
        echo "Copied $sourceFile to $destDir"
      shell: pwsh

    - name: Upload Packaged App Artifacts (Installer)
      uses: actions/upload-artifact@v4
      with:
        name: packaged-app-artifacts
        path: CustomWindow/CustomWindow (Package)/AppPackages/

    - name: Upload Unpackaged App Artifacts (Executable)
      uses: actions/upload-artifact@v4
      with:
        name: unpackaged-app-artifacts
        # 이제 이 경로에는 C# 앱과 C++ 앱이 모두 포함되어 있습니다.
        path: CustomWindow/CustomWindow/bin/x64/Release/net8.0-windows10.0.19041.0/win-x64/
```

갑자기 늘어난 코드들을 보면 알겠지만, 경로 하나 찾겠다고, 온갖 경로를 보기 위한 디버그 코드들을 집어넣은 것을 알 수 있다.
이런 걸 보면, 내가 디렉터리 구조를 되게 안좋게 구성했다는 것을 알 수 있게 된다.
앞으로는 디렉터리 구조를 좀 더 체계적으로 구성할 수 있도록 해야 할 것이댜.