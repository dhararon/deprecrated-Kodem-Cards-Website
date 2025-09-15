import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * State interface for the context
 */
interface ContextNameState {
    /** Value stored in the context */
    value: string;
    /** Loading state flag */
    isLoading: boolean;
    /** Error state */
    error: string | null;
}

/**
 * Context interface that includes state and actions
 */
interface ContextNameContextType extends ContextNameState {
    /** Update the value */
    setValue: (newValue: string) => void;
    /** Reset the context to initial state */
    reset: () => void;
}

// Initial state
const initialState: ContextNameState = {
    value: '',
    isLoading: false,
    error: null
};

// Create the context with a default value
const ContextNameContext = createContext<ContextNameContextType | undefined>(undefined);

/**
 * Props for the ContextNameProvider component
 */
interface ContextNameProviderProps {
    /** Child components that will have access to the context */
    children: ReactNode;
    /** Optional initial value override */
    initialValue?: string;
}

/**
 * Provider component for the ContextName context
 * 
 * @example
 * ```tsx
 * <ContextNameProvider>
 *   <YourComponent />
 * </ContextNameProvider>
 * ```
 */
export const ContextNameProvider: React.FC<ContextNameProviderProps> = ({
    children,
    initialValue = initialState.value
}) => {
    // State initialization with the initial value
    const [state, setState] = useState<ContextNameState>({
        ...initialState,
        value: initialValue
    });

    // Action to update the value
    const setValue = useCallback((newValue: string) => {
        setState(prevState => ({
            ...prevState,
            value: newValue,
            error: null
        }));
    }, []);

    // Action to reset the state
    const reset = useCallback(() => {
        setState({
            ...initialState,
            value: initialValue
        });
    }, [initialValue]);

    // Context value that will be provided
    const contextValue: ContextNameContextType = {
        ...state,
        setValue,
        reset
    };

    return (
        <ContextNameContext.Provider value={contextValue}>
            {children}
        </ContextNameContext.Provider>
    );
};

/**
 * Custom hook to use the ContextName context
 * 
 * @example
 * ```tsx
 * const { value, setValue, isLoading, error, reset } = useContextName();
 * ```
 * 
 * @returns The context value
 * @throws Error if used outside of a ContextNameProvider
 */
export const useContextName = (): ContextNameContextType => {
    const context = useContext(ContextNameContext);

    if (context === undefined) {
        throw new Error('useContextName must be used within a ContextNameProvider');
    }

    return context;
};

export default ContextNameContext; 