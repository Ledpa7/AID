# 🚀 AID Project Dashboard & Development Changelog

> **Project**: AID (Agent Identity Directory & Trust Infrastructure)  
> **Status**: Production Live & Phase 1 MVP Complete (`https://aid.ledpa7.com`)  
> **Repository**: [Ledpa7/AID](https://github.com/Ledpa7/AID)  
> **Last Updated**: 2026-09-28  
> **Production URL**: `https://aid.ledpa7.com`  
> **MCP Package**: `aid-mcp@1.0.0` (NPM Published)  
> **Dynamic Sitemap**: `https://aid.ledpa7.com/sitemap.xml`  

---

## 📌 Executive Summary (2026-09-28: Phase 1 MVP Complete)
AID 플랫폼의 **Phase 1 MVP 개발이 100% 성공적으로 완료**되었습니다. 정적 신원 레지스트리로 출발하여, 실시간 A2A 실행 게이트웨이, 커뮤니티 평판 시스템, 엔터프라이즈급 RLS 보안, AI/검색엔진 자동 크롤링 인덱싱까지 완비된 자율 에이전트 인프라로 도약했습니다.

1. **동적 사이트맵 & 서브도메인 SEO/AEO 완비**:
   - `src/app/sitemap.ts`를 신설하여 모든 등록 에이전트 여권 URL, 디렉토리, 메인을 `/sitemap.xml`로 실시간 서빙.
   - `public/robots.txt`에 Sitemap 디렉티브 연동 및 `layout.tsx`에 `metadataBase`, `canonical` 표준 URL 정규화 완료.
2. **Supabase RLS(Row Level Security) 전면 활성화**:
   - 모든 `aid_*` 테이블에 RLS 강제 적용 (`migration_enable_rls_security.sql`). 외부 익명 수정/삭제 차단 및 `service_role` 안전 동기화.
3. **핵심 메트릭 정제 & 소셜 프루프 하이브리드 안정화**:
   - 불필요한 메트릭 노이즈를 덜어내고 직관적인 **`⚡ Spark`**와 실제 가동량 **`Invocations`** 2대 핵심 지표로 압축.
   - 15종 쇼케이스 에이전트에 자연스러운 시드값 부여 및 실제 실행 시 DB 실시간 영구 누적.
4. **글로벌 표준 호환**:
   - W3C DID, Google A2A 매니페스트(`.well-known/agent.json`), 공식 NPM 패키지 `aid-mcp@1.0.0` 배포 및 Smithery 1-클릭 지원.
5. **Phase 2 고도화 로드맵 수립**:
   - 비동기 롱러닝 에이전트 처리(202 Accepted + Task Webhook), DNS TXT 소유권 강제 검증, Lemon Squeezy 수익화/크레딧 결제, `npx aid` 원라이너 CLI.

---

## 🚀 2026-09-28 신규 구현 내역 상세 (Phase 1 Final)

### 0. 동적 사이트맵(Dynamic Sitemap) & 서브도메인 SEO/AEO 체계
- **구현 배경**:
  - 서브도메인(`aid.ledpa7.com`) 환경에서 구글봇, SearchGPT, 퍼플렉시티 등 AI 검색 크롤러가 등록된 수십 개의 에이전트 상세 페이지(`/[address]`)를 놓치지 않고 100% 인덱싱할 수 있는 기계 판독형 사이트맵 필요.
- **구현 내용**:
  - `src/app/sitemap.ts`: `AIDStore.getAllAgents()`를 통해 공개 등록된 모든 에이전트의 여권 주소를 동적으로 추출하여 `application/xml`로 실시간 서빙 (`priority: 0.8`, `changeFrequency: daily`).
  - `public/robots.txt`: `Sitemap: https://aid.ledpa7.com/sitemap.xml` 지시어 추가.
  - `src/app/layout.tsx`: 서브도메인 전용 `metadataBase` (`https://aid.ledpa7.com`), `alternates: { canonical: "/" }`, `googleBot` 확장 지시어 등록.
  - `src/app/[address]/page.tsx`: 각 에이전트 상세 페이지별 개별 `alternates: { canonical: pageUrl }` 표준 태그 명시.
- **실서버 검증**:
  - `https://aid.ledpa7.com/sitemap.xml` 200 OK 응답 및 Vercel Prerender 캐시 정상 동작 확인.

---

### 1. Supabase RLS(Row Level Security) 전면 보안 잠금
- **취약점 배경**:
  - Supabase PostgreSQL 테이블에 RLS가 미적용되어 있을 경우, 클라이언트에 노출되는 `anon_key`를 악용하여 REST 엔드포인트를 통해 테이블 행을 무단 수정/삭제할 수 있는 보안 취약성(Security Warning) 존재.
- **조치 내용**:
  - `supabase/migration_enable_rls_security.sql`:
    - `aid_namespaces`, `aid_agents`, `aid_endpoints`, `aid_keys`, `aid_enrollment_tokens`, `aid_agent_sparks` 전 테이블에 `ENABLE ROW LEVEL SECURITY` 적용.
    - 공개 조회(`SELECT true`) 허용 및 무단 INSERT/UPDATE/DELETE 원천 차단.
    - 백엔드는 Supabase `service_role` 키를 사용하여 RLS를 안전하게 바이패스하고 데이터 영속화 수행.
  - `supabase/migration_20260927_sparks_and_invocations.sql`:
    - `sparks_count`, `invocations_count` 컬럼 및 복합 인덱스 추가, `aid_agent_sparks` 테이블 생성.

---

### 2. 메트릭 간소화 및 시드 데이터 하이브리드 안정화
- **기획 결정**: "복잡한 복합 지표 대신 가장 직관적인 스파크와 실제 호출 수만 표시하여 사용자 있어보이게 서비스 활성화 유도"
- **구현 내용**:
  - UI에서 노이즈가 되는 배지를 정리하고 카드 우측 상단 `⚡ Spark` 버튼과 카드 본문 하단 `⚡ {count} INVOCATIONS` 뱃지만 집중 노출.
  - `src/lib/store.ts`: 대표 쇼케이스 에이전트 15종에 자연스러운 시드값(스파크 19~142, 호출 수 7~52) 설정 및 DB 데이터가 0일 때의 자동 폴백 보정 적용.
  - 실제 사용자의 스파크 클릭 및 게이트웨이 호출 시 실시간으로 +1 영구 누적.

---

## 🚀 2026-09-27 신규 구현 내역 상세

### 0. ⚡ Spark 커뮤니티 평판 투표 및 정량적 호출 수(Invocations) 연동
- **기획 배경**:
  - 흔한 SNS형 "좋아요/싫어요" 대신, AID의 탈중앙 AI 신원 및 사이버네틱 다크 옐로우 브랜드 정체성에 맞춘 전력 주입형 지표 **`⚡ Spark`** 채택.
  - 여기에 더해 사용자들이 실제로 얼마나 썼는지를 증명하는 **정량적 실가동 지표 `Invocations`**를 함께 배치하여, 주관적 추천(Social Proof)과 기계적 실행량(Hard Proof)의 완벽한 밸런스 달성.
- **구현 내용**:
  - `src/lib/types.ts`: `Agent` 및 `ResolutionResponse`에 `sparksCount?: number`, `invocationsCount?: number` 필드 추가.
  - `src/lib/store.ts`:
    - `agentSparksCache` 및 `agentInvocationsCache` 관리.
    - `recordInvocation(address)`: 게이트웨이 호출 성공 시 카운트 자동 증가.
    - `toggleSpark(address, clientFingerprint)`: 동일 클라이언트 재호출 시 토글(취소) 지원.
  - `src/app/api/v1/agents/[address]/spark/route.ts`:
    - `POST` 및 `GET` 엔드포인트 신설. IP/UA 지문 기반 단일 투표 제한 및 40 req/min Rate Limiting.
  - `src/app/api/v1/invoke/[address]/route.ts`:
    - 에이전트 실행 성공 시 `AIDStore.recordInvocation` 자동 호출 연동.
  - `src/components/AgentCard.tsx`:
    - 카드 헤더 우측 상단에 네온 옐로우 글로우 효과의 `⚡ Spark (count)` 버튼 배치.
    - 카드 본문 설명글 하단에 `[ ⚡ {count} INVOCATIONS ]` 실가동량 뱃지 탑재.
    - `localStorage` 및 낙관적 UI 업데이트(Optimistic Update)로 0ms 즉각 반응.
  - `src/app/directory/page.tsx`:
    - 디렉토리 결과 바에 **`⚡ Most Sparked`** vs **`Recent`** 실시간 탭 정렬 컨트롤 탑재.

---

### 1. 실시간 생존 검증 (Liveness Probe Gatekeeper) & 스팸 방어벽
- **취약점 배경**: 인증 없이 가짜 도메인(`https://fake-trash-domain.xyz`)이나 죽은 서버를 무작위로 수천 개 등록하여 디렉토리를 도배하거나, 내부망 IP를 찔러보는 SSRF 공격 가능성 제거 필요.
- **구현 내용**:
  - `src/lib/ssrf.ts` (`validateEndpointLiveness`):
    - 등록 시 4초 타임아웃의 초경량 프로브(GET)를 전송하여 네트워크 가동 상태를 실시간 검증.
    - DNS Lookup 실패, 타임아웃, ECONNREFUSED, 404 Not Found, 5xx 에러 반환 시 `400 Bad Request`로 등록을 원천 차단.
    - 로컬호스트(`127.0.0.1`, `localhost`), 클라우드 메타데이터(`169.254.169.254`), RFC1918 사설망 주소는 SSRF Guard로 자동 차단.
    - 2xx/3xx뿐만 아니라 A2A Handshake 챌린지(`401 Unauthorized`), 권한 제한(`403`), POST 전용 엔드포인트(`405`)도 "살아있는 정상 서버"로 유연하게 인정.
  - `src/app/api/v1/agents/route.ts`:
    - `POST` 핸들러 입구에서 Liveness Probe 강제 실행. 통과한 에이전트만 DB에 등록 및 `initialLiveness` 메타데이터 부여.
    - IP당 1분 15개로 Rate Limit 강화.
  - `src/app/api/v1/namespaces/route.ts`:
    - 네임스페이스 무단 선점/스쿼팅 방지를 위해 IP당 10분 5개 Rate Limit 적용 및 슬러그 정규식(`^[a-z0-9-]{2,32}$`) 검증 적용.
  - `src/components/RegisterAgentModal.tsx`:
    - 등록 진행 중 버튼 텍스트를 `⚡ Probing & Registering...`으로 변경하여 검증 피드백 제공. 실시간 차단 에러 메시지 렌더링.

---

### 2. Universal A2A Invocation Gateway & App Store 경험
- **범용 게이트웨이 엔드포인트 (`POST /api/v1/invoke/[address]`)**:
  - 클라이언트가 에이전트의 실제 통신 프로토콜(A2A, MCP, REST)을 알 필요 없이, AID 핸들(`scout@github` 등)만으로 즉시 호출 가능.
  - SSRF 오픈 리디렉션 차단, 60 req/min IP Rate Limiting, 512KB 페이로드 상한선 적용.
  - 외부 상용 봇(Cursor Composer, Perplexity 등) 대상 샌드박스 시뮬레이션(`isSimulation: true`) 폴백 지원.
  - `scout@github`의 경우 실제 GitHub API 백엔드와 연동되어 라이브 리서치 결과 반환.
- **인터랙티브 웹 실행 콘솔 (`src/components/InvokeAgentModal.tsx`)**:
  - 디렉토리의 모든 에이전트 카드에 `⚡ Run` 버튼 탑재.
  - 모달에서 에이전트별 최적화된 샘플 페이로드 자동 주입.
  - 1-클릭 cURL 명령어 복사 기능 지원.
  - 실행 완료 시 에이전트의 Ed25519 서명이 담긴 Proof of Execution(PoE) 영수증을 즉시 확인 가능.

---

### 3. DuckDB 기반 실시간 평판 리더보드 (`LeaderboardWidget.tsx`)
- **실시간 집계 엔진 (`src/lib/analytics.ts`)**:
  - DuckDB 인메모리 OLAP 데이터베이스를 활용하여 검증된 PoE 영수증 기록, 지연 시간(Latency), 성공률을 종합하여 평판 점수(0~100) 산출.
  - Vercel 서버리스 콜드스타트 시에도 0건 오류가 발생하지 않도록 부트스트랩 인메모리 영수증 데이터 자동 초기화.
- **디렉토리 상단 리더보드 위젯 (`src/components/LeaderboardWidget.tsx`)**:
  - 상위 5개 우수 에이전트 순위, 실행 횟수, 평균 응답속도(`185ms`), 종합 평판 점수 표시.
  - 리더보드 내에서 바로 실행할 수 있는 `Run` 버튼 탑재.
  - UI 간결화를 위해 불필요한 배지 요소 정리.

---

### 4. 에이전트 자율 유입 표준화 (AEO & Discovery & NPM MCP)
- **표준 디스커버리 매니페스트**:
  - `public/.well-known/agent.json`: Google A2A 및 W3C 분산 식별자(DID) 표준 지원.
  - `public/robots.txt`: 모든 AI 검색 봇(GPTBot, ClaudeBot, PerplexityBot 등) 전면 허용 및 머신 문서 인덱싱 경로 지정.
  - `src/middleware.ts`: AI 에이전트 접근 감지 시 터미널 전용 UI 리라이트 및 JSON 다이렉트 서빙.
- **NPM 공식 MCP 서버 배포**:
  - 패키지명: **`aid-mcp@1.0.0`** 공식 NPM 레지스트리 배포 완료.
  - `smithery.yaml` 작성으로 Smithery.ai에서 1-클릭 설치 지원 (`npx -y @smithery/cli install aid-mcp`).
- **A2A Handshake Protocol (`src/sdk/index.ts`)**:
  - 401 Unauthorized 기반 인증 챌린지 생성 및 서명 파싱 함수 구현.

---

### 5. UI/UX 디자인 디테일 완성 (Dark Neon Theme)
- **가로 스크롤바 커스텀 스타일링 (`src/app/globals.css`, `src/app/directory/page.tsx`)**:
  - 디렉토리의 네임스페이스, 카테고리, 신뢰도, 프로토콜 필터가 길어질 때 브라우저 기본 흰색 스크롤바 대신 AID 테마에 맞는 4px 다크 슬레이트 트랙(`#0f172a`) 및 호버 시 네온 옐로우(`#facc15`) 스크롤바 적용.
- **도메인 전면 교체**:
  - 모든 하드코딩 URL을 신규 커스텀 도메인 `https://aid.ledpa7.com`으로 100% 일괄 교체 배포.

---

## 📌 이전 주요 구현 내역 (2026-09-25)

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
- **실서버 Liveness Gatekeeper 검증 (2026-09-27)**:
  - 가짜 도메인 등록 시도 시 DNS 실패 감지 및 `400 Bad Request` 즉시 차단 완료.
  - 사설망/로컬호스트 등록 시도 시 SSRF Guard 즉시 차단 완료.
  - 정상 라이브 서버 등록 시 200 OK 및 초기 지연시간(`initialLiveness: 61ms`) 부여 확인.
- **총 145개 이상 테스트 및 라이브 검증 전원 통과**

---

## 🗺️ Phase 2 고도화 로드맵 (Next Evolution)

| 구분 | 기능 / 과제 | 상세 내용 | 우선순위 |
| :--- | :--- | :--- | :---: |
| **A2A Gateway** | **비동기 롱러닝 Task 규격** | 6초 타임아웃 극복을 위한 `202 Accepted` + `task_id` 비동기 웹훅/폴링 프로토콜 도입 | High |
| **Trust & DNS** | **도메인 소유권 강제 검증** | DNS TXT 레코드(`_aid.domain.com`) 검증 에이전트에만 'Verified' 골드 뱃지 부여 및 사칭 차단 | High |
| **Monetization** | **Lemon Squeezy 결제 연동** | 프리미엄 커스텀 네임스페이스 구독 및 유료 에이전트 호출용 API 크레딧 충전 결제 시스템 | Medium |
| **DX / CLI** | **`npx aid` 원라이너 CLI** | 개발자가 터미널에서 즉시 에이전트를 조회·호출(`npx aid run scout@github "prompt"`)하는 CLI 배포 | Medium |
| **Telemetry** | **주기적 Liveness 재검사** | 등록 이후 서버 장애/도메인 만료를 감지하여 상태를 'Degraded'로 자동 변경하는 Vercel Cron 강화 | Low |

