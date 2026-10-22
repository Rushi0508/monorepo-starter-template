import { cn } from '@repo/ui/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface AlertMessageProps {
	message: string;
	variant?: 'default' | 'destructive' | 'info' | 'success' | 'warning';
	alignment?: 'center' | 'left' | 'right';
}

const AlertMessage = ({
	message,
	variant,
	alignment = 'left',
}: AlertMessageProps) => {
	const variants = {
		default: {
			className:
				'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900',
			icon: (
				<AlertCircle
					className='mt-0.5 size-4 text-yellow-600 shrink-0'
					strokeWidth={2}
				/>
			),
		},
		destructive: {
			className:
				'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:border-red-900',
			icon: (
				<AlertCircle
					className='mt-0.5 size-4 text-red-600 shrink-0'
					strokeWidth={2}
				/>
			),
		},
		info: {
			className:
				'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900',
			icon: (
				<AlertCircle
					className='mt-0.5 size-4 text-blue-600 shrink-0'
					strokeWidth={2}
				/>
			),
		},
		success: {
			className:
				'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/30 dark:border-green-900',
			icon: (
				<CheckCircle
					className='mt-0.5 size-4 text-green-600 shrink-0'
					strokeWidth={2}
				/>
			),
		},
		warning: {
			className:
				'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900',
			icon: (
				<AlertTriangle
					className='mt-0.5 size-4 text-yellow-600 shrink-0'
					strokeWidth={2}
				/>
			),
		},
	};
	const variantClass = variants[variant || 'default'];
	return (
		<div
			className={cn(
				'text-primary p-2.5 rounded-lg text-center text-sm border flex items-start gap-2 w-full',
				variantClass.className,
				alignment === 'left' && 'text-left',
				alignment === 'right' && 'text-right'
			)}
		>
			{variantClass.icon} <span className='whitespace-pre-line'>{message}</span>
		</div>
	);
};

export default AlertMessage;
