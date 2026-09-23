import { AIDStore } from "../src/lib/store";
import { calculateTrustLadder } from "../src/lib/trust";

async function runCronHealthCheckTests() {
  console.log("==================================================");
  console.log("🕒  AID 1-Hour Automated Health-Check Cron Test Suite");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  try {
    // Test 1: Global Health Sweep Execution
    console.log("[1] Running Global Health Sweep across all registered agents...");
    const sweep = await AIDStore.runGlobalHealthCheck();

    assert(sweep.total > 0, `Total agents swept > 0 (swept: ${sweep.total})`);
    assert(sweep.results.length === sweep.total, "Result count matches total swept agents");
    assert(sweep.durationMs >= 0, `Health check completed in ${sweep.durationMs}ms`);
    assert(typeof sweep.checkedAt === "string", "Timestamp checkedAt is recorded");

    // Test 2: scout@github liveness status
    console.log("\n[2] Verifying scout@github liveness & response speed...");
    const scoutResult = sweep.results.find((r) => r.address === "scout@github");
    assert(!!scoutResult, "scout@github included in sweep results");
    assert(scoutResult?.status === "HEALTHY", `scout@github status is HEALTHY (actual: ${scoutResult?.status})`);
    assert((scoutResult?.latencyMs || 0) > 0, `Latency measured: ${scoutResult?.latencyMs}ms`);

    // Test 3: Down endpoint / Dead Agent revocation
    console.log("\n[3] Testing Dead Agent (DOWN status) badge revocation...");
    const deadAgentLadder = calculateTrustLadder({
      primaryAddress: "zombie@dead-domain.io",
      publicKey: "ed25519:6c91a32b...",
      isKeyVerified: true,
      isDomainVerified: true,
      endpoints: [{ url: "https://dead-domain.io/endpoint", protocol: "a2a" }],
      healthStatus: {
        status: "DOWN",
        latencyMs: 3000,
        httpStatus: 504,
        checkedAt: new Date().toISOString(),
        message: "Endpoint timed out",
      },
    });

    const liveBadge = deadAgentLadder.badges.find((b) => b.id === "live");
    assert(liveBadge?.achieved === false, "Lv.4 Live badge revoked for DOWN status");
    assert(deadAgentLadder.currentLevel < 4, `Level capped below Lv.4 for dead agent (actual: Lv.${deadAgentLadder.currentLevel})`);

    // Test 4: Healthy Agent badge retention
    console.log("\n[4] Testing Healthy Agent badge retention...");
    const healthyLadder = calculateTrustLadder({
      primaryAddress: "healthy@live-domain.io",
      publicKey: "ed25519:6c91a32b...",
      isKeyVerified: true,
      isDomainVerified: true,
      securityAudit: {
        riskScore: 0,
        tier: "SECURE",
        isSafe: true,
        summary: "No threats detected",
        passedChecks: ["RCE_SHELL", "ARBITRARY_FS", "CREDENTIAL_EXFIL", "SSRF_NETWORK", "PROMPT_INJECTION"],
        findings: [],
        auditedAt: new Date().toISOString(),
      },
      endpoints: [{ url: "https://live-domain.io/endpoint", protocol: "a2a" }],
      healthStatus: {
        status: "HEALTHY",
        latencyMs: 22,
        httpStatus: 200,
        checkedAt: new Date().toISOString(),
      },
    });

    const healthyLiveBadge = healthyLadder.badges.find((b) => b.id === "live");
    assert(healthyLiveBadge?.achieved === true, "Lv.4 Live badge granted for HEALTHY status");
    assert(healthyLadder.currentLevel === 4, `Healthy agent reaches Lv.4 (actual: Lv.${healthyLadder.currentLevel})`);

    // Test 5: Resolution integration
    console.log("\n[5] Testing Resolution Integration with Health Status...");
    const res = await AIDStore.resolveAddress("scout@github");
    assert(res !== null, "Resolved scout@github successfully");
    assert(res?.healthStatus !== undefined, "Resolution contains healthStatus object");
    assert(res?.healthStatus?.status === "HEALTHY", "Health status is reported as HEALTHY");

  } catch (error: any) {
    console.error("Unexpected test failure:", error);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runCronHealthCheckTests();
