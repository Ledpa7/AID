# AID
## AI Agent Identity Infrastructure

**Version 0.1 — Concept & Product Architecture**

---

## 1. Executive Summary

AI Agent의 수가 폭발적으로 증가하는 시대에는 각각의 Agent를 **식별하고, 찾고, 검증하고, 연결하는 공통 인프라**가 필요해진다.

인터넷에서는 DNS가 복잡한 IP 주소를 `google.com`과 같은 인간 친화적 주소로 변환했다.

AID는 이와 유사하게 AI Agent에게 사람이 이해할 수 있는 고유 이름과 기계가 검증할 수 있는 영구 Identity를 제공하는 것을 목표로 한다.

예를 들어,

`research@jidoo`

라는 주소를 통해 다른 Agent는 해당 Agent의 고유 ID, 소유자, 기능, Endpoint, 지원 프로토콜, 공개키, 인증 상태 등을 확인할 수 있다.

AID의 장기적인 목표는 단순한 **Agent Naming Service**가 아니다.

> **AI Agent 세계의 Identity + DNS + Registry + Discovery + Trust Infrastructure**

를 구축하는 것이다.

---

# 2. Problem

AI Agent가 증가하면서 다음과 같은 문제가 발생한다.

### 2.1 Agent Identity

Agent를 어떻게 고유하게 식별할 것인가?

현재 시스템 내부에서는 다음과 같은 임의 ID가 사용될 수 있다.

`agent_82fa7139`

그러나 이는 사람이 기억하거나 다른 서비스에서 활용하기 어렵다.

---

### 2.2 Agent Discovery

특정 작업을 수행할 수 있는 Agent를 어떻게 찾을 것인가?

예를 들어 사용자 Agent가

> "한국 특허를 검색할 수 있는 Agent를 찾아줘."

라는 요청을 받았을 때 전 세계 Agent 중 해당 기능을 가진 Agent를 발견할 공통 검색 계층이 필요하다.

---

### 2.3 Agent Verification

발견한 Agent가 실제로 주장하는 조직이나 개인의 Agent인지 어떻게 확인할 것인가?

예를 들어

`sales@samsung`

이라는 Agent가 실제 삼성에서 운영하는 Agent인지 검증할 방법이 필요하다.

---

### 2.4 Agent Routing

Agent를 찾았다면 실제 요청을 어디로 보내야 하는가?

Agent는 MCP, A2A, REST API 등 다양한 Endpoint를 가질 수 있다.

---

### 2.5 Agent Trust

어떤 Agent를 신뢰할 수 있는가?

Agent Economy가 형성되면 다음과 같은 정보가 중요해진다.

- 소유자
- 조직
- 인증 여부
- 성공률
- 응답속도
- Uptime
- 작업 이력
- Credential
- Reputation

---

# 3. Solution

AID는 모든 Agent에 두 가지 Identity를 제공한다.

### Human-readable Agent Name

사람이 이해하고 기억할 수 있는 주소다.

예:

`research@jidoo`

`design@jidoo`

`support@samsung`

`booking@hotel`

---

### Permanent Agent ID

시스템 내부에서 사용하는 영구적인 Identity다.

예:

`aid:agent:01K72M8KQ4A7F`

Agent Name은 변경되거나 이전될 수 있지만 Permanent Agent ID는 유지된다.

구조적으로는 다음과 같다.

```text
research@jidoo
      ↓
Permanent Agent ID
      ↓
Public Key
      ↓
Agent Passport
      ↓
Endpoint
```

---

# 4. Identity Architecture

AID에서는 다음 네 요소를 분리한다.

### Identity

Agent의 영구 ID

`aid:agent:01K72M8KQ4A7F`

### Name

사람이 사용하는 이름

`research@jidoo`

### Endpoint

Agent가 실제 존재하는 위치

`https://agent.example.com/a2a`

### Public Key

Agent의 암호학적 신원을 증명하는 키

이 구조는 현실 세계의 신원 시스템과 비슷하다.

```text
Permanent ID = 신분번호
Name         = 이름
Endpoint     = 주소
Public Key   = 디지털 서명
Credential   = 자격증
Reputation   = 신뢰도
```

---

# 5. Agent Namespace

개인은 하나의 Namespace를 가진다.

예:

`@jidoo`

그 아래 여러 Agent를 생성할 수 있다.

```text
@jidoo

├── research@jidoo
├── design@jidoo
├── shopping@jidoo
└── secretary@jidoo
```

기업도 동일하다.

```text
@samsung

├── support@samsung
├── sales@samsung
├── recruit@samsung
└── purchase@samsung
```

Namespace 자체가 개인 또는 조직의 Agent 생태계를 표현한다.

---

# 6. Agent Passport

각 Agent에는 Machine-readable Agent Passport가 존재한다.

예:

```json
{
  "aid": "aid:agent:01K72M8KQ4A7F",
  "name": "research@jidoo",
  "owner": "@jidoo",
  "type": "agent",
  "description": "Technology research agent",

  "capabilities": [
    "web.search",
    "web.extract",
    "research",
    "summarize"
  ],

  "protocols": {
    "a2a": "https://agent.example.com/a2a",
    "mcp": "https://agent.example.com/mcp"
  },

  "verification": {
    "owner": true,
    "domain": true
  },

  "publicKey": "..."
}
```

다른 Agent는 Passport 하나만 조회해도 다음 정보를 파악할 수 있다.

**WHO**

누구의 Agent인가?

**WHAT**

무엇을 할 수 있는가?

**WHERE**

어디로 요청해야 하는가?

**HOW**

어떤 Protocol을 사용하는가?

**TRUST**

신뢰할 수 있는 Agent인가?

---

# 7. AID Resolution

AID의 가장 기본적인 기능이다.

다른 Agent가 다음 주소를 조회한다.

`research@jidoo`

AID Resolver가 이를 해석한다.

```text
research@jidoo

       ↓

AID Resolver

       ↓

Permanent ID

aid:agent:01K...

       ↓

Agent Passport

       ↓

A2A / MCP / REST Endpoint
```

API 예:

`GET /v1/resolve/research@jidoo`

Response:

```json
{
  "aid": "aid:agent:01K...",
  "name": "research@jidoo",
  "verified": true,
  "protocols": {
    "a2a": "...",
    "mcp": "..."
  }
}
```

---

# 8. Agent Registry

AID는 전 세계 Agent 정보를 저장하는 Global Agent Registry 역할을 한다.

Registry에는 다음 정보가 저장된다.

- Agent ID
- Agent Name
- Owner
- Organization
- Public Key
- Endpoint
- Capabilities
- Protocol
- Credential
- Verification
- Reputation
- Status

Registry는 향후 Agent Discovery의 기반 데이터가 된다.

---

# 9. Agent Discovery

Agent는 다른 Agent를 검색할 수 있다.

예:

`GET /v1/search?capability=web.research`

결과:

```text
research@company-a
research@company-b
research@developer
research@university
```

검색 조건은 향후 다음까지 확장한다.

- Capability
- Price
- Region
- Language
- Protocol
- Reputation
- Verification
- Latency
- Availability

이를 통해 AID는 장기적으로 **Agent Search Engine**으로 발전할 수 있다.

---

# 10. Domain Verification

조직을 사칭하는 Agent를 방지하기 위해 Domain Verification을 제공한다.

예를 들어 `@company` Namespace를 사용하는 기업은 자사 Domain에서 소유권을 증명한다.

방법 1:

```text
company.com/.well-known/aid.json
```

방법 2:

DNS TXT Record

```text
aid-verification=XXXXXXXX
```

검증이 완료되면 해당 Namespace와 Agent에 다음 표시를 부여한다.

`✓ Domain Verified`

---

# 11. Cryptographic Identity

각 Agent는 Public / Private Key Pair를 가진다.

Agent는 Private Key로 메시지에 서명한다.

```text
Agent

Private Key
    ↓
Sign

Request
    ↓
AID / Other Agent

Public Key
    ↓

Verify
```

따라서 Endpoint나 Agent 이름을 복제하더라도 실제 Agent의 Private Key 없이는 신원을 증명하기 어렵다.

장기적으로 W3C Verifiable Credentials 등의 표준과 호환하는 구조를 고려한다.

---

# 12. Agent Credentials

Agent가 특정 권한이나 자격을 가지고 있다는 사실을 증명하는 Credential Layer를 구축한다.

예:

```text
tax@company

✓ Organization Verified
✓ Domain Verified
✓ Accounting Credential
✓ Tax API Credential
```

Credential 발급자는 향후 다음과 같이 확장될 수 있다.

- 기업
- 정부기관
- 금융기관
- 대학
- 플랫폼
- API Provider
- 인증기관

AID는 이를 검증하고 전달하는 Trust Infrastructure 역할을 한다.

---

# 13. Reputation

Agent의 작업 이력을 기반으로 Reputation을 구축한다.

예:

```text
research@jidoo

Completed Tasks
184,292

Success Rate
99.1%

Median Latency
820ms

Uptime
99.98%

Dispute Rate
0.04%
```

Agent 선택 시 다음 요소를 함께 고려할 수 있다.

```text
Capability
    +
Price
    +
Verification
    +
Credential
    +
Reputation
```

---

# 14. Existing Protocol Integration

AID는 새로운 Agent 통신 프로토콜을 만드는 것을 목표로 하지 않는다.

기존 표준과 호환되는 Identity / Discovery Layer가 되는 것을 목표로 한다.

핵심 호환 대상:

### A2A

Agent ↔ Agent 통신

### MCP

Agent ↔ Tool / Data 연결

### REST API

기존 서비스 연결

### W3C Verifiable Credentials

Credential 검증

따라서 전체 구조는 다음과 같다.

```text
              AID

Identity
Registry
Discovery
Verification
Trust

               │

       ┌───────┼───────┐
       │       │       │
      A2A     MCP     REST
       │       │       │
       ↓       ↓       ↓

     Agent   Tools   Services
```

---

# 15. Agent Payment

장기적으로 Agent-to-Agent Payment를 지원한다.

예:

사용자 요청

> "최근 반도체 산업을 분석해."

```text
User Agent
     ↓
AID Discovery
     ↓
research@company
     ↓
Price $0.03
     ↓
Payment
     ↓
A2A Request
     ↓
Result
```

HTTP 402 기반 Agent Payment Protocol인 x402 등의 표준과 연동할 수 있다.

단, Payment는 초기 MVP에서는 제외한다.

---

# 16. System Architecture

초기 인프라는 다음과 같이 구성한다.

```text
Frontend

Next.js
     │
     ↓
Cloudflare

DNS
CDN
WAF

     │
     ↓

API Server

Node.js
TypeScript

     │
     ↓

PostgreSQL
Supabase

     │
 ┌───┼────┐
 ↓   ↓    ↓

Agent
Name
Credential
Registry

     │
     ↓

Redis

Resolution Cache

     │
     ↓

Search Engine

Meilisearch
or
Typesense
```

서비스 규모가 커지면 다음 구조로 확장한다.

```text
PostgreSQL
Redis
OpenSearch
Kafka
Object Storage
Kubernetes
KMS / HSM
```

---

# 17. Database Architecture

주요 테이블:

### users

사용자 정보

### organizations

조직 정보

### namespaces

`@jidoo`, `@company`

### agents

Agent Identity

### names

Human-readable Agent Name

### endpoints

A2A / MCP / REST Endpoint

### capabilities

Agent 기능

### credentials

Agent Credential

### verifications

Domain / Owner Verification

### reputation_events

Agent Reputation 기록

### name_history

이름 변경 기록

### key_history

Public Key 변경 기록

Identity 시스템 특성상 History는 삭제보다 추적 가능한 기록을 우선한다.

---

# 18. Resolution Cache

AID가 성장하면 모든 Agent 요청을 중앙 DB에서 직접 처리해서는 안 된다.

DNS와 비슷한 Cache 구조를 사용한다.

```text
Agent

resolve
research@jidoo

       ↓

Local / Edge Cache

       ↓ Cache Miss

AID Resolver

       ↓

Registry
```

예:

```text
TTL = 3600

research@jidoo
→ Permanent ID
→ Endpoint
→ Public Key
```

Cloudflare Edge 등을 활용해 전 세계 Resolution latency를 최소화한다.

---

# 19. Centralization Strategy

AID가 단일 회사에 완전히 종속되는 구조는 장기적인 Identity Infrastructure에 적합하지 않다.

따라서 목표 구조는:

> **Centralized UX + Decentralized Verification**

등록, 검색, 관리 UX는 AID가 제공한다.

하지만 Identity 검증은 다음 요소를 활용한다.

```text
Domain
+
Public Key
+
Signed Agent Card
+
Open Specification
```

따라서 AID 서비스 자체가 존재하지 않더라도 Agent Identity를 검증할 수 있는 방향을 지향한다.

---

# 20. Business Model

초기에는 Agent ID 등록 장벽을 최대한 낮춘다.

### Individual

`@name`

무료

### Developer

여러 Agent 관리

API 사용량 기반

### Organization

`@company`

연간 요금

### Verified Organization

Domain / Organization Verification

유료

### Enterprise

Private Agent Registry

Credential

Identity Management

Audit

SLA

월 구독

---

장기적인 수익원은 다음과 같다.

**Name**

Premium Namespace

**Verification**

Organization / Domain Verification

**Resolution API**

대량 Agent Resolution

**Discovery API**

Agent Search

**Enterprise Registry**

기업 내부 Agent Identity 관리

**Credential Infrastructure**

Credential 발급 및 검증

**Trust API**

Agent Reputation 데이터

**Routing**

Agent-to-Agent Routing

**Marketplace**

Agent 거래 중개

**Payment**

Agent Payment Infrastructure

---

# 21. Go-To-Market Strategy

AID의 핵심 경쟁력은 기술 자체보다 Network Effect다.

따라서 초기에는 수익보다 Agent 등록량과 Developer Adoption을 우선한다.

### 무료 제공

Agent ID

Basic Registry

Basic Resolution API

Developer SDK

### Open Source

AID Specification

SDK

Resolver

Agent Card Tools

### 지원 언어

TypeScript

Python

Go

### Framework Integration

MCP

A2A

주요 Agent Framework

---

# 22. Growth Flywheel

```text
Agent 증가
     ↓

AID 등록 증가
     ↓

Registry 데이터 증가
     ↓

Discovery 가치 증가
     ↓

개발자 증가
     ↓

더 많은 Agent 등록
     ↓

AID Adoption 증가
     ↓

Identity Standard
```

AID가 성공하기 위해서는 이 Network Effect를 만들어야 한다.

---

# 23. MVP

처음부터 전체 시스템을 만들지 않는다.

## Phase 1 — Identity

목표:

**Agent에게 주소를 발급하고 Resolve할 수 있게 한다.**

기능:

- 회원가입
- `@namespace` 등록
- Agent 생성
- `agent@namespace`
- Permanent Agent ID
- Public Key
- Agent Passport
- A2A Agent Card Import
- MCP Endpoint 등록
- `/resolve` API
- `/search` API

이 단계에서 실제 제품을 출시한다.

---

# 24. Phase 2 — Verification

추가 기능:

- Domain Verification
- Organization
- Signed Agent Passport
- Public Key Rotation
- Credential
- TypeScript SDK
- Python SDK

---

# 25. Phase 3 — Discovery

추가 기능:

- Capability Search
- Agent Search Engine
- Reputation
- Latency
- Uptime
- Ranking
- Agent Routing

---

# 26. Phase 4 — Agent Economy

추가 기능:

- Usage Pricing
- Payment
- x402
- Marketplace
- Transaction History
- Delegated Permission

---

# 27. Phase 5 — Open Standard

AID Specification 1.0 공개

목표:

```text
Open Specification
       ↓
Open Source
       ↓
Agent Framework Adoption
       ↓
Cloud / Platform Adoption
       ↓
Industry Standard
```

장기적으로 IETF / W3C 등의 표준화 생태계와 연계한다.

---

# 28. Competitive Moat

AID의 방어력은 코드에서 나오지 않는다.

핵심 자산은 다음 다섯 가지다.

### Namespace

누가 어떤 이름을 소유하고 있는가.

### Identity Graph

Agent ↔ Owner ↔ Organization 관계

### Agent Registry

전 세계 Agent 데이터

### Reputation Graph

Agent의 실제 활동과 신뢰 기록

### Network Effect

다른 Agent가 AID 주소를 사용하기 때문에 새로운 Agent도 AID에 등록해야 하는 구조

특히 마지막 요소가 가장 중요하다.

---

# 29. Product Principle

AID는 다음 원칙을 따른다.

### Open

특정 LLM이나 Agent 플랫폼에 종속되지 않는다.

### Portable

Agent가 플랫폼을 옮겨도 Identity는 유지된다.

### Verifiable

암호학적으로 신원을 검증할 수 있다.

### Human-readable

사람이 기억하고 공유할 수 있다.

### Machine-readable

Agent가 자동으로 해석할 수 있다.

### Discoverable

Agent가 다른 Agent를 검색할 수 있다.

### Interoperable

A2A, MCP 및 기존 Web 표준과 호환된다.

---

# 30. Vision

인터넷 시대에는 사람들이 물었다.

> "홈페이지 주소가 뭐야?"

그리고

`google.com`

이라는 답을 했다.

AI Agent 시대에는 사람들이 이렇게 물을 수 있다.

> "네 Agent 주소가 뭐야?"

그리고 답한다.

> `design@jidoo`

그 주소 하나를 통해 Agent는 상대 Agent의 신원, 기능, 위치, 인증, Credential, Reputation을 확인하고 연결한다.

최종적으로 AID가 만들고자 하는 구조는 다음과 같다.

```text
             AI Agent World

                    │
                    ↓

                   AID

          Agent Identity Layer

                    │

      ┌─────────────┼─────────────┐
      │             │             │

   Identity      Discovery       Trust

      │             │             │
      └─────────────┼─────────────┘
                    │
                    ↓

                  A2A

                    │

          Agent ↔ Agent ↔ Agent

                    │
                    ↓

                 Payment

                    │
                    ↓

               Agent Economy
```

## Mission

**Give every AI Agent a universal identity.**

## Long-term Vision

> **Become the identity layer of the Agentic Internet.**