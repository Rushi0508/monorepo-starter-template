export type DashboardMetrics = {
	orders: number;
	netRevenue: number;
	netRevenueTrendPercentage: number;
	unitsShipped: number;
	openAlerts: number;
	alertDetail: string;
	conversionRate: number;
	repeatPurchaseRate: number;
	avgTimeBetweenOrders: number;
	activeSubscriptions: number;
};

export type DashboardOrderStatusItem = {
	key: string;
	label: string;
	count: number;
	color: string;
};

export type DashboardDailyPoint = {
	date: string; // "YYYY-MM-DD"
	grossRevenue: number;
	netRevenue: number;
	orders: number;
	grossAov: number;
	netAov: number;
};

export type DashboardTopSku = {
	sku: string;
	title: string | null;
	netRevenue: number;
	grossRevenue: number;
	units: number;
};

export type CustomerSplit = {
	newCustomers: number;
	returningCustomers: number;
};

export type SessionsBreakdownRow = {
	referringChannel: string;
	deviceType: string;
	sessions: number;
	completedCheckouts: number;
};

export type GetDashboardResponseType = {
	metrics: DashboardMetrics;
	orderStatus: DashboardOrderStatusItem[];
	dailyTrend: DashboardDailyPoint[];
	topSkus: DashboardTopSku[];
	sessionBreakdown: SessionsBreakdownRow[];
	customerSplit: CustomerSplit;
};
