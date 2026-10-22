import { Button } from '@repo/ui/components/button';
import { Spinner } from '@repo/ui/components/spinner';
import type { ComponentProps } from 'react';

type LoadingButtonProps = ComponentProps<typeof Button> & {
	isLoading?: boolean;
};

export function LoadingButton({
	isLoading = false,
	disabled,
	children,
	...props
}: LoadingButtonProps) {
	return (
		<Button disabled={disabled || isLoading} {...props}>
			{isLoading && <Spinner data-icon='inline-start' />}
			{children}
		</Button>
	);
}
