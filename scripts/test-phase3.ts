import { AIDStore } from "../src/lib/store";
import { AID } from "../src/sdk";
import { verifyEd25519Signature } from "../src/lib/crypto";

async function runPhase3Tests() {
  console.log("==================================================");
  console.log("🛡️  AID Phase 3 (Agent-native Enrollment) Test Suite");
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
    // Test 1: Native Ed25519 Key Generation & Signing in SDK
    console.log("[1] Testing Native Ed25519 SDK Key Generation & Signing...");
    const keys = AID.generateKeyPair();
    assert(keys.publicKey.startsWith("ed25519:"), "Public key format is 'ed25519:<hex>'");
    assert(keys.privateKeyPem.includes("BEGIN PRIVATE KEY"), "Private key PEM is generated locally");

    const testMsg = "AID-AUTH:test-challenge:nonce-12345";
    const sig = AID.signPayload({ message: testMsg, privateKeyPem: keys.privateKeyPem });
    assert(sig.length === 128, "Ed25519 signature is 64-byte hex string (128 chars)");

    const isSigValid = verifyEd25519Signature({
      publicKey: keys.publicKey,
      message: testMsg,
      signature: sig,
    });
    assert(isSigValid === true, "Node native crypto verifies generated Ed25519 signature successfully");

    // Test 2: Enrollment Token Creation
    console.log("\n[2] Testing Enrollment Token Creation...");
    const tokenResult = await AIDStore.createEnrollmentToken({
      namespaceSlug: "community",
      name: "Autonomous Test Swarm",
      maxAgents: 2, // Quota of 2 agents
      expiresInDays: 7,
    });

    assert(tokenResult.token.startsWith("aid_enroll_"), "Plaintext token generated with prefix 'aid_enroll_'");
    assert(tokenResult.enrollmentToken.maxAgents === 2, "Token max quota set to 2");
    assert(tokenResult.enrollmentToken.usedAgents === 0, "Initial used quota is 0");
    assert(tokenResult.enrollmentToken.isActive === true, "Token is active");

    // Test 3: List Enrollment Tokens
    console.log("\n[3] Testing Enrollment Token Listing...");
    const tokenList = await AIDStore.listEnrollmentTokens("community");
    const foundToken = tokenList.find((t) => t.id === tokenResult.enrollmentToken.id);
    assert(!!foundToken, "Created token appears in namespace token list");
    assert(Boolean(foundToken?.tokenPrefix.startsWith("aid_enroll_")), "Token prefix is properly masked");

    // Test 4: Agent 1 Auto-Enrollment
    console.log("\n[4] Testing Autonomous Agent 1 Enrollment...");
    const enroll1 = await AIDStore.enrollAgent({
      token: tokenResult.token,
      alias: `worker-${Date.now().toString().slice(-4)}`,
      displayName: "Autonomous Worker 1",
      endpointUrl: "https://worker1.ai-cluster.internal/a2a",
      protocol: "a2a",
      publicKey: keys.publicKey,
      category: "DevOps",
      description: "Automated cluster deployment agent",
    });

    assert(enroll1.success === true, "Agent 1 enrolled successfully");
    assert(enroll1.aid.startsWith("aid_"), "Permanent ULID AID issued");
    assert(enroll1.isKeyVerified === true, "Cryptographic key registered and verified");
    assert(enroll1.tokenUsed.remainingQuota === 1, "Remaining quota decremented to 1");

    // Test 5: Reverse Address Resolution
    console.log("\n[5] Testing Address Resolution for Enrolled Agent...");
    const resolved = await AIDStore.resolveAddress(enroll1.address);
    assert(resolved?.aid === enroll1.aid, "Resolution returns exact permanent AID");
    assert(resolved?.verification.key === true, "Resolution confirms key verification");
    assert(resolved?.endpoints[0]?.url === "https://worker1.ai-cluster.internal/a2a", "Endpoint accurately resolved");

    // Test 6: Agent 2 Auto-Enrollment (Reaching Quota)
    console.log("\n[6] Testing Agent 2 Auto-Enrollment (Consuming remaining quota)...");
    const keys2 = AID.generateKeyPair();
    const enroll2 = await AIDStore.enrollAgent({
      token: tokenResult.token,
      alias: `worker-${Date.now().toString().slice(-4)}b`,
      displayName: "Autonomous Worker 2",
      endpointUrl: "https://worker2.ai-cluster.internal/mcp",
      protocol: "mcp",
      publicKey: keys2.publicKey,
      category: "Coding",
    });

    assert(enroll2.success === true, "Agent 2 enrolled successfully");
    assert(enroll2.tokenUsed.remainingQuota === 0, "Remaining quota is now 0");

    // Test 7: Sybil Defense / Quota Enforcement
    console.log("\n[7] Testing Sybil Defense (Enrollment rejection when quota exhausted)...");
    let quotaErrorCaught = false;
    try {
      await AIDStore.enrollAgent({
        token: tokenResult.token,
        alias: `worker-overflow`,
        displayName: "Unauthorized Worker",
        endpointUrl: "https://overflow.internal",
      });
    } catch (err: any) {
      if (err.message.includes("quota exceeded")) {
        quotaErrorCaught = true;
      }
    }
    assert(quotaErrorCaught === true, "Quota overflow was rejected with 'quota exceeded' error");

    // Test 8: Revocation Defense
    console.log("\n[8] Testing Token Revocation...");
    await AIDStore.revokeEnrollmentToken(tokenResult.enrollmentToken.id);
    let revokedErrorCaught = false;
    try {
      await AIDStore.enrollAgent({
        token: tokenResult.token,
        alias: `worker-revoked`,
        displayName: "Revoked Worker",
        endpointUrl: "https://revoked.internal",
      });
    } catch (err: any) {
      if (err.message.includes("revoked") || err.message.includes("deactivated")) {
        revokedErrorCaught = true;
      }
    }
    assert(revokedErrorCaught === true, "Revoked token is rejected from any further enrollment");

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

runPhase3Tests();
