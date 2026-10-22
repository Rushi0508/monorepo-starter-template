'use client';

import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert';
import { Button } from '@repo/ui/components/button';
import { DialogFooter } from '@repo/ui/components/dialog';
import { AlertCircle, File, Info, X } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import LoadingButton from '@/components/general/LoadingButton';

interface FileUploadFormFooterProps {
	file: File | undefined;
	form: UseFormReturn<{ file: File } & Record<string, unknown>>;
	isPending: boolean;
	apiError: string | null;
	setShowSampleFormat: (show: boolean) => void;
	errorTitle?: string;
}

export const FileUploadFormFooter = ({
	file,
	form,
	isPending,
	apiError,
	setShowSampleFormat,
	errorTitle = 'Import Error',
}: FileUploadFormFooterProps) => {
	return (
		<>
			{file && !form.formState.errors.file && (
				<div className='flex items-center justify-between rounded-lg border p-3'>
					<div className='flex items-center gap-2'>
						<File className='text-primary h-6 w-6' />
						<span className='text-sm font-medium break-all'>{file.name}</span>
					</div>
					<Button
						variant='ghost'
						size='icon'
						onClick={() => form.resetField('file')}
						disabled={isPending}
					>
						<X className='h-4 w-4' />
					</Button>
				</div>
			)}

			{apiError && (
				<>
					<Alert variant='destructive'>
						<AlertCircle className='h-4 w-4' />
						<AlertTitle>{errorTitle}</AlertTitle>
						<AlertDescription>
							<div className='max-h-40 overflow-y-auto'>
								<pre className='whitespace-pre-wrap'>{apiError}</pre>
							</div>
						</AlertDescription>
					</Alert>
					<Button
						variant='outline'
						size='sm'
						onClick={() => setShowSampleFormat(true)}
						className='w-full'
					>
						<Info className='mr-2 h-4 w-4' />
						View Sample Format
					</Button>
				</>
			)}
		</>
	);
};

interface FileUploadDialogFooterProps {
	file: File | undefined;
	form: UseFormReturn<{ file: File } & Record<string, unknown>>;
	isPending: boolean;
	handleClose: () => void;
	submitLabel?: string;
	submittingLabel?: string;
}

export const FileUploadDialogFooter = ({
	file,
	form,
	isPending,
	handleClose,
	submitLabel = 'Import',
	submittingLabel = 'Importing...',
}: FileUploadDialogFooterProps) => {
	return (
		<DialogFooter>
			<Button variant='outline' onClick={handleClose} disabled={isPending}>
				Cancel
			</Button>
			<LoadingButton
				type='submit'
				isLoading={isPending}
				disabled={!file || isPending || !!form.formState.errors.file}
			>
				{isPending ? submittingLabel : `${submitLabel} ${file ? '1 file' : ''}`}
			</LoadingButton>
		</DialogFooter>
	);
};
