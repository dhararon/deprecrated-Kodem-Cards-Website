import React from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Props interface for the ComponentName component.
 * @interface ComponentNameProps
 */
interface ComponentNameProps {
    /** The content to display in the component */
    children?: React.ReactNode;
    /** Additional CSS classes to apply to the component */
    className?: string;
    /** Whether the component is disabled */
    disabled?: boolean;
    /** The ID attribute for the component */
    id?: string;
    /** Callback when the component is clicked */
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    /** Additional props to pass to the component */
    [x: string]: any;
}

/**
 * ComponentName component description
 * 
 * @example
 * ```tsx
 * <ComponentName>Content</ComponentName>
 * <ComponentName className="custom-class">With custom class</ComponentName>
 * <ComponentName disabled>Disabled state</ComponentName>
 * ```
 */
export const ComponentName: React.FC<ComponentNameProps> = ({
    children,
    className = '',
    disabled = false,
    id,
    onClick,
    ...rest
}) => {
    const baseClasses = 'rounded-md p-4';
    const stateClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    const combinedClasses = twMerge(baseClasses, stateClasses, className);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        onClick?.(e);
    };

    return (
        <div
            id={id}
            className={combinedClasses}
            onClick={handleClick}
            aria-disabled={disabled}
            {...rest}
        >
            {children}
        </div>
    );
};

// Export the component as default
export default ComponentName; 