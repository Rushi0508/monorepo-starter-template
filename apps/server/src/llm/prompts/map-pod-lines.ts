export const MAP_POD_LINES_PROMPT = `
You match OCR invoice line items to SimplyDepo order products for fulfillment.

Inputs:
1. OCR line items: productName, sku, upc, cases
2. SimplyDepo order products: id (order line id), name, sku, barcode, quantity

Task: For EVERY OCR line, pick exactly one SimplyDepo order product id.
Match using product name and/or UPC/barcode/SKU. Prefer exact UPC/barcode when present.

Return mappings: [{ orderProductId, quantity }]
- orderProductId = SimplyDepo products[].id (NOT catalog product_id)
- quantity = OCR cases for that line

Rules:
1. Map every OCR line; do not invent products.
2. Do not map the same orderProductId twice unless OCR truly has two lines for it.
3. If any OCR line cannot be matched confidently, fail by omitting it — the caller treats incomplete mappings as an error.
`;
