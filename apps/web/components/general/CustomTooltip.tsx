import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@repo/ui/components/tooltip';
import { cn } from '@repo/ui/lib/utils';
import { InfoIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface CustomTooltipProps {
	children?: ReactNode;
	/** Strings get URLs turned into links; JSX is rendered as given. */
	content?: ReactNode;
	className?: string;
	isOpen?: boolean;
	delayDuration?: number;
}

const LINK_REGEX = /(https?:\/\/[^\s]+)/g;

const renderText = (text: string) =>
	text.split(LINK_REGEX).map((part) =>
		part.match(LINK_REGEX) ? (
			<a
				key={part}
				href={part}
				target='_blank'
				rel='noopener noreferrer'
				className='text-blue-500 underline'
				onClick={(e) => e.stopPropagation()}
			>
				{part}
			</a>
		) : (
			<span key={part}>{part}</span>
		)
	);

const CustomTooltip = ({
	children,
	content,
	className,
	isOpen,
	delayDuration = 500,
}: CustomTooltipProps) => {
	if (!content) return children;

	return (
		<Tooltip delayDuration={delayDuration} open={isOpen}>
			<TooltipTrigger asChild>
				<span>
					{children ?? <InfoIcon className='w-3 h-3 text-muted-foreground' />}
				</span>
			</TooltipTrigger>
			<TooltipContent
				className={cn('bg-foreground text-background max-w-xs', className)}
			>
				{typeof content === 'string' ? renderText(content) : content}
			</TooltipContent>
		</Tooltip>
	);
};

export default CustomTooltip;
