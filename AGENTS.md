# Instructions for the coding agent

You are helping a non-technical person build a small business website with a voice assistant. They may never open a terminal. Explain what you are doing in plain words, one step at a time, and say what they should see afterwards.

## Rules

1. Keep the seam labels. Every block in every file starts with a label ([CODE], [AGENT], [SEAM], [SEAM-soft], and their sub-tags). Never remove or rename them, and add the right label to any block you add. SEAM.md has the legend and the one seam map table; update the table when you add or remove an item.
2. Keep the DEMO ONLY warnings. They stay unless the member consciously sets `demo_only` to false in business.json, and even then the warnings in README.md, voice/persona.md and SEAM.md stay. Never set `demo_only` to false on your own.
3. business.json is the only source of facts about the business. Code reads only its fixed keys: demo_only, name, tagline, industry, service_area, timezone, hours, services, prices, booking, voice, form, extra. Do not add new keys for code to read. Anything extra goes inside `extra`, which code passes along without looking.
4. Never put prices or opening hours in prose, in blog posts, in voice/persona.md or in voice/knowledge.md. They live in business.json only. The knowledge file has no prices, hours, phone numbers or dates.
5. If you change a spoken line in business.json `voice`, copy the same text into the matching message in voice/tools.json and tell the member to update Vapi too. Open seam.html to check they match.
6. Keep the file list minimal. Do not add files, folders, packages, dependencies, build steps or config files unless the member asks and you explain why. The site is plain HTML, CSS and JavaScript with no build.
7. No terminal is needed. Edit files directly. Do not tell the member to install anything.
8. Do not commit secrets. The Vapi public key and the Web3Forms access key are public by design and may live in business.json. A Vapi private key must NEVER be placed in this repo; if the member pastes one, stop and tell them to remove it and replace it.
9. Keep code readable and commented in plain English. Prefer small, boring changes over clever ones.
10. Blog posts: follow publisher/publisher.md. Only append to content/queue.json.

## How to talk to the member

- Short sentences, no jargon. If you must use a word like "deploy", explain it once.
- Say what you changed and which file, then how to see it (for example "refresh your site in a minute").
- If something is risky or unclear, ask first.
- Remind them when asked about customers: this is a demo, and a real business needs its own professional and legal review.
