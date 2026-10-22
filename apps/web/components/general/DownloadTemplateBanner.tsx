import { Button } from '@repo/ui/components/button';
import { Download, FileSpreadsheet } from 'lucide-react';

type DownloadTemplateBannerProps = Readonly<{
	onDownload: () => void;
	label?: string;
}>;

export function DownloadTemplateBanner({
	onDownload,
	label = 'Download CSV Template',
}: DownloadTemplateBannerProps) {
	return (
		<div className='bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-3'>
			<div className='flex items-center gap-2 text-sm'>
				<FileSpreadsheet className='text-muted-foreground h-4 w-4' />
				<span>Need the template?</span>
			</div>
			<Button variant='outline' size='sm' onClick={onDownload} type='button'>
				<Download className='mr-1.5 h-3.5 w-3.5' />
				{label}
			</Button>
		</div>
	);
}
