import { AIDStore } from "../src/lib/store";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runPaginationTests() {
  console.log("==================================================");
  console.log("📄  AID Cursor-based Pagination & Filter Test Suite");
  console.log("==================================================");

  try {
    const all = await AIDStore.getAllAgents();
    const totalCount = all.length;
    console.log(`[0] Total registered agents in system: ${totalCount}`);
    assert(totalCount >= 4, `Total agents available for pagination test (actual: ${totalCount})`);

    const chunkSize = 2; // Test with 2-agent chunks

    // 1. First Page (Limit: 2)
    console.log(`\n[1] Testing Page 1 (Limit: ${chunkSize})...`);
    const page1 = await AIDStore.getAgents({ limit: chunkSize });
    assert(page1.agents.length === chunkSize, `Page 1 returns exactly ${chunkSize} agents (actual: ${page1.agents.length})`);
    assert(page1.total === totalCount, `Total reported accurately (actual: ${page1.total})`);
    assert(page1.hasMore === true, "hasMore is true when items remain");
    assert(Boolean(page1.nextCursor), `nextCursor is provided (actual: ${page1.nextCursor})`);

    // 2. Second Page using cursor
    console.log(`\n[2] Testing Page 2 with cursor: ${page1.nextCursor}...`);
    const page2 = await AIDStore.getAgents({ limit: chunkSize, cursor: page1.nextCursor });
    assert(page2.agents.length === chunkSize, `Page 2 returns next ${chunkSize} agents (actual: ${page2.agents.length})`);
    
    // Check whether more items remain after page 2
    const remainingAfterPage2 = totalCount - (chunkSize * 2);
    if (remainingAfterPage2 > 0) {
      assert(page2.hasMore === true, `hasMore is true with ${remainingAfterPage2} items left`);
      assert(Boolean(page2.nextCursor), `nextCursor is provided for page 3`);
    } else {
      assert(page2.hasMore === false, "hasMore is false on last page");
      assert(page2.nextCursor === undefined, "nextCursor is undefined on last page");
    }

    // Ensure no duplicate IDs between page 1 and page 2
    const page1Ids = new Set(page1.agents.map((a) => a.id));
    const duplicates = page2.agents.filter((a) => page1Ids.has(a.id));
    assert(duplicates.length === 0, "Zero duplicates between page 1 and page 2 across cursor boundary");

    // 3. Complete Pagination Traversal to the end
    console.log("\n[3] Testing Full Traversal across all pages...");
    let collectedAgents: string[] = [];
    let currentCursor: string | undefined = undefined;
    let pagesTraversed = 0;
    let hasMorePages = true;

    while (hasMorePages && pagesTraversed < 10) {
      const page = await AIDStore.getAgents({ limit: chunkSize, cursor: currentCursor });
      page.agents.forEach((a) => collectedAgents.push(a.id));
      hasMorePages = page.hasMore;
      currentCursor = page.nextCursor;
      pagesTraversed++;
    }

    assert(collectedAgents.length === totalCount, `Full traversal retrieved all ${totalCount} agents (actual: ${collectedAgents.length})`);
    assert(new Set(collectedAgents).size === totalCount, "All retrieved agent IDs across traversal are unique");

    // 4. Filter by Category
    console.log("\n[4] Testing Pagination + Category Filter (DevOps / Coding)...");
    const devopsAgents = await AIDStore.getAgents({ category: "DevOps", limit: 10 });
    assert(devopsAgents.agents.length > 0, `Found DevOps agents (actual: ${devopsAgents.agents.length})`);
    assert(
      devopsAgents.agents.every((a) => a.category === "DevOps"),
      "Every returned agent belongs to 'DevOps' category"
    );

    // 5. Filter by Min Trust Level
    console.log("\n[5] Testing Pagination + Min Trust Level Filter (Lv.3+)...");
    const lv3Agents = await AIDStore.getAgents({ minTrustLevel: 3, limit: 10 });
    assert(lv3Agents.agents.length > 0, `Found Lv.3+ agents (actual: ${lv3Agents.agents.length})`);

    // 6. Security & Safety Limit Capping (Max: 50)
    console.log("\n[6] Testing Limit Capping...");
    const capped = await AIDStore.getAgents({ limit: 999 });
    assert(capped.limit === 50, `Capped to max limit 50 (actual: ${capped.limit})`);

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

runPaginationTests();
