# AID (AI Agent Identity & Trust Infrastructure) Architecture & Roadmap

> **North Star**: Give every AI agent a verifiable identity.  
> **Core Value**: Agent의 신원(Identity), 소유권(Ownership), 암호학적 진위(Signature), Endpoint를 API 1회로 기계적 검증.

---

## 1. System Architecture

```text
[ Developer / Admin ]          [ AI Agent (Caller) ]
        │                                │
        ▼                                ▼
┌─────────────────────────────────────────────────────────┐
│                   AID Platform (Next.js)                │
│                                                         │
│  ┌───────────────────────┐   ┌───────────────────────┐  │
│  │ Web Console (UI)      │   │ Public / Core REST API│  │
│  │ - Dashboard           │   │ - /v1/resolve/:address│  │
│  │ - Namespace Manager   │   │ - /v1/agents          │  │
│  │ - Agent Card Registry │   │ - /v1/verify/:aid     │  │
│  │ - API Key / Token     │   │ - /v1/search          │  │
│  └───────────────────────┘   └───────────────────────┘  │
│                             │                           │
│  ┌──────────────────────────┴────────────────────────┐  │
│  │ Core Services                                     │  │
│  │ 1. Resolver Service (Human Address -> ULID AID)   │  │
│  │ 2. Card Inspector (SSRF-safe fetch & schema parse)│  │
│  │ 3. Cryptographic Verifier (Ed25519 challenge)     │  │
│  │ 4. Domain / DNS Verifier (TXT challenge)          │  │
│  └──────────────────────────┬────────────────────────┘  │
└─────────────────────────────┼───────────────────────────┘
                              ▼
        ┌───────────────────────────────────────────┐
        │ Supabase (PostgreSQL + Auth + Storage)    │
        │ - namespaces, agents, agent_aliases       │
        │ - agent_cards, agent_keys, audit_logs     │
        │ - append-only identity_events             │
        └───────────────────────────────────────────┘
```

---

## 2. Core Data Entities

1. **Permanent AID**: 고유 식별자 (`aid_01K72M8KQ4A7F`, ULID 기반) - 주소가 바뀌어도 영구 불변.
2. **Address (Alias)**: 인간 친화형 주소 (`research@jidoo`) - Namespace(`@jidoo`)에 바인딩.
3. **Agent Card / Passport**: Agent 기능(capabilities), 프로토콜(A2A/MCP/REST), Endpoint, 소유권 정보.
4. **Public Key**: Agent 런타임이 생성한 Ed25519 공개키 (Private Key는 절대 서버에 저장하지 않음).
5. **Identity Events**: 블록체인 대신 Postgres Append-only Hash Chain 구조로 불변 이력 보증.

---

## 3. Technology Stack

- **Framework**: Next.js 14+ (App Router, Route Handlers)
- **UI & Styling**: Tailwind CSS, Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security + Supabase Auth)
- **State & Local Analytics**: SQLite / DuckDB
- **Crypto & Security**: Ed25519 (`@noble/ed25519`), SSRF 방어(IP/DNS 필터링)
- **Deployment**: Vercel + Supabase

---

## 4. Phase 1 (Registry MVP) Implementation Plan

1. **Database Schema Setup**
   - `namespaces`, `agents`, `agent_aliases`, `agent_endpoints`, `agent_cards`, `api_keys`, `audit_logs`
2. **Core Resolution Engine**
   - `GET /v1/resolve/{address}`: `research@jidoo` 입력 시 최신 Endpoint, Public Key, 검증 증거 반환.
3. **Agent Card Fetcher & SSRF Guard**
   - 사설망(127.0.0.1, 10.x, 192.168.x, 169.254.x) 차단, HTTPS 강제, Timeout 5s, Agent Card JSON 스키마 검증.
4. **Console Dashboard**
   - Namespace 생성, Agent 등록 마법사, 발급된 AID 조회, API Key 발급.
