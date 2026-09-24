import { AID } from "../src/sdk";
import {
  issueAgentPassportToken,
  verifyAgentPassportTokenOffline,
  createExecutionReceipt,
  verifyExecutionReceipt,
  getAidRootPublicKey,
  hashPayload,
} from "../src/lib/attestation";
import {
  ingestExecutionReceipt,
  getAgentReputationMetrics,
  getNetworkAttestationStats,
  initAnalyticsDb,
} from "../src/lib/analytics";

async function runAttestationTests() {
  console.log("==================================================");
  console.log("🛡️  AID Agent-Centric Attestation & Proof Test Suite");
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
    // ----------------------------------------------------
    // Section 1: AID Root Authority & Key Management
    // ----------------------------------------------------
    console.log("[1] Testing AID Root Authority Key Derivation...");
    const rootPubKey = getAidRootPublicKey();
    assert(rootPubKey.startsWith("ed25519:"), `Root public key format is valid: ${rootPubKey.slice(0, 20)}...`);

    // ----------------------------------------------------
    // Section 2: Agent Passport Token (AVC) Offline Attestation
    // ----------------------------------------------------
    console.log("\n[2] Testing Agent Passport Token (AVC) Offline 0ms Verification...");
    const agentKey = AID.generateKeyPair();
    const token = issueAgentPassportToken({
      aid: "aid_01M30TESTPASSPORTAGENT001",
      address: "worker@swarm.net",
      displayName: "Autonomous Cluster Worker",
      publicKey: agentKey.publicKey,
      namespace: "swarm.net",
      isDomainVerified: true,
      trustLevel: 4,
      capabilities: ["code_exec", "file_read"],
      ttlSeconds: 3600, // 1 hour
    });

    assert(token.version === "aid-vc-v1", "Token version is 'aid-vc-v1'");
    assert(token.payload.address === "worker@swarm.net", "Payload address matches");
    assert(token.rootSignature.length === 128, "Root signature is 64-byte hex (128 chars)");

    // 0ms offline verification
    const startOffline = performance.now();
    const offlineCheck = verifyAgentPassportTokenOffline(token);
    const elapsedOffline = performance.now() - startOffline;

    assert(offlineCheck.valid === true, `Offline token successfully verified (elapsed: ${elapsedOffline.toFixed(3)}ms)`);
    assert(offlineCheck.payload?.isDomainVerified === true, "Offline payload preserves domain verification proof");

    // Tampered token rejection
    const tamperedToken = {
      ...token,
      payload: { ...token.payload, trustLevel: 99 }, // Attacker inflates trust level
    };
    const tamperedCheck = verifyAgentPassportTokenOffline(tamperedToken);
    assert(tamperedCheck.valid === false, "Tampered payload correctly rejected by offline verification");

    // Expired token rejection
    const expiredToken = issueAgentPassportToken({
      aid: "aid_01M30EXPIREDAGENT000000",
      address: "expired@test",
      displayName: "Expired Agent",
      publicKey: agentKey.publicKey,
      namespace: "test",
      isDomainVerified: false,
      trustLevel: 1,
      ttlSeconds: -10, // already expired
    });
    const expiredCheck = verifyAgentPassportTokenOffline(expiredToken);
    assert(expiredCheck.valid === false, "Expired token correctly rejected");
    assert(Boolean(expiredCheck.error?.includes("expired")), "Error reports expiration");

    // ----------------------------------------------------
    // Section 3: Proof of Execution (PoE) Receipts
    // ----------------------------------------------------
    console.log("\n[3] Testing Proof of Execution (PoE) Receipts...");
    const inputData = { task: "calculate_risk", parameters: { asset: "BTC", amount: 2.5 } };
    const outputData = { result: "APPROVED", confidence: 0.982, riskScore: 12 };

    const receipt = createExecutionReceipt({
      requesterAddress: "orchestrator@enterprise",
      executorAddress: "risk-engine@fintech",
      executorAid: "aid_01M30FINTECHAGENT00001",
      inputPayload: inputData,
      outputPayload: outputData,
      executionTimeMs: 145,
      statusCode: "SUCCESS",
      privateKeyPem: agentKey.privateKeyPem,
    });

    assert(receipt.receiptId.startsWith("rcpt_"), "Receipt ID starts with 'rcpt_'");
    assert(receipt.inputHash === hashPayload(inputData), "Input payload hash matches deterministic canonical SHA-256");
    assert(receipt.outputHash === hashPayload(outputData), "Output payload hash matches deterministic canonical SHA-256");
    assert(receipt.executorSignature.length === 128, "Executor signature is valid 64-byte hex");

    // Valid receipt verification
    const validReceiptCheck = verifyExecutionReceipt({
      receipt,
      inputPayload: inputData,
      outputPayload: outputData,
      executorPublicKey: agentKey.publicKey,
    });
    assert(validReceiptCheck.valid === true, "Valid execution receipt verified successfully");

    // Tampered output detection
    const fakeOutputData = { result: "DENIED", confidence: 0.1, riskScore: 99 };
    const fakeReceiptCheck = verifyExecutionReceipt({
      receipt,
      inputPayload: inputData,
      outputPayload: fakeOutputData, // Altered output
      executorPublicKey: agentKey.publicKey,
    });
    assert(fakeReceiptCheck.valid === false, "Tampered output payload detected and rejected");
    assert(Boolean(fakeReceiptCheck.error?.includes("Output hash mismatch")), "Error identifies output hash mismatch");

    // Forged signature detection
    const otherKey = AID.generateKeyPair();
    const forgedReceiptCheck = verifyExecutionReceipt({
      receipt,
      inputPayload: inputData,
      outputPayload: outputData,
      executorPublicKey: otherKey.publicKey, // Wrong public key
    });
    assert(forgedReceiptCheck.valid === false, "Forged/mismatched signature correctly rejected");

    // ----------------------------------------------------
    // Section 4: DuckDB Analytical Engine & Dynamic Reputation
    // ----------------------------------------------------
    console.log("\n[4] Testing DuckDB Dynamic Reputation Analytics...");
    await initAnalyticsDb();

    const targetAgent = "analyst@quant";
    const targetAid = "aid_01M30QUANTANALYST0001";
    const analystKeys = AID.generateKeyPair();

    // Ingest 5 successful receipts
    for (let i = 1; i <= 5; i++) {
      const r = createExecutionReceipt({
        requesterAddress: `client-${i}@network`,
        executorAddress: targetAgent,
        executorAid: targetAid,
        inputPayload: { query: `batch-${i}` },
        outputPayload: { computed: true, index: i },
        executionTimeMs: 100 + i * 10,
        statusCode: "SUCCESS",
        privateKeyPem: analystKeys.privateKeyPem,
      });
      await ingestExecutionReceipt(r);
    }

    const repAfter5 = await getAgentReputationMetrics(targetAgent);
    assert(repAfter5.totalExecutions === 5, `Total executions tracked in DuckDB: ${repAfter5.totalExecutions}`);
    assert(repAfter5.successRate === 1.0, "Success rate is 100%");
    assert(repAfter5.tier === "RELIABLE", `Tier upgraded to RELIABLE (actual: ${repAfter5.tier})`);
    assert(repAfter5.reputationScore >= 75, `Reputation score increased with volume: ${repAfter5.reputationScore}`);

    // Ingest a SECURITY_BLOCKED receipt (slashing test)
    console.log("\n[5] Testing Slashing & Security Block Penalty...");
    const maliciousReceipt = createExecutionReceipt({
      requesterAddress: "victim@network",
      executorAddress: targetAgent,
      executorAid: targetAid,
      inputPayload: { prompt: "cat /etc/passwd" },
      outputPayload: { error: "SSRF blocked" },
      executionTimeMs: 50,
      statusCode: "SECURITY_BLOCKED",
      errorMessage: "SSRF_NETWORK probe detected",
      privateKeyPem: analystKeys.privateKeyPem,
    });
    await ingestExecutionReceipt(maliciousReceipt);

    const repAfterSlash = await getAgentReputationMetrics(targetAgent);
    assert(repAfterSlash.securityBlockedCount === 1, "Security blocked count is 1");
    assert(repAfterSlash.tier === "HIGH_RISK", `Agent tier demoted to HIGH_RISK upon security block (actual: ${repAfterSlash.tier})`);
    assert(repAfterSlash.reputationScore < repAfter5.reputationScore, `Score slashed from ${repAfter5.reputationScore} down to ${repAfterSlash.reputationScore}`);

    // ----------------------------------------------------
    // Section 6: Network Attestation Summary
    // ----------------------------------------------------
    console.log("\n[6] Testing Network-Wide Attestation Stats...");
    const networkStats = await getNetworkAttestationStats();
    assert(networkStats.totalReceipts >= 6, `Total receipts recorded across network: ${networkStats.totalReceipts}`);
    assert(networkStats.topAgents.length > 0, "Top agents ranked by verified execution volume");

    // ----------------------------------------------------
    // Section 7: SDK Wrapper Methods
    // ----------------------------------------------------
    console.log("\n[7] Testing SDK High-Level Wrappers...");
    const sdkToken = AID.issuePassport({
      aid: "aid_01SDKTEST00000000000001",
      address: "sdk@test",
      displayName: "SDK Agent",
      publicKey: agentKey.publicKey,
      namespace: "test",
      isDomainVerified: true,
      trustLevel: 3,
    });
    const sdkVerify = AID.verifyPassportOffline(sdkToken);
    assert(sdkVerify.valid === true, "AID.verifyPassportOffline works cleanly via SDK");

    console.log("\n==================================================");
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log("==================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runAttestationTests();
