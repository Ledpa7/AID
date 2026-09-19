**AID**

**AI Agent Identity & Trust Infrastructure**

**Master Development Roadmap v1.0**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>제품 정의<br />
</strong>AID는 AI Agent가 상대 Agent의 신원(Identity),
소유권(Ownership), 암호학적 진위(Signature), Endpoint 및 검증
증거(Evidence)를 기계적으로 확인할 수 있게 하는 Agent Trust
Infrastructure다.<br />
<br />
AID는 '이 Agent를 믿어라'고 판정하지 않는다. 무엇이 어떤 방법으로
검증되었는지를 제공하고, 최종 신뢰 정책은 호출하는 Agent/기업이
결정한다.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

개발 원칙: 가장 단순한 Registry MVP에서 시작해 Agent-native Trust
Network까지 단계적으로 확장

# 0. Executive Summary

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>한 줄 목표<br />
</strong>“Can I verify that this agent is who it claims to be?”라는
질문에 API 한 번으로 검증 가능한 증거를 제공한다.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

초기 AID는 Agent 주소 발급 서비스가 아니라, 기존 Agent를 등록하고 영구
ID와 사람이 읽을 수 있는 주소를 부여한 뒤 Agent Card/Endpoint/Domain을
검증하는 Registry로 시작한다. 이후 공개키 기반 인증, 요청 서명,
Credential, Trust History, Gateway/Framework 통합으로 발전시킨다.
블록체인은 MVP 및 핵심 로드맵에서 제외한다.

| **단계** | **제품 상태**            | **핵심 가치**                                | **개발 난이도** |
|----------|--------------------------|----------------------------------------------|-----------------|
| 1        | Registry MVP             | 등록·주소·Resolve·기본 검증                  | 낮음            |
| 2        | Verifiable Identity      | 공개키·Challenge·소유권 증명                 | 중간            |
| 3        | Agent-native Enrollment  | Agent가 권한 위임을 받아 자동 AID 발급       | 중간            |
| 4        | Trust Verification Layer | 요청 진위·Credential·Evidence API            | 중상            |
| 5        | Trust Network            | Gateway·Discovery·Private/Enterprise·History | 높음            |
| 6        | Ecosystem Standard       | Framework/플랫폼 기본 통합·연합형 Trust      | 매우 높음       |

## 0.1 비협상 설계 원칙

- Permanent AID와 사람이 읽는 주소(alias)를 분리한다. 주소가 바뀌어도
  AID는 유지한다.

- Identity Trust와 Reputation/Credit을 분리한다. 신생 Agent도 강한 신원
  검증이 가능해야 한다.

- AID는 신뢰 점수를 임의로 만들지 않고 검증 가능한 Evidence를 제공한다.

- Private Key는 AID 서버가 생성·보관하지 않는다. Agent/Runtime 측에서
  생성한다.

- A2A, MCP, W3C VC, SPIFFE, HTTP 보안 표준을 가능한 한 재사용한다.

- AID는 Agent 실행, LLM inference, task lifecycle, context/memory를
  책임지지 않는다.

- AID Gateway는 MVP에서 Agent 트래픽을 프록시하지 않는다.

- 블록체인은 초기 제품에서 제외하고 append-only event log/hash 구조만
  준비한다.

# 1. 문제 정의

Agent-to-Agent 환경에서는 상대 Agent가 스스로 이름, 기능, Endpoint를
주장할 수 있다. 그러나 자기소개 정보만으로는 그 Agent가 실제로 해당
소유자에 의해 운영되는지, 이전에 보았던 동일 Agent인지, 현재 요청이
등록된 Agent가 보낸 것인지 검증하기 어렵다. AID는 이 공백을 '영구
Identity + 검증 증거 + 기계 검증 API'로 해결한다.

Agent A  
\|  
\| "travel@company와 통신해도 되는가?"  
v  
AID Verify  
\|- Permanent Identity exists?  
\|- Signature valid?  
\|- Endpoint ownership verified?  
\|- Domain ownership verified?  
\|- Organization credential available?  
v  
Evidence Result  
\|  
v  
Agent A의 자체 정책으로 CONNECT / DENY 결정

## 1.1 AID가 보증하는 것과 보증하지 않는 것

| **AID가 제공**              | **AID가 제공하지 않음**           |
|-----------------------------|-----------------------------------|
| 영구 Agent ID 존재 여부     | Agent가 업무를 잘 수행한다는 보증 |
| 공개키/서명 검증 결과       | 악의가 없다는 절대적 보증         |
| Endpoint/Domain 소유권 증거 | 법적 법인 동일성(별도 검증 전)    |
| Credential/Issuer 증거      | 일률적인 Trust Score              |
| 검증 시점·상태·History      | Agent의 task/context/memory 관리  |

# 2. 목표 아키텍처

AID PLATFORM  
  
Web Console REST API SDK / MCP  
\\ \| /  
\\ \| /  
+--------- AID CORE --------+  
\|  
+------------+-------------+  
\| \| \|  
Registry Evidence Verification  
\| \| \|  
Permanent ID Domain/Key Verify API  
Alias Endpoint Revocation  
Visibility Credential History  
\|  
PostgreSQL / Cache / Worker  
  
External standards & systems:  
A2A Agent Card \| MCP \| DNS/.well-known \| VC \| SPIFFE \| HTTP/OAuth

## 2.1 핵심 객체

| **객체**      | **예시**                     | **역할**                            |
|---------------|------------------------------|-------------------------------------|
| Permanent AID | aid_01K82YH...               | 절대 재사용하지 않는 영구 식별자    |
| Address       | research@jidoo               | 사람이 읽는 alias; 변경 가능        |
| Namespace     | @jidoo                       | 소유자/조직이 관리하는 이름 공간    |
| Public Key    | Ed25519 ...                  | Agent가 private key를 보유함을 검증 |
| Agent Card    | /.well-known/agent-card.json | A2A 기능/Endpoint 자기 기술         |
| Endpoint      | https://agent.example/a2a    | 실제 통신 위치                      |
| Evidence      | domain/key/credential proof  | 검증 가능한 사실                    |
| Credential    | Org/role/certification       | 외부 issuer가 발급한 자격 증거      |
| Instance ID   | aid:instance:...             | 향후 실제 runtime/workload 식별     |

# 3. Phase 1 — Registry MVP

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>목표<br />
</strong>사람이 웹에서 기존 Agent를 등록하면 AID가 영구 ID와 주소를
발급하고, 다른 프로그램이 Resolve/Verify API로 기본 정보를 조회할 수
있게 한다.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 3.1 사용자 흐름

Developer  
-\> AID 가입  
-\> @jidoo namespace 생성  
-\> Agent Card URL 또는 REST/MCP endpoint 입력  
-\> AID가 URL 안전성/형식 확인  
-\> aid_01K... + research@jidoo 발급  
-\> public profile 생성  
  
Other Agent / App  
-\> GET /v1/resolve/research@jidoo  
-\> 현재 endpoint + card + verification 상태 획득

## 3.2 반드시 구현

- 이메일/OAuth 로그인, namespace 생성 및 소유자 연결

- Agent CRUD, permanent AID(ULID), address(alias) 발급

- A2A Agent Card URL 입력·fetch·schema validation·snapshot

- 비-A2A Agent용 REST/MCP endpoint 수동 등록

- Resolve API, Search API, Public Profile

- DNS TXT 기반 namespace/domain verification

- PUBLIC / UNLISTED / PRIVATE visibility 모델의 데이터 구조

- API Key, 기본 rate limit, audit log, background health/card refresh

- SSRF 방어: HTTPS only, private/loopback/metadata IP 차단, redirect
  재검증, timeout/size 제한

## 3.3 Phase 1 API

POST /v1/namespaces  
POST /v1/agents  
GET /v1/agents/{aid}  
PATCH /v1/agents/{aid}  
GET /v1/resolve/{address}  
GET /v1/agents/search  
POST /v1/domain-verifications  
GET /v1/domain-verifications/{id}

## 3.4 Phase 1 완료 기준

- 웹에서 Agent Card URL 하나로 Agent 등록 가능

- 등록 직후 permanent AID와 address가 생성됨

- 다른 클라이언트가 address를 resolve해 최신 endpoint를 얻음

- domain verification 상태가 UI/API에 정확히 표시됨

- Private Agent는 익명 resolve/search/profile에서 노출되지 않음

# 4. Phase 2 — Verifiable Identity

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>목표<br />
</strong>AID가 단순 Registry를 넘어 '이 Agent Identity를 실제 누가
통제하는가'를 암호학적으로 검증한다.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 4.1 핵심 기능

- Agent 측 Ed25519 key pair 생성; AID에는 public key만 등록

- Key Challenge: AID challenge를 Agent가 private key로 서명

- Endpoint Ownership Challenge: /.well-known/aid-challenge 또는 DNS TXT

- Domain Verified와 Organization Verified를 분리

- Key rotation, revoke, compromised 상태 모델

- Identity event를 append-only audit/event log로 기록

1\) AID -\> random challenge  
2) Agent -\> Sign(challenge, private_key)  
3) AID -\> Verify(signature, registered_public_key)  
4) Endpoint -\> publish AID challenge proof  
5) AID -\> fetch + verify endpoint/domain control  
6) Verification flags updated

## 4.2 Verify 응답 예시

GET /v1/verify/aid_01K...  
  
{  
"aid": "aid_01K...",  
"address": "research@jidoo",  
"identity": {"status": "verified"},  
"key": {"status": "verified"},  
"endpoint": {"status": "verified"},  
"domain": {"status": "verified", "domain": "example.com"},  
"organization": {"status": "not_verified"},  
"last_verified_at": "..."  
}

# 5. Phase 3 — Agent-native Self Enrollment

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>목표<br />
</strong>사람이 Agent마다 웹 폼을 채우지 않아도, namespace 소유자가
권한을 위임하면 Agent/Runtime이 스스로 AID를 발급받는다.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 5.1 Enrollment Token

Owner creates:  
AID_NAMESPACE=jidoo  
AID_ENROLLMENT_TOKEN=aid_enroll_xxxx  
  
Token policy:  
- namespace: jidoo  
- scopes: agent:create  
- max_agents: 10  
- expires_at: ...  
- plaintext shown once; only hash stored

## 5.2 Agent flow

Agent Boot  
-\> local key generation  
-\> POST /v1/enrollments  
-\> challenge received  
-\> challenge signature  
-\> endpoint ownership proof  
-\> namespace token/quota check  
-\> Permanent AID issued  
-\> address issued  
-\> identity stored locally

## 5.3 SDK 목표

import { AID } from "@aid/sdk";  
  
const identity = await AID.autoEnroll({  
name: "research"  
});  
  
// or name suggestion from Agent Card  
const identity2 = await AID.autoEnroll();

- JS SDK 우선, Python SDK 후속

- enrollment_tokens / enrollments 테이블

- POST /v1/enrollments, POST /v1/enrollments/{id}/verify

- Sybil 방지를 위한 namespace-bound quota/expiry/revoke

- AID configuration discovery endpoint(.well-known/aid-configuration)
  제공 검토

- MCP tools: register_identity, resolve_agent, verify_agent,
  search_agents

# 6. Phase 4 — Trust Verification Layer

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>목표<br />
</strong>Agent가 다른 Agent와 통신하기 직전에 AID를 호출하여 '현재
요청자가 등록된 Agent와 동일한 주체인가'와 관련 Evidence를
확인한다.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 6.1 Request Authentication

AID 고유 헤더를 성급히 표준화하지 않는다. HTTP Message Signatures,
OAuth/OIDC, mTLS 등 기존 방식과의 결합을 우선 검토한다. Permanent
identity와 단기 access credential을 분리해 장기 private key 노출 위험을
줄인다.

Permanent AID  
\|  
Root / long-term identity  
\|  
Short-lived credential  
\|  
Signed Agent Request  
\|  
Verifier / AID SDK

## 6.2 Evidence API

const trust = await aid.verify("travel@company");  
  
trust.identity  
trust.signature  
trust.endpoint  
trust.domain  
trust.organization  
trust.credentials  
trust.lastVerifiedAt

## 6.3 Credential 모델

- Credential은 AID가 모두 발급하는 구조가 아니라 외부 issuer 증거를
  연결할 수 있게 설계

- W3C Verifiable Credentials 계열과 호환 가능한 모델 검토

- Credential expiry/revocation/issuer verification 지원

- AID는 '92점' 같은 단일 Trust Score를 MVP/초기 제품에서 제공하지 않음

# 7. Phase 5 — Agent Trust Network

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>목표<br />
</strong>AID가 개별 Agent의 신원 확인 도구에서 Agent 생태계의 Discovery
+ Access + Trust 인프라로 확장된다.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 7.1 AID Gateway

Internet / Agent A  
\|  
v  
AID Gateway  
- identity evidence  
- signature/auth  
- access policy  
\|  
v  
Agent B

Gateway는 Phase 5에서 선택적으로 제공한다. 초기 AID가 모든 Agent
트래픽의 중앙 프록시가 되는 구조는 피한다. 기업이 자신의 Agent 앞에
배치하여 '검증된 Identity만 허용' 같은 정책을 적용하는 제품으로 본다.

## 7.2 Discovery

GET /v1/agents/search  
?capability=hotel.booking  
&country=KR  
&protocol=a2a  
&verified=true

- Capability, protocol, region, language, verification 상태 기반 검색

- PUBLIC만 일반 검색에 노출; UNLISTED는 직접 resolve만; PRIVATE는
  인증/권한 기반

- AID가 검색 랭킹을 Reputation과 혼동하지 않도록 초기에는 명시적 필터
  중심

## 7.3 Trust History

Identity History  
- created_at  
- key rotations  
- endpoint changes  
- verification events  
- credential issuance/revocation  
- compromise/recovery events  
  
Reputation (later, separate)  
- task evidence  
- disputes  
- transaction evidence  
- external attestations

Identity History는 객관적 이벤트 로그다. Reputation은 훨씬 뒤에 별도
계층으로 구축한다. 신생 Agent가 이력이 없다는 이유만으로 '신뢰할 수
없음'으로 처리되지 않도록 둘을 분리한다.

# 8. Phase 6 — Ecosystem / Standard Layer

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>궁극적 목표<br />
</strong>Agent Framework·Hosting·Marketplace·Enterprise Platform이 Agent
생성/통신 과정에서 AID를 기본 Identity/Verification 옵션으로 지원하게
한다.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Agent Framework / Hosting / Marketplace  
\|  
AID Integration  
\|  
Agent Boot -\> Enroll -\> Verify -\> Discover  
\|  
Agent-to-Agent Network

- 주요 Agent framework용 plugin/adaptor

- A2A Gateway/Agent Card와 자연스러운 매핑

- MCP server 및 SDK를 오픈소스화하여 채택 장벽 축소

- Organization/Enterprise private registry 및 SSO/Policy

- 여러 검증기관/issuer가 동일 AID에 증거를 붙이는 연합형 Trust 모델

- Agent와 Runtime Instance를 분리한 2계층 identity 모델

- 필요 시 SPIFFE/SPIRE workload identity와 연결

# 9. Namespace / Squatting / Abuse 설계

| **상태**              | **의미**                      |
|-----------------------|-------------------------------|
| AVAILABLE             | 등록 가능                     |
| CLAIMED               | 정상 소유 중                  |
| RESERVED              | 시스템/유명 브랜드 등 보호    |
| VERIFICATION_REQUIRED | 공식 domain 등 추가 증명 필요 |
| DISPUTED              | 분쟁 중; 변경 제한            |
| SUSPENDED             | 정책/보안 문제로 중지         |
| TOMBSTONED            | 삭제 후 재사용 금지 기간      |

- 유명 브랜드 namespace는 자동 선점 허용 대신
  reserved/verification-required 정책

- 삭제 alias는 즉시 재사용하지 않고 redirect/tombstone 기간 적용

- Self-enrollment은 namespace owner가 발급한 token 없이는 불가

- Rate limit, WAF, API key, quota로 spam/Sybil 억제

- 분쟁 정책은 AID가 법원을 대체하지 않고 evidence/freeze/review/외부
  법적 결과 반영 구조로 설계

# 10. 데이터 모델 로드맵

| **Phase** | **주요 테이블/엔티티**                                                                                                                                                       |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1         | users/profiles, namespaces, namespace_members, agents, agent_aliases, agent_endpoints, agent_cards, agent_skills, domain_verifications, api_keys, audit_logs, reserved_names |
| 2         | agent_keys, verification_challenges, endpoint_verifications, identity_events, key_history                                                                                    |
| 3         | enrollment_tokens, enrollments, enrollment_usage                                                                                                                             |
| 4         | credentials, credential_issuers, credential_status, request_verification_events                                                                                              |
| 5         | access_policies, gateway_clients, trust_evidence, reputation_events(후기), dispute_events                                                                                    |
| 6         | runtime_instances, trust_anchors, federation_peers / external attestations                                                                                                   |

# 11. 기술 스택

| **영역**      | **권장**                                                    |
|---------------|-------------------------------------------------------------|
| Frontend      | Next.js + TypeScript                                        |
| Auth/DB       | Supabase Auth + PostgreSQL                                  |
| API           | Node.js/TypeScript REST API                                 |
| Cache         | Redis/Upstash 또는 Cloudflare KV                            |
| Search        | 초기 PostgreSQL FTS + tags; 규모 증가 시 별도 검색엔진      |
| Edge/Security | Cloudflare DNS/CDN/WAF                                      |
| Worker        | Agent Card refresh, verification, health, credential status |
| Observability | Sentry + structured logs + audit log                        |
| Deploy        | Vercel + Supabase + Cloudflare로 시작                       |
| Crypto        | Ed25519 우선 검토; 표준 라이브러리 사용                     |

# 12. 보안 요구사항

- Private key를 AID 서버에 저장하지 않는다.

- Enrollment/API token은 plaintext를 1회만 표시하고 hash만 저장한다.

- Agent Card/endpoint fetch는 SSRF 방어를 필수 적용한다.

- Challenge는 random, single-use, short TTL로 운영한다.

- Replay 방지를 위해 timestamp/nonce/expiry를 고려한다.

- Key compromise/revoke/recovery 절차를 제품 초기부터 데이터 모델에
  포함한다.

- Private Agent metadata/card URL도 visibility/access policy를 따른다.

- Audit log와 identity event log는 append-only 성격을 유지한다.

- AID Verify 결과에는 검증 시각과 evidence source를 포함한다.

# 13. 블록체인 결정

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>결정: 초기 로드맵에서 제외<br />
</strong>블록체인은 AID의 핵심 문제인 Agent 신원·소유권 검증을 해결하는
데 필수적이지 않다. MVP에서는 개발 복잡성,
wallet/gas/chain/smart-contract 운영 부담을 피한다. 대신
identity_events를 append-only로 저장하고 event hash/previous hash를 남겨
향후 Merkle Root 또는 외부 public anchor로 확장 가능하게 한다.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Phase 1~6 Core  
Postgres -\> Append-only Identity Events -\> Hash Chain  
  
Optional Future  
Identity Events -\> Merkle Tree -\> External/Public Anchor

# 14. 단계별 성공 지표

| **Phase** | **기술적 성공 기준**                    | **제품 검증 질문**                                   |
|-----------|-----------------------------------------|------------------------------------------------------|
| 1         | 등록→AID 발급→Resolve가 안정적으로 동작 | 개발자가 Agent를 등록할 이유가 있는가?               |
| 2         | Key/Endpoint/Domain proof 자동 검증     | 신원 검증이 실제 pain point인가?                     |
| 3         | SDK로 무인 enrollment 가능              | Agent 생성 파이프라인에 붙일 만큼 간단한가?          |
| 4         | 실시간 verify/evidence API              | 통신 전에 검증 API를 호출할 가치가 있는가?           |
| 5         | Gateway/Discovery/Private 정책 운영     | AID가 네트워크 접근/발견 계층으로 확장되는가?        |
| 6         | 외부 framework/platform 통합            | AID가 독립 서비스가 아니라 생태계 구성요소가 되는가? |

# 15. 구현 순서 — 실제 개발 Backlog

| **우선** | **Epic**               | **주요 산출물**                                        |
|----------|------------------------|--------------------------------------------------------|
| P0       | Registry Foundation    | Auth, namespace, agent, AID/alias, DB migration        |
| P0       | Agent Card / Endpoint  | secure fetch, validation, snapshot, health             |
| P0       | Resolve / Search       | REST API, cache, public profile                        |
| P0       | Verification Basic     | DNS TXT domain verification, audit                     |
| P1       | Cryptographic Identity | Ed25519 public key, challenge/signature                |
| P1       | Endpoint Ownership     | .well-known/DNS challenge                              |
| P1       | Lifecycle              | key rotate/revoke, alias/tombstone, identity event log |
| P1       | Self Enrollment        | token, quota, enrollment API, JS SDK                   |
| P2       | MCP/Python SDK         | verify/search/register tools                           |
| P2       | Credential/Evidence    | issuer, expiry, revoke, evidence response              |
| P2       | Request Verification   | short-lived credential/signature integration           |
| P3       | Gateway                | policy enforcement sidecar/reverse proxy               |
| P3       | Enterprise             | private registry, SSO, policy, audit                   |
| P4       | Ecosystem              | framework plugins, federation/trust anchors            |

# 16. MVP에서 절대 하지 않을 것

- Agent hosting / LLM inference

- A2A traffic proxy

- 자체 task/context/memory protocol

- Marketplace 및 payment

- 임의의 Trust Score / 신용등급

- NFT/Token/Blockchain Registry

- 완전 decentralized identity network

- 대규모 Kafka/Kubernetes/OpenSearch 선도입

# 17. 최종 제품 경험

Developer / Agent:  
identity = AID.autoEnroll()  
  
Agent A:  
evidence = AID.verify("travel@company")  
  
AID:  
Permanent ID aid_01K...  
Human Address travel@company  
Identity VERIFIED  
Signature VALID  
Endpoint VERIFIED  
Domain VERIFIED  
Organization VERIFIED / NOT VERIFIED  
Credentials \[...\]  
Last Verified ...  
Evidence \[...\]  
  
Agent A:  
Apply own trust policy  
-\> CONNECT / DENY

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>최종 제품 원칙<br />
</strong>AID는 '누구를 믿어야 하는가'를 결정하는 심판이 아니다. Agent가
상대방의 정체와 검증 증거를 빠르고 일관되게 확인할 수 있도록 만드는 공통
Trust Layer다.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 18. 최종 로드맵 한 장 요약

| **단계**                | **한 문장**                                                            |
|-------------------------|------------------------------------------------------------------------|
| 1\. Registry MVP        | 사람이 Agent를 등록하고 permanent AID/address를 발급받는다.            |
| 2\. Verifiable Identity | Key/Endpoint/Domain challenge로 실제 통제권을 증명한다.                |
| 3\. Self Enrollment     | 권한을 위임받은 Agent가 SDK/API로 스스로 AID를 발급받는다.             |
| 4\. Verification Layer  | Agent끼리 통신 전 signature/credential/evidence를 실시간 확인한다.     |
| 5\. Trust Network       | Discovery/Gateway/Private Registry/History로 네트워크 효과를 만든다.   |
| 6\. Ecosystem Layer     | Framework/Hosting/Marketplace가 AID를 기본 Identity 옵션으로 통합한다. |

**North Star**

**Give every AI agent a verifiable identity.**
