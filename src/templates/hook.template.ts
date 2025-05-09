import { useState, useEffect, useCallback } from 'react';

/**
 * Interface for the hook parameters
 */
interface UseCustomHookParams {
    /** Initial value for the state */
    initialValue?: string;
    /** Optional callback when value changes */
    onChange?: (value: string) => void;
}

/**
 * Interface for the hook return values
 */
interface UseCustomHookReturn {
    /** Current value */
    value: string;
    /** Function to update the value */
    setValue: (newValue: string) => void;
    /** Flag indicating if the hook is in loading state */
    isLoading: boolean;
    /** Error message if something went wrong */
    error: string | null;
    /** Reset the hook state to initial values */
    reset: () => void;
}

/**
 * A custom React hook that [describe what it does]
 * 
 * @example
 * const { value, setValue } = useCustomHook({
 *   initialValue: 'valor inicial',
 *   onChange: (newValue) => handleChange(newValue)
 * });
 * 
 * @param params - Hook parameters
 * @returns Hook state and functions
 */
export const useCustomHook = ({
    initialValue = '',
    onChange
}: UseCustomHookParams = {}): UseCustomHookReturn => {
    // State
    const [value, setValueState] = useState<string>(initialValue);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Set value with side effects
    const setValue = useCallback((newValue: string) => {
        try {
            setValueState(newValue);
            onChange?.(newValue);
        } catch (err) {
            setError(`Error setting value: ${err}`);
        }
    }, [onChange]);

    // Reset function
    const reset = useCallback(() => {
        setValueState(initialValue);
        setIsLoading(false);
        setError(null);
    }, [initialValue]);

    // Example effect to run on mount or when dependencies change
    useEffect(() => {
        // Example async operation
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 500));
                setIsLoading(false);
            } catch (err) {
                setError(`Error fetching data: ${err}`);
                setIsLoading(false);
            }
        };

        fetchData();

        // Cleanup function
        return () => {
            // Any cleanup code here
        };
    }, []);

    return {
        value,
        setValue,
        isLoading,
        error,
        reset
    };
};

export default useCustomHook; 