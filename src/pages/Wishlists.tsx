import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { Spinner } from '@/components/atoms/Spinner';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Button } from '@/components/atoms/Button';
import { Plus, Heart, Edit, Trash2, ChevronRight, Save } from 'lucide-react';
import { WishList } from '@/types/wishlist';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/atoms/Dialog';
import { Input } from '@/components/atoms/Input';
import { Textarea } from '@/components/atoms/Textarea';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Label } from '@/components/atoms/Label';
import { useLocation } from 'wouter';
import { Image } from '@/components/atoms/Image';

/**
 * Wishlists - Página principal para gestionar las listas de deseos
 * @returns Componente React de la página de listas de deseos
 */
export default function Wishlists() {
    const { user } = useAuth();
    const { 
        userWishlists, 
        loading, 
        createWishlist, 
        deleteWishlist,
        updateWishlist,
        selectWishlist,
    } = useWishlist();
    const [, navigate] = useLocation();

    // Estados para el diálogo de creación/edición
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [editingList, setEditingList] = useState<WishList | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Abrir diálogo de creación de lista
    const handleOpenCreateDialog = () => {
        setDialogMode('create');
        setFormData({
            name: '',
            description: '',
            isPublic: false
        });
        setEditingList(null);
        setIsDialogOpen(true);
    };

    // Abrir diálogo de edición de lista
    const handleOpenEditDialog = (list: WishList) => {
        setDialogMode('edit');
        setFormData({
            name: list.name,
            description: list.description || '',
            isPublic: list.isPublic
        });
        setEditingList(list);
        setIsDialogOpen(true);
    };

    // Manejar cambios en el formulario
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Manejar cambio en checkbox
    const handleCheckboxChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            isPublic: checked
        }));
    };

    // Crear o actualizar lista
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (dialogMode === 'create') {
                await createWishlist(formData.name, formData.description, formData.isPublic);
            } else if (dialogMode === 'edit' && editingList) {
                await updateWishlist(editingList.id, {
                    name: formData.name,
                    description: formData.description,
                    isPublic: formData.isPublic
                });
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error al guardar lista:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Eliminar lista
    const handleDeleteList = async (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta lista? Esta acción no se puede deshacer.')) {
            try {
                await deleteWishlist(id);
            } catch (error) {
                console.error('Error al eliminar lista:', error);
            }
        }
    };

    // Ver detalles de lista
    const handleViewList = async (list: WishList) => {
        await selectWishlist(list.id);
        navigate(`/wishlist/${list.id}`);
    };

    // Si no hay usuario autenticado, mostrar mensaje
    if (!user) {
        return (
            <EmptyState
                title="Acceso no autorizado"
                description="Debes iniciar sesión para ver tus listas de deseos"
                icon="lock"
            />
        );
    }

    // Si está cargando, mostrar spinner
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="px-3 py-4 sm:container sm:px-4 sm:py-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold">Mis Listas de Deseos</h1>
                <Button 
                    onClick={handleOpenCreateDialog}
                    className="flex items-center gap-2"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Nueva Lista</span>
                </Button>
            </div>

            {userWishlists.length === 0 ? (
                <EmptyState
                    title="No tienes listas de deseos"
                    description="Crea tu primera lista para guardar las cartas que deseas conseguir"
                    icon="heart"
                    action={
                        <Button onClick={handleOpenCreateDialog} className="mt-4">
                            Crear Lista
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {userWishlists.map(list => (
                        <div 
                            key={list.id} 
                            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
                                {list.imageUrl ? (
                                    <Image
                                        src={list.imageUrl}
                                        alt={list.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Heart className="h-16 w-16 text-primary/30" />
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-lg mb-1 truncate">{list.name}</h3>
                                <p className="text-muted-foreground text-sm mb-3 line-clamp-2 h-10">
                                    {list.description || "Sin descripción"}
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm">
                                        <span className="font-medium">{list.cardCount}</span> cartas
                                    </p>
                                    <div className="flex space-x-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleOpenEditDialog(list)}
                                        >
                                            <Edit size={16} />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteList(list.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="icon"
                                            className="h-8 w-8 ml-2"
                                            onClick={() => handleViewList(list)}
                                        >
                                            <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Diálogo de creación/edición de lista */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === 'create' ? 'Crear nueva lista' : 'Editar lista'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre de la lista</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Mi lista de deseos"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción (opcional)</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe tu lista de deseos..."
                                rows={3}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="isPublic" 
                                checked={formData.isPublic} 
                                onCheckedChange={handleCheckboxChange} 
                            />
                            <Label htmlFor="isPublic">Lista pública</Label>
                        </div>
                        <DialogFooter className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !formData.name.trim()}
                                className="flex items-center gap-2"
                            >
                                {isSubmitting ? <Spinner size="sm" /> : (
                                    dialogMode === 'create' ? <Plus size={16} /> : <Save size={16} />
                                )}
                                {dialogMode === 'create' ? 'Crear' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
} 