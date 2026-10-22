import { PageHeader } from '@/components/general/PageHeader';
import { SkuSettingsAgGrid } from '@/components/sku-settings/SkuSettingsAgGrid';

const SkuSettingsPage = () => {
	return (
		<div className='flex h-[calc(100dvh-61px-2rem)] flex-col gap-4'>
			<div className='shrink-0'>
				<PageHeader
					title='SKU settings'
					description='Changes autosave. Drag headers to reorder, click a header to sort, filter with the row under each column. Right click cell/header to get more options. Ctrl/Cmd+Z undoes cell edits.'
				/>
			</div>
			<SkuSettingsAgGrid />
		</div>
	);
};

export default SkuSettingsPage;
