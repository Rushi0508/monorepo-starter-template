import { Input } from '@repo/ui/components/input';

interface CustomInputProps
	extends Omit<React.ComponentProps<'input'>, 'onChange'> {
	onChange?: (
		e: React.ChangeEvent<HTMLInputElement> | number | undefined
	) => void;
}

const CustomInput = ({ ...props }: CustomInputProps) => {
	return (
		<Input
			{...props}
			onChange={(e) => {
				if (props.type === 'number') {
					const num = e.target.valueAsNumber;
					props.onChange?.(Number.isNaN(num) ? undefined : num);
				} else {
					props.onChange?.(e);
				}
			}}
		/>
	);
};

export default CustomInput;
