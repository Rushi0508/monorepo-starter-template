import { shopifyGraphqlRequest } from './shopify-request';

const MATCH = 'ap-south-1';

const listQuery = `
  query {
    webhookSubscriptions(first: 250) {
      edges {
        node {
          id
          topic
          uri
        }
      }
    }
  }
`;

const deleteMutation = `
  mutation webhookSubscriptionDelete($id: ID!) {
    webhookSubscriptionDelete(id: $id) {
      deletedWebhookSubscriptionId
      userErrors {
        field
        message
      }
    }
  }
`;

type Subscription = { id: string; topic: string; uri: string };

async function deleteSubscription(subscription: Subscription) {
	const data = await shopifyGraphqlRequest<{
		webhookSubscriptionDelete: {
			deletedWebhookSubscriptionId: string | null;
			userErrors: { field: string; message: string }[];
		};
	}>(deleteMutation, { id: subscription.id });

	console.log(`\n=== ${subscription.topic} ===`);
	console.log(JSON.stringify(data.webhookSubscriptionDelete, null, 2));
}

async function main() {
	const data = await shopifyGraphqlRequest<{
		webhookSubscriptions: { edges: { node: Subscription }[] };
	}>(listQuery);

	const matched = data.webhookSubscriptions.edges
		.map((edge) => edge.node)
		.filter((node) => node.uri.includes(MATCH));

	console.log(`Deleting ${matched.length} subscription(s) matching: ${MATCH}`);

	for (const subscription of matched) {
		await deleteSubscription(subscription);
	}

	console.log('\nAll matching subscriptions deleted');
}

main();
