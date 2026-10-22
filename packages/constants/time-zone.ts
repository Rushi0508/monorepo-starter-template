/**
 * The business's reporting zone — Mountain time, as the client asked. Anything
 * that must read the same for everyone belongs in this zone rather than the
 * viewer's or UTC.
 *
 * It matters more than it looks: orders peak in the US evening, which is the
 * *next day* in UTC, so a UTC month boundary moves a whole evening of sales
 * into the following month.
 */
export const BUSINESS_TIME_ZONE = 'America/Denver';

export const DEFAULT_TIME_ZONE = 'UTC';
