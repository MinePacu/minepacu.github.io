---
title: Code-server 구축해보기 - 1
date: 2025-11-12 12:30 +0900
categories: [가이드, 서버]
tags: [server-setup]
mermaid: true
---

이번에는 HTTP에서 보안이 더 좋은 HTTPS로 넘어가는 방법에 대해서 설명한다.

##  DNS 등록
원만하면 DNS를 등혹해서 IP 주소가 직접적으로 노출되는 일이 없도록 하는 것이 좋다.
필자는 무로 DNS인 duck DNS를 활용하였다.

Sign in 버튼들 중 원하는 하나를 골라서 로그인하고,  Recaptcha를 진행하면 본인 계정에 대한 정보 페이지가 뜬다.

본인이 원하는 서브 도메인을 입력하고, add domain 버튼을 누른다.

current ip 부분에 OCI 인스턴스의 외부 IP로 변경하고 update ip 버튼을 누른다.

그 후, 위 쪽에 있는 토큰을 잘 기록해주자.

## nginx 설치
이번엔 nginx를 설치해야 한다.
다음과 같은 명령어들을 차례로 입력한다.

```bash
sudo apt update
sudo apt install nginx
```

vim이나 nano와 같은 텍스트 편집기를 이용해서 다음과 같은 파일을 새로 만들거나 해야한다.

```bash
vim /etc/nginx/sites-available/[원하는 이름].conf
```

그 후에 그 파일을 다음과 같이 고쳐준다.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name [본인이 등록한 도메인];

    # 아직은 리다이렉트 하지 말고, certbot이 HTTP로 접근할 수 있게 놔두는 것도 방법
    # 나중에 certbot 끝난 다음에 아래 줄 활성화
    # return 301 https://$host$request_uri;

    # (테스트용 루트 페이지)
    location / {
        return 200 'nginx is alive';
        add_header Content-Type text/plain;
    }
}
```

저장한 후, 다음과 같은 명령어를 입력해 링크를 만들어, 해당 설정 파일을 활성화한다.

```bash
sudo ln -s /etc/nginx/sites-available/[원하는 이름].conf /etc/nginx/sites-enabled/
```

 다음과 같은 명령어를 입력해 본인이 고친 코드에 문제가 있는지 점검한다.

```bash
sudo nginx -t
```

에러가 없다고 뜨면 다음과 같은 명령어를 입력해 nginx를 재시작해준다.

```bash
sudo systemctl reload nginx
```

## SSL 인증서 발급
이제 암호화에 필요한 SSL 인증서를 발급받아야 한다.

우선 다음과 같은 명령어를 입력해 certbot를 설치해준다.

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

현재 nginx가 80 포트에서 본인의 도메인를 잘 응답하고 있는 상태라면

```bash
sudo certbot --nginx -d [본인의 도메인]
```

중간에 이메일 / 약관 동의 등을 물어볼 수 있다. 약관 동의는 필수와 선택이 있으니 잘 읽어보고 선택해주자.

발급이 성공하면 `/etc/letsencrypt/live/[본인의 도메인]/` 디렉터리가 생기고,  
그 안에 `fullchain.pem`, `privkey.pem` 파일이 만들어진다.

## nginx 다시 설정

이제 nginx 설치를 할 떄, 설정했던 [원하는 이름].conf 파일을 다시 읽어와야 한다.

```bash
vim /etc/nginx/sites-available/[원하는 이름].conf
```

 이제 certbot에 의해 일부 코드가 고쳐진 것을 알 수 있다.
 포트 80 부분이 다음과 같은지 확인하고 아니면 고쳐준다.

```nginx
server {
	if ($host = [본인의 도메인]) {
		return 301 https:://$host$$request_uri;
	}
	
	listen 80;
	listen [::]:80;
	server_name [본인의 도메인];
	return 404;
}
```

이제 HTTPS 부분을 다음과 같이 설정해준다.
필자는 webdav와 code-server를 모두 사용할 것이기에 각 필요한 경로에 redirect 시켜줬다.

본인에 맞게 고쳐두면 된다.

```nginx
server {
	server_name [본인의 도메인];
	
	listen [::]:443 ssl ipv6only=on;
	listen 443 ssl;
	
	ssl_certificate /etc/letsencrypt/live/[본인의 도메인]/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/[본인의 도메인]/privatekey.pem;
	include /etc/letsencrypt/options-ssl-nginx.conf;
	ssl_dhparam /etc/letsencrypt/ssl-dhparam.pem;
	
	proxyproxy_set_header Host         $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set header X-Forwarded-Host $host:$server_port;
    proxy_set header Accept-Encoding gzip;
    
    client_max_body_size 20;
    
    # webdav : https://example.com/webdav/
    location /webdab/ {
	    proxy_pass http://127.0.0.1:[본인이 설정한 포트]/;
	    
	    proxy_request_buffering off;
    }
    
    # code-server : https://example.com/code/
    location /code/ {
	    proxy_pass https://127.0.0.1:[본인이 설정한 포트(기본은 8080)]/;
	    
	    proxy_http_version 1.1;
	    proxy_set_header Upgrade $http_upgrade;
	    proxy_set_header Connection "upgrade";
	    
	    proxy_set_header Host "[본인의 도메인]";
	    
	    proxy_read_timeout 7d;
	    proxy_send_timeout 7d;
	    proxy_connect_timeout 7d;
    }
}
```

다시 다음과 같은 명령어를 입력해 테스트한 후, 문제가 없으면 서비스를 다시 시작한다.

```bash
sudo nginx -t
sudo systemctl reload nginx
```
