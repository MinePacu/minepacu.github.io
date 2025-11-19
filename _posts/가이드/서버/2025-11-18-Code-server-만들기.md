---
title: Code-server 구축해보기 - 1
date: 2025-11-12 12:30 +0900
categories: [가이드, 서버]
tags: [server-setup]
mermaid: true
---

이번에는 보면서 꽤나 흥미로운 프로젝트가 있어서 이 프로젝트 파일을 직접 설치하고 서버 구성을 변경해보고자 한다.

## 계획
1. code-server 설치
2. 포트포워딩
3. 임시로 http 에서 동작시켜보기
4. https로 변경해보기
	1. DNS 할당
	2. nginx 설치 및 설정
	3. SSL 인증서 발급
	4. 2차 nginx 설정
	5. 테스트 및 extension 설치

https 로의 전환은 다른 게시글에서 다룰 예정이다.

## 1. code-server 설치
다음과 같은 명령어를 터미널에서 실행하여 설치한다.

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

그 후, 아래와 같은 명령어들을 차례로 입력해 설정 파일을 생성한다.

```bash
mkdir -p ~/.config/code-server
nano ~/.config/code-server/config.yaml
```

config.yaml 파일에는 다음과 같은 내용을 추가한다.

```yaml
bind-addr: 127.0.0.1:8080
auth: password
password: yourpassword
cert: false
```

8080 부분은 포트인데 이 글은 명령어를 통한 포트포워딩 과정만을 다룰 것이다.
OCI에서 하는 포트포워딩은 블로그에서 이전에 DB 구축하는 곳에 방법이 들어가 있으니 참조하면 된다.
그걸 참조해서 80포트와 8080포트를 열어준다.

`password: yourpassword` 부분에서 `yourpassword` 는 본인이 원하는 비밀번호로 고쳐주면 된다.

그 후, 아래와 같은 명령어로 서비스를 시작하면 된다.

```bash
sudo systemctl enable --now code-server@[Username]
```

`Username` 부분은 현재 터미널에 로그인된 사용자의 이름을 입력하면 되는데, 아래와 같은 명령어로 확인하면 된다.

```bash
whoami
```


## 2. 포트포워딩
이제 외부 접속이 가능하게 하려면 포트포워딩을 해야한다.
OCI에서 만든 인스턴스는 우리가 집에서 접속해도 외부 접속에 해당하기 떄문에 반드시 해줘야 한다.

일단 다음과 같은 명령어를 입력한다.

```bash
sudo iptables -I INPUT -j ACCEPT
```

이 명령어는 외부에서 들어온 모든 포트를 허용한다는 뜻으로 원래는 입력이 권장되지 않는 명령어지만, OCI는 서브넷 단에서 한 번 걸러주니 괜찮긴하다. 

그 후, 아래와 같은 명령어를 입력해 80포트와 8080포트를 운영체제 단에서 열어준다.

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
```

`iptables` 명령으로 저장한 포트 허용 규칙은 재부팅 시에 삭제되므로 아래와 같은 명령어를 써서 저장 후, 다시 로드한다.

```bash
sudo netfilter-persistent save
sudo netfilter-persistent reload
```


## 3. 임시로 http 에서 구동해보기
이제 웹 브라우저를 열고 주소 칸에 다음과 같이 입력한다.

```
[서버 인스턴스의 외부 아이피]:[포트번호]
```

이후에 비밀번호를 입력하라는 창이 뜨면 `config.yaml` 에 입력한 비밀번호를 입력한다.