import { calculateTrustLadder } from "../src/lib/trust";
import { AIDStore } from "../src/lib/store";

async function runTrustLadderTests() {
  console.log("==================================================");
  console.log("🏆  AID Progressive Trust Ladder (5-Tier Badge) Test Suite");
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
    // Test 1: Level 0 - Frictionless minimal registration
    console.log("[1] Testing Lv.0 Registered (Minimal friction registration)...");
    const lv0 = calculateTrustLadder({
      primaryAddress: "bot@anonymous",
      endpoints: [],
      isDomainVerified: false,
      isKeyVerified: false,
    });

    assert(lv0.currentLevel === 0, `Current level is 0 (actual: ${lv0.currentLevel})`);
    assert(lv0.percentage === 0, "Progress percentage is 0%");
    assert(lv0.levelLabel === "Lv.0 Registered", "Level label is 'Lv.0 Registered'");
    assert(lv0.badges[0].achieved === true, "Lv.0 Registered badge is achieved");
    assert(lv0.badges[1].achieved === false, "Lv.1 Key badge is locked");

    // Test 2: Level 1 - Ed25519 Key Verified
    console.log("\n[2] Testing Lv.1 Key Verified...");
    const lv1 = calculateTrustLadder({
      primaryAddress: "signer@dev",
      publicKey: "ed25519:6c91a32b0f44e26f59c2598379c1d65dfc2d4b1fa3d677284addd200126d8888",
      isKeyVerified: true,
      endpoints: [],
      isDomainVerified: false,
    });

    assert(lv1.currentLevel === 1, `Current level is 1 (actual: ${lv1.currentLevel})`);
    assert(lv1.percentage === 25, "Progress percentage is 25%");
    assert(lv1.levelLabel === "Lv.1 Key Verified", "Level label is 'Lv.1 Key Verified'");
    assert(lv1.badges[1].achieved === true, "Lv.1 Key badge is achieved");

    // Test 3: Level 2 - Domain Verified
    console.log("\n[3] Testing Lv.2 Domain Verified...");
    const lv2 = calculateTrustLadder({
      primaryAddress: "bot@company.com",
      publicKey: "ed25519:6c91a3...",
      isKeyVerified: true,
      isDomainVerified: true,
      endpoints: [],
    });

    assert(lv2.currentLevel === 2, `Current level is 2 (actual: ${lv2.currentLevel})`);
    assert(lv2.percentage === 50, "Progress percentage is 50%");
    assert(lv2.levelLabel === "Lv.2 Domain Verified", "Level label is 'Lv.2 Domain Verified'");
    assert(lv2.badges[2].achieved === true, "Lv.2 Domain badge is achieved");

    // Test 4: Level 3 - Security Shield Safe
    console.log("\n[4] Testing Lv.3 Shield Safe...");
    const lv3 = calculateTrustLadder({
      primaryAddress: "clean@org",
      publicKey: "ed25519:6c91a3...",
      isKeyVerified: true,
      isDomainVerified: true,
      securityAudit: {
        tier: "SECURE",
        riskScore: 0,
        isSafe: true,
        summary: "Clean",
        passedChecks: [],
        findings: [],
        auditedAt: new Date().toISOString(),
      },
      endpoints: [],
    });

    assert(lv3.currentLevel === 3, `Current level is 3 (actual: ${lv3.currentLevel})`);
    assert(lv3.percentage === 75, "Progress percentage is 75%");
    assert(lv3.levelLabel === "Lv.3 Shield Safe", "Level label is 'Lv.3 Shield Safe'");
    assert(lv3.badges[3].achieved === true, "Lv.3 Shield badge is achieved");

    // Test 5: Level 4 - Fully Certified Live Agent (scout@github)
    console.log("\n[5] Testing Lv.4 Certified Live (scout@github)...");
    const lv4 = calculateTrustLadder({
      primaryAddress: "scout@github",
      publicKey: "ed25519:6c91a32b0f44e26f59c2598379c1d65dfc2d4b1fa3d677284addd200126d8888",
      isKeyVerified: true,
      isDomainVerified: true,
      securityAudit: {
        tier: "SECURE",
        riskScore: 0,
        isSafe: true,
        summary: "Clean",
        passedChecks: [],
        findings: [],
        auditedAt: new Date().toISOString(),
      },
      endpoints: [{ url: "https://aid-beryl.vercel.app/api/agents/github", protocol: "rest" }],
      isLimited: false,
    });

    assert(lv4.currentLevel === 4, `Current level is 4 (actual: ${lv4.currentLevel})`);
    assert(lv4.percentage === 100, "Progress percentage is 100%");
    assert(lv4.levelLabel === "Lv.4 Certified Live", "Level label is 'Lv.4 Certified Live'");
    assert(lv4.badges.every((b) => b.achieved), "All 5 badges achieved");

    // Test 6: Closed Ecosystem Agent (muse@meta)
    console.log("\n[6] Testing Closed Ecosystem Agent (muse@meta)...");
    const museLadder = calculateTrustLadder({
      primaryAddress: "muse@meta",
      publicKey: "ed25519:e2d810...",
      isKeyVerified: true,
      isDomainVerified: false,
      isLimited: true, // Closed API
      endpoints: [{ url: "https://ai.meta.com/muse", protocol: "rest" }],
    });

    assert(museLadder.badges[4].achieved === false, "Live Responding is false for closed ecosystem");
    assert(museLadder.currentLevel < 4, `Capped below Lv.4 (actual: ${museLadder.currentLevel})`);

    // Test 7: Resolution Integration
    console.log("\n[7] Testing Resolution Integration with Trust Ladder...");
    const res = await AIDStore.resolveAddress("scout@github");
    assert(res !== null, "Resolved scout@github successfully");
    assert(res?.trustLadder !== undefined, "Resolution contains trustLadder");
    assert(res?.trustLadder?.currentLevel === 4, `Resolution reports Lv.4 (actual: ${res?.trustLadder?.currentLevel})`);
    assert(res?.trustLadder?.badges.length === 5, "Contains all 5 ladder badges");

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

runTrustLadderTests();
