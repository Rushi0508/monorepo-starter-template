import {
	Injectable,
	Logger,
	ServiceUnavailableException,
} from '@nestjs/common';
import { createZapierSdk } from '@zapier/zapier-sdk';
import { config } from 'src/common/env-config';
import {
	SIMPLYDEPO_APP,
	type ZapierActionType,
} from './constants/simplydepo.constants';

type ZapierSdkClient = ReturnType<typeof createZapierSdk>;

@Injectable()
export class ZapierClient {
	private readonly logger = new Logger(ZapierClient.name);
	private sdk: ZapierSdkClient | null = null;
	private connectionIdCache: string | null = null;

	private getSdk(): ZapierSdkClient {
		if (this.sdk) return this.sdk;

		const { clientId, clientSecret } = config.zapier;
		if (!clientId || !clientSecret) {
			throw new ServiceUnavailableException(
				'Zapier not configured. Set ZAPIER_CREDENTIALS_CLIENT_ID and ZAPIER_CREDENTIALS_CLIENT_SECRET.'
			);
		}

		this.sdk = createZapierSdk({
			credentials: {
				clientId,
				clientSecret,
			},
		});

		return this.sdk;
	}

	async getSimplyDepoConnectionId(): Promise<string> {
		if (config.zapier.simplyDepoConnectionId) {
			return config.zapier.simplyDepoConnectionId;
		}

		if (this.connectionIdCache) {
			return this.connectionIdCache;
		}

		const zapier = this.getSdk();
		const { data: connection } = await zapier.findFirstConnection({
			app: SIMPLYDEPO_APP,
			owner: 'me',
		});

		if (!connection?.id) {
			throw new ServiceUnavailableException(
				'No SimplyDepo Zapier connection found. Create one with: npx zapier-sdk create-connection simplydepo'
			);
		}

		this.connectionIdCache = String(connection.id);
		this.logger.log(
			`Using SimplyDepo Zapier connection ${this.connectionIdCache}`
		);
		return this.connectionIdCache;
	}

	async runAction<T = unknown>(params: {
		actionType: ZapierActionType;
		action: string;
		inputs?: Record<string, unknown>;
	}): Promise<T> {
		const zapier = this.getSdk();
		const connection = await this.getSimplyDepoConnectionId();

		this.logger.debug(
			`Zapier runAction ${SIMPLYDEPO_APP}.${params.actionType}.${params.action}`
		);

		const { data } = await zapier.runAction({
			app: SIMPLYDEPO_APP,
			actionType: params.actionType,
			action: params.action,
			connection,
			inputs: params.inputs ?? {},
		});

		return data as T;
	}
}
