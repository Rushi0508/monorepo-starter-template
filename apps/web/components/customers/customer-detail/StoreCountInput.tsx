'use client';

import { useEffect, useState } from 'react';
import CustomInput from '@/components/general/CustomInput';
import { useUpdateCustomer } from '@/queries';

interface StoreCountInputProps {
	customerId: string;
	storeCount: number;
}

const StoreCountInput = ({
	customerId,
	storeCount: savedStoreCount,
}: StoreCountInputProps) => {
	const { mutate: updateCustomer, isPending } = useUpdateCustomer(customerId);
	const [storeCount, setStoreCount] = useState<number | undefined>(
		savedStoreCount
	);

	useEffect(() => {
		setStoreCount(savedStoreCount);
	}, [savedStoreCount]);

	const save = () => {
		if (storeCount == null || !Number.isInteger(storeCount) || storeCount < 1) {
			setStoreCount(savedStoreCount);
			return;
		}
		if (storeCount !== savedStoreCount) {
			updateCustomer({ storeCount });
		}
	};

	return (
		<div className='flex items-center gap-2 text-sm text-muted-foreground'>
			<label htmlFor='store-count'>Stores</label>
			<CustomInput
				id='store-count'
				type='number'
				min={1}
				step={1}
				className='h-8 w-20'
				value={storeCount ?? ''}
				disabled={isPending}
				onChange={(val) =>
					setStoreCount(typeof val === 'number' ? val : undefined)
				}
				onBlur={save}
				onKeyDown={(e) => {
					if (e.key === 'Enter') e.currentTarget.blur();
				}}
			/>
		</div>
	);
};

export default StoreCountInput;
