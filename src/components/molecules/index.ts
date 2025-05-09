// CardImage exports
export * from "./CardImage";

// SearchBar exports
export * from "./SearchBar";

// Pagination exports
export * from "./Pagination";

// ModalDialog exports
export * from "./ModalDialog";

// CardsGrid exports
export * from "./CardsGrid";

// Sidebar exports
export * from "./Sidebar";

// UserMenu exports
export * from "./UserMenu";

// ThemeSwitcher exports
export * from "./ThemeSwitcher";

// CardCarousel exports
export * from "./CardCarousel";
export { default as CardCarousel } from "./CardCarousel";

// CollectionCard exports
export * from "./CollectionCard";
export { default as CollectionCard } from "./CollectionCard";

// Re-exportar componentes de Sidebar
export { Sidebar } from './Sidebar';
export { sidebarIcons, createDefaultSections } from './SidebarUtils';
export type { SidebarSection, SidebarLink } from './SidebarUtils';

// Re-exportar el hook para ser usado por los consumidores
export { useFormField } from './FormUtils'; 