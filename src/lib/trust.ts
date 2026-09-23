import { Agent, SecurityAuditReport, TrustBadgeItem, TrustLadder, AgentHealthStatus } from "./types";

interface TrustCandidate {
  id?: string;
  primaryAddress?: string;
  isKeyVerified?: boolean;
  publicKey?: string;
  isDomainVerified?: boolean;
  endpoints?: { url: string; protocol: string; isActive?: boolean }[];
  isLimited?: boolean;
  securityAudit?: SecurityAuditReport;
  healthStatus?: AgentHealthStatus;
}

/**
 * Calculates progressive trust tier and checklist progress (0 to 4 levels).
 * Frictionless registration allows Lv.0; progressive evidence unlocks higher tiers.
 */
export function calculateTrustLadder(agent: TrustCandidate): TrustLadder {
  const isRegistered = true; // Level 0: Always achieved once registered
  const hasKey = !!agent.isKeyVerified || !!agent.publicKey;
  const hasDomain = !!agent.isDomainVerified;
  const isShieldSafe = !!agent.securityAudit && (agent.securityAudit.tier === "SECURE" || agent.securityAudit.tier === "ELEVATED");
  const isLive =
    Array.isArray(agent.endpoints) &&
    agent.endpoints.length > 0 &&
    !agent.isLimited &&
    agent.healthStatus?.status !== "DOWN";



  const badges: TrustBadgeItem[] = [
    {
      id: "registered",
      level: 0,
      name: "Registered",
      icon: "⚪",
      achieved: isRegistered,
      title: "레지스트리 등록 완료",
      description: "영구 불변 AID(ULID) 및 가독 주소(Alias) 발급 완료.",
    },
    {
      id: "key",
      level: 1,
      name: "Key Verified",
      icon: "🔑",
      achieved: hasKey,
      title: "암호학적 공개키 검증",
      description: "Ed25519 공개키 등록 및 챌린지 서명 검증 가능.",
      actionHint: "Ed25519 공개키를 등록하면 Lv.1이 즉시 잠금 해제됩니다.",
    },
    {
      id: "domain",
      level: 2,
      name: "Domain Verified",
      icon: "🌐",
      achieved: hasDomain,
      title: "도메인 공식 소유권 확인",
      description: "DNS TXT 레코드(_aid.domain.com)를 통한 실시간 소유권 검증 통과.",
      actionHint: "도메인 DNS TXT 레코드에 인증 토큰을 추가해 사칭 방지 뱃지를 획득하세요.",
    },
    {
      id: "shield",
      level: 3,
      name: "Shield Safe",
      icon: "🛡️",
      achieved: isShieldSafe,
      title: "보안 보호막 (Security Shield) 통과",
      description: "임의 쉘 실행(RCE), 파일 파괴, 비밀키 탈취 등 악성 벡터 미탐지.",
      actionHint: "도구 스키마에서 위험한 명령어(exec, bash)를 제거하고 안전한 권한만 선언하세요.",
    },
    {
      id: "live",
      level: 4,
      name: "Live Responding",
      icon: "⚡",
      achieved: isLive,
      title: "실시간 엔드포인트 활성",
      description: "공개 호출 가능한 엔드포인트가 연결되어 즉시 통신 가능.",
      actionHint: "공개 REST/MCP/A2A 엔드포인트 URL을 연결해 실시간 호출 뱃지를 받으세요.",
    },
  ];

  // Calculate achieved count (0 to 4)
  const achievedLevels = [hasKey, hasDomain, isShieldSafe, isLive].filter(Boolean).length;
  const currentLevel = achievedLevels;
  const maxLevel = 4;
  const percentage = Math.round((currentLevel / maxLevel) * 100);

  let levelLabel = "Lv.0 Registered";
  let levelColor = "slate";

  if (currentLevel === 4) {
    levelLabel = "Lv.4 Certified Live";
    levelColor = "emerald";
  } else if (currentLevel === 3) {
    levelLabel = "Lv.3 Shield Safe";
    levelColor = "blue";
  } else if (currentLevel === 2) {
    levelLabel = "Lv.2 Domain Verified";
    levelColor = "amber";
  } else if (currentLevel === 1) {
    levelLabel = "Lv.1 Key Verified";
    levelColor = "cyan";
  }

  // Next recommendation
  let nextAction: string | undefined;
  if (!hasKey) {
    nextAction = "다음 신뢰 잠금 해제: Ed25519 공개키를 등록하세요.";
  } else if (!hasDomain) {
    nextAction = "다음 신뢰 잠금 해제: DNS TXT 레코드로 도메인 소유권을 증명하세요.";
  } else if (!isShieldSafe) {
    nextAction = "다음 신뢰 잠금 해제: Security Shield 감사 경고 항목을 조치하세요.";
  } else if (!isLive) {
    nextAction = "다음 신뢰 잠금 해제: 유효한 통신 엔드포인트를 연결하세요.";
  }

  return {
    currentLevel,
    maxLevel,
    percentage,
    levelLabel,
    levelColor,
    badges,
    nextAction,
  };
}
