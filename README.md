# Keytomic MCP

Keytomic MCP brings Keytomic, the end-to-end AI SEO agent, to your AI
assistant and connects it to your Keytomic workspace. Use it in Claude,
ChatGPT, Cursor, Claude Code, Codex, Gemini CLI, Windsurf, and other remote MCP
clients. Ask questions about your Google Search Console data, run SEO audits of
your site, read the fixes, read your Google Analytics traffic, and do keyword
research. Plan your content calendar, write and edit articles, generate their
hero images, and publish them to your CMS. Get your pages indexed on Google
and Bing, read your backlinks, find Reddit threads to answer, and track how AI
search mentions your brand. You do all of this in the chat.

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

## Keytomic: the end-to-end AI SEO agent

Keytomic is the AI SEO agent that runs the whole SEO cycle for your site, for
Google and AI search:

1. **Research**: finds the keywords and topics that your customers search for
   on Google and in AI search.
2. **Write**: plans your content calendar and writes on-brand articles with
   images.
3. **Publish**: publishes to your site and gets your pages indexed.
4. **Monitor**: tracks your rankings, your Search Console data, and how often
   AI search mentions your brand.
5. **Improve**: refreshes content that loses traffic, finds technical issues,
   and finds backlink opportunities.

One platform does the work of a keyword tool, an AI writer, a publishing
workflow, and a rank tracker: AI SEO automation from the first keyword to the
next ranking gain. Plans start at $99/month, or $79/month when you pay yearly,
with a free trial. [See pricing](https://keytomic.com/pricing).

Keytomic MCP brings this agent into your AI assistant. The sections below show
how to connect it and what it can do in the chat.

## Install

### Claude

Keytomic is a connector in the
[Claude directory](https://claude.ai/directory/keytomic).

1. Open [Keytomic in the Claude directory](https://claude.ai/directory/keytomic).
2. Click **Connect to Claude**, sign in to Keytomic, and approve.

You can also add Keytomic as a custom connector:

1. Open **Customize > Connectors**.
2. Click **+ Add**, then **Add custom connector**.
3. Name it `Keytomic` and paste the server URL `https://app.keytomic.com/mcp`.
   Click **Continue**.
4. Examine the authentication settings that Claude found. Click **Continue**,
   then click **Add**.
5. Click **Connect**, sign in to Keytomic, and approve.

The [AI SEO with Keytomic](https://github.com/epicx-labs/keytomic-claude-plugin)
plugin for Claude adds the same server and ten skills. The skills are SEO
audits, Search Console review, Google Analytics, workspace setup, the content
calendar with keyword research, articles, and hero images, and publishing.
The other skills are indexing, backlinks, Reddit Opportunities, and AI
Visibility.

### ChatGPT

Full MCP support in ChatGPT is available only on the ChatGPT Business,
Enterprise, and Edu plans. Use ChatGPT on the web. On a Business plan, an admin
or owner adds the server. Developer mode is not necessary.

1. Go to **Plugins**.
2. Click **+**, then click **Add custom MCP server**.
3. Type the name `Keytomic`.
4. In **Connection**, paste `https://app.keytomic.com/mcp`.
5. Select OAuth for the authentication.
6. Select **I understand and want to continue**.
7. Click **Create as a plugin**.
8. Sign in to Keytomic and approve.
9. Install the plugin. In a new chat, type `@` and select Keytomic.

### Claude Code

Run this command in your terminal:

```bash
claude mcp add --transport http --scope user keytomic https://app.keytomic.com/mcp
```

The `--scope user` option makes Keytomic available in all your projects on
this computer.

Start Claude Code and sign in to Keytomic when it prompts you. You can also run
`/mcp`, select **keytomic**, and complete the sign-in.

To install the AI SEO with Keytomic plugin with its ten skills, run this
command:

```bash
claude plugin install keytomic --marketplace epicx-labs/keytomic-claude-plugin
```

### Cursor

[![Add Keytomic MCP to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=keytomic&config=eyJ1cmwiOiJodHRwczovL2FwcC5rZXl0b21pYy5jb20vbWNwIn0=)

Click **Add Keytomic MCP to Cursor**, then sign in to Keytomic when Cursor asks.
You can also add the server yourself:

1. Open `~/.cursor/mcp.json` for all your projects, or `.cursor/mcp.json` for
   one project.
2. Add this to the file:

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

The [AI SEO with Keytomic for Cursor](https://github.com/epicx-labs/keytomic-cursor-plugin)
plugin adds the same server and the ten skills to Cursor.

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
  Console tools, and a Google Analytics 4 property, for the analytics tools.
  The indexing tools use the Google Search Console and Bing Webmaster Tools
  connections of the site. The other tools do not need them.
- A publishing destination connected to the site in Keytomic, such as
  WordPress, Webflow, Shopify, Framer, Contentful, Notion, GoHighLevel, a
  webhook, or an API destination, for the publishing tools.

## What this server does

- **SEO Audits**: start an audit of a site, follow it to the end, and read the
  findings by category, with the affected pages and the recommended fix.
- **Search Console insights**: find the top, new, improving, and declining
  queries and pages, low-hanging fruits, underperforming pages, keyword
  cannibalization, zombie pages, and question queries.
- **Search Console data**: run Search Analytics queries, and read the sitemaps
  of the property and the URLs in a sitemap.
- **Indexing**: read the indexing status of the posts that Keytomic published,
  on Google and Bing, inspect up to 50 URLs live, and submit URLs or sitemaps
  to Google and Bing.
- **Google Analytics**: read the GA4 users, sessions, new users, bounce rate,
  traffic sources, top pages, and countries of a site, also for organic or AI
  assistant traffic only, and its events and key events.
- **Workspace setup**: read a site's brand profile, settings, author profiles,
  Usage Limits, and integrations. Edit the brand profile, the site settings
  (article and indexing settings), and the author profiles.
- **Content calendar**: read the topics planned for a site and their scheduled
  days, and read the number of keyword searches left for the site. Edit a
  topic, add topics from keywords or from a title, and start a content
  calendar run and follow it.
- **Articles**: write the article of a calendar topic, read it with its SEO
  fields and its Markdown text, edit it, and generate a new hero image for it.
  In clients that support MCP Apps, such as Claude and ChatGPT, the article
  and the hero image show in the chat. When your connection can edit content,
  you can edit the title and the text of the article in the chat and save
  them, or select text and ask the assistant to change it.
- **Publishing**: list the publishing destinations of a site, publish an
  article to one of them as a draft or live, and check where each article was
  published.
- **Keyword research**: get related keywords for a seed keyword, with search
  volume, difficulty, competition, CPC, and the monthly trend.
- **Backlinks**: read the saved backlinks of a site and the backlink gaps
  against your competitors, with an outreach draft for each gap. Set the
  competitor domains.
- **Reddit Opportunities**: read the Reddit threads that the daily scans found,
  start a scan, write a reply draft, and change the status of a thread.
  Nothing posts to Reddit: you copy the reply and post it.
- **AI Visibility**: set up and read how AI platforms mention your brand, edit
  the prompts and the settings, start a check, and read the report.

## MCP tools

| Area | Tools |
| --- | --- |
| Sites and workspace | `list_sites`, `get_project` |
| Workspace edits | `update_brand_profile`, `update_project_settings`, `save_author_profile`, `delete_author_profile` |
| SEO Audits | `start_audit`, `watch_audit`, `get_audit`, `list_audits`, `list_audit_findings`, `list_audit_rows`, `list_audit_pages`, `list_audit_links` |
| Search Console insights | `get_search_performance`, `get_search_insight` |
| Search Console data | `search_analytics_query`, `list_sitemaps`, `list_sitemap_urls` |
| Indexing | `get_indexing_status`, `inspect_urls`, `submit_for_indexing` |
| Content calendar | `list_calendar_topics`, `get_content_calendar_progress` |
| Content calendar edits | `update_calendar_topic`, `add_keywords_to_calendar`, `create_calendar_topic`, `start_content_calendar` |
| Articles | `get_draft`, `generate_article`, `update_draft`, `generate_hero_image` |
| Publishing | `publish_draft`, `get_publication_status` |
| Google Analytics | `get_analytics_performance`, `list_analytics_events` |
| Keyword research | `search_keywords` |
| Backlinks | `get_backlinks`, `set_backlink_competitors` |
| Reddit Opportunities | `get_reddit_settings`, `list_reddit_threads`, `update_reddit_settings`, `set_reddit_opportunity_status`, `scan_reddit`, `generate_reddit_reply` |
| AI Visibility | `get_visibility`, `get_visibility_report`, `add_visibility_prompts`, `update_visibility_prompt`, `update_visibility_settings`, `start_visibility_setup`, `start_visibility_check` |

`get_project` returns a site in sections: `profile`, `settings`, `usage`,
`integrations`, `destinations`, `property`, and `keywordSearches`.
`get_search_insight` answers one question for each `kind`: `top_rankings`,
`new_rankings`, `improving`, `declining`, `low_hanging_fruits`,
`underperforming`, `cannibalization`, `zombie_pages`, or `question_queries`.

Most tools spend no credits. These tools can use the credits of the site:

| Tool | What it uses |
| --- | --- |
| `search_keywords` | 1 of the monthly keyword searches of the site |
| `create_calendar_topic` | 1 of the monthly keyword searches of the site |
| `start_content_calendar` | 1 of the calendar runs of the billing cycle. If the run plans a topic for today, it also starts that article, which uses 1 article. |
| `generate_article` | 1 article of the month, or 1 Article Credit when the month limit is reached |
| `generate_hero_image` | 1 Blog Hero Credit. Keytomic also calls these credits image credits. |
| `start_visibility_check` | 1 AI Visibility observation of the month for each Active prompt on each AI platform |

All members of the site share these credits. The `keywordSearches` section of
`get_project` gives the keyword searches that are left, and the `usage`
section gives each Usage Limit. `start_content_calendar`, `generate_article`,
`generate_hero_image`, and `start_visibility_check` first return a plan and
start nothing. The plan gives the counts before the call.
The tools start the work only when you call them again with `confirm` set to
`true`. If a `generate_hero_image` call with `confirm` times out, read the
article with `get_draft` before you call again. The image can still finish,
and a second call uses a second Blog Hero Credit.

`publish_draft` uses no credit. The first send of an article to a destination
in a mode uses 1 of the daily publishes of the site. A repeat after a
succeeded publish uses none. Ask before each call: a publish writes to your
CMS, and mode `publish` makes the article live. Most calls first return a plan
that you confirm with `confirm` set to `true`. If a publish times out, read `get_publication_status` before you call
again.

Keytomic pays for `start_visibility_setup` and `scan_reddit`. A site can start
one Reddit scan each UTC day, and the daily scan runs on its schedule.
`generate_reddit_reply` makes one AI call.

`add_keywords_to_calendar` uses no keyword search. The daily automation writes
the article of each new topic on its scheduled day, and that article counts
then. For `add_keywords_to_calendar` and `create_calendar_topic`, the site must
have articles left this month, or Article Credits, for the new topics.

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
| `insufficient_credits` | The site does not have sufficient Article Credits or image credits (Blog Hero Credits) for the action. |
| `project_spend_locked` | A Spend Lock stops paid actions on the site until the billing cycle ends. |
| `rate_limited` | You made more than 60 tool calls in one minute. |
| `workspace_access_revoked` | You are not a member of the workspace now. Connect Keytomic again. |
| `gsc_not_connected`, `gsc_reconnect_required` | The site has no working Search Console connection. |
| `gsc_permission_denied` | The connected Google account does not have access to the property. |
| `gsc_owner_permission_required` | A sitemap submit to Google needs an Owner or Full user of the property. |
| `gsc_quota_exceeded` | Google rate limits the Search Console requests. Try again later, after `retryAfterSeconds` when the error has it. In an `inspect_urls` result, each URL after the limit has this error. |
| `topic_not_in_plan` | The workspace cannot open this calendar topic for now. |
| `ga4_not_connected`, `ga4_reconnect_required` | The site has no working Google Analytics connection. The error gives a `connectUrl`. |
| `ga4_permission_denied` | The connected Google account does not have access to the GA4 property. The error gives a `connectUrl`. |
| `ga4_quota_exceeded` | Google rate limits the Analytics requests. Try again after `retryAfterSeconds`. |
| `feature_disabled` | AI Visibility is not available. The AI Visibility tools return this error. |

The content calendar and article tools also return these errors:

| Error code | Cause |
| --- | --- |
| `image_studio_setup_required` | Save the Image Studio settings of the site in Keytomic first. |
| `automation_days_required` | Set the automation days of the site in its automatic blog settings in Keytomic first. |
| `calendar_run_required` | Run the content calendar of the site once before you add topics. |
| `brand_profile_incomplete` | Complete the brand profile of the site first. `update_brand_profile` can fill fields. |
| `brand_profile_review_required` | The workspace owner must confirm the brand profile review in Keytomic. |
| `active_run_exists` | The site has a content calendar run in progress. |
| `active_seo_workflow_exists` | An SEO automation run is in progress for the site. Try again after it ends. |
| `no_calendar_days_left` | The billing cycle has no automation days left for a new run. |
| `topic_has_article` | The topic has an article, or Keytomic writes its article now. You cannot edit the topic or start a new article for it. |
| `topic_generation_in_progress` | Keytomic writes the article of this topic now. |
| `draft_not_found` | The topic has no article yet. |
| `article_slug_taken` | Another article of the site uses this slug. |

The publishing tools also return these errors:

| Error code | Cause |
| --- | --- |
| `publishing_destination_unavailable` | The destination was removed, needs a reconnect, or belongs to another site. |
| `destination_setup_required` | The destination needs a setting in Keytomic before it can take a publish. |
| `draft_mode_not_supported` | The destination cannot keep a draft. Publish with mode `publish`. |
| `publication_in_progress` | A publish of this article to this destination has not ended. Check it with `get_publication_status`. |
| `publish_failed` | The destination did not confirm the publish, so the article may or may not be there. |
| `article_slug_taken` | Another article of the site uses this slug. Change the slug with `update_draft`. |

## Security model

- You sign in with your Keytomic account through OAuth, and you select one
  workspace. The server reads and writes only the data of that workspace.
- The connection is a Connected App. Keytomic asks for these MCP Scopes:
  `workspace:read`, `workspace:write`, `audit:read`, `audit:run`, `gsc:read`,
  `content:read`, `content:write`, `content:publish`, `analytics:read`,
  `indexing:write`, `visibility:read`, and `visibility:write`. On the consent
  page, you can clear a scope that you do not want to give.
- The `content:write` scope lets the AI assistant do actions that can use
  credits: keyword searches, new topics, content calendar runs, articles, and
  hero images.
  Keytomic reports the credits that each action used.
- The `content:publish` scope lets the AI assistant publish articles to your
  connected CMS. The `analytics:read` scope lets it read your Google Analytics
  and Bing Webmaster data.
- The `indexing:write` scope lets the AI assistant submit URLs and sitemaps to
  Google and Bing. The indexing read tools read Google data with `gsc:read`
  and Bing data with `analytics:read`.
- The `visibility:read` and `visibility:write` scopes cover AI Visibility,
  backlinks, and Reddit Opportunities. AI Visibility checks use observations.
- The edit tools of the workspace, content, and visibility areas also need the
  read scope of their area, and `publish_draft` also needs `content:read`.
  Each section of `get_project` needs the scope of its data.
- If the Connected App does not have a scope, the server refuses the tools that
  need it with an HTTP 403 `insufficient_scope` response. This occurs when
  you cleared the scope on the consent page, or when you connected Keytomic
  before the content scopes were available. Your client shows an authorization or
  insufficient scope error, sometimes with the text "Keytomic needs approval".
  This error is not the `permission_denied` tool error, and a role change does
  not correct it. The other tools continue to operate. To correct it:
  1. Sign in to Keytomic again in your client and approve all the scopes. In
     Claude Code, run `/mcp`, select **keytomic**, and sign in again.
  2. If the error continues, open the **Keytomic MCP** page in Keytomic and
     click **Disconnect** on the row of the app under **Connected apps**. Then
     connect Keytomic again and approve all the scopes.
- You can disconnect the Connected App at any time on the **Keytomic MCP**
  page in Keytomic, under **Connected apps**.

Report vulnerabilities with the process in [SECURITY.md](SECURITY.md).

## Links

- [Keytomic MCP](https://keytomic.com/mcp)
- [Keytomic in the Claude directory](https://claude.ai/directory/keytomic)
- [AI SEO with Keytomic, the plugin for Claude](https://github.com/epicx-labs/keytomic-claude-plugin)
- [AI SEO with Keytomic for Cursor](https://github.com/epicx-labs/keytomic-cursor-plugin)
- [Keytomic](https://keytomic.com)
- [Privacy policy](https://keytomic.com/privacy-policy)
- Support: [hi@keytomic.com](mailto:hi@keytomic.com)
- [Security policy](SECURITY.md)
- [License](LICENSE)
