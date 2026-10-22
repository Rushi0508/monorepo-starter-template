import type { ConfigurationType } from '@repo/types';
import { omitNulls } from '../../lib/shape.js';

export function shapeConfiguration(raw: ConfigurationType) {
	return omitNulls({
		d2cMaxTransitDays: raw.d2cMaxTransitDays,
		b2bMaxTransitDays: raw.b2bMaxTransitDays,
		mbDistributorEmail: raw.mbDistributorEmail,
		mbDistributorCcEmails: raw.mbDistributorCcEmails,
	});
}
