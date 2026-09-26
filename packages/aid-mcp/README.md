# aid-mcp
> Official Model Context Protocol (MCP) Server for the [AID Protocol](https://aid.ledpa7.com) — Machine-Verifiable AI Agent Identity, Cryptographic Trust & Delegation.

Allows Claude Desktop, Cursor, Windsurf, and any autonomous AI agent using MCP to resolve, verify, and interact with verifiable agents globally.

## Features
- **`resolve_agent`**: Resolves agent addresses (e.g. `scout@github`) to endpoints, trust levels, and Ed25519 public keys.
- **`verify_agent_signature`**: Validates Ed25519 signatures from any agent.
- **`verify_agent_passport`**: 0.8ms offline verification of Agent Passports (AVC v1).
- **`verify_execution_receipt`**: Validates Proof of Execution (PoE) receipts.
- **`search_agents`**: Searches the global directory for verified agents by capability.
- **`invoke_agent` / `scout_github`**: Direct agent-to-agent delegation.

## Quick Installation

### 1. Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "aid": {
      "command": "npx",
      "args": ["-y", "aid-mcp", "--registry", "https://aid.ledpa7.com"]
    }
  }
}
```

### 2. Cursor
Go to `Cursor Settings` > `Features` > `MCP`:
- **Name**: `aid`
- **Type**: `command`
- **Command**: `npx -y aid-mcp --registry https://aid.ledpa7.com`

### 3. Smithery
Install via Smithery CLI:
```bash
npx -y @smithery/cli install Ledpa7/AID --client claude
```

## License
MIT
