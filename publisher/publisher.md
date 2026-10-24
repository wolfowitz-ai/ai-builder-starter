# Publisher prompt

How to use: open this repo in your coding agent (Claude Code, Codex, or the chat in your editor). Say: "Follow publisher/publisher.md and draft 3 posts, one per day starting tomorrow." Then look at the result and ask for changes in plain English.

## [AGENT] Your job: write the posts

- Read business.json first. Use the business name, industry, service area and services. Write in the voice of that business: friendly, plain, helpful.
- Draft a short title and a body of two to four short paragraphs (blank line between paragraphs, plain text only, no HTML, no markdown symbols).
- Do not put prices, opening hours or phone numbers in a post. Those facts live in business.json and change. A post can say "see our home page for hours and prices".
- Only write things that are generally true. Do not invent customer stories, awards or guarantees.

## [CODE-QUEUE] Your job: follow the exact shape

Add each post to the list in content/queue.json. The page checks every entry, and skips (and hides) any entry that breaks these rules:

- Each entry has exactly these fields: `id`, `title`, `body`, `publish_on`, `status`.
- `id`: unique text. Use the date plus a short slug, for example `2026-11-20-winter-filter-tip`. Never reuse an id.
- `publish_on`: a real date written `YYYY-MM-DD`. The post appears on the site on that date (in the business timezone) and not before.
- `status`: always `"queued"` for a new post.
- Append. Never overwrite, reorder or delete the existing entries.
- Keep the file valid JSON: straight double quotes, a comma between entries, no comma after the last one, the whole list inside `[ ]`. Write line breaks inside `body` as `\n`.

If you break a rule, nothing crashes. The post just does not show. Open blog.html with `?debug` on the end of the address to see which entries were skipped and why.

## Example

This entry, appended to the list, shows up on the blog on 2026-11-20:

```json
{
  "id": "2026-11-20-winter-filter-tip",
  "title": "A two-minute check before the cool season",
  "body": "Pull out your air filter and hold it up to a light.\n\nIf you cannot see light through it, swap it for a fresh one. A clean filter helps your system run easily.",
  "publish_on": "2026-11-20",
  "status": "queued"
}
```

## After you finish

Tell the member, in plain words, which posts you added and on which dates they will appear. Do not run any commands unless the member asks.
