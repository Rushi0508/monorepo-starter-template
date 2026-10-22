import { useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface UseFileUploadHandlersOptions {
	form: UseFormReturn<{ file: File } & Record<string, unknown>>;
	setApiError: (error: string | null) => void;
	setIsDragging: (dragging: boolean) => void;
	setShowSampleFormat: (show: boolean) => void;
	onClose: () => void;
}

export function useFileUploadHandlers({
	form,
	setApiError,
	setIsDragging,
	setShowSampleFormat,
	onClose,
}: UseFileUploadHandlersOptions) {
	const file = form.watch('file');

	const handleFileSelect = useCallback(
		(selectedFile: File) => {
			form.setValue('file', selectedFile, { shouldValidate: true });
			setApiError(null);
		},
		[form, setApiError]
	);

	const handleFileChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			if (event.target.files?.[0]) {
				handleFileSelect(event.target.files[0]);
			}
		},
		[handleFileSelect]
	);

	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLElement>) => {
			event.preventDefault();
			event.stopPropagation();
			setIsDragging(false);
			if (event.dataTransfer.files?.[0]) {
				handleFileSelect(event.dataTransfer.files[0]);
			}
		},
		[handleFileSelect, setIsDragging]
	);

	const handleDragEnter = useCallback(
		(event: React.DragEvent<HTMLElement>) => {
			event.preventDefault();
			event.stopPropagation();
			setIsDragging(true);
		},
		[setIsDragging]
	);

	const handleDragLeave = useCallback(
		(event: React.DragEvent<HTMLElement>) => {
			event.preventDefault();
			event.stopPropagation();
			setIsDragging(false);
		},
		[setIsDragging]
	);

	const handleClose = useCallback(() => {
		form.reset();
		setApiError(null);
		setShowSampleFormat(false);
		onClose();
	}, [form, setApiError, setShowSampleFormat, onClose]);

	return {
		file,
		handleFileSelect,
		handleFileChange,
		handleDrop,
		handleDragEnter,
		handleDragLeave,
		handleClose,
	};
}
