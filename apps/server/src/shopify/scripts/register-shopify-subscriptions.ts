import { config } from '../../common/env-config';
import { SHOPIFY_WEBHOOK_TOPICS } from '../shopify-webhook-topics';
import { shopifyGraphqlRequest } from './shopify-request';

const EVENTBRIDGE_ARN =
	'arn:aws:events:us-west-2::event-source/aws.partner/shopify.com/376643420161/sauero-shopify-bus';

const TOPICS = Object.keys(SHOPIFY_WEBHOOK_TOPICS);

const createSubscriptionMutation = `
  mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription {
        id
        topic
        filter
        uri
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function createSubscription(topic: string) {
	const data = await shopifyGraphqlRequest<{
		webhookSubscriptionCreate: {
			webhookSubscription: { id: string; topic: string; uri: string } | null;
			userErrors: { field: string; message: string }[];
		};
	}>(createSubscriptionMutation, {
		topic,
		webhookSubscription: { uri: EVENTBRIDGE_ARN },
	});

	console.log(`\n=== ${topic} ===`);
	console.log(JSON.stringify(data.webhookSubscriptionCreate, null, 2));
}

async function main() {
	console.log(
		`Registering ${TOPICS.length} subscription(s) for shop: ${config.shopify.shop}`
	);

	for (const topic of TOPICS) {
		await createSubscription(topic);
	}

	console.log('\nAll subscriptions created successfully');
}

main();
