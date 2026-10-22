'use client';

import { tooltips } from '@repo/constants';
import { MultiSelect } from '@repo/ui/components/multi-select';
import { useMemo, useState } from 'react';
import { CustomAlertDialog } from '@/components/general/CustomAlertDialog';
import CustomTooltip from '@/components/general/CustomTooltip';
import { SkletonLoader } from '@/components/general/SkletonLoader';
import { useFolkGroups, useSetFolkTrackedGroups } from '@/queries';

const FolkGroupsField = () => {
	const { data, isLoading, error } = useFolkGroups();
	const { mutate: setTrackedGroups, isPending } = useSetFolkTrackedGroups();

	// Removing a group deletes its mappings, so it is confirmed before applying.
	const [pendingSelection, setPendingSelection] = useState<string[] | null>(
		null
	);
	// MultiSelect holds its own selection, so cancelling has to remount it to
	// drop the chips the user removed before confirming.
	const [selectionKey, setSelectionKey] = useState(0);

	const cancelRemoval = () => {
		setPendingSelection(null);
		setSelectionKey((key) => key + 1);
	};

	const trackedIds = useMemo(
		() =>
			(data ?? [])
				.filter((group) => group.tracked)
				.map((group) => group.folkGroupId),
		[data]
	);

	const options = (data ?? []).map((group) => ({
		label: group.name,
		value: group.folkGroupId,
	}));

	const removedNames = (data ?? [])
		.filter(
			(group) =>
				group.tracked && pendingSelection?.includes(group.folkGroupId) === false
		)
		.map((group) => group.name);

	const handleChange = (selected: string[]) => {
		const removed = trackedIds.filter((id) => !selected.includes(id));
		if (removed.length > 0) {
			setPendingSelection(selected);
			return;
		}
		setTrackedGroups(selected);
	};

	return (
		<div className='grid grid-cols-2 gap-6 py-5'>
			<div className='space-y-1'>
				<div className='flex items-center gap-1.5'>
					<p className='text-sm leading-none font-medium'>Folk groups</p>
					<CustomTooltip content={tooltips.configurationPage.folkGroups} />
				</div>
				<p className='text-sm text-muted-foreground'>
					Companies in these Folk groups are pulled into Folk mapping and
					receive order metrics. Everything outside them is ignored.
				</p>
				{error && <p className='text-sm text-destructive'>{error.message}</p>}
			</div>

			{isLoading ? (
				<SkletonLoader count={1} className='h-10' />
			) : (
				<MultiSelect
					key={selectionKey}
					type='button'
					variant='secondary'
					options={options}
					defaultValue={trackedIds}
					onValueChange={handleChange}
					disabled={isPending || Boolean(error)}
					disableSelectAll
					placeholder='Select Folk groups'
					searchPlaceholder='Search groups...'
					maxCount={4}
					className='h-9 self-start text-sm'
				/>
			)}

			<CustomAlertDialog
				isOpen={pendingSelection !== null}
				onClose={cancelRemoval}
				title='Stop tracking these Folk groups?'
				description={`${removedNames.join(', ')} will be removed from Folk mapping and stop receiving order metrics. Linked Sauero customers are unlinked, not deleted. Nothing changes in Folk itself.`}
				cancelText='Cancel'
				confirmText='Stop tracking'
				isLoading={isPending}
				onConfirm={() => {
					if (!pendingSelection) return;
					setTrackedGroups(pendingSelection, {
						onSuccess: () => setPendingSelection(null),
					});
				}}
			/>
		</div>
	);
};

export default FolkGroupsField;
