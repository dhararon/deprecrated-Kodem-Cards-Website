import { StoreApi, UseBoundStore } from 'zustand';

/**
 * Versión segura para obtener un valor del store sin usar hooks
 * @param store La instancia del store (no el hook)
 * @param selector El selector para extraer datos del store
 * @returns El valor seleccionado
 */
export function getFromStore<T, U>(
  store: StoreApi<T>,
  selector: (state: T) => U
): U {
  return selector(store.getState());
}

/**
 * Versión simplificada para usar selectores.
 * No modifica el hook original, solo devuelve una función para hacer selecciones.
 * 
 * Este enfoque es compatible con las reglas de linting y no causa problemas de Fast Refresh.
 * 
 * @param useStore Hook del store de Zustand
 * @param selector Función selectora
 * @returns Una función que puede ser usada en componentes React
 */
export function createSelector<T, U>(
  useStore: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => U
) {
  return () => useStore(selector);
} 