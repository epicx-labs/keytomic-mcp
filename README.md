# Keytomic MCP

Keytomic MCP connects your AI assistant to your Keytomic workspace. Use it in
Claude, ChatGPT, Cursor, Claude Code, Codex, Gemini CLI, Windsurf, and other
remote MCP clients. Ask questions about your Google Search Console data, run
SEO audits of your site, read the fixes, read your content calendar, and do
keyword research, all in the chat.

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

- A Keytomic workspace on a paid plan or in a trial. If the workspace has no
  active plan, or if it is still in Onboarding, the tools return an error with
  a link to Keytomic.
- A role in the workspace that gives the permission for the action. Each tool
  needs a workspace permission for its action. If your role does not give the
  permission, the tool returns the `permission_denied` error.
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
- **Content calendar**: read the topics planned for a site and their scheduled
  days, read the number of keyword searches left for the site, and follow a
  content calendar run.
- **Keyword research**: get related keywords for a seed keyword, with search
  volume, difficulty, competition, CPC, and the monthly trend.

## MCP tools

| Area | Tools |
| --- | --- |
| Sites and workspace | `list_sites`, `get_project`, `get_project_settings`, `get_usage` |
| Workspace edits | `update_brand_profile`, `update_article_settings`, `update_indexing_settings`, `create_author_profile`, `update_author_profile`, `delete_author_profile`, `set_default_author_profile` |
| SEO Audits | `start_audit`, `watch_audit`, `get_audit`, `list_audits`, `get_audit_category`, `list_audit_findings`, `list_audit_check_rows`, `list_audit_evidence`, `list_audit_pages`, `list_audit_links` |
| Search Console insights | `get_search_performance`, `list_top_rankings`, `list_new_rankings`, `list_improving`, `list_declining`, `list_low_hanging_fruits`, `list_underperforming`, `list_cannibalization`, `list_zombie_pages`, `list_question_queries` |
| Search Console data | `search_analytics_query`, `inspect_url`, `inspect_urls`, `get_property`, `list_sitemaps`, `get_sitemap`, `list_sitemap_urls` |
| Search Console writes | `submit_sitemap`, `sync_sitemaps` |
| Content calendar | `list_calendar_topics`, `get_calendar_topic`, `get_keyword_search_usage`, `get_content_calendar_progress` |
| Keyword research | `search_keywords` |

Most tools spend no credits. Each `search_keywords` call uses 1 of the
monthly keyword searches of the site. All members of the site share these
searches. The result of each call tells you how many searches are left.

Some workspaces can open only some calendar topics for now. For these
workspaces, the content calendar tools return only the topics that they can
open.

## Limits and errors

- Each user can make 60 tool calls each minute in one workspace. When you go
  above the limit, the tool returns the `rate_limited` error with
  `retryAfterSeconds`.
- A tool error is a JSON object with an `error` code and a `message`. Errors
  that you can correct in Keytomic also give a link.

The table gives the errors about access, limits, and connections. Tools also
return errors for an input that is not correct.

| Error code | Cause |
| --- | --- |
| `subscription_required` | The workspace has no active plan. |
| `onboarding_required` | The workspace did not complete Onboarding. |
| `permission_denied` | Your role in the workspace does not give the permission for the action. |
| `usage_limit_reached` | The site or workspace used all of a Usage Limit, for example its keyword searches. |
| `insufficient_credits` | The site does not have sufficient Article Credits or image credits for the action. |
| `project_spend_locked` | A Spend Lock stops paid actions on the site until the billing cycle ends. |
| `rate_limited` | You made more than 60 tool calls in one minute. |
| `workspace_access_revoked` | You are not a member of the workspace now. Connect Keytomic again. |
| `gsc_not_connected`, `gsc_reconnect_required` | The site has no working Search Console connection. |
| `gsc_permission_denied` | The connected Google account does not have access to the property. |
| `gsc_owner_permission_required` | A sitemap write needs an Owner or Full user of the property. |

## Security model

- You sign in with your Keytomic account through OAuth, and you select one
  workspace. The server reads and writes only the data of that workspace.
- The connection is a Connected App with these MCP Scopes: `workspace:read`,
  `workspace:write`, `audit:read`, `audit:run`, `gsc:read`, `gsc:write`,
  `content:read`, and `content:write`.
- The `content:write` scope lets the AI assistant do actions that can use
  credits, for example keyword searches. Keytomic reports the credits that each
  action used.
- If you connected Keytomic before the content scopes were available, the
  content calendar tools return an error that Keytomic needs approval. Remove
  the Connected App on the **Connected apps** page in Keytomic. Then connect
  Keytomic again and approve all the scopes.
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
