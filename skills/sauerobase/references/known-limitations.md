# Known limitations

What the system does not do today. Read this before presenting a number as fact.

---

## No approvals, no roles, no separation of duties

There are no permission levels. Everyone who can sign in can create warehouse orders,
change the product costs that drive margin reporting, delete products, and remove other users.
Connecting the assistant grants the same full read as any signed-in user.

---

## Nobody is told when something fails

The system has no alerting of any kind. A person has to look at a screen to discover that
anything went wrong, and several failures leave no trace on any screen at all:

| What can fail silently | What the business loses |
| --- | --- |
| The distributor pickup email | The distributor is never told about a transfer to collect |
| The new-order delivery email | The distributor is never told about an order to deliver |
| A distributor's acknowledgement being judged | The acknowledgement is missed, permanently |
| A product on a transfer the store doesn't recognise | That stock is never added to distributor figures |
| Missed email during an inbox outage | That delivery paperwork is skipped permanently |

The system health screen can look entirely green while any of these has stopped the
business process.

---

## Information can be stale, and one type can silently freeze

Nothing is live. Stock and delivery figures can be several hours old; accounting figures a
day old.

More importantly: **if a refresh is interrupted mid-run, that information type stops
refreshing permanently** until someone intervenes. Nothing clears the stuck state — the
figures simply stop moving. This is the single most likely operational incident with this
system.

---

## Delivery paperwork can be lost

Every other connection catches up after an outage. The shared inbox does not. Paperwork
received during the gap is skipped and cannot be recovered. Reconnecting has the same
effect: processing restarts from the moment of reconnection, and anything before it is
never picked up.

---

## Things that cannot be corrected

| You cannot | Consequence |
| --- | --- |
| Cancel or amend a distributor transfer | A mistake has to be resolved with the warehouse directly |
| Resend a distributor notification that failed | The distributor has to be told another way |
| Correct an acknowledgement recorded wrongly | The record stays wrong |
| Edit an order, customer, or product listing | Those changes belong in the online store |

---

## Margin is only as good as the costs entered

Cost of goods and fulfilment cost come from the costs entered per product in SKU settings
(fulfilment per channel). A cost that has not been entered counts as zero, so margin reads
higher than it really is for those products.

The cost-per-case figure recorded against each production run — which would give a real,
per-batch cost — is captured, displayed, and never used.

Anyone relying on gross margin or contribution margin should know both facts.

---

## Automated reading can be wrong, and nothing measures it

Reading delivery paperwork, matching its lines to the right product, and judging whether a
reply confirms a transfer are all automated. The most damaging failure is guarded against —
quantities are capped at what is outstanding, so a misread figure cannot cause an
over-delivery. A line matched to the wrong product and a reply judged incorrectly are not
guarded, and there is no measurement of how often either happens.

---

## Accounting information is collected and invisible

Ledger entries, bills, invoices, and payments are copied in every morning and stored. No
screen, report, or figure uses any of it.

---

## Missing tools people expect

| Not available | Notes |
| --- | --- |
| Export or download of any report | No report can be taken out of the system |
| Scheduled or emailed reports | Everything is on-screen only |
| Search across everything at once | Each screen searches its own information |
| Attachment archive | Delivery paperwork is read but never stored here |
| Audit history outside product data | Only product changes are recorded |
| Marketing data | No Klaviyo, ad spend, or attribution; sessions are coarse Shopify traffic sources |
| SQL, shipping-zone cost | Not exposed to this connector |

---

## Capacity and scale — not established

Delivery paperwork processes at about one document a minute, never tested against a known
peak. The revenue and delivery reports load a whole date range at once, so cost grows with
the range and no limit is enforced.
