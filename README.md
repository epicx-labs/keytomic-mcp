# Keytomic MCP

Keytomic MCP connects your AI assistant to your Keytomic workspace. Use it in
Claude, ChatGPT, Cursor, Claude Code, Codex, Gemini CLI, Windsurf, and other
remote MCP clients. Ask questions about your Google Search Console data, run
SEO audits of your site, and read the fixes, all in the chat.

The Keytomic MCP server URL is:

```text
https://app.keytomic.com/mcp
```

The server is a remote MCP server over Streamable HTTP. You sign in with your
Keytomic account. You do not need an API key, and you do not install software.
Keytomic is also a connector in the
[Claude directory](https://claude.ai/directory/keytomic).

This repository has no code. It gives the installation steps for each client.
For more information, go to [keytomic.com/mcp](https://keytomic.com/mcp).

## Install

### Claude

Keytomic is a connector in the
[Claude directory](https://claude.ai/directory/keytomic).

1. Open [Keytomic in the Claude directory](https://claude.ai/directory/keytomic).
2. Click **Connect to Claude**, sign in to Keytomic, and approve.

You can also add Keytomic as a custom connector:

1. Open **Settings**, then **Connectors**, then **Add custom connector**.
2. Name it `Keytomic` and paste the server URL `https://app.keytomic.com/mcp`.
3. Click **Connect**, sign in to Keytomic, and approve.

The [Keytomic plugin for Claude](https://github.com/epicx-labs/keytomic-claude-plugin)
adds the same server and four skills for SEO workflows: Website Audit,
Search Console review, workspace setup, and content calendar.

### ChatGPT

1. Open **Settings**, then **Apps & Connectors**. Under **Advanced**, turn on
   **Developer mode**, then click **Create**.
2. Name it `Keytomic` and paste `https://app.keytomic.com/mcp` as the MCP
   server URL.
3. Save, sign in with your Keytomic account, then select Keytomic from the
   **+** menu in a chat.

### Claude Code

Run this command in your terminal:

```bash
claude mcp add --transport http keytomic https://app.keytomic.com/mcp
```

Start Claude Code and sign in to Keytomic when it prompts you. You can also run
`/mcp`, select **keytomic**, and complete the sign-in.

To install the Keytomic plugin with its four skills, run this command:

```bash
claude plugin install keytomic --marketplace epicx-labs/keytomic-claude-plugin
```

### Cursor

1. Open **Cursor Settings**, then **MCP**, then **Add new MCP server**.
2. Add this to your `mcp.json`:

   ```json
   {
     "mcpServers": {
       "keytomic": {
         "url": "https://app.keytomic.com/mcp"
       }
     }
   }
   ```

3. Sign in to Keytomic when Cursor asks.

### Codex

1. Add this to `~/.codex/config.toml`:

   ```toml
   [mcp_servers.keytomic]
   url = "https://app.keytomic.com/mcp"
   ```

2. Restart Codex and sign in to Keytomic when it prompts you.

### Gemini CLI

1. Add this to `~/.gemini/settings.json`:

   ```json
   {
     "mcpServers": {
       "keytomic": {
         "httpUrl": "https://app.keytomic.com/mcp"
       }
     }
   }
   ```

2. Restart Gemini CLI and sign in to Keytomic when it prompts you.

### Windsurf

1. Open the **Cascade** panel, click the **MCPs** icon, then **Configure**.
2. Add this to `mcp_config.json`:

   ```json
   {
     "mcpServers": {
       "keytomic": {
         "serverUrl": "https://app.keytomic.com/mcp"
       }
     }
   }
   ```

3. Refresh and sign in to Keytomic when Windsurf asks.

### Other remote MCP clients

Each client that supports remote MCP servers can use the same URL:
`https://app.keytomic.com/mcp`. Use Streamable HTTP as the transport and OAuth
as the authentication.

## Requirements

- A Keytomic workspace on a paid plan. If the workspace is not on a paid plan,
  or if it is still in Onboarding, the tools return an error with a link
  to Keytomic.
- A Google Search Console property connected to the site, for the Search
  Console tools. The other tools do not need it.

## What this server does

- **SEO Audits**: start an audit of a site, follow it to the end, and read the
  findings by category, with the affected pages and the recommended fix.
- **Search Console insights**: find the top, new, improving, and declining
  queries and pages, low-hanging fruits, keyword cannibalization, zombie pages,
  and question queries.
- **Search Console data**: run Search Analytics queries, inspect URLs, and read,
  submit, and sync sitemaps.
- **Workspace setup**: read a site's brand profile, settings, author profiles,
  and Usage Limits, and edit them.

## MCP tools

| Area | Tools |
| --- | --- |
| Sites and workspace | `list_sites`, `get_project`, `get_project_settings`, `get_usage` |
| Workspace edits | `update_brand_profile`, `update_article_settings`, `update_indexing_settings`, `create_author_profile`, `update_author_profile`, `delete_author_profile`, `set_default_author_profile` |
| SEO Audits | `start_audit`, `watch_audit`, `get_audit`, `list_audits`, `get_audit_category`, `list_audit_findings`, `list_audit_check_rows`, `list_audit_evidence`, `list_audit_pages`, `list_audit_links` |
| Search Console insights | `get_search_performance`, `list_top_rankings`, `list_new_rankings`, `list_improving`, `list_declining`, `list_low_hanging_fruits`, `list_underperforming`, `list_cannibalization`, `list_zombie_pages`, `list_question_queries` |
| Search Console data | `search_analytics_query`, `inspect_url`, `inspect_urls`, `get_property`, `list_sitemaps`, `get_sitemap`, `list_sitemap_urls` |
| Search Console writes | `submit_sitemap`, `sync_sitemaps` |

The content calendar tools arrive with the next Keytomic release.

## Security model

- You sign in with your Keytomic account through OAuth, and you select one
  workspace. The server reads and writes only the data of that workspace.
- The connection is a Connected App with these MCP Scopes: `workspace:read`,
  `workspace:write`, `audit:read`, `audit:run`, `gsc:read`, and `gsc:write`.
- You can remove the Connected App at any time on the **Connected apps** page
  in Keytomic.

Report vulnerabilities with the process in [SECURITY.md](SECURITY.md).

## Links

- [Keytomic MCP](https://keytomic.com/mcp)
- [Keytomic in the Claude directory](https://claude.ai/directory/keytomic)
- [Keytomic plugin for Claude](https://github.com/epicx-labs/keytomic-claude-plugin)
- [Keytomic](https://keytomic.com)
- [Privacy policy](https://keytomic.com/privacy-policy)
- Support: [hi@keytomic.com](mailto:hi@keytomic.com)
- [Security policy](SECURITY.md)
- [License](LICENSE)
