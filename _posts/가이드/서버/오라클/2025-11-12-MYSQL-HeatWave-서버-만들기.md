---
title: MYSQL HeatWave 서버 만들기
date: 2025-11-12 12:30 +0900
categories: [가이드, 서버, 오라클]
tags: [server-setup]
mermaid: true
---

## 1. 가상 클라우드 네트워크와 가상 서브넷 만들기

1. 다음과 같이 `Network -> Virtual cloud network` 에 들어간다.
![Menu Image in network](/img/251112/image6.png)

2. `Create VCN` 버튼을 클릭한다.
![Create VCN button](/img/251112/image7.png)

3. VCN의 이름을 입력하고, IPv4 CIDR Blocks 에는 `0.0.0.0/0`을 입력한다.
![Setting default value in VCN](/img/251112/image8.png)

4. `Create VCN` 버튼을 클릭하여 VCN을 생성한다. VCN을 생성하면 자동으로 서브넷도 생성된다.

5. 방금 만든 VCN의 상세 정보에 들어간 후, `Security` 항목에 `Default Security List for VCN`을 클릭한다.
![Setting Security rule in VCN](/img/251112/image9.png)

6. `Security rules` 항목에서 `Add Ingress rules`을 클릭한다.
![Setting Security rule in VCN](/img/251112/image10.png)

7. `Another Ingress rule` 버튼을 눌러 2개의 규칙을 만들고 `Source CIDR`에 모두 본인의 아이피/24 를 입력하고, `Destination Port Range`에는 각각 3306과 13306을 입력하고, `Add Ingress Rules` 버튼을 클릭한다. 
![Setting Security rule in VCN](/img/251112/image11.png)


## 2. DB 서버 만들기
이제 DB 서버를 만들어야 한다.

1. 다음과 같이 `Database -> DB system` 으로 이동한다.
![Menu Image](/img/251112/image.png)

2. `Create DB System` 버튼을 클릭한다.
![Create DB system button](/img/251112/image2.png)

3. `Always free` 버튼을 클릭한다.
![Selecting Template](/img/251112/image3.png)

4. DB의 이름, 설명, 관리자 계정 설정을 완료한다.
![Set Full information about DB](/img/251112/image4.png)

5. 이전 과정에서 만든 가상 클라우드 네트워크와 가상 서브넷을 지정한다.
![Set Full information about DB](/img/251112/image5.png)

6. `Always Free`로 설정하면 DB 서버의 사양은 모두 고정된다.

7. `Create` 버튼을 눌러 DB System을 생성한다.

이렇게 하면 다음과 같이 서버가 만들어져 있을 것이다.

![Setting Complete](/img/251112/image12.png)

다음 편에는 이 서버에 접속하는 법과 MYSQL을 설정하는 법에 대해서 적어보겠다.