import { Button } from '@repo/ui/components/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog';
import { cn } from '@repo/ui/lib/utils';
import { AlertTriangle } from 'lucide-react';
import AlertMessage from './AlertMessage';
import LoadingButton from './LoadingButton';

type CustomAlertDialogProps = Readonly<{
	isOpen: boolean;
	onClose?: () => void;
	onConfirm?: () => void;
	isLoading?: boolean;
	title?: string;
	description?: string;
	descriptionComponent?: React.ReactNode;
	cancelText?: string;
	confirmText?: string;
	headingClassName?: string;
	confirmButtonClassName?: string;
	icon?: React.ReactNode;
	iconBackgroundClassName?: string;
	error?: string | null;
}>;

export function CustomAlertDialog({
	isOpen,
	onClose,
	onConfirm,
	isLoading = false,
	title = 'Are you sure?',
	description = 'This action cannot be undone.',
	descriptionComponent,
	cancelText = 'Cancel',
	confirmText,
	headingClassName = 'text-center',
	confirmButtonClassName = 'bg-destructive hover:bg-destructive/80 text-white border-none',
	icon = <AlertTriangle className='size-8 text-destructive' />,
	iconBackgroundClassName = 'bg-destructive/10',
	error,
}: CustomAlertDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='no-scrollbar w-full max-w-xl overflow-y-auto max-sm:max-w-sm max-sm:rounded-lg'>
				<DialogHeader className='flex flex-col items-center justify-center gap-4'>
					<div
						className={cn(
							'flex items-center justify-center p-4 rounded-full w-fit',
							iconBackgroundClassName
						)}
					>
						{icon}
					</div>
					<DialogTitle className={cn('text-center', headingClassName)}>
						{title}
					</DialogTitle>
					<DialogDescription className='text-center'>
						{description}
					</DialogDescription>
					{descriptionComponent}
					{error && <AlertMessage message={error} variant='destructive' />}
				</DialogHeader>
				<DialogFooter className='max-sm:flex-col max-sm:gap-2 grid grid-cols-2'>
					{cancelText && (
						<Button variant='outline' disabled={isLoading} onClick={onClose}>
							{cancelText}
						</Button>
					)}
					{confirmText && (
						<LoadingButton
							disabled={isLoading}
							onClick={onConfirm}
							className={confirmButtonClassName}
							isLoading={isLoading}
						>
							{confirmText}
						</LoadingButton>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
