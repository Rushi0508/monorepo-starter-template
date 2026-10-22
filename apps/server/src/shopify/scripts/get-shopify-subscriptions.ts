import { shopifyGraphqlRequest } from './shopify-request';

const query = `
  query {
    webhookSubscriptions(first: 250) {
      edges {
        node {
          id
          topic
          uri
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

async function main() {
	const data = await shopifyGraphqlRequest<{
		webhookSubscriptions: {
			edges: { node: { id: string; topic: string; uri: string } }[];
			pageInfo: { hasNextPage: boolean };
		};
	}>(query);

	console.log(JSON.stringify(data.webhookSubscriptions.edges, null, 2));
	console.log(`\n${data.webhookSubscriptions.edges.length} subscription(s)`);

	if (data.webhookSubscriptions.pageInfo.hasNextPage) {
		console.warn('More subscriptions exist beyond this page.');
	}
}

main();
