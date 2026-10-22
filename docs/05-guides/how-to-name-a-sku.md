---
order: 2
title: How to Name a SKU
description: The pattern every SKU code and product name follows, with the rules and examples.
last_verified: 2026-10-08
---

# How to Name a SKU

Every product Sauero tracks has a **SKU code** (for example `SAU-SL-12OZ-12PK`) and a
**name** (for example "Salted Lime - 12oz - 12-pack"). Following one pattern means anyone
can tell what a product is from its code, a search for a flavour finds every format of it,
and the same product looks the same in every system.

Use this guide whenever you add a product on the
[SKU Settings](/sku-settings) screen. The app does not check the
pattern for you, so follow it by hand. It only stops you using a code that another product
has now, or had before it was renamed.

## The pattern

Codes and names both run from broadest to narrowest: what the product is, then the
container, then the pack size, then a tie-breaker if one is needed.

| Type | Code | Name | Example code | Example name |
| --- | --- | --- | --- | --- |
| Finished goods | `SAU-<FLAVOR>-<SIZE>-<PACK>[-<VARIANT>]` | `<Flavor> - <Size> - <Pack>[ - <Variant>]` | `SAU-VAR-12OZ-6PK-D2C` | Variety - 12oz - 6-pack - D2C |
| Virtual bundles | `BDL-<TYPE>-<PACK>` | `<Type> - <Pack>` | `BDL-BYO-3PK` | Build Your Own - 3-pack |
| Packaging | `PKG-<ITEM>-<FIT>[-<VARIANT>]` | `<Item> - <Fit>[ - <Variant>]` | `PKG-CARD-VAR-B2B` | Insert card - Variety - B2B |
| Ingredients (reserved, none created yet) | `ING-<ITEM>-<SPEC>` | `<Item> - <Spec>` | `ING-JUICE-LIME` | Lime juice - NFC |

The part in square brackets is optional. Leave it out unless you need it.

## What each part means

| Part | Allowed values |
| --- | --- |
| **FLAVOR** | `SL` Salted Lime · `BT` Salted Lime & Black Tea · `WM` Salted Lime & Watermelon · `GV` Salted Lime & Guava (discontinued) · `VAR` Variety |
| **SIZE** | `12OZ`, `16OZ` |
| **PACK** | `EA` (a single can), `6PK`, `12PK` |
| **VARIANT** | `B2B`, `D2C`, `SLK` (sleek). Only used when two products would otherwise get the same code. No variant means a standard can |
| **ITEM** (packaging) | `CAN`, `END`, `TRAY`, `RING`, `SHIP`, `CARD`, `TAPE` |
| **FIT** (packaging) | What the packaging holds: `6PK`, `12PK`, `VAR`, `ANY` |

## The rules

**Format**

- Use uppercase letters, digits and hyphens only.
- Keep codes to **21 characters or fewer**.
- Every fixed part is always filled in. The optional last part is only for telling two
  otherwise identical products apart.

**What to leave out**

- No supplier names (such as Whalepod or Econopod).
- Nothing that changes over time, like price, co-manufacturer or season.

**Sleek cans**

- Sleek products carry the `SLK` variant, so a search for a flavour finds both formats.
- When a sleek product sells through, it is set to inactive. If sleek comes back as the same
  product with the same barcode (GTIN), it returns on the same code.
- Single cans need no variant: sleek and standard cans share one GTIN per flavour.

**Variety packs**

- A variety pack keeps its code when the mix of flavours changes, but it gets a new GTIN
  (GS1's rule for a changed fixed assortment).
- The current mix is written in the product's **Short Description**. Lot codes tell the old
  and new mix apart.

**Packaging**

- Anything that doesn't go inside the can is packaging and starts with `PKG`. That includes
  the cans and can ends themselves.

**Names (titles)**

- Leave "Sauero" out of the name. The **Brand** field already carries it.
- Spell flavours exactly the way the can spells them.
- The same name is used in Sauerobase, BlueBox and SimplyDepo.
- Shopify product titles are **not** changed. They are set separately, for what customers
  see on the store.

**Retiring and renaming**

- A retired code is **never reused** for a different product.
- Retire a product by setting it inactive, not by deleting it. Deleting a product also
  deletes the record of its old codes, so the app can no longer stop them being reused.
- To change a product's code, rename it on the [SKU Settings](/sku-settings) screen rather
  than deleting it and adding a new one. Renaming keeps the old code as an alias, so past
  orders and stock still count toward the product.
