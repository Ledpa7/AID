#!/usr/bin/env node

/**
 * AID MCP Server (Model Context Protocol)
 * Allows Claude Desktop, Cursor, and any MCP client to resolve, verify,
 * and discover verifiable AI agents directly through tool calling.
 */

const readline = require("readline");

// CLI Args parsing
let registryUrl = process.env.AID_REGISTRY_URL || "https://aid-beryl.vercel.app";
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--registry" && args[i + 1]) {
    registryUrl = args[i + 1].replace(/\/$/, "");
    i++;
  }
}

// Log to stderr only (stdout is strictly reserved for JSON-RPC)
function logDebug(msg) {
  process.stderr.write(`[AID-MCP] ${msg}\n`);
}

logDebug(`Starting AID MCP Server connected to ${registryUrl}`);

// Tools definition
const TOOLS = [
  {
    name: "resolve_agent",
    description:
      "Resolves an AI agent's verifiable identity, permanent AID, primary endpoint URL, protocol (A2A, MCP, REST), and cryptographic trust evidence from an address like registry@aid or oracle@community.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The agent address in alias@namespace format (e.g. registry@aid)",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "verify_agent_signature",
    description:
      "Cryptographically verifies whether a message or request was signed by the registered Ed25519 private key of an AI agent.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The claimed agent address (e.g. registry@aid)",
        },
        message: {
          type: "string",
          description: "The raw message/payload string that was signed",
        },
        signature: {
          type: "string",
          description: "The Ed25519 signature in hex or base64 format",
        },
      },
      required: ["address", "message", "signature"],
    },
  },
  {
    name: "search_agents",
    description:
      "Search the global AID registry for available agents by alias, name, description, or capability.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keyword (e.g. 'registry', 'oracle', 'aid', 'github', 'scout')",
        },
      },
    },
  },
  {
    name: "invoke_agent",
    description:
      "Directly delegates an autonomous task to a verified AI agent registered on AID (e.g. scout@github). Resolves the agent's endpoint and executes the requested action.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The agent address (e.g. 'scout@github')",
        },
        action: {
          type: "string",
          description: "Action to execute on target agent (e.g. 'search_repos', 'fetch_readme', 'inspect_dependencies')",
        },
        params: {
          type: "object",
          description: "Parameters for the agent action (e.g. { query: 'nextjs-saas' } or { owner: 'vercel', repo: 'ai' })",
        },
      },
      required: ["address", "action"],
    },
  },
  {
    name: "scout_github",
    description:
      "Shorthand tool to invoke the scout@github verified agent for open-source exploration, live README extraction (zero-hallucination context), or package dependency auditing.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["search_repos", "fetch_readme", "inspect_dependencies", "trending_templates"],
          description: "Action to execute on GitHub Scout",
        },
        params: {
          type: "object",
          description: "Parameters: { query } for search, { owner, repo } for readme/inspect, { category } for trending",
        },
      },
      required: ["action"],
    },
  },
];

// Tool handlers
async function handleToolCall(name, params) {
  switch (name) {
    case "resolve_agent": {
      const address = encodeURIComponent(params.address || "");
      const res = await fetch(`${registryUrl}/api/v1/resolve/${address}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to resolve agent '${params.address}': ${err.error || res.statusText}`,
            },
          ],
        };
      }
      const data = await res.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    case "verify_agent_signature": {
      const res = await fetch(`${registryUrl}/api/v1/verify/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: params.address,
          message: params.message,
          signature: params.signature,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Signature verification FAILED for ${params.address}: ${data.error || "Invalid signature"}`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Signature VERIFIED successfully! Agent ${data.address} (${data.aid}) is cryptographically verified.\nVerified at: ${data.verifiedAt}`,
          },
        ],
      };
    }

    case "search_agents": {
      const res = await fetch(`${registryUrl}/api/v1/agents`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        return {
          isError: true,
          content: [{ type: "text", text: "Failed to query AID agent directory." }],
        };
      }
      const data = await res.json();
      const allAgents = data.agents || [];
      const q = (params.query || "").toLowerCase();
      const filtered = q
        ? allAgents.filter(
            (a) =>
              a.primaryAddress.toLowerCase().includes(q) ||
              a.displayName.toLowerCase().includes(q) ||
              (a.description && a.description.toLowerCase().includes(q))
          )
        : allAgents;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                totalFound: filtered.length,
                agents: filtered.map((a) => ({
                  address: a.primaryAddress,
                  aid: a.id,
                  name: a.displayName,
                  description: a.description,
                  endpoint: a.endpoints?.[0]?.url,
                  protocol: a.endpoints?.[0]?.protocol,
                  isVerified: a.isDomainVerified && a.isKeyVerified,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    case "invoke_agent": {
      const address = encodeURIComponent(params.address || "");
      const resolveRes = await fetch(`${registryUrl}/api/v1/resolve/${address}`, {
        headers: { Accept: "application/json" },
      });
      if (!resolveRes.ok) {
        return {
          isError: true,
          content: [{ type: "text", text: `Could not resolve agent '${params.address}' on AID registry.` }],
        };
      }
      const resolution = await resolveRes.json();
      const endpoint = resolution.primaryEndpoint?.url || resolution.endpoints?.[0]?.url;
      if (!endpoint) {
        return {
          isError: true,
          content: [{ type: "text", text: `Agent '${params.address}' has no active communication endpoint.` }],
        };
      }

      const invokeRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: params.action,
          params: params.params || {},
        }),
      });
      const invokeData = await invokeRes.json().catch(() => ({}));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(invokeData, null, 2),
          },
        ],
      };
    }

    case "scout_github": {
      // Direct call to GitHub Scout agent endpoint or via resolution
      const endpoint = `${registryUrl}/api/agents/github`;
      const invokeRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: params.action,
          params: params.params || {},
        }),
      });
      const invokeData = await invokeRes.json().catch(() => ({}));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(invokeData, null, 2),
          },
        ],
      };
    }

    default:
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
      };
  }
}

// Read JSON-RPC from stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch (err) {
    logDebug(`Invalid JSON: ${trimmed}`);
    return;
  }

  const { id, method, params } = request;

  // Notification (no id)
  if (id === undefined || id === null) {
    if (method === "notifications/initialized") {
      logDebug("Client initialized notification received.");
    }
    return;
  }

  // Requests
  let response = { jsonrpc: "2.0", id };

  try {
    switch (method) {
      case "initialize":
        response.result = {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "aid-mcp-server",
            version: "0.1.0",
          },
        };
        break;

      case "ping":
        response.result = {};
        break;

      case "tools/list":
        response.result = { tools: TOOLS };
        break;

      case "tools/call":
        if (!params || !params.name) {
          response.error = { code: -32602, message: "Missing tool name" };
        } else {
          const toolResult = await handleToolCall(params.name, params.arguments || {});
          response.result = toolResult;
        }
        break;

      default:
        response.error = { code: -32601, message: `Method not found: ${method}` };
        break;
    }
  } catch (error) {
    logDebug(`Error handling method ${method}: ${error.message}`);
    response.error = { code: -32603, message: error.message || "Internal error" };
  }

  process.stdout.write(JSON.stringify(response) + "\n");
});
