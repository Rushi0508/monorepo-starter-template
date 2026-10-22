import { Slot } from '@radix-ui/react-slot';
import { cn } from '@repo/ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent text-sm font-medium transition-colors duration-300 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/40 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default:
					'border-primary bg-primary text-primary-foreground text-xs uppercase tracking-[0.1em] hover:bg-transparent hover:text-primary',
				destructive:
					'border-destructive bg-destructive text-white text-xs uppercase tracking-[0.1em] hover:bg-transparent hover:text-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
				outline:
					'border-primary/40 bg-transparent text-primary text-xs uppercase tracking-[0.1em] hover:border-primary hover:bg-primary hover:text-primary-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
				subtle:
					'border-primary/40 bg-card text-primary hover:bg-muted dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-secondary/70',
				ghost:
					'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-9 px-4 py-2 has-[>svg]:px-3',
				sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
				lg: 'h-10 px-6 has-[>svg]:px-4',
				icon: 'size-9',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	}
);
Button.displayName = 'Button';

export { Button, buttonVariants };
