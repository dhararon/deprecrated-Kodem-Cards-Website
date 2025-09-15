import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	disabled?: boolean;
	className?: string;
	id?: string;
}

export const Switch: React.FC<SwitchProps> = ({ 
	checked = false, 
	onCheckedChange, 
	disabled = false,
	className,
	id
}) => {
	const handleClick = () => {
		if (!disabled && onCheckedChange) {
			onCheckedChange(!checked);
		}
	};

	return (
		<button
			type="button"
			id={id}
			role="switch"
			aria-checked={checked}
			disabled={disabled}
			onClick={handleClick}
			className={cn(
				'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
				'disabled:cursor-not-allowed disabled:opacity-50',
				checked 
					? 'bg-primary data-[state=checked]:bg-primary' 
					: 'bg-input data-[state=unchecked]:bg-input',
				className
			)}
		>
			<span
				className={cn(
					'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
					checked ? 'translate-x-5' : 'translate-x-0'
				)}
			/>
		</button>
	);
};
