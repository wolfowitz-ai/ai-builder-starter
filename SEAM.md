# The seam map

**DEMO ONLY: this template, and its recording-notice, opt-out and emergency wording, are placeholders for a fictional business. A real business needs its own professional and legal review before anything like this takes a customer call.**

## What is a seam?

Some jobs in this project are done by code (same result every time). Some are done by the AI agent (it decides, so results vary). A seam is the place where the two meet. Knowing which is which tells you what you can trust, what to test, and what to double-check. Open seam.html in the running site to see this page drawn in colour.

## Legend

- **CODE** (blue): code does it, the same way every time.
  - CODE-INJECT: code copies exact facts from business.json into the assistant.
  - CODE-VERBATIM: code (or a fixed tool message) speaks exact words. The AI never rephrases them.
  - CODE-FORMAT: code builds a text in a fixed format.
  - CODE-QUEUE: code checks and releases blog posts by rule.
- **AGENT** (orange): the AI decides or writes it.
  - AGENT-QUALIFY: which questions to ask the caller.
  - AGENT-TRIAGE: judging how urgent a problem is.
  - AGENT-REPLY: tone and open-ended answers.
- **SEAM** (purple): code and agent meet. The agent decides, and code carries it out or supplies the words.
- **SEAM-soft** (light purple, hatched): we ask the agent to be exact, but cannot force it.

Where labels live: HTML files use `<!-- -->` comments, CSS uses `/* */`, JavaScript uses `//` or `/* */`, and markdown files use headings like `## [LABEL] title`. JSON files cannot hold comments, so voice/tools.json and content/queue.json use a `"_seam"` note that no code reads, and business.json (which must stay clean) is described in the table below instead.

## Seam map

| Item | Label | Where | Why |
|---|---|---|---|
| Business name, tagline, industry, service area, timezone | CODE-INJECT | business.json to app.js to Vapi variables | Exact facts must never come from the AI's memory. |
| Opening hours | CODE-INJECT | business.json, formatted by app.js into hours_text | Hours are looked up, never remembered. |
| Services and visit lengths | CODE-INJECT | business.json, formatted by app.js into services_text | Same reason: exact values. |
| Prices | CODE-INJECT | business.json, formatted by app.js into prices_text | A wrong price is a promise. Kept out of the knowledge base. |
| Minimum booking notice | CODE-INJECT | business.json booking.min_notice_hours | Exact rule, also enforced by vapi-tools.js. |
| Today's date and time | CODE-INJECT | app.js today_text | The assistant needs the real date to check availability. |
| Extra notes drawer | SEAM | business.json extra, passed as one {{extra}} string | Code carries it untouched, the agent reads it. No code looks inside. |
| Greeting and recording notice | CODE-VERBATIM | business.json voice, spoken as Vapi firstMessage built by app.js | Legal-sounding words are never improvised. Placeholder in this demo. |
| Opt-out wording | CODE-VERBATIM | business.json voice.opt_out, copy in voice/tools.json (opt_out tool) | Fixed words spoken by a tool message. Placeholder in this demo. |
| Emergency wording | CODE-VERBATIM | business.json voice.emergency_script, copy in voice/tools.json (escalate tool) | Safety words are fixed. Placeholder in this demo. |
| Tool-error line | CODE-VERBATIM | business.json voice.tool_error_line, copy in voice/tools.json | A fixed fallback when a tool fails. |
| "One moment" line | CODE-VERBATIM | business.json voice.working_line, copy in voice/tools.json (every tool) | Without it Vapi lets the AI improvise a filler phrase while a tool runs. |
| Deciding it is an emergency | SEAM | voice/persona.md triage section, then escalate tool | The agent judges, the code says the words. |
| Copies of voice text in tools.json | CODE-VERBATIM | voice/tools.json, checked by seam.html | Vapi tool messages are fixed text, so they are copies. seam.html turns red if they drift. |
| Questions to ask the caller | AGENT-QUALIFY | voice/persona.md | Judgement about the conversation. |
| How urgent is the problem | AGENT-TRIAGE | voice/persona.md | Judgement, with a rubric to guide it. |
| Tone and open-ended answers | AGENT-REPLY | voice/persona.md, voice/knowledge.md | The AI writes the words. It says "I don't know" instead of inventing. |
| Availability and booking rules | CODE | functions/api/vapi-tools.js | Hours, notice and slot rules are checked the same way every time. |
| Deciding when to check or book | SEAM | voice/persona.md booking steps, tools in voice/tools.json | The agent chooses the moment, the function checks the facts. |
| Reading the booking confirmation aloud | SEAM-soft | voice/persona.md | We ask for word-for-word, but cannot force it. |
| Contact form email subject and fields | CODE-FORMAT | app.js | Built by code in a fixed format. |
| Blog post id, date, status and checks | CODE-QUEUE | content/queue.json, app.js | The page validates and releases posts by date. |
| Blog post title and body | AGENT | publisher/publisher.md | The AI drafts the writing. |
| DEMO ONLY banner | CODE | business.json demo_only, app.js | Shows automatically while demo_only is true. |
