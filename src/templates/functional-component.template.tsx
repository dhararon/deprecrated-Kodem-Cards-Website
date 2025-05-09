import React from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Props for the ComponentName component.
 */
interface ComponentNameProps {
    /** The component content */
    children?: React.ReactNode;
    /** Custom CSS class names */
    className?: string;
}

/**
 * A functional component that [describe what it does].
 * 
 * @param props - Component props
 * @returns A React component
 */
export const ComponentName: React.FC<ComponentNameProps> = ({
    children,
    className = ''
}) => {
    const classes = twMerge('base-style', className);

    return (
        <div className={classes}>
            {children}
        </div>
    );
};

export default ComponentName; 