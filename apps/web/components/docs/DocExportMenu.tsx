'use client';

import { Button } from '@repo/ui/components/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { Download, FileCode2, FileDown, FileText } from 'lucide-react';

const FORMATS = [
	{ format: 'pdf', label: 'PDF', Icon: FileDown },
	{ format: 'docx', label: 'Word (.docx)', Icon: FileText },
	{ format: 'md', label: 'Markdown (.md)', Icon: FileCode2 },
] as const;

export function DocExportMenu({ slug }: { slug: string[] }) {
	const path = slug.join('/');

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant='ghost'
					size='icon'
					className='size-7 text-muted-foreground'
					aria-label='Export this page'
					title='Export'
				>
					<Download className='size-4' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-44'>
				{FORMATS.map(({ format, label, Icon }) => (
					<DropdownMenuItem key={format} asChild>
						<a href={`/docs/export/${format}/${path}`} download>
							<Icon />
							{label}
						</a>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default DocExportMenu;
