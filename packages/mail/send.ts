import nodemailer, { type Transporter } from 'nodemailer';
import type { MailConfig, MailPayload } from './types.js';

const transporterCache = new Map<string, Transporter>();

function getTransporter(config: MailConfig): Transporter {
	const key = `${config.smtp.host}:${config.smtp.port}:${config.smtp.auth.user}`;
	const cached = transporterCache.get(key);
	if (cached) return cached;

	const transporter = nodemailer.createTransport({
		...config.smtp,
		secure: true,
		pool: true,
		maxConnections: 5,
		maxMessages: 100,
	});

	transporterCache.set(key, transporter);
	return transporter;
}

export async function sendMail(
	config: MailConfig,
	payload: MailPayload
): Promise<void> {
	try {
		const transporter = getTransporter(config);
		await transporter.sendMail({
			from: `"${config.defaults.fromName}" <${config.defaults.from}>`,
			to: payload.to,
			subject: payload.subject,
			text: payload.text,
			html: payload.html,
			attachments: payload.attachments,
		});
	} catch (error) {
		console.error(error);
	}
}
