export const SOURCE_CONFIG: Record<
	string,
	{ label: string; color: string; url: string }
> = {
	SHOPIFY: {
		label: 'Shopify',
		color: 'bg-green-500/10 text-green-700 border-green-200',
		url: 'https://admin.shopify.com/store/y1x10m-xw',
	},
	BLUEBOX: {
		label: 'BlueBox',
		color: 'bg-sky-500/10 text-sky-700 border-sky-200',
		url: 'https://www.blueboxlogistics.com',
	},
	QBO: {
		label: 'QuickBooks',
		color: 'bg-purple-500/10 text-purple-700 border-purple-200',
		url: 'https://qbo.intuit.com/app/homepage',
	},
	GMAIL: {
		label: 'Gmail',
		color: 'bg-blue-500/10 text-blue-700 border-blue-200',
		url: 'https://mail.google.com',
	},
	SIMPLYDEPO: {
		label: 'SimplyDepo',
		color: 'bg-orange-500/10 text-orange-700 border-orange-200',
		url: 'https://app.simplydepo.com',
	},
	FOLK: {
		label: 'Folk',
		color: 'bg-pink-500/10 text-pink-700 border-pink-200',
		url: 'https://app.folk.app/apps/contacts/network/c820e91d-ef8a-4c29-ade0-5b1cdbe45a0b',
	},
} as const;
