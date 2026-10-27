// app.js - the one script behind index.html, blog.html and seam.html.
// Plain JavaScript, no build step, no libraries. Read top to bottom.
// Every block starts with a seam label: [CODE] means the computer does it the
// same way every time. See SEAM.md for the legend.

// Pinned version of the Vapi web SDK, loaded only when someone clicks the call button.
const VAPI_SDK_URL = "https://esm.sh/@vapi-ai/web@3.0.1";
// Where the contact form is sent.
const WEB3FORMS_URL = "https://api.web3forms.com/submit";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

/* ------------------------------------------------------------------ */
/* [CODE-FORMAT] Small formatting helpers. Exported so seam.html can reuse them. */

// "17:00" -> "5:00 PM"
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// "08:00-17:00" -> "8:00 AM-5:00 PM", "closed" stays "closed"
function formatRange(value) {
  if (!value || value === "closed") return "closed";
  const [from, to] = value.split("-");
  return `${formatTime(from)}-${formatTime(to)}`;
}

// Turns the hours object into one line, grouping days that share hours:
// "Mon-Fri 8:00 AM-5:00 PM; Sat 9:00 AM-1:00 PM; Sun closed"
export function formatHours(hours) {
  const groups = [];
  for (const day of DAYS) {
    const text = formatRange(hours[day]);
    const last = groups[groups.length - 1];
    if (last && last.text === text) last.end = day;
    else groups.push({ start: day, end: day, text });
  }
  return groups
    .map((g) => {
      const label = g.start === g.end ? DAY_LABELS[g.start] : `${DAY_LABELS[g.start]}-${DAY_LABELS[g.end]}`;
      return `${label} ${g.text}`;
    })
    .join("; ");
}

export function formatServices(services) {
  return services.map((s) => `${s.name} (${s.duration_min} min)`).join("; ");
}

export function formatPrices(prices) {
  return Object.entries(prices)
    .map(([name, price]) => `${name}: ${price}`)
    .join("; ");
}

// Today's date as YYYY-MM-DD in the business's own timezone (uses the browser's Intl).
export function todayIn(timezone, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// "Saturday 2026-10-24, 10:15 AM" in the business timezone, so the voice assistant knows "today".
export function nowText(timezone, now = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "long" }).format(now);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(now);
  return `${weekday} ${todayIn(timezone, now)}, ${time}`;
}

// "-04:00 until 2026-10-31; -05:00 from 2026-11-01 until 2027-03-13; ..." for the next year, computed by the
// browser. Vapi's Google Calendar availability tool reads times without an offset as UTC, so the assistant is
// told the exact offset to write on every time (the code works it out, the AI never guesses daylight saving).
export function utcOffsetsText(timezone, now = new Date(), days = 400) {
  const offsetOn = (date) => {
    const part = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "longOffset", hour: "numeric" })
      .formatToParts(date).find((p) => p.type === "timeZoneName").value;   // "GMT-05:00" or "GMT"
    const m = /GMT([+-]\d{2}):?(\d{2})?/.exec(part);
    return m ? `${m[1]}:${m[2] || "00"}` : "+00:00";
  };
  const segments = [];
  for (let i = 0; i <= days; i++) {
    const date = new Date(now.getTime() + i * 86400000);
    const off = offsetOn(date), day = todayIn(timezone, date);
    const last = segments[segments.length - 1];
    if (!last || last.off !== off) segments.push({ off, from: day });
  }
  return segments.map((seg, i) => {
    const next = segments[i + 1];
    const until = next ? ` until ${todayIn(timezone, new Date(new Date(next.from + "T12:00:00Z").getTime() - 86400000))}` : "";
    return `${seg.off}${i === 0 ? "" : " from " + seg.from}${until}`;
  }).join("; ");
}

export function isPlaceholder(value) {
  return !value || /^PASTE_/i.test(String(value));
}

/* ------------------------------------------------------------------ */
/* [CODE-INJECT] Builds the facts handed to the voice assistant.
   These become {{business_name}}, {{hours_text}} ... inside voice/persona.md.
   The assistant gets exact values from business.json, never from memory.
   `extra` is passed along untouched as one JSON string; no code reads inside it. */
export function buildVariables(biz, now = new Date()) {
  return {
    business_name: biz.name,
    tagline: biz.tagline,
    industry: biz.industry,
    service_area: biz.service_area,
    timezone: biz.timezone,
    hours_text: formatHours(biz.hours),
    services_text: formatServices(biz.services),
    prices_text: formatPrices(biz.prices),
    min_notice_hours: String(biz.booking.min_notice_hours),
    today_text: nowText(biz.timezone, now),
    utc_offsets_text: utcOffsetsText(biz.timezone, now),
    extra: JSON.stringify(biz.extra || {}),
  };
}

/* [CODE-VERBATIM] The first words the assistant speaks, built by code, never by the model. */
export function buildFirstMessage(biz) {
  // {name} in the greeting becomes the business name, so renaming the business in one place is enough.
  // "&" is spoken as "and".
  const spokenName = String(biz.name).replace(/&/g, "and");
  const greeting = String(biz.voice.greeting).replaceAll("{name}", spokenName);
  return `${greeting} ${biz.voice.recording_notice}`;
}

/* ------------------------------------------------------------------ */
/* [CODE-QUEUE] Blog queue checks. The page shows a post only if it passes. */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SHOWN_STATUSES = ["queued", "published"];
const ALL_STATUSES = ["queued", "published", "draft"];

function isRealDate(text) {
  if (!DATE_RE.test(text)) return false;
  const [y, m, d] = text.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// Returns "" if the entry is fine, otherwise a plain-English reason.
export function checkEntry(entry, seenIds) {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) return "not an object";
  if (typeof entry.id !== "string" || !entry.id.trim()) return "id must be non-empty text";
  if (seenIds.has(entry.id)) return `duplicate id "${entry.id}"`;
  if (typeof entry.title !== "string" || !entry.title.trim()) return "title must be non-empty text";
  if (typeof entry.body !== "string" || !entry.body.trim()) return "body must be non-empty text";
  if (typeof entry.publish_on !== "string" || !isRealDate(entry.publish_on)) return "publish_on must be a real date like 2026-10-25";
  if (!ALL_STATUSES.includes(entry.status)) return `status must be one of ${ALL_STATUSES.join(", ")}`;
  return "";
}

// Splits the queue into posts to show and entries to skip. Newest first.
export function selectPosts(queue, timezone, now = new Date()) {
  const today = todayIn(timezone, now);
  const posts = [];
  const skipped = [];
  const waiting = [];   // valid and queued, but their date has not arrived yet
  const drafts = [];    // valid, status "draft": never shown
  if (!Array.isArray(queue)) return { posts, skipped: [{ label: "queue.json", reason: "must be a list (starts with [ )" }], waiting, drafts };
  const seen = new Set();
  queue.forEach((entry, i) => {
    const reason = checkEntry(entry, seen);
    const label = entry && entry.id ? String(entry.id) : `entry number ${i + 1}`;
    if (reason) { skipped.push({ label, reason }); return; }
    seen.add(entry.id);
    if (!SHOWN_STATUSES.includes(entry.status)) { drafts.push(entry); return; }   // a draft: valid, just not shown
    if (entry.publish_on > today) { waiting.push(entry); return; }                // not its day yet
    posts.push(entry);
  });
  posts.sort((a, b) => (a.publish_on < b.publish_on ? 1 : -1));
  waiting.sort((a, b) => (a.publish_on > b.publish_on ? 1 : -1));
  return { posts, skipped, waiting, drafts };
}

/* ------------------------------------------------------------------ */
/* Everything below touches the page. It only runs in a browser. */

const $ = (id) => document.getElementById(id);

// Small helper: make an element with safe text (textContent never runs HTML).
function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

/* [CODE] Fill the page with values from business.json. Any element with
   data-bind="name" (or tagline, service_area, hours_text ...) gets that value. */
function fillPage(biz) {
  const values = buildVariables(biz);
  values.name = biz.name;
  document.querySelectorAll("[data-bind]").forEach((node) => {
    const value = values[node.dataset.bind];
    if (value !== undefined) node.textContent = value;
  });
  document.title = document.title.replace("Sample website", biz.name);

  const list = $("services-list");
  if (list) {
    list.replaceChildren();
    for (const s of biz.services) {
      const li = el("li");
      li.append(el("strong", s.name), ` (${s.duration_min} min) - ${biz.prices[s.name] || "ask us for a price"}`);
      list.append(li);
    }
  }
}

/* [CODE] The DEMO ONLY banner. It appears unless demo_only is false. */
const DEMO_TEXT =
  "DEMO ONLY: this template, and its recording-notice, opt-out and emergency wording, are placeholders for a fictional business. A real business needs its own professional and legal review before anything like this takes a customer call.";

function showBanner(biz) {
  const banner = $("demo-banner");
  if (!banner) return;
  // Shown unless demo_only is exactly false or "false" (any other value keeps the banner on).
  const off = biz.demo_only === false || String(biz.demo_only).toLowerCase() === "false";
  if (!off) {
    banner.textContent = DEMO_TEXT;
    banner.hidden = false;
  } else {
    banner.hidden = true;
  }
}

/* [CODE-FORMAT] Contact form -> Web3Forms. Without a key, show an email-link fallback. */
function setupForm(biz) {
  const form = $("contact-form");
  if (!form) return;
  const status = $("form-status");
  const say = (text, kind) => { status.textContent = text; status.className = `status ${kind || ""}`; };
  const subject = `New enquiry from ${biz.name} website`;

  if (isPlaceholder(biz.form.web3forms_key)) {
    // No key yet (Day 2). Offer a mail link so the form never fails silently.
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const body = `Name: ${data.get("name")}\nEmail: ${data.get("email")}\n\n${data.get("message")}`;
      const link = el("a", "Open an email instead");
      link.href = `mailto:${isPlaceholder(biz.form.fallback_email) ? '' : encodeURIComponent(biz.form.fallback_email).replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.className = "status warn";
      status.replaceChildren(
        "The form is not connected yet (add your Web3Forms key in business.json on Day 2). ", link,
      );
    });
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    say("Sending...");
    try {
      const response = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: biz.form.web3forms_key,
          subject,
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          botcheck: data.get("botcheck") ? true : false,   // hidden trap for spam bots
        }),
      });
      const result = await response.json();
      if (result.success) {
        say(biz.form.success_message, "ok");
        form.reset();
      } else {
        say(`Sorry, that did not send (${result.message || "unknown problem"}).`, "error");
      }
    } catch (err) {
      say("Sorry, that did not send. Please check your connection and try again.", "error");
    }
    button.disabled = false;
  });
}

/* [CODE-QUEUE] Blog page: load the queue, show what passes, list the rest with ?debug. */
async function setupBlog(biz) {
  const container = $("posts");
  if (!container) return;
  let queue;
  try {
    const response = await fetch("content/queue.json");
    queue = await response.json();
  } catch (err) {
    container.replaceChildren(el("p", "Could not read content/queue.json. Check it is valid JSON.", "status error"));
    return;
  }
  const { posts, skipped, waiting, drafts } = selectPosts(queue, biz.timezone);

  container.replaceChildren();
  if (posts.length === 0) container.append(el("p", "No posts yet. Check back soon."));
  for (const post of posts) {
    const article = el("article", undefined, "post");
    article.append(el("h2", post.title), el("p", post.publish_on, "post-date"));
    // Blank line = new paragraph. Text only, so nothing in a post can run as code.
    post.body.split(/\n\s*\n/).forEach((paragraph) => article.append(el("p", paragraph.trim())));
    container.append(article);
  }

  if (new URLSearchParams(location.search).has("debug")) {
    const panel = $("debug");
    panel.hidden = false;
    panel.replaceChildren(el("h2", "Debug: skipped entries"));
    if (skipped.length === 0) panel.append(el("p", "None. Every entry passed the check."));
    for (const item of skipped) panel.append(el("p", `${item.label}: ${item.reason}`));
    panel.append(el("h2", "Waiting for their date (not shown yet)"));
    if (waiting.length === 0) panel.append(el("p", "None."));
    for (const post of waiting) panel.append(el("p", `${post.publish_on}: ${post.title} (${post.id})`));
    if (drafts.length > 0) {
      panel.append(el("h2", "Drafts (never shown)"));
      for (const post of drafts) panel.append(el("p", `${post.publish_on}: ${post.title} (${post.id})`));
    }
  }
}

/* [CODE] Voice demo button (Vapi web call). The call itself is [AGENT] work. */
function setupVoice(biz) {
  const box = $("voice");
  if (!box) return;
  const note = $("voice-note");
  const button = $("voice-btn");
  const status = $("voice-status");
  const v = biz.voice;

  if (!v.enabled) {
    note.textContent = "The voice demo is switched off right now.";
    return;
  }
  if (isPlaceholder(v.vapi_public_key) || isPlaceholder(v.assistant_id)) {
    note.textContent = "Voice demo not set up yet (Day 4).";
    return;
  }

  note.textContent = "Talk to our demo assistant in your browser. It will ask to use your microphone.";
  button.hidden = false;

  let vapi = null;
  let inCall = false;
  const say = (text, kind) => { status.textContent = text; status.className = `status ${kind || ""}`; };
  const idle = () => { inCall = false; button.textContent = "Start voice demo"; button.disabled = false; };

  button.addEventListener("click", async () => {
    if (inCall) { vapi.stop(); say("Ending call..."); return; }
    button.disabled = true;
    say("Connecting...");
    try {
      if (!vapi) {
        const { default: Vapi } = await import(VAPI_SDK_URL);
        vapi = new Vapi(v.vapi_public_key);
        vapi.on("call-start", () => { inCall = true; button.textContent = "End call"; button.disabled = false; say("Connected. Say hello."); });
        vapi.on("call-end", () => { idle(); say("Call ended."); });
        vapi.on("speech-start", () => say("Assistant is speaking..."));
        vapi.on("speech-end", () => say("Listening..."));
        vapi.on("error", (err) => {
          idle();
          const text = (err && (err.message || (err.error && err.error.message))) || "unknown problem";
          say(`Voice demo problem: ${text}`, "error");
        });
      }
      // [CODE-INJECT] + [CODE-VERBATIM]: facts and the opening words come from business.json.
      await vapi.start(v.assistant_id, {
        firstMessage: buildFirstMessage(biz),
        variableValues: buildVariables(biz),
      });
    } catch (err) {
      idle();
      say("Could not start the call. Check the microphone permission and your Vapi keys.", "error");
    }
  });
}

/* Start: read business.json once, then set up whatever this page has. */
async function main() {
  let biz;
  try {
    const response = await fetch("business.json");
    biz = await response.json();
  } catch (err) {
    const message = el("p", "Could not read business.json. Check it is valid JSON (every key in quotes, commas between items).", "status error");
    document.body.prepend(message);
    return;
  }
  fillPage(biz);
  showBanner(biz);
  setupForm(biz);
  setupBlog(biz);
  setupVoice(biz);
}

if (typeof document !== "undefined") main();
