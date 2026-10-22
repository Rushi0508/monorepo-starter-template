'use client';

import type { DemandPlanType } from '@repo/types';
import { Copy } from 'lucide-react';
import { CustomAlertDialog } from '@/components/general/CustomAlertDialog';
import { useScenarioActions } from '@/queries';

export const DuplicateScenarioDialog = ({
	scenario,
	open,
	onClose,
	onDuplicated,
}: {
	scenario: Pick<DemandPlanType, 'id' | 'name'>;
	open: boolean;
	onClose: () => void;
	onDuplicated?: (copy: DemandPlanType) => void;
}) => {
	const { duplicate } = useScenarioActions();

	return (
		<CustomAlertDialog
			isOpen={open}
			onClose={onClose}
			title={`Duplicate ${scenario.name}?`}
			description='The copy carries the same scope, forecast methods, prices and overrides, and opens as a new draft.'
			confirmText='Duplicate'
			confirmButtonClassName=''
			icon={<Copy className='size-8 text-primary' />}
			iconBackgroundClassName='bg-primary/10'
			isLoading={duplicate.isPending}
			onConfirm={() =>
				duplicate.mutate(scenario.id, {
					onSuccess: (copy) => {
						onClose();
						onDuplicated?.(copy);
					},
				})
			}
		/>
	);
};

export default DuplicateScenarioDialog;
