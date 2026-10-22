---
order: 11
title: SKU Settings
description: The master list of products, with custom columns, prices and costs, and a full change history.
last_verified: 2026-10-02
---

# SKU settings

SKU Settings holds the master list of products (SKUs) Sauero tracks, any custom fields the business wants on them, and each product's prices and costs over time, with a record of who changed what. It's the one place where Sauerobase creates data instead of reflecting another system. Supply, operations and finance use it to add new products, keep planning attributes current, enter costs and prices, and check which systems recognize a product.

## What this list controls

Set a product up here before anything else about it will work:

- Every product picker in Sauerobase (production runs, replenishment orders, demand plans) only offers products on this list.
- Manuel Brothers stock only shows listed products ([Rule 20](../01-business/business-rules.md)). See [Inventory](./stock-visibility.md).
- Demand plan actuals ignore sales of products that aren't on the list.
- Margins and stock values depend on the costs entered here, and a missing cost counts as zero ([Rule 11](../01-business/business-rules.md)).
- Pickup request emails to Manuel Brothers use the title entered here, and show the bare code without one.

## SKU Settings screen: the product grid

- Add, rename, retitle and delete products. When you add one, the dialog checks whether the code already exists in Shopify, BlueBox and SimplyDepo. Products are added one at a time; there's no bulk upload.
- Create your own columns, like safety stock, lead time, minimum order quantity or UPC code, without development. Rename, reorder (drag) or delete columns from the column header. Column names don't have to be unique.
- Edit in the grid, which saves as you type.
- Sort and filter the product and custom columns, filtering by value.
- Right-click the grid to copy cells or export to CSV or Excel.
- The icons under each code show whether Shopify, BlueBox and SimplyDepo recognize the product.
- Manage prices and costs from the pinned Price and Cost column, or by right-clicking a product.
- Read the change history.

Custom values are all stored as text, with no number, date or list column types and no validation. Emptying a field removes it ([Rule 21](../01-business/business-rules.md)), and deleting a column removes its values from every product with no undo ([Rule 24](../01-business/business-rules.md)).

![SKU settings grid with custom columns and the connected-system icons under each product](/images/docs/sku-settings.jpg)

Two column names behave differently:

| Column name | What happens |
| --- | --- |
| Unit Type (exact name, any capitalization) | When a new demand plan is created, products whose Unit Type contains "distribution" are selected by default |
| Any name containing "UPC code" | Duplicate values in that column are highlighted |

## Prices and costs

Each product holds four kinds of price and cost. Each one is entered with an **effective from** date and earlier versions are kept, so a new figure applies from its start date without rewriting the past ([Rule 12](../01-business/business-rules.md)).

| Item | Made up of | Per channel? | Used for |
| --- | --- | --- | --- |
| MSRP | One suggested retail price | No | Stored and shown only. No calculation uses it |
| Cost of goods (COGS) | Materials, production and shipping to the warehouse | No | Gross margin and stock value ([Rule 8](../01-business/business-rules.md)) |
| Fulfillment cost | Storage, pick, pack and shipping to the customer | Yes | Contribution margin ([Rule 10](../01-business/business-rules.md)) |
| Channel price | The selling price in that channel | Yes | Starting prices for new demand plans only |

Amounts are for one unit of the product as it's sold: a single can for a can product, the whole case for a case product. For orders iDrive ships, iDrive's actual shipping charge replaces the entered outbound shipping.

- Amounts can't be negative.
- Two versions of the same item can't start on the same day.
- Versions can't be edited. Remove the version and add a new one.
- Removing a cost version changes the margins of every past order it covered, because those orders are then costed with whichever version is left.
- Every price and cost added or removed shows in the change history.

![Price and cost panel for one product: MSRP, cost of goods, fulfilment cost and channel pricing](/images/docs/sku-price-and-cost.jpg)

## Product codes

- Codes aren't case-sensitive: "ABC-1" and "abc-1" are the same product, and a code can exist only once ([Rule 19](../01-business/business-rules.md)).
- Renaming keeps history connected. The old code is kept as an alias, so past orders, stock and iDrive records under it still count toward the product ([Rule 61](../01-business/business-rules.md)).
- An old code can never be reused for a different product, because that would attach the old orders to the wrong product. A product can be renamed back to one of its own old codes.
- The connected-system icons only check the current code, so a recently renamed product can show as unrecognized until the other systems use the new code.

## Deleting a product

- Deleting a product erases its whole price and cost history. Past orders of that product then count as having no cost, so historical margins go up.
- A product used in any demand plan can't be deleted. The attempt fails with a general "Something went wrong" message.
- Change history entries about the product are kept.

## How the change history records edits

The history is built to read as what someone meant to do, not every keystroke:

- Repeated edits to the same field by the same person within ten seconds collapse into one entry, keeping the original and final values ([Rule 22](../01-business/business-rules.md)).
- Changing a value and changing it back within those ten seconds leaves no entry ([Rule 23](../01-business/business-rules.md)).
- Adding, renaming and deleting products and columns, reordering columns, and adding or removing prices and costs are each recorded separately and never collapsed.
- History survives deletion of the product, the column or the person who made the change ([Rule 25](../01-business/business-rules.md)).

![Audit log listing each change with who made it and when](/images/docs/sku-audit-log.jpg)
