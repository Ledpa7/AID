<div align="center">

# 🛡️ AID — AI Agent Identity & Trust Infrastructure

**Give every AI agent a verifiable identity, an address, and cryptographic trust.**

[![AID Badge](https://img.shields.io/badge/aid-verified_infrastructure-10b981?style=for-the-badge&logo=shield)](https://github.com)
[![Next.js 14](https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Crypto: Ed25519](https://img.shields.io/badge/Crypto-Ed25519_Native-6366f1?style=for-the-badge)](https://github.com)
[![Protocol: MCP | A2A](https://img.shields.io/badge/Protocol-MCP_%7C_A2A_%7C_REST-purple?style=for-the-badge)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br />

[Features](#-features) • [Terminal Quickstart](#-terminal-quickstart) • [Viral README Badge](#-add-aid-badge-to-your-repo) • [MCP Integration](#-mcp-integration) • [API Docs](#-api-reference)

</div>

---

## 💡 The Problem & The Solution

In the multi-agent economy, agents need to discover and talk to each other. But today:
- **No Identity**: Agents only have transient URLs or random IDs like `agent_82fa7139`.
- **Impersonation**: Anyone can spin up an agent and claim to be `support@samsung.com`.
- **Protocol Fragmentation**: Some use MCP, some A2A, some REST.

**AID solves this by serving as the DNS + Registry + Cryptographic Trust Layer for AI Agents:**

```text
               "Can I verify this agent is who it claims to be?"
                                      │
  Agent A ────────────── GET /v1/resolve/research@jidoo ─────────────► AID
    (Caller)                                                            │
       ◄────────────── Endpoint + Ed25519 Key + Evidence ──────────────┘
       │
  [ Cryptographic Handshake & Direct Communication via MCP / A2A ]
```

---

## ⚡ Terminal Quickstart

Inspect any agent directly in your command line with zero installation:

```bash
# Instant Agent Passport Lookup in your terminal
curl -sL https://aid.dev/research@jidoo
```

```text
┌────────────────────────────────────────────────────────────────────────┐
│  AID AGENT PASSPORT — Verifiable AI Identity                           │
├────────────────────────────────────────────────────────────────────────┤
  Address:       research@jidoo
  Permanent AID: aid_01K72M8KQ4A7F901
  Status:        ACTIVE (PUBLIC)

  [ TRUST EVIDENCE ]
  • Domain (jidoo.net):       ✓ Verified
  • Cryptographic Key:        ✓ Verified (Ed25519)
  • Agent Card Metadata:      ✓ Valid

  [ ENDPOINTS ]
    • [A2A] https://agent.jidoo.net/a2a (primary)
    • [MCP] https://agent.jidoo.net/mcp
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🏷️ Add AID Badge to Your Agent's GitHub Repo

If you build an AI agent, add a dynamic, real-time verified badge to your repo's `README.md`:

```markdown
[![AID Verified](https://aid.dev/api/v1/badge/research@jidoo)](https://aid.dev/research@jidoo)
```

Renders live based on domain and key verification:
> `[ aid : research@jidoo | verified ]`

---

## 🔌 MCP (Model Context Protocol) Integration

Plug AID directly into **Claude Desktop**, **Cursor**, or any MCP-compatible client to let your LLM resolve and connect to agents across the web.

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aid": {
      "command": "npx",
      "args": ["-y", "@aid/mcp-server", "--registry", "https://aid.dev"]
    }
  }
}
```

Now your AI assistant can invoke:
```text
use_tool("resolve_agent", { "address": "research@jidoo" })
```

---

## 🔐 Cryptographic Verification (Ed25519)

AID never stores private keys. Private keys stay inside your agent runtime.

### 1. Challenge Request
```bash
curl -X POST https://aid.dev/api/v1/verify/challenge \
  -H "Content-Type: application/json" \
  -d '{"subject": "research@jidoo"}'
```

### 2. Verify Signature
When receiving a request from an agent, verify its identity in 1 line:
```bash
curl -X POST https://aid.dev/api/v1/verify/signature \
  -H "Content-Type: application/json" \
  -d '{
    "address": "research@jidoo",
    "message": "AID-AUTH:research@jidoo:nonce_abc123",
    "signature": "3a8f94d..."
  }'
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/:address` | `GET` | Terminal card (curl) or Web redirect (browser) |
| `/api/v1/resolve/:address` | `GET` | Resolve address to AID, endpoint, and trust evidence |
| `/api/v1/badge/:address` | `GET` | Dynamic SVG status badge for GitHub READMEs |
| `/api/v1/agents` | `POST` | Register a new agent and issue permanent AID (ULID) |
| `/api/v1/agents/inspect` | `POST` | SSRF-protected Agent Card (`/.well-known/agent-card.json`) inspector |
| `/api/v1/verify/challenge` | `POST` | Issue cryptographic challenge nonce |
| `/api/v1/verify/signature` | `POST` | Verify Ed25519 signature against registered agent key |

---

## 🚀 Self-Hosting

### 1. Clone & Install
```bash
git clone https://github.com/your-org/aid.git
cd aid
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

### 3. Setup Database (Supabase)
Run the SQL schema in `supabase/schema.sql` on your Supabase project.

### 4. Run Locally
```bash
npm run dev
```
Open `http://localhost:3000` to access the AID Web Console.

---

## 📄 License
MIT © 2026 AID Team.
