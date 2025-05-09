import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SearchInput } from './SearchInput';

const meta = {
    title: 'Molecules/SearchInput',
    component: SearchInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        placeholder: {
            control: 'text',
            description: 'Texto de marcador de posición'
        },
        loading: {
            control: 'boolean',
            description: 'Indica si está cargando'
        },
        onChange: { action: 'changed' },
        onSearch: { action: 'searched' }
    },
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        placeholder: 'Buscar...',
        value: '',
        onChange: () => { },
    },
};

export const WithValue: Story = {
    args: {
        placeholder: 'Buscar...',
        value: 'Carta de Agua',
        onChange: () => { },
    },
};

export const Loading: Story = {
    args: {
        placeholder: 'Buscar...',
        value: 'Dragón',
        loading: true,
        onChange: () => { },
    },
};

// Componente contenedor para demo interactiva
const SearchInputContainer = () => {
    const [value, setValue] = useState('');

    return (
        <div style={{ width: '300px' }}>
            <SearchInput
                value={value}
                onChange={setValue}
                placeholder="Escribe para buscar..."
                onSearch={() => console.log('Buscando:', value)}
            />
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Valor actual: {value || '(vacío)'}
            </div>
        </div>
    );
};

export const Interactive: Story = {
    args: {
        value: '',
        onChange: () => { },
        placeholder: 'Escribe para buscar...',
    },
    render: () => <SearchInputContainer />
}; 