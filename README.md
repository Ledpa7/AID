<div align="center">

# 🛡️ AID — AI Agent Identity & Trust Infrastructure

**The decentralized DNS, Verifiable Passport, and Cryptographic Trust Layer for AI Agents.**

[![Live Production](https://img.shields.io/badge/Live_Demo-aid--beryl.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://aid-beryl.vercel.app)
[![Next.js 14](https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Crypto: Ed25519](https://img.shields.io/badge/Crypto-Ed25519_Native-6366f1?style=for-the-badge)](https://github.com)
[![Protocol: MCP | A2A](https://img.shields.io/badge/Protocol-MCP_%7C_A2A_%7C_REST-purple?style=for-the-badge)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br />

[What is AID?](#-what-is-aid-in-30-seconds) • [3-Minute User Guides](#-3-minute-user-guides) • [Architecture](#-architecture-dns-vs-proxy) • [MCP Setup](#-guide-3-use-with-claude-desktop--cursor-mcp) • [API Reference](#-api-reference)

</div>

---

## 💡 What is AID in 30 Seconds?

In the emerging multi-agent economy, autonomous agents need to discover, authenticate, and communicate with each other. Today, that process is broken:
- **No Identity**: Agents only have transient URLs or random IDs like `agent_82fa7139`.
- **Impersonation**: Anyone can spin up an agent and claim to be `support@samsung.com` or `tax@intuit.com`.
- **Protocol Fragmentation**: Some use Model Context Protocol (MCP), some use A2A, others use raw REST endpoints.

**AID solves this by serving as the DNS and Passport Bureau for AI Agents:**
1. **Readable Addresses**: Replace raw URLs with clean, memorable identities like `weather@community` or `research@jidoo`.
2. **Cryptographic Proof of Ownership**: Verified via native DNS TXT records (`_aid.yourdomain.com`) and Ed25519 public key signatures.
3. **Open Resolution**: Any agent, LLM, or user can resolve an agent's endpoint and trust profile in a single, edge-cached lookup.

---

## 🚀 3-Minute User Guides

Depending on what you want to do, choose one of the three paths below:

```
                  ┌──────────────────────────────────────────────┐
                  │              HOW TO USE AID                  │
                  └───────┬──────────────┬──────────────┬────────┘
                          │              │              │
             ┌────────────▼───┐   ┌──────▼───────┐   ┌──▼──────────────┐
             │ 1. EXPLORER    │   │ 2. BUILDER   │   │ 3. CONSUMER     │
             │ Inspect & verify│  │ Register &   │   │ Plug into       │
             │ any AI Agent   │   │ certify your │   │ Claude / Cursor │
             │ via Web / CLI  │   │ own AI agent │   │ via MCP tools   │
             └────────────────┘   └──────────────┘   └─────────────────┘
```

---

### 📖 Guide 1: Inspect & Verify Any AI Agent (For Everyone)

Want to check if an agent on the internet is authentic, who owns it, and what capabilities it offers?

#### Option A: View the Official Web Passport
Visit any agent's public passport page directly in your browser:
```text
https://aid-beryl.vercel.app/scout@github
```
* Shows verified badges for domain ownership and cryptographic signature capability.
* Displays registered endpoints (`REST`, `MCP`, `A2A`).
* Provides one-click copyable configuration snippets for Claude Desktop and Cursor.

#### Option B: Terminal Lookup (Zero Installation)
Inspect any agent passport instantly using standard `curl`:

```bash
curl -sL https://aid-beryl.vercel.app/scout@github
```

**Terminal Output:**
```text
┌────────────────────────────────────────────────────────────────────────┐
│  AID AGENT PASSPORT — Verifiable AI Identity                           │
├────────────────────────────────────────────────────────────────────────┤
  Address:       scout@github
  Permanent AID: aid_01M30DW5MS43TTBR0BBS3KRSZ4
  Status:        ACTIVE (PUBLIC)

  [ TRUST EVIDENCE ]
  • Domain (github.com):      ✓ Verified
  • Cryptographic Key:        ✓ Verified (Ed25519)
  • Agent Card Metadata:      ✓ Valid

  [ ENDPOINTS ]
    • [REST] https://aid-beryl.vercel.app/api/agents/github (primary)
└────────────────────────────────────────────────────────────────────────┘
```

---

### 🛠️ Guide 2: Register & Certify Your Own Agent (For Developers)

Give your AI agent a verified identity that anyone can trust and query.

#### Step 1: Claim Your Domain Namespace
1. Open the [AID Console](https://aid-beryl.vercel.app).
2. Under **Namespaces**, enter your domain name (e.g., `acme.corp` or `jidoo.net`) and an owner email.
3. Click **Register Namespace**.

#### Step 2: Verify Real-Time Domain Ownership (DNS TXT)
To prevent impersonation, prove you own the domain:
1. Click the **Verify DNS** button next to your namespace.
2. Add a DNS `TXT` record at your domain registrar (Cloudflare, Namecheap, Route53, etc.):
   * **Host / Name**: `_aid` (or `_aid.yourdomain.com`)
   * **Type**: `TXT`
   * **Value**: `aid-verification=<YOUR_TOKEN>`
3. Click **Execute DNS Check**. AID queries Google & Cloudflare DNS in real-time. Once detected, your namespace immediately receives a green `Verified` badge!

#### Step 3: Register Your Agent Address
1. Go to the **Agents** tab in the console.
2. Choose your namespace and alias (e.g., `support@acme.corp`).
3. Fill in your agent's live endpoint (e.g., `https://api.acme.corp/mcp`) and your agent's Ed25519 public key.
4. Submit to mint a permanent, immutable **AID ULID** (e.g., `aid_01K72M8KQ4A7F901`).

#### Step 4: Embed the Live Verified Badge on GitHub
Add this snippet to your agent's GitHub `README.md` to display your live trust status:

```markdown
[![AID Verified](https://aid-beryl.vercel.app/api/v1/badge/support@acme.corp)](https://aid-beryl.vercel.app/support@acme.corp)
```

Renders as:
> `[ aid : support@acme.corp | verified ]`

---

### 🔌 Guide 3: Use with Claude Desktop & Cursor (For AI Assistants)

Connect your favorite LLM assistant directly to the global AID network so it can discover and use external AI agents on demand.

#### 1. Configure MCP (Model Context Protocol)

Add the AID MCP server to your `claude_desktop_config.json` (or Cursor MCP settings):

```json
{
  "mcpServers": {
    "aid": {
      "command": "npx",
      "args": ["-y", "aid-mcp", "--registry", "https://aid-beryl.vercel.app"]
    }
  }
```

#### 2. Ask Your Assistant in Natural Language

Once configured, your AI assistant gains the `resolve_agent` tool. You can simply prompt it:

> *"Check the identity of `scout@github` on AID, verify its status, and ask it to find the top trending Next.js 15 AI agent boilerplates."*

Your assistant will:
1. Call AID's resolution API to get the endpoint and trust status.
2. Confirm that the agent is officially registered with verified cryptographic keys.
3. Directly communicate with the remote agent's tool server.

---

## 🏛️ Architecture: DNS vs Proxy

A common question is: **"Does all agent-to-agent communication route through AID servers?"**

**No.** AID operates strictly as a **DNS Directory and Trust Registry**, not a centralized proxy or data relay:

```text
[ Client Agent / LLM ]
       │
       ├─ (1) Resolve Address (One-time, <1KB JSON) ──► [ AID Edge Registry ]
       │      "Where is weather@community?"                    │
       │      "Here is the verified URL and public key." ◄─────┘
       │
       └─ (2) Direct Execution (P2P / MCP / REST) ────► [ Target Agent Server ]
              "Stream weather data for Seoul..."               │
              "Here is the complete forecast payload." ◄───────┘
```

### Why this design matters:
* **Zero Latency & Privacy**: Heavy LLM tokens, sensitive user data, and streaming responses never pass through AID. They travel directly between client and target.
* **Global Edge Caching**: Resolution results are cached on Vercel's global CDN (`s-maxage=300`), returning addresses in **under 15ms** worldwide with near-zero server load.
* **High Reliability**: Even if the registry undergoes maintenance, clients can cache known agent addresses locally.

---

## 🔐 Cryptographic Authentication (Ed25519)

AID supports end-to-end cryptographic challenge-response authentication. **AID never stores private keys.**

```text
Caller                                               AID Registry / Target Agent
  │                                                               │
  ├─ (1) POST /api/v1/verify/challenge { address } ──────────────►│ (Issues nonce)
  │◄──────────────── Nonce String ("AID-AUTH:...") ───────────────┤
  │                                                               │
  ├─ (2) Sign nonce using Agent's local Private Key               │
  │                                                               │
  ├─ (3) POST /api/v1/verify/signature { address, signature } ───►│ (Verifies with
  │                                                               │  registered public key)
  │◄──────────────── { "verified": true } ────────────────────────┤
```

---

## 📡 REST API Reference

All endpoints return standard JSON and support CORS.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/:address` | `GET` | Smart Route: ASCII passport for `curl`, Web passport for browsers |
| `/api/v1/resolve/:address` | `GET` | Resolve address to AID, endpoint, and trust verification state |
| `/api/v1/badge/:address` | `GET` | Dynamic SVG status badge for GitHub READMEs |
| `/api/v1/namespaces` | `POST` | Register a new domain namespace |
| `/api/v1/namespaces/:slug/verify` | `GET` | Get DNS TXT challenge instructions for domain |
| `/api/v1/namespaces/:slug/verify` | `POST` | Execute live DNS TXT record check via 8.8.8.8 and 1.1.1.1 |
| `/api/v1/agents` | `POST` | Register a new agent and issue a permanent ULID |
| `/api/v1/agents/inspect` | `POST` | SSRF-protected Agent Card (`/.well-known/agent-card.json`) inspector |
| `/api/v1/verify/challenge` | `POST` | Issue cryptographic challenge nonce |
| `/api/v1/verify/signature` | `POST` | Verify Ed25519 signature against registered agent public key |

---

## 💻 Local Development & Self-Hosting

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) PostgreSQL database

### 1. Clone & Install
```bash
git clone https://github.com/Ledpa7/AID.git
cd AID
npm install
```

### 2. Configure Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Initialize Database
Execute the SQL schema in `supabase/schema.sql` inside your Supabase SQL Editor.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the console.

---

## 📄 License

MIT © 2026 AID Team. Distributed under the MIT License.
