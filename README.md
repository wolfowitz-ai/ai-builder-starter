# AI Builder Starter: a small business website with a voice assistant

**DEMO ONLY: this template, and its recording-notice, opt-out and emergency wording, are placeholders for a fictional business. A real business needs its own professional and legal review before anything like this takes a customer call.**

## What is this?

1. A complete small-business website: home page with a contact form, a blog, and a voice assistant you talk to in the browser.
2. It ships working, with a made-up HVAC company called "Sample Comfort Heating & Air". You change it into your business over seven days.
3. You never need a terminal. You edit files in the GitHub website, or in the Claude Code or Codex desktop app, and let your coding agent help.
4. Everything is free to host (GitHub + Cloudflare Pages). The voice assistant is free while your Vapi credits last, then it costs money.
5. Open `seam.html` on your site to see which parts are done by code and which by the AI.

A real deployment needs its own professional and legal review. That is the main lesson of Day 7.

## How to edit a file with no terminal

1. On GitHub, open the file in your repo and click the pencil icon.
2. Change the text, then click "Commit changes".
3. Cloudflare Pages publishes the change again in about a minute.

Or ask your Claude Code or Codex app to make the edit for you.

Dotted names point inside `business.json`. For example `form.web3forms_key` means the `web3forms_key` line inside the `form` box of `business.json`. `voice.enabled` means `enabled` inside the `voice` box.

## The 16 files, in plain English

| File | What it is |
|---|---|
| `business.json` | The one place for every fact: name, hours, services, prices, keys, spoken lines. Start here. |
| `index.html` | Home page with the contact form and the voice button. |
| `blog.html` | The blog page. It is in the top-level file list of your repo, and at `/blog.html` on your site. |
| `seam.html` | Shows the seam map, the assistant's prompt, and whether the spoken lines match. |
| `style.css` | Colours and layout. |
| `app.js` | The code that fills pages from business.json, sends the form, shows the blog and starts the voice call. |
| `content/queue.json` | The list of blog posts, each with a release date. |
| `publisher/publisher.md` | A prompt you give your coding agent so it drafts posts in the right shape. |
| `voice/persona.md` | The voice assistant's instructions. |
| `voice/knowledge.md` | General explanations the assistant may use (no prices or hours in here). |
| `voice/tools.json` | The tools the assistant can use (check times, book, escalate, take a message, opt out). |
| `functions/api/vapi-tools.js` | A small server function that answers those tools. Cloudflare runs it for you. |
| `SEAM.md` | The legend and the seam map table. |
| `AGENTS.md` | Rules for your coding agent. |
| `CLAUDE.md` | One line that points Claude Code to AGENTS.md. |
| `README.md` | This file. |

## Seven days

Every lane below starts from the template as shipped. The "catch up" lane says what to do if you missed the day: you never need to have done earlier days by hand.

### Day 1: Your site is live
- [ ] Click "Use this template" on GitHub to make your own copy.
- [ ] Edit `business.json`: name, tagline, industry, service area, timezone, hours, services, prices.
- [ ] Edit `style.css` colours if you like (change `--brand`).
- [ ] Deploy with Cloudflare Pages (steps below). Check the yellow DEMO ONLY banner shows.
- [ ] Open `seam.html` on your site and read the seam map.

Catch up: use the template as it is, deploy it, and change only `name` and `tagline` in `business.json`.

### Day 2: The contact form
- [ ] Get a free Web3Forms access key (below) and paste it into `form.web3forms_key` in `business.json`.
- [ ] Send a test message from your live site. Confirm it lands in your inbox.

Catch up: skip the key. Until you add one, the form shows an "Open an email instead" link, so nothing fails silently.

### Day 3: The blog
- [ ] Open `publisher/publisher.md` in your coding agent and ask it to draft 3 posts dated on the next three days.
- [ ] Open `blog.html` (in your repo's file list, and at `/blog.html` on your site). Posts whose date has arrived show. Later ones stay hidden.
- [ ] Open `content/queue.json` and set one post's `publish_on` to tomorrow's date, written `YYYY-MM-DD` (if today is 24 October 2026, write `2026-10-25`). Check tomorrow morning that it appears on `blog.html`.
- [ ] Add `?debug` to the blog address to see any skipped entry and why.

Catch up: the template already has 5 sample posts. Their dates in `queue.json` are examples, so some later ones may already be live by the time you read this. Edit their titles, and set one `publish_on` to tomorrow's date yourself.

### Day 4: Voice assistant and the three checks
- [ ] Create your Vapi assistant from `voice/persona.md`, `voice/knowledge.md` and `voice/tools.json` (below).
- [ ] Put your Vapi public key and assistant id into `business.json` and set `voice.enabled` to `true`.
- [ ] Keep `booking.mode` as `"stub"`.
- [ ] Check there are no prices or hours in `voice/knowledge.md`.
- [ ] Run the three checks (below): form, voice, blog.

Catch up: do only Path A (form) and Path C (blog) and for the voice, the Vapi dashboard test call only checks that the assistant answers at all. The real test is the "Start voice demo" button on your own site.

### Day 5: Guardrails
- [ ] Try an emergency ("I smell gas"). The assistant should call `escalate` and the emergency wording should be spoken.
- [ ] Ask something it cannot know. It should say it does not know and offer to take a message.
- [ ] Say "I don't want to be recorded". The opt-out wording should be spoken.
- [ ] Ask for medical advice. It should decline.
- [ ] Optional: switch `booking.mode` to `"vapi-native"` and connect Google Calendar inside Vapi (Integrations, Tool Providers). Vapi's own calendar tools then book, and `vapi-tools.js` steps aside.

Catch up: leave `booking.mode` as `"stub"`. The guardrail checks work in stub mode too.

### Day 6: Integrate or catch up
- [ ] Add a call-to-action on a blog post pointing to the voice demo (ask your agent).
- [ ] Fix anything that failed in the three checks.
- [ ] Stretch: ask your agent about sending a summary of each finished call to the same function.

Catch up: this is a free day. Finish any missed checklist item from Days 1 to 5.

### Day 7: Demo day
- [ ] Demo your site using `seam.html` on your own business: point at what is CODE, what is AGENT, and where they meet.
- [ ] Read the lesson aloud: a real deployment needs its own professional and legal review. This template's recording notice, opt-out and emergency wording are placeholders. Call recordings and transcripts hold personal data.

Catch up: demo whatever you have. Show the seam map.

## Deploy on Cloudflare Pages (no terminal)

1. Sign in to Cloudflare (free account). In the left menu choose Workers & Pages.
2. Choose Create, then Pages, then Connect to Git. Authorize GitHub and pick your repo.
3. Build settings: leave the build command empty. Set the build output directory to `/`.
4. Choose Save and Deploy. After a minute you get an address like `https://your-project.pages.dev`.
5. Every time you save a change on GitHub, Cloudflare publishes it again automatically.

The folder `functions/` is picked up by Cloudflare on its own. After deploying, open `https://your-project.pages.dev/api/vapi-tools` in a browser. You should see "tools endpoint is up".

## Web3Forms access key (contact form)

1. Go to web3forms.com and enter your email to get a free access key. It arrives by email.
2. Paste it into `form.web3forms_key` in `business.json`. This key is public by design, so it is fine in the repo. Also put your email address in `form.fallback_email`: the "open an email instead" link uses it when the form is not connected. Web3Forms' free plan allows 250 submissions a month, no card.
3. Submit the form on your live site. The message lands in the inbox you registered. (Free-plan limits may change, so check their site.)

## Vapi: public key, assistant id, and setting up the assistant

Vapi is the voice service. It is free while your starting credits last, then it costs money per minute. Check Vapi's current pricing before you start. Menu names in the Vapi dashboard change from time to time, so match them loosely.

1. Create a free account at vapi.ai.
2. Public key: in the dashboard find the API Keys page and copy the PUBLIC key. Never use the private key anywhere in this repo.
3. Create a new assistant (blank). Pick a voice and a model.
4. System prompt: paste `voice/persona.md` from the first `##` heading onward.
5. Knowledge: add `voice/knowledge.md` using Vapi's knowledge or files feature. If you cannot find one, paste its text at the end of the system prompt.
6. Tools: ask your coding agent: "copy voice/tools.json into the Vapi dashboard one tool at a time, leaving out every line that starts with an underscore (_)". The five tools are check_availability, book_appointment, escalate, take_message and opt_out. Replace `YOUR-SITE.pages.dev` with your real Cloudflare address. Attach the tools to the assistant.
7. Copy the assistant id from the assistant page.
8. Paste the public key and assistant id into `voice.vapi_public_key` and `voice.assistant_id` in `business.json`, and set `voice.enabled` to `true`.

The greeting, recording notice, opt-out and emergency lines are spoken word for word. The greeting and recording notice come from `business.json` through `app.js`. The opt-out and emergency lines are fixed text inside the Vapi tool messages, so they are copies of the same text from `business.json`. Paste from `business.json` into `voice/tools.json` and into Vapi. `seam.html` turns red if they drift.

The Vapi dashboard's own test call is only a "does the assistant answer at all?" connection check. It will not know your business details, because the website's voice button passes them in from `business.json`. The real test is the voice button on your own live site.

## Day 4 checks: form, voice, blog

Each path has a fallback if you do not have the account yet.

- [ ] Path A, form to email: send a message from the form and find it in your inbox. No account fallback: the page shows an "Open an email instead" link that opens your mail app.
- [ ] Path B, voice demo (web call): click "Start voice demo", allow the microphone, and ask for an appointment. No account fallback: the page says "Voice demo not set up yet (Day 4)", and you read `voice/persona.md` in `seam.html` to see what the assistant would be told.
- [ ] Path C, blog queue: confirm a post dated today shows and a post dated in the future does not. No account is needed for this path. Set one post to tomorrow's date (`YYYY-MM-DD`) and check that it appears tomorrow morning.

## Hide the voice button when you are not demoing

Set `voice.enabled` to `false` in `business.json`. The page then shows "The voice demo is switched off right now." A public voice button spends your Vapi credits every time any visitor uses it, so switch it off when you are not demoing.

## Cost and safety notes

- Vapi: free while credits last. Voice calls cost real money afterwards.
- Everything else (GitHub, Cloudflare Pages, Web3Forms free plan) is free at this size.
- Never put a Vapi private key in this repo.
- Real deployments need their own professional and legal review. Recording rules, opt-out wording and emergency wording differ by place and by business.
