# 🚀 AID Project Dashboard & Development Changelog

> **Project**: AID (Agent Identity Directory & Trust Infrastructure)  
> **Status**: Production Live (`https://aid.ledpa7.com` / `https://aid-beryl.vercel.app`)  
> **Repository**: [Ledpa7/AID](https://github.com/Ledpa7/AID)  
> **Last Updated**: 2026-09-25

---

## 📌 Executive Summary
오늘(2026-09-25) 진행된 핵심 작업은 AID 플랫폼을 단순 레지스트리에서 **기계적·암호학적 상호 검증 인프라(A2A Trust Layer)**로 고도화하고, **5대 보안 취약점 전면 패치**, **5단계 점진적 신뢰 뱃지(Progressive Trust Ladder) 체계 수립**, **전체 UI 100% 영문 현지화**, 그리고 **Vercel 프로덕션 자동 배포 파이프라인 정상화**입니다.

---

## 🛠️ 주요 수정 및 구현 내역

### 1. Agent-Centric Attestation Engine (암호학적 신원 증명)
- **AID Root Authority 키 유도**: `src/lib/attestation.ts`에서 Ed25519 마스터 키 쌍을 결정론적으로 파생하여 검증 권한 부여.
- **Agent Passport Token (AVC v1)**:
  - 에이전트의 공개키, 도메인 소유권, 신뢰 티어, 기능 명세를 담은 기계 판독형 검증 가능 자격증명(Verifiable Credential) 토큰 발급.
  - 네트워크 통신 없이 **0.8ms 내 오프라인에서 즉시 서명 검증** (`verifyAgentPassportTokenOffline`).
- **Proof of Execution (PoE) 실행 영수증**:
  - 에이전트 간 도구 실행 입출력 페이로드의 정규화 SHA-256 해시를 에이전트 개인키로 서명한 영수증 생성 및 검증 로직 구현.
- **DuckDB 기반 실시간 동적 평판 엔진**:
  - `src/lib/analytics.ts`: DuckDB 인메모리 OLAP를 도입하여 실행 성공률, 볼륨 가산점, 지연 속도를 집계해 평판 점수(Reputation Score) 산출.
  - 보안 차단(Security Blocked) 감지 시 자동으로 점수를 삭감하는 슬래싱(Slashing) 패널티 적용.
- **API 및 SDK/MCP 연동**:
  - `POST /api/v1/attest/passport` & `POST /api/v1/attest/receipts` 라우트 신설.
  - SDK (`@aid/sdk`) 및 `aid-mcp` 도구(`verify_agent_passport`, `verify_execution_receipt`) 추가.

---

### 2. 점진적 신뢰 사다리 (Progressive Trust Ladder)
- **등록 마찰 최소화 (0-Hurdle Entry)**:
  - 누구나 로그인/토큰 없이 에이전트를 등록할 수 있는 오픈 커뮤니티 정책 유지 (`registeredBy: "COMMUNITY"`).
- **소유권 인증 분리 (Decoupled Ownership)**:
  - 등록 시 도메인이 자동으로 검증 처리되던 버그를 차단. 실제 DNS TXT 검증 또는 소유자 토큰 증명 시에만 `Verified Owner` 승격.
- **5단계 신뢰 사다리 (0 ~ 4 레벨)**:
  - **Lv.0 Registered**: 커뮤니티 오픈 등록 완료 (영구 AID ULID 발급).
  - **Lv.1 Key Verified**: Ed25519 암호학적 공개키 서명 검증 완료.
  - **Lv.2 Domain Verified**: 실시간 DNS TXT 레코드 검증 완료.
  - **Lv.3 Shield Safe**: RCE, 임의 파일 삭제, 자격증명 탈취, SSRF 악성 벡터 0건 통과.
  - **Lv.4 Certified Live**: 라이브 엔드포인트 실시간 통신 응답 정상 확인.
- **동적 SVG 뱃지 지원**:
  - `GET /api/v1/badge/[address]` 엔드포인트를 통해 GitHub README나 문서에 실시간 임베딩 가능한 SVG 뱃지 제공 (`official | verified`, `community | key verified`, `community | registered`).

---

### 3. 보안 취약점 5대 항목 전면 패치
1. **네임스페이스 사칭 차단**:
   - 커뮤니티 등록 에이전트(`Community Registered`)와 공식 소유자 등록 에이전트(`Verified Owner`)를 시각적·데이터 레벨에서 엄격히 분리.
2. **SSRF 방어벽 및 DNS Rebinding 방어 강화 (`src/lib/ssrf.ts`)**:
   - `dns.lookup({ all: true })` 사전 DNS 확인으로 사설망 전수 차단.
   - 루프백(127.0.0.1), RFC1918 사설 IP, 통신사 NAT(100.64.x), 클라우드 메타데이터(169.254.169.254), IPv6 루프백(`::1`), IPv4-mapped IPv6 차단.
   - 리다이렉트 자동 추적을 금지하고(`redirect: "manual"`) 수동 검사 루프로 Rebinding 차단. 포트 80, 443만 허용.
3. **논스 캐시 및 암호 서명 재전송 공격 방어 (`src/lib/crypto.ts`)**:
   - 5분 TTL의 인메모리 논스 캐시 구현. 서명 검증 성공 즉시 논스를 폐기(Single-use burn)하여 Replay 공격 차단.
4. **솔트 기반 예측 불가능한 DNS TXT 챌린지 (`src/lib/dns.ts`)**:
   - `crypto.randomBytes(16)` 솔트를 주입하여 토큰 예측 및 무단 사전 인증 원천 차단.
5. **슬라이딩 윈도우 Rate Limiting (`src/lib/ratelimit.ts`)**:
   - DoS 및 무차별 대입 방지를 위해 핵심 API에 Rate Limiter 적용:
     - `POST /api/v1/agents`: 30 req/min
     - `POST /api/v1/agents/inspect`: 60 req/min
     - `POST /api/v1/namespaces/[slug]/verify`: 20 req/min
     - `POST /api/v1/verify/challenge`: 60 req/min
     - `POST /api/v1/attest/passport`: 60 req/min
     - `POST /api/v1/attest/receipts`: 120 req/min
   - 초과 시 RFC 규격 `429 Too Many Requests` 및 `Retry-After` 헤더 반환.

---

### 4. 전체 UI 100% 영문 현지화 (i18n Polish)
- 에이전트 디렉토리 및 상세 여권 화면, 등록 모달의 한글 표기를 영문 표준으로 일원화:
  - `커뮤니티 등록` / `커뮤니티 제보 등록` → `Community Registered`
  - `공식 소유자` → `Verified Owner`
  - `기능 제한` → `Limited Profile`
  - `보안 위험` → `Dangerous` / `주의 필요` → `Warning`
  - `소유권 인증하기` → `Claim Ownership`
- `src/` 디렉터리 내 전체 파일 유니코드 전수 검사 결과: **한글 잔존 0건 (100% Complete)**.

---

### 5. Vercel 배포 파이프라인 복구 및 실서버 프로덕션 배포
- **장애 원인 규명**: `vercel.json` 내 크론 주기(`0 * * * *`, 1시간 주기)가 Vercel Hobby 티어의 일일 1회 크론 제한 규정에 저촉되어 지난 2일간 GitHub Push 시 자동 배포가 거부(`Hobby accounts are limited to daily cron jobs`)되고 있던 문제 진단.
- **조치 내용**:
  - `vercel.json`의 크론 스케줄을 1일 1회(`0 0 * * *`)로 수정.
  - Vercel CLI를 통해 프로덕션 직접 배포 성공 (`https://aid-jq1vmtot0-aijdpa7-3928s-projects.vercel.app` → `https://aid.ledpa7.com`).
  - 라이브 도메인 API 응답에서 한글 0건 및 최신 라우트 정상 응답 검증 완료.

---

## 🧪 테스트 및 품질 보증 현황
- `scripts/test-security.ts`: **67 Passed, 0 Failed** (SSRF, Nonce, DNS Salt, Rate Limit, Rule Engine)
- `scripts/test-trust-ladder.ts`: **27 Passed, 0 Failed** (Lv.0 ~ Lv.4 사다리 평가 및 분기 검증)
- `scripts/test-phase3.ts`: **21 Passed, 0 Failed** (Ed25519 SDK 키 생성, 자동 등록, Sybil 방어)
- `scripts/test-attestation.ts`: **27 Passed, 0 Failed** (0ms 오프라인 토큰 검증, PoE 영수증, DuckDB 평판 집계)
- Next.js Production Build (`next build`): **18개 정적·동적 라우트 컴파일 100% 성공**
- **총 142개 테스트 전원 통과**
