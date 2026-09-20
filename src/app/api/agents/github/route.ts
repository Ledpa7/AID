import { NextRequest, NextResponse } from "next/server";

interface GitHubAgentRequest {
  action: "search_repos" | "fetch_readme" | "inspect_dependencies" | "trending_templates";
  params: Record<string, any>;
}

const GITHUB_HEADERS: Record<string, string> = {
  "User-Agent": "AID-Scout-Agent/1.0 (https://aid-beryl.vercel.app; scout@github)",
  Accept: "application/vnd.github.v3+json",
};

if (process.env.GITHUB_TOKEN) {
  GITHUB_HEADERS["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
}

export async function GET() {
  return NextResponse.json({
    aid: "aid_01K72M8KQ4GITHUB01",
    address: "scout@github",
    name: "GitHub Scout Agent (Vibe Coder Edition)",
    description:
      "Autonomous open-source research agent for vibe coders. Discovers curated AI boilerplates, extracts verified README docs to eliminate LLM hallucinations, and audits package dependencies in real time.",
    protocols: ["rest", "mcp", "a2a"],
    version: "1.0.0",
    status: "ACTIVE",
    capabilities: [
      {
        action: "search_repos",
        description: "Search open-source repositories by keyword, topics, and stars.",
        params: { query: "string (required)", sort: "stars | updated", limit: "number (default: 5)" },
      },
      {
        action: "fetch_readme",
        description: "Fetch raw Markdown README of any GitHub repository for zero-hallucination code context.",
        params: { owner: "string (required)", repo: "string (required)" },
      },
      {
        action: "inspect_dependencies",
        description: "Extract package.json dependencies and versions to audit compatible tech stacks.",
        params: { owner: "string (required)", repo: "string (required)" },
      },
      {
        action: "trending_templates",
        description: "Retrieve curated trending AI agent, Next.js, and vibe-coding boilerplates.",
        params: { category: "ai-agents | nextjs-saas | mcp-servers (optional)" },
      },
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: GitHubAgentRequest = await request.json();
    const { action, params = {} } = body;

    switch (action) {
      case "search_repos": {
        const query = params.query;
        if (!query) {
          return NextResponse.json({ error: "Missing required param: query" }, { status: 400 });
        }
        const sort = params.sort || "stars";
        const limit = Math.min(Number(params.limit) || 5, 10);

        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
          query
        )}&sort=${sort}&order=desc&per_page=${limit}`;

        const res = await fetch(url, { headers: GITHUB_HEADERS });
        if (!res.ok) {
          return NextResponse.json(
            { error: `GitHub API error: ${res.statusText}` },
            { status: res.status }
          );
        }

        const data = await res.json();
        const results = (data.items || []).map((repo: any) => ({
          name: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          updatedAt: repo.pushed_at,
          topics: repo.topics || [],
        }));

        return NextResponse.json({
          agent: "scout@github",
          action: "search_repos",
          count: results.length,
          repositories: results,
        });
      }

      case "fetch_readme": {
        const { owner, repo } = params;
        if (!owner || !repo) {
          return NextResponse.json({ error: "owner and repo are required." }, { status: 400 });
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/readme`;
        const res = await fetch(url, {
          headers: {
            ...GITHUB_HEADERS,
            Accept: "application/vnd.github.raw+json",
          },
        });

        if (!res.ok) {
          return NextResponse.json(
            { error: `Failed to fetch README for ${owner}/${repo}: ${res.statusText}` },
            { status: res.status }
          );
        }

        const markdown = await res.text();
        // Truncate to reasonable context limit if extremely long
        const cleanMarkdown =
          markdown.length > 20000
            ? `${markdown.slice(0, 20000)}\n\n---\n*(README truncated by scout@github for token safety)*`
            : markdown;

        return NextResponse.json({
          agent: "scout@github",
          action: "fetch_readme",
          repository: `${owner}/${repo}`,
          content: cleanMarkdown,
        });
      }

      case "inspect_dependencies": {
        const { owner, repo } = params;
        if (!owner || !repo) {
          return NextResponse.json({ error: "owner and repo are required." }, { status: 400 });
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/contents/package.json`;
        const res = await fetch(url, {
          headers: {
            ...GITHUB_HEADERS,
            Accept: "application/vnd.github.raw+json",
          },
        });

        if (!res.ok) {
          return NextResponse.json(
            { error: `package.json not found in ${owner}/${repo}` },
            { status: 404 }
          );
        }

        const rawText = await res.text();
        let pkg: any = {};
        try {
          pkg = JSON.parse(rawText);
        } catch {
          return NextResponse.json({ error: "Failed to parse package.json" }, { status: 500 });
        }

        return NextResponse.json({
          agent: "scout@github",
          action: "inspect_dependencies",
          repository: `${owner}/${repo}`,
          stack: {
            name: pkg.name,
            version: pkg.version,
            scripts: pkg.scripts || {},
            dependencies: pkg.dependencies || {},
            devDependencies: pkg.devDependencies || {},
          },
        });
      }

      case "trending_templates": {
        const category = params.category || "ai-agents";
        let searchQuery = "stars:>500 topic:ai-agents";
        if (category === "nextjs-saas") {
          searchQuery = "stars:>300 topic:nextjs topic:saas";
        } else if (category === "mcp-servers") {
          searchQuery = "stars:>100 topic:mcp topic:model-context-protocol";
        }

        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
          searchQuery
        )}&sort=stars&order=desc&per_page=6`;

        const res = await fetch(url, { headers: GITHUB_HEADERS });
        if (!res.ok) {
          return NextResponse.json(
            { error: `GitHub API error: ${res.statusText}` },
            { status: res.status }
          );
        }

        const data = await res.json();
        const templates = (data.items || []).map((repo: any) => ({
          name: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count,
          language: repo.language,
          topics: repo.topics || [],
        }));

        return NextResponse.json({
          agent: "scout@github",
          action: "trending_templates",
          category,
          count: templates.length,
          templates,
        });
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown action '${action}'. Supported actions: search_repos, fetch_readme, inspect_dependencies, trending_templates`,
          },
          { status: 400 }
        );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal agent execution error" },
      { status: 500 }
    );
  }
}
