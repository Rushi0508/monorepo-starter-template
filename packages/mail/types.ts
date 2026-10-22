export type MailConfig = {
	smtp: {
		host: string;
		port: number;
		auth: {
			user: string;
			pass: string;
		};
	};
	defaults: {
		from: string;
		fromName: string;
	};
};

export type MailPayload = {
	to: string | string[];
	subject: string;
	text?: string;
	html?: string;
	attachments?: Array<{
		filename: string;
		content: Buffer | string;
	}>;
};
