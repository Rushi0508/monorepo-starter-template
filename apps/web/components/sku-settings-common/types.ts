import type { SkuChannelPresence, SkuSettingType } from '@repo/types';

/** A SKU row with resolved channel presence and a mutable custom-field map. */
export type EditableRow = SkuSettingType & {
	channels: SkuChannelPresence;
	_customFields: Record<string, string>;
};

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';
