import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import type { DataPipelineName } from '@repo/constants';
import { PipelineStatus } from '@repo/db';
import {
	BlueboxAsnScheduler,
	BlueboxInventoryScheduler,
	BlueboxKitOrderScheduler,
	BlueboxOrderScheduler,
	BlueboxShipmentScheduler,
} from 'src/bluebox/sync/schedulers';
import { DemandActualsScheduler } from 'src/demand-planning/schedulers/demand-actuals.scheduler';
import { FolkMetricsScheduler } from 'src/folk/schedulers/folk-metrics.scheduler';
import { FolkReconcileScheduler } from 'src/folk/schedulers/folk-reconcile.scheduler';
import { GmailInboxScheduler } from 'src/gmail/schedulers/gmail-inbox.scheduler';
import { QboSyncScheduler } from 'src/qbo/sync/schedulers';
import {
	ShopifyAnalyticsScheduler,
	ShopifyCustomerScheduler,
	ShopifyInventoryScheduler,
	ShopifyOrderScheduler,
	ShopifyProductScheduler,
} from 'src/shopify/sync/schedulers';
import { SimplyDepoProductScheduler } from 'src/simplydepo/sync/schedulers/simplydepo-product.scheduler';
import { DataPipelineService } from './data-pipeline.service';

@Injectable()
export class DataPipelineRunnerService {
	private readonly logger = new Logger(DataPipelineRunnerService.name);

	constructor(
		private readonly pipelineService: DataPipelineService,
		private readonly qboSyncScheduler: QboSyncScheduler,
		private readonly shopifyOrderScheduler: ShopifyOrderScheduler,
		private readonly shopifyProductScheduler: ShopifyProductScheduler,
		private readonly shopifyCustomerScheduler: ShopifyCustomerScheduler,
		private readonly blueboxOrderScheduler: BlueboxOrderScheduler,
		private readonly blueboxShipmentScheduler: BlueboxShipmentScheduler,
		private readonly blueboxInventoryScheduler: BlueboxInventoryScheduler,
		private readonly blueboxAsnScheduler: BlueboxAsnScheduler,
		private readonly blueboxKitOrderScheduler: BlueboxKitOrderScheduler,
		private readonly shopifyAnalyticsScheduler: ShopifyAnalyticsScheduler,
		private readonly shopifyInventoryScheduler: ShopifyInventoryScheduler,
		private readonly simplyDepoProductScheduler: SimplyDepoProductScheduler,
		private readonly demandActualsScheduler: DemandActualsScheduler,
		private readonly gmailInboxScheduler: GmailInboxScheduler,
		private readonly folkMetricsScheduler: FolkMetricsScheduler,
		private readonly folkReconcileScheduler: FolkReconcileScheduler
	) {}

	/**
	 * `force` is the escape hatch for a lock stranded by a dead process: it drops
	 * the RUNNING status so the run can start. It does not override PAUSED —
	 * pausing is a deliberate configuration choice, so resume the pipeline first.
	 */
	async run(
		name: DataPipelineName,
		options?: { force?: boolean }
	): Promise<void> {
		const pipeline = await this.pipelineService.findByName(
			name as DataPipelineName
		);
		if (!pipeline) {
			throw new NotFoundException(`Pipeline "${name}" not found`);
		}

		if (pipeline.status === PipelineStatus.PAUSED) {
			throw new BadRequestException(
				`Pipeline "${name}" is paused — resume it before running`
			);
		}

		if (pipeline.status === PipelineStatus.RUNNING) {
			if (!options?.force) {
				throw new BadRequestException(`Pipeline "${name}" is already running`);
			}

			// startRun would refuse while the row still reads RUNNING, so the lock
			// has to be dropped before dispatching.
			await this.pipelineService.releaseLock(
				name,
				'Previous run was force-cleared by a manual trigger'
			);
			this.logger.warn(`Force-cleared stuck RUNNING lock for "${name}"`);
		}

		this.dispatch(name).catch((err) => {
			this.logger.error(`Manual trigger failed for "${name}": ${err.message}`);
		});
	}

	private async dispatch(name: DataPipelineName): Promise<void> {
		switch (name) {
			case 'shopify-orders':
				await this.shopifyOrderScheduler.syncOrders();
				break;
			case 'shopify-products':
				await this.shopifyProductScheduler.syncProducts();
				break;
			case 'shopify-customers':
				await this.shopifyCustomerScheduler.syncCustomers();
				break;
			case 'shopify-analytics':
				await this.shopifyAnalyticsScheduler.syncAnalytics();
				break;
			case 'shopify-inventory':
				await this.shopifyInventoryScheduler.syncInventory();
				break;
			case 'bluebox-orders':
				await this.blueboxOrderScheduler.syncOrders();
				break;
			case 'bluebox-shipments':
				await this.blueboxShipmentScheduler.syncShipments();
				break;
			case 'bluebox-inventory':
				await this.blueboxInventoryScheduler.syncInventory();
				break;
			case 'bluebox-asns':
				await this.blueboxAsnScheduler.syncAsns();
				break;
			case 'bluebox-kit-orders':
				await this.blueboxKitOrderScheduler.syncKitOrders();
				break;
			case 'qbo-sync':
				await this.qboSyncScheduler.syncAll();
				break;
			case 'demand-actuals':
				await this.demandActualsScheduler.refreshActuals();
				break;
			case 'simplydepo-products':
				await this.simplyDepoProductScheduler.syncProducts();
				break;
			case 'gmail-inbox':
				await this.gmailInboxScheduler.syncInbox();
				break;
			case 'folk-metrics-push':
				await this.folkMetricsScheduler.pushMetrics();
				break;
			case 'folk-nightly-reconcile':
				await this.folkReconcileScheduler.reconcile();
				break;
			default:
				this.logger.warn(`No runner configured for pipeline "${name}"`);
		}
	}
}
