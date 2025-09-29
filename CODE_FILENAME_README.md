# 코드 블록 파일명 표시 기능

이 기능을 사용하면 코드 블록 상단에 파일명을 표시할 수 있습니다. Jekyll Rouge 하이라이터와 완전 호환되며, 문법 하이라이팅을 유지합니다.

## 사용법

마크다운에서 코드 블록을 작성할 때 다음과 같은 형식을 사용하세요:

````
```language:filename
코드 내용
```
````

⚠️ **중요**: 콜론(`:`) 뒤에 공백 없이 바로 파일명을 입력하세요.

### 예시

#### C# 파일
````
```csharp:Program.cs
using System;

class Program 
{
    static void Main() 
    {
        Console.WriteLine("Hello World!");
    }
}
```
````

#### Python 파일
````
```python:main.py
def hello_world():
    print("Hello, World!")

if __name__ == "__main__":
    hello_world()
```
````

#### JavaScript 파일
````
```javascript:app.js
function greet(name) {
    return `Hello, ${name}!`;
}

console.log(greet("World"));
```
````

## 기능

- **파일명 표시**: 코드 블록 상단에 파일명이 표시됩니다
- **복사 버튼**: 각 코드 블록에 복사 버튼이 추가됩니다
- **테마 지원**: 다크/라이트 테마를 자동으로 지원합니다
- **반응형**: 모바일 환경에서도 잘 작동합니다

## 지원되는 언어

모든 Prism.js 하이라이팅 언어를 지원합니다:

- `csharp` - C#
- `python` - Python
- `javascript` - JavaScript
- `typescript` - TypeScript
- `java` - Java
- `cpp` - C++
- `c` - C
- `html` - HTML
- `css` - CSS
- `scss` - SCSS
- `json` - JSON
- `yaml` - YAML
- `xml` - XML
- `markdown` - Markdown
- `bash` - Bash/Shell
- `sql` - SQL
- `php` - PHP
- `ruby` - Ruby
- `go` - Go
- `rust` - Rust
- `kotlin` - Kotlin
- `swift` - Swift
- 그 외 많은 언어들...

## 주의사항

1. 파일명에는 공백을 사용하지 마세요. 대신 언더스코어(`_`)나 하이픈(`-`)을 사용하세요.
2. 콜론(`:`) 문자는 언어와 파일명을 구분하는 용도로만 사용됩니다.
3. 파일명은 실제 확장자를 포함해야 더 명확합니다 (예: `.cs`, `.py`, `.js`).

## 예상 결과

위 문법을 사용하면:
- 코드 블록 상단에 회색 배경의 헤더가 표시됩니다
- 헤더 왼쪽에는 파일명이 표시됩니다  
- 헤더 오른쪽에는 복사 버튼이 표시됩니다
- 복사 버튼을 클릭하면 코드가 클립보드에 복사됩니다
- 복사 성공 시 체크 아이콘으로 2초간 변경됩니다