import duckdb from "duckdb";
import { ExecutionReceipt, AgentReputationMetrics } from "./types";

// In-memory or persistent local DuckDB instance
let dbInstance: duckdb.Database | null = null;
let isInitialized = false;

function getDb(): duckdb.Database {
  if (!dbInstance) {
    dbInstance = new duckdb.Database(":memory:");
  }
  return dbInstance;
}

function runQuery(sql: string, params: any[] = []): Promise<any[]> {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(sql, ...params, (err: any, rows: any[]) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function runExec(sql: string): Promise<void> {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.exec(sql, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function initAnalyticsDb(): Promise<void> {
  if (isInitialized) return;

  await runExec(`
    CREATE TABLE IF NOT EXISTS execution_receipts (
      receipt_id VARCHAR PRIMARY KEY,
      requester_address VARCHAR,
      executor_address VARCHAR,
      executor_aid VARCHAR,
      input_hash VARCHAR,
      output_hash VARCHAR,
      execution_time_ms INTEGER,
      status_code VARCHAR,
      error_message VARCHAR,
      timestamp BIGINT,
      executor_signature VARCHAR
    );
    CREATE INDEX IF NOT EXISTS idx_executor ON execution_receipts(executor_address);
    CREATE INDEX IF NOT EXISTS idx_timestamp ON execution_receipts(timestamp);
  `);

  isInitialized = true;
}

/**
 * Ingests a verified Execution Receipt into the DuckDB analytical store
 */
export async function ingestExecutionReceipt(receipt: ExecutionReceipt): Promise<void> {
  await initAnalyticsDb();

  const sql = `
    INSERT OR REPLACE INTO execution_receipts (
      receipt_id,
      requester_address,
      executor_address,
      executor_aid,
      input_hash,
      output_hash,
      execution_time_ms,
      status_code,
      error_message,
      timestamp,
      executor_signature
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  await runQuery(sql, [
    receipt.receiptId,
    receipt.requesterAddress,
    receipt.executorAddress,
    receipt.executorAid,
    receipt.inputHash,
    receipt.outputHash,
    receipt.executionTimeMs,
    receipt.statusCode,
    receipt.errorMessage || null,
    receipt.timestamp,
    receipt.executorSignature,
  ]);
}

/**
 * Computes real-time dynamic reputation metrics for an agent using DuckDB analytics
 */
export async function getAgentReputationMetrics(
  executorAddress: string
): Promise<AgentReputationMetrics> {
  await initAnalyticsDb();

  const sql = `
    SELECT
      COUNT(*) AS total_executions,
      COALESCE(AVG(execution_time_ms), 0) AS avg_latency_ms,
      COALESCE(SUM(CASE WHEN status_code = 'SUCCESS' THEN 1 ELSE 0 END), 0) AS success_count,
      COALESCE(SUM(CASE WHEN status_code = 'FAILED' THEN 1 ELSE 0 END), 0) AS failed_count,
      COALESCE(SUM(CASE WHEN status_code = 'SECURITY_BLOCKED' THEN 1 ELSE 0 END), 0) AS blocked_count,
      MAX(timestamp) AS last_timestamp
    FROM execution_receipts
    WHERE executor_address = ?;
  `;

  const rows = await runQuery(sql, [executorAddress]);
  const row = rows[0] || {};

  const totalExecutions = Number(row.total_executions || 0);
  const avgLatencyMs = Math.round(Number(row.avg_latency_ms || 0));
  const successCount = Number(row.success_count || 0);
  const failedCount = Number(row.failed_count || 0);
  const blockedCount = Number(row.blocked_count || 0);
  const lastTimestamp = row.last_timestamp ? Number(row.last_timestamp) : Date.now();

  const successRate = totalExecutions > 0 ? successCount / totalExecutions : 1.0;

  // Reputation Scoring (0 - 100)
  // Base 50 points
  let score = 50;

  if (totalExecutions === 0) {
    return {
      address: executorAddress,
      totalExecutions: 0,
      successRate: 1.0,
      averageLatencyMs: 0,
      failedExecutions: 0,
      securityBlockedCount: 0,
      reputationScore: 50,
      tier: "UNPROVEN",
      lastActiveAt: new Date().toISOString(),
    };
  }

  // Volume bonus (up to +25 points for >= 25 verified executions)
  const volumeBonus = Math.min(25, totalExecutions);
  score += volumeBonus;

  // Success bonus (up to +25 points for 100% success rate)
  score += Math.round(successRate * 25);

  // Security blocked penalty (-30 per blocked event)
  score -= blockedCount * 30;

  // Clamp 0 to 100
  score = Math.max(0, Math.min(100, score));

  let tier: "ELITE" | "RELIABLE" | "UNPROVEN" | "HIGH_RISK" = "RELIABLE";
  if (blockedCount > 0 || score < 40) {
    tier = "HIGH_RISK";
  } else if (totalExecutions < 5) {
    tier = "UNPROVEN";
  } else if (score >= 90 && totalExecutions >= 10 && successRate >= 0.95) {
    tier = "ELITE";
  }

  return {
    address: executorAddress,
    totalExecutions,
    successRate: Math.round(successRate * 100) / 100,
    averageLatencyMs: avgLatencyMs,
    failedExecutions: failedCount,
    securityBlockedCount: blockedCount,
    reputationScore: score,
    tier,
    lastActiveAt: new Date(lastTimestamp).toISOString(),
  };
}

/**
 * Returns network-wide attestation summary
 */
export async function getNetworkAttestationStats(): Promise<{
  totalReceipts: number;
  averageLatencyMs: number;
  topAgents: { address: string; executions: number; reputationScore: number }[];
}> {
  await initAnalyticsDb();

  const summaryRows = await runQuery(`
    SELECT
      COUNT(*) AS total_receipts,
      COALESCE(AVG(execution_time_ms), 0) AS avg_latency
    FROM execution_receipts;
  `);

  const topAgentsRows = await runQuery(`
    SELECT
      executor_address,
      COUNT(*) AS executions
    FROM execution_receipts
    GROUP BY executor_address
    ORDER BY executions DESC
    LIMIT 5;
  `);

  const topAgents = await Promise.all(
    topAgentsRows.map(async (r: any) => {
      const rep = await getAgentReputationMetrics(r.executor_address);
      return {
        address: r.executor_address,
        executions: Number(r.executions),
        reputationScore: rep.reputationScore,
      };
    })
  );

  return {
    totalReceipts: Number(summaryRows[0]?.total_receipts || 0),
    averageLatencyMs: Math.round(Number(summaryRows[0]?.avg_latency || 0)),
    topAgents,
  };
}
