FROM node:24.21.0-slim AS base

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /app

COPY . .

RUN pnpm install

RUN pnpm db:generate

RUN pnpm build

CMD ["sh", "-c", "pnpm db:deploy && pnpm start"]
