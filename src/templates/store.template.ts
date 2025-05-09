import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Interface for the store state
 */
interface StoreNameState {
    /** Example value stored in the state */
    value: string;
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
    /** Selected items collection */
    selectedItems: string[];
}

/**
 * Interface for the store actions
 */
interface StoreNameActions {
    /** Set the value */
    setValue: (newValue: string) => void;
    /** Reset the store to initial state */
    reset: () => void;
    /** Add an item to the selected items */
    addItem: (itemId: string) => void;
    /** Remove an item from selected items */
    removeItem: (itemId: string) => void;
    /** Set loading state */
    setLoading: (isLoading: boolean) => void;
    /** Set error message */
    setError: (error: string | null) => void;
}

/**
 * Combined interface for state and actions
 */
type StoreNameStore = StoreNameState & StoreNameActions;

/**
 * Initial state for the store
 */
const initialState: StoreNameState = {
    value: '',
    isLoading: false,
    error: null,
    selectedItems: []
};

/**
 * Create the store with Zustand
 * 
 * @example
 * ```tsx
 * // In a component
 * const { value, setValue, selectedItems, addItem } = useStoreName();
 * ```
 */
export const useStoreName = create<StoreNameStore>()(
    devtools(
        (set) => ({
            // Initial state
            ...initialState,

            // Actions
            setValue: (newValue) => {
                set({ value: newValue }, false, 'setValue');
            },

            reset: () => {
                set(initialState, false, 'reset');
            },

            addItem: (itemId) => {
                set(
                    (state) => ({
                        selectedItems: [...state.selectedItems, itemId]
                    }),
                    false,
                    'addItem'
                );
            },

            removeItem: (itemId) => {
                set(
                    (state) => ({
                        selectedItems: state.selectedItems.filter(
                            (id) => id !== itemId
                        )
                    }),
                    false,
                    'removeItem'
                );
            },

            setLoading: (isLoading) => {
                set({ isLoading }, false, 'setLoading');
            },

            setError: (error) => {
                set({ error }, false, 'setError');
            }
        }),
        { name: 'store-name-store' }
    )
);

export default useStoreName; 