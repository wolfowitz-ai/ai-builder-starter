// functions/api/vapi-tools.js
// A Cloudflare Pages Function. Cloudflare turns this file into the web address
//   https://YOUR-SITE.pages.dev/api/vapi-tools
// Vapi (the voice service) calls that address when the assistant uses a tool.
// No libraries, nothing is saved anywhere: the demo only checks and replies.
//
// Label legend (see SEAM.md): the AGENT decides WHEN to call a tool;
// everything in this file is [CODE]: the same rules every time.

/* [CODE] Tiny helpers ------------------------------------------------ */

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];   // index = JavaScript getUTCDay()
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Vapi needs `result` to be ONE flat line of text: no line breaks, no objects.
function flat(text) {
  return String(text).replace(/\s+/g, " ").trim();
}

// True only for a real calendar date: 2026-02-30 and 2026-13-40 are rejected, not rolled over.
function isRealDate(y, m, d) {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

// Thrown for bad input from the assistant; becomes {toolCallId, error}.
class ToolProblem extends Error {}

function need(args, key) {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) throw new ToolProblem(`missing ${key}`);
  return value.trim();
}

// "17:00" -> minutes since midnight (1020)
function minutesOf(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function clock(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

// Opening window for a calendar date: {open, close} in minutes, or null if closed.
function windowFor(biz, y, m, d) {
  const value = biz.hours[DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]];
  if (!value || value === "closed") return null;
  const [from, to] = value.split("-");
  return { open: minutesOf(from), close: minutesOf(to) };
}

/* [CODE] Time zones using the built-in Intl (no library) ------------- */

// How many minutes the timezone is ahead of UTC at a given moment.
function offsetMinutes(timezone, date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
    }).formatToParts(date).map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

// Wall-clock time in the business timezone -> a real moment (Date).
function zonedToDate(timezone, y, m, d, minutes) {
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  let result = guess - offsetMinutes(timezone, new Date(guess)) * 60000;
  result = guess - offsetMinutes(timezone, new Date(result)) * 60000;   // second pass handles daylight saving edges
  return new Date(result);
}

// A moment -> {y, m, d, minutes} on the wall clock of the business timezone.
function wallClock(timezone, date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric",
    }).formatToParts(date).map((x) => [x.type, x.value]),
  );
  return { y: +p.year, m: +p.month, d: +p.day, minutes: +p.hour * 60 + +p.minute };
}

/* [CODE] The tools --------------------------------------------------- */

function checkAvailability(biz, args, now) {
  if (biz.booking.mode === "vapi-native") {
    return "Availability is handled by the calendar tools in this assistant, so this function does nothing.";
  }
  const date = need(args, "date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ToolProblem("date must look like 2026-10-26");
  const [y, m, d] = date.split("-").map(Number);
  if (!isRealDate(y, m, d)) throw new ToolProblem(`${date} is not a real calendar date, use a date like 2026-10-26`);
  const win = windowFor(biz, y, m, d);
  const dayName = FULL_DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  if (!win) return `We are closed on ${dayName} ${date}.`;

  // Canned slots: every slot_minutes from opening, ending on or before closing,
  // and far enough ahead to respect min_notice_hours.
  const earliest = now.getTime() + biz.booking.min_notice_hours * 3600 * 1000;
  const slots = [];
  for (let start = win.open; start + biz.booking.slot_minutes <= win.close; start += biz.booking.slot_minutes) {
    if (zonedToDate(biz.timezone, y, m, d, start).getTime() >= earliest) slots.push(clock(start));
  }
  if (slots.length === 0) return `No open times on ${dayName} ${date}. Try another day.`;
  return `Open times on ${dayName} ${date} (${biz.timezone}): ${slots.join(", ")}. Demo slots only, nothing is really booked.`;
}

function bookAppointment(biz, args, now) {
  if (biz.booking.mode === "vapi-native") {
    return "Booking is handled by the calendar tools in this assistant, so this function does nothing.";
  }
  const name = need(args, "name");
  const phone = need(args, "phone");
  const service = need(args, "service");
  const startIso = need(args, "start_iso");

  if ((phone.match(/\d/g) || []).length < 7) throw new ToolProblem("phone needs at least 7 digits");
  const match = biz.services.find((s) => s.name.toLowerCase() === service.toLowerCase());
  if (!match) throw new ToolProblem(`unknown service, choose one of: ${biz.services.map((s) => s.name).join(", ")}`);

  // start_iso with no zone ("2026-10-26T09:00") is read in the business timezone.
  // With a zone ("...Z" or "+01:00") it is read as given.
  const parts = startIso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/);
  if (!parts) throw new ToolProblem("start_iso must look like 2026-10-26T09:00");
  if (!isRealDate(+parts[1], +parts[2], +parts[3]) || +parts[4] > 23 || +parts[5] > 59) {
    throw new ToolProblem(`${startIso} is not a real calendar date and time, use something like 2026-10-26T09:00`);
  }
  let start;
  if (parts[6]) {
    start = new Date(startIso);
  } else {
    start = zonedToDate(biz.timezone, +parts[1], +parts[2], +parts[3], +parts[4] * 60 + +parts[5]);
  }
  if (Number.isNaN(start.getTime())) throw new ToolProblem("start_iso is not a real time");

  const local = wallClock(biz.timezone, start);
  const win = windowFor(biz, local.y, local.m, local.d);
  const when = `${FULL_DAYS[new Date(Date.UTC(local.y, local.m - 1, local.d)).getUTCDay()]} ${local.y}-${String(local.m).padStart(2, "0")}-${String(local.d).padStart(2, "0")} at ${clock(local.minutes)}`;

  if (!win) return `We are closed on that day (${when}). Please offer another day.`;
  if (local.minutes < win.open || local.minutes + match.duration_min > win.close) {
    return `That time is outside our hours (${when}). Please offer a time that fits.`;
  }
  if ((local.minutes - win.open) % biz.booking.slot_minutes !== 0) {
    return `Appointments start every ${biz.booking.slot_minutes} minutes from opening (${when} does not fit). Please offer a listed time.`;
  }
  if (start.getTime() < now.getTime() + biz.booking.min_notice_hours * 3600 * 1000) {
    return `We need at least ${biz.booking.min_notice_hours} hours notice (${when} is too soon). Please offer a later time.`;
  }
  // Stub mode: nothing is saved. The sentence below is what the persona tells the agent to read aloud.
  return `Booked (demo, nothing saved): ${match.name} for ${name} on ${when}, ${biz.timezone}.`;
}

function escalate(biz, args) {
  const reason = need(args, "reason").slice(0, 200);
  // The words the caller hears come from the tool message in Vapi (copy of voice.emergency_script).
  return `Emergency flagged (demo, nobody was really notified). Reason: ${reason}`;
}

function takeMessage(biz, args) {
  const name = need(args, "name");
  const phone = need(args, "phone");
  const note = need(args, "note").slice(0, 300);
  if ((phone.match(/\d/g) || []).length < 7) throw new ToolProblem("phone needs at least 7 digits");
  return `Message noted for ${name} (demo, nothing saved or sent): ${note}`;
}

function optOut() {
  return "Opt-out noted (demo, nothing changed). The caller hears the opt-out wording from the tool message.";
}

const TOOLS = {
  check_availability: checkAvailability,
  book_appointment: bookAppointment,
  escalate,
  take_message: takeMessage,
  opt_out: optOut,
};

/* [CODE] Reading Vapi's request -------------------------------------- */

// Vapi sends message.toolCallList. Older shapes (toolCalls, functionCall) are tolerated too.
function extractCalls(body) {
  const message = body && typeof body.message === "object" && body.message ? body.message : {};
  const list = (value) => (Array.isArray(value) ? value : []);   // anything that is not a list counts as empty
  let raw = list(message.toolCallList);
  if (!raw.length) raw = list(message.toolCalls);
  if (!raw.length && message.functionCall && typeof message.functionCall === "object") raw = [message.functionCall];
  return raw.filter((call) => call && typeof call === "object").map((call) => {
    const fn = call.function && typeof call.function === "object" ? call.function : call;
    let args = fn.arguments !== undefined ? fn.arguments : fn.parameters;
    if (typeof args === "string") {
      try { args = JSON.parse(args); } catch (err) { args = null; }
    }
    return { id: call.id || call.toolCallId || fn.id, name: fn.name, args: args && typeof args === "object" ? args : {}, badArgs: args === null };
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

/* [CODE] The two entry points Cloudflare looks for -------------------- */

// Open this address in a browser to check the function is deployed.
export async function onRequestGet() {
  return new Response("tools endpoint is up", { headers: { "Content-Type": "text/plain" } });
}

export async function onRequestPost(context) {
  // Bad secret -> 401 and malformed JSON -> 400 are intended. Any other surprise -> 200 with empty results, never a 500.
  try {
    return await handlePost(context);
  } catch (err) {
    return json({ results: [] });
  }
}

async function handlePost({ request, env }) {
  // Optional shared secret. Set VAPI_SERVER_SECRET in Cloudflare and in Vapi to turn this on.
  if (env && env.VAPI_SERVER_SECRET && request.headers.get("x-vapi-secret") !== env.VAPI_SERVER_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  let body;
  try { body = await request.json(); } catch (err) { return json({ error: "body must be JSON" }, 400); }
  const calls = extractCalls(body);
  if (calls.length === 0) return json({ results: [] });   // nothing to do (for example a status message)

  // The business facts live in business.json on the same site.
  let biz;
  try {
    const response = await fetch(new URL("/business.json", request.url));
    biz = await response.json();
  } catch (err) {
    biz = null;
  }

  // Always HTTP 200: Vapi reads success or failure from each item in `results`.
  const results = calls.map((call) => {
    try {
      if (!biz) throw new ToolProblem("could not read business.json");
      const tool = Object.hasOwn(TOOLS, call.name) ? TOOLS[call.name] : null;
      if (!tool) throw new ToolProblem(`unknown tool ${call.name}`);
      if (call.badArgs) throw new ToolProblem("arguments were not valid JSON");
      return { toolCallId: call.id, result: flat(tool(biz, call.args, new Date())) };
    } catch (err) {
      if (err instanceof ToolProblem) return { toolCallId: call.id, error: flat(err.message) };
      return { toolCallId: call.id, error: "something went wrong" };
    }
  });
  return json({ results });
}
