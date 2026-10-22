import { Spinner } from '@repo/ui/components/spinner';

const GlobalLoading = () => (
	<div className='flex h-dvh w-full items-center justify-center'>
		<Spinner className='size-8' />
	</div>
);

export default GlobalLoading;
