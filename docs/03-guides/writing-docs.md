---
order: 3
title: Writing docs
description: Add or edit Help Center pages, images and process diagrams.
last_verified: 2026-10-23
---

# Writing docs

Every page in the Help Center is a Markdown file in the `docs/` folder.

## Add or edit a page

1. Pick the folder that fits the topic. The number prefix sets the order in the sidebar
   and is left out of the URL, so `docs/03-guides/writing-docs.md` serves at
   `/docs/guides/writing-docs`.
2. Start every page with frontmatter, then a `#` heading:

   ```md
   ---
   order: 3
   title: Writing docs
   description: One line shown under the page title.
   last_verified: 2026-10-23
   ---

   # Writing docs
   ```

   - `title`: the name shown in the sidebar.
   - `description`: optional one-line summary under the heading.
   - `order`: position within the folder; lower comes first.
   - `last_verified`: when someone last checked the page is accurate.

3. Break the page into sections with `##` and `###`. Each section appears in the
   "On this page" menu and in search.

## Add an image

Put the image in `apps/web/public/images/docs` and reference it on a line of its own:

```md
![What the image shows](/images/docs/your-image.png)
```

The text in brackets is shown as the caption. Images are public, so avoid screenshots
with real customer data.

## Add a process diagram (BPMN)

Keep the editable `.bpmn` file next to an exported image, all with the same name, in
`apps/web/public/images/docs/bpmn`:

```
order-intake.bpmn   ← editable source
order-intake.png    ← required (used by PDF and Word export)
order-intake.svg    ← optional, sharper on the website
```

Show the image in the page and link the source:

```md
![What the process shows](/images/docs/bpmn/order-intake.svg)

The source, [order-intake.bpmn](/images/docs/bpmn/order-intake.bpmn), opens in any BPMN tool.
```

Also describe the process in text on the same page, because search reads text, not images.
