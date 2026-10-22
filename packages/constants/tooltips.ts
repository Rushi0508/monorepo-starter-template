export const tooltips = {
	revenuePage: {
		grossRevenue:
			'Total revenue before any deductions: the sum of (quantity × unit price) across all non-cancelled order line items, plus the shipping charged to customers, in the selected period. Tax is not revenue and is excluded.',
		discounts:
			'Total discount value applied to orders. Pulled from Shopify\'s "totalDiscounts" field on each order — includes automatic discounts, coupon codes, and manual reductions.',
		refunds:
			'Money returned to customers on non-cancelled orders in the selected period. Sum of successful refund transactions, less the tax refunded on products (tax is never revenue). Includes refunded shipping. Counted against the order date, not the date the refund was issued.',
		netRevenue:
			'Revenue after deducting discounts and refunds. Formula: Gross Revenue − Discounts − Refunds.',
		casesSold:
			'Total number of cases (units) sold across all non-cancelled orders in the selected period, summed from line item quantities.',
		cogs: "Cost of goods sold: each unit's COGS (materials + production + shipping to the warehouse) as of the order date. Set it for each SKU in SKU settings.",
		grossMargin:
			'Gross profit as a percentage of net revenue. Formula: (Net Revenue − COGS) ÷ Net Revenue × 100. Shows how much revenue remains after the cost of goods.',
		fulfillmentCost:
			"Cost to fulfill orders: each unit's storage + pick + pack + shipping for the order's channel, as of the order date. BlueBox's actual shipping replaces the entered shipping when available. Set it for each SKU and channel in SKU settings.",
		contributionMargin:
			'Profitability after both COGS and fulfillment costs. Formula: (Gross Profit − Fulfillment Cost) ÷ Net Revenue × 100.',
	},
	ordersPage: {
		margin:
			"This order from top line to bottom line: gross revenue, less discounts and refunds, less COGS and fulfillment cost. Uses each SKU's costs as of the order date. BlueBox's actual shipping replaces the entered shipping when available. Costs not entered count as $0 — set them in SKU settings.",
	},
	dashboard: {
		orders:
			'Total number of Shopify orders created in the selected date range, including cancelled orders.',
		netRevenue:
			'Revenue after discounts and refunds for non-cancelled orders. The trend percentage compares the current period to the equivalent prior period of the same length.',
		unitsShipped:
			'Total units (case quantities) from orders that have a "Fulfilled" fulfillment status in Shopify during the selected range.',
		openAlerts:
			'Orders that are paid but have not been fulfilled, and are between 2 and 30 days old. These need attention as they may be stuck.',
		conversionRate:
			'Percentage of Shopify sessions that resulted in a completed checkout. Formula: Completed Checkouts ÷ Total Sessions × 100.',
		repeatPurchaseRate:
			'Percentage of customers who placed more than one order in the selected period. Formula: Customers with 2+ orders ÷ Total distinct customers × 100.',
		avgTimeBetweenOrders:
			'Average number of days between consecutive orders, calculated only for customers who placed 2 or more orders. Useful for understanding reorder cadence.',
		activeSubscriptions:
			'Count of subscription contracts currently in "ACTIVE" status in Shopify, regardless of the selected date range.',
		sampleShipmentSpend:
			'Total cost of sample cases shipped to influencers and marketing contacts. Cases sent for free as part of product seeding and gifting campaigns.',
	},
	customerPage: {
		skuVelocity:
			'How fast a customer reorders each SKU, measured in units per week. Calculated from the first to the last order date for each SKU, then divided by the number of weeks active.',
		unitsPerWeek:
			"Total units ordered for a SKU divided by the number of weeks between the customer's first and last order for that SKU. A higher number means faster reorder frequency.",
		unitsPerStorePerWeek:
			'Also called retail velocity. Units / Week divided by the number of stores this customer has.',
		cansPerStorePerWeek:
			"Units / Store / Week multiplied by the cans in each unit, from the SKU's Config (Units) setting. SKUs with no Config (Units) count each unit as 1 can.",
		caseVolume:
			'Total number of cases ordered by this customer across all non-cancelled orders, lifetime.',
		netAov:
			'Net Average Order Value — average net revenue per order. Formula: Total Net Revenue ÷ Total Orders.',
		grossProfit:
			"Gross profit for this customer. Formula: Net Revenue − COGS, where COGS uses each SKU's COGS from SKU settings as of the order date. Same calculation as the Revenue page.",
	},
	inventoryPage: {
		onHand:
			'Total physical stock at the Bluebox warehouse, summed across all warehouse locations for each SKU. Reported directly by the Bluebox inventory feed.',
		committed:
			'Units reserved for open orders that have not yet shipped. Reported directly by Bluebox — these units are allocated but still physically in the warehouse.',
		available:
			'Units that are on hand and not committed, backordered, or quarantined. This is the sellable stock available for new orders, as reported by Bluebox.',
		backordered:
			'Units that have been ordered by customers but are not currently in stock. These represent unfulfilled demand waiting on new inventory, as tracked by Bluebox.',
		quarantined:
			'Units held aside and not available for sale — typically due to quality holds, damage inspections, or pending returns. Reported directly by Bluebox.',
		inProduction:
			'Units on the way into BlueBox: production runs not yet on an ASN, the unreceived quantity on open ASNs, and kits still to be built on open iDrive kitting orders. A run stops counting once an ASN with the same SKU and lot picks it up, so nothing is counted twice.',
		inventoryValue:
			"What the stock on hand cost to make: on hand units × the SKU's current COGS (materials + production + shipping to the warehouse), summed across BlueBox and Manuel Brothers. SKUs with no COGS in SKU settings show — and are left out of the total.",
	},
	fulfillmentPage: {
		avgLeadTime:
			'Average number of days from when a Shopify order is placed to when Bluebox marks it as delivered. Only includes orders with a Bluebox delivery timestamp.',
		avgTransitTime:
			'Average number of days from when Bluebox ships an order (dateOrderShipped) to when it is delivered (dateOrderDelivered). Calculated entirely from Bluebox data.',
		onTimeRate:
			'Percentage of delivered orders that arrived within the configured maximum transit days for each channel (DTC and B2B thresholds are set in Configuration).',
	},
	folkMappingPage: {
		emailMissing:
			'Add an email for this customer in Folk to map it in Sauerobase.',
	},
	configurationPage: {
		gmailConnection:
			'Sauero reads incoming emails from this inbox and sends outgoing emails from this address. Sign-in emails are sent separately.',
		folkGroups:
			'Only companies in these Folk groups are pulled into Sauero and receive order metrics. Everything outside them is ignored.',
	},
	demandPlanningPage: {
		accuracy:
			'How close that forecast came for the selected month: 1 − |Actual − Forecast| ÷ Forecast, floored at zero. Over- and under-forecasting are penalised equally, so this measures the size of the miss, not its direction. Always scored against the forecast as it was signed off — never a later revision.',
		forecast:
			"What the plan at the chosen lag expected to ship in the selected month. Finalized plans can't be edited, so this is exactly the number that was signed off at the time — change the lag and you're reading a different plan's number.",
		actual:
			"Cases actually shipped in the selected month, rolled up from the source systems for the channels and SKUs in scope. This doesn't move when you change the lag — only the forecast it's compared against does.",
		bias: "Whether the plan leans one way. Net signed miss across all scored months as a share of total forecast — positive means actuals ran above plan, so demand was underestimated. Opposite misses cancel here, which is the point: it separates a consistent habit from ordinary noise. It spans every scored month rather than just the selected one, which is why it isn't the mirror of Accuracy.",
		period:
			'The month being scored — the month whose actuals are on the table, not the month the plan was cut in. It stays fixed as you change the lag; only the forecast being judged against it changes.',
		lag: "How far ahead the forecast was made. Lag N grades the selected month against the plan finalized N months earlier — if August is selected at Lag 2, that's August's actuals against the forecast for August that the June plan contained. The month never changes; only which forecast is on trial. Read the lag that matches your purchasing lead time — a forecast only counts if it arrived early enough to order on.",
		totalGrowth:
			'The revenue difference between the two plans across the months they share, as a share of the baseline. Formula: (new revenue − old revenue) ÷ old revenue. Volume growth and price growth always add up to exactly this, so nothing is left unexplained. Example: 100 cases at $50 becomes 110 cases at $55. Revenue goes from $5,000 to $6,050 — total growth +21%.',
		volumeGrowth:
			"The part of the change that came from planning more or fewer cases, with prices held at the baseline's. Formula: (new cases − old cases) × old price, as a share of old revenue. Every dollar here has a procurement consequence — more cases to produce, store and ship. Example: 100 cases at $50 becomes 110 cases at $55. Volume growth is (110 − 100) × $50 = $500, or +10%.",
		priceGrowth:
			'The part of the change that came from charging more or less, applied to the new case volumes. Formula: (new price − old price) × new cases, as a share of old revenue. This money arrives without producing a single extra case. Example: 100 cases at $50 becomes 110 cases at $55. Price growth is ($55 − $50) × 110 = $550, or +11%.',
		plannedRevenue:
			"Total revenue the compared plan expects across the shared months, with the baseline's figure underneath for reference. Revenue is always derived from planned cases and the price ladder — it is never entered directly.",
		sharedHorizon:
			'Every plan forecasts a fixed 12-month window from its own cycle month, so two plans rarely line up. Only the months both cover are compared — including a month that only one plan reaches would show growth or decline that never happened. Example: a July plan runs Jul–Jun and an August plan runs Aug–Jul, so they share 11 months.',
		movers:
			'What moved in the selected month, ranked by revenue movement — biggest first, in either direction. Group by SKU to see which product moved, or by channel to see which route to market did; click a row to break it down by the other. Change is measured in cases, while the effects and Revenue are in dollars.',
	},
	mcpConnect: {
		skills:
			'A small package that teaches Claude how Sauero defines its metrics and what it should not guess at, so answers match the dashboard.',
	},
	replenishmentOrders: {
		howItWorks:
			'When you create an order here, it is sent to BlueBox as a pickup order for Manuel Brothers. A background job checks if BlueBox has delivered the order. Once delivered, the system automatically adjusts inventory levels in Shopify for the Manuel Brothers location by adding the ordered quantities to available stock.',
		dataFlowStatus:
			"Whether this order has been added to Manuel Brothers stock in Shopify. A background job checks BlueBox and updates it.\n\nPending: BlueBox hasn't shipped or delivered the order yet, or the SKU update is not done in Shopify yet. Shopify is unchanged until every item can be added.\n\nSynced: BlueBox marked it Shipped or Delivered, and the ordered quantities were added to available stock at the Manuel Brothers location in Shopify.\n\nSkipped: the order was cancelled in BlueBox, so Shopify stock was left alone.",
	},
};
