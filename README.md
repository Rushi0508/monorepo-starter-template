### Sauero

https://app.drinksauero.com

## Documentation

Read the documentation at https://app.drinksauero.com/docs.

Each page there is a file in the [`docs`](./docs) folder. Changes appear on the site after
the next release.

### Add or edit a page

1. Open the folder that fits the topic:

   | Folder | What goes in it |
   | --- | --- |
   | `01-business` | How the business works — rules, calculations, limitations |
   | `02-features` | What each screen does |
   | `03-workflows` | Processes and automations, step by step |
   | `04-technical` | How things work behind the scenes |
   | `05-guides` | How-to guides |

2. To add a page, upload a new `.md` file to that folder. The easiest start is to copy an
   existing page in the same folder and replace its content. Every page starts like this:

   ```md
   ---
   order: 3
   title: Order Visibility
   description: One line shown under the page title.
   last_verified: 2026-10-02
   ---

   # Order Visibility
   ```

   - `title` — the name shown in the sidebar.
   - `description` — optional; a one-line summary shown under the page title.
   - `order` — where the page sits in its folder; lower numbers come first.
   - `last_verified` — the date someone last checked the page is still accurate.
   - The line starting with `#` is the heading at the top of the page.

3. Break the page into sections with lines starting `##` (and `###` for smaller ones). Each
   section appears in the "On this page" menu, can be found through search, and is how the
   AI assistant looks things up.

4. To edit a page, open its file and change the text.

### Add an image

1. Upload the image to [`apps/web/public/images/docs`](./apps/web/public/images/docs).
2. In the page, put this line where the image should appear, on a line of its own:

   ```md
   ![What the image shows](/images/docs/your-image.jpg)
   ```

   Replace `your-image.jpg` with the file's name. The text in the square brackets is shown
   as the caption under the image.

Images can be opened by anyone with the link, so don't use screenshots that show real
customer names, emails or addresses.

### Add a process diagram (BPMN)

Processes in the **Workflows** section are drawn as BPMN diagrams — the standard format for
business process diagrams. See
[Distributor Replenishment](./docs/03-workflows/distributor-replenishment.md) for an example.

**Why both a BPMN file and an image?** A `.bpmn` file is the editable source: anyone can
open it in a BPMN tool and change the process later. But the help center, web browsers and
the PDF / Word exports cannot display a `.bpmn` file, so readers need an image of the
diagram. Keep the two together: the image is what people see, the `.bpmn` file is what you
update.

1. Draw the process in a BPMN tool such as [bpmn.io](https://demo.bpmn.io), Camunda Modeler
   or draw.io, and save it as a `.bpmn` file.
2. Export the diagram from the same tool as a **PNG** image. This is required — it is what
   the PDF and Word exports use.
3. Optionally also export it as an **SVG**. SVG stays sharp at any zoom on the website. It
   is not required; if you add one, give it the same name as the PNG.
4. Upload the files, all with the same name, to
   [`apps/web/public/images/docs/bpmn`](./apps/web/public/images/docs/bpmn):

   ```
   order-intake.bpmn   ← the editable source
   order-intake.png    ← required
   order-intake.svg    ← optional
   ```

5. In the page, wherever the diagram should appear, show the image (use `.svg` if you
   uploaded one, otherwise `.png`) and link the source file:

   ```md
   ![What the process shows](/images/docs/bpmn/order-intake.svg)

   The source, [order-intake.bpmn](/images/docs/bpmn/order-intake.bpmn), opens in any BPMN tool.
   ```

Keep the process written out in text on the same page too. The AI assistant reads text,
not images, so the written description is how it answers questions about the process.

When a process changes, open the `.bpmn` file, update it, and export the image(s) again
under the same name, so the page picks up the new version.
