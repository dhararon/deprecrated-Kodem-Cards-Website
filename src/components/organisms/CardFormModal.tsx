import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Textarea } from '@/components/atoms/Textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/atoms/Dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/atoms/Select';
import { PlusIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { Card as CardInterface, CardType, CardEnergy, CardRarity, CardSet } from '@/types/card';
import { addCard, updateCard, getCardById } from '@/lib/firebase/services/cardService';
import { Switch } from '@/components/ui/switch';
import { uploadFile, downloadAndUploadImage, sanitizeFileName, sanitizeCardFileName } from '@/lib/firebase/services/storageService';
import logger from '@/lib/utils/logger';

// Interfaz interna para el estado del componente, incluyendo el ID de Firestore
interface CardState extends CardInterface {
    id: string;
}

interface CardFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentCard: CardState | null;
    editMode: boolean;
    onCardSaved: (card: CardState) => void;
}

export const CardFormModal: React.FC<CardFormModalProps> = ({
    open,
    onOpenChange,
    currentCard,
    editMode,
    onCardSaved
}) => {
    const [isSaving, setIsSaving] = useState(false);
    
    // Valores iniciales para una nueva carta - usar useMemo para evitar recreaciones
    const initialEmptyCardState = useMemo(() => ({
        name: '',
        cardType: CardType.ADENDEI,
        cardEnergy: CardEnergy.PIRICA,
        rarity: CardRarity.COMUN,
        cardSet: CardSet.PROMOS,
        imageUrl: '',
        cardNumber: 0,
        power: undefined,
        sleep: undefined,
        description: '',
        rules: [''],
        artist: [''],
        fullId: '',
        languages: [],
        standardLegal: true,
        type: CardType.ADENDEI,
        energy: CardEnergy.PIRICA
    }), []);
    
    const [formData, setFormData] = useState<Partial<CardInterface>>(
        currentCard || initialEmptyCardState
    );

    // Estado para manejar carga de imágenes
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Actualizar estado del formulario cuando cambia currentCard
    useEffect(() => {
        console.log('CardFormModal - currentCard changed:', currentCard, 'editMode:', editMode);

        if (currentCard) {
            // Modo edición - cargar datos de la carta existente
            setFormData({
                ...currentCard,
                rules: currentCard.rules?.length ? currentCard.rules : [''],
                artist: currentCard.artist?.length ? currentCard.artist : [''],
                standardLegal: currentCard.standardLegal !== undefined ? currentCard.standardLegal : true,
            });
        } else {
            // Modo creación - reiniciar formulario
            setFormData(initialEmptyCardState);
        }
    }, [currentCard, editMode, open, initialEmptyCardState]);

    // Manejar el cambio en el tipo de carta para aplicar reglas específicas
    useEffect(() => {
        // Si cambia el tipo de carta, aplicar reglas específicas
        if (formData.cardType) {
            const cardTypeStr = formData.cardType.toLowerCase();
            
            // Regla 2 y 3: Validar energía según tipo de carta
            // Si es ROT, PROTECTOR, IXIM o BIO, la energía debe estar vacía
            if (['rot', 'protector', 'ixim', 'bio'].includes(cardTypeStr)) {
                setFormData(prev => ({
                    ...prev,
                    cardEnergy: undefined, // Vaciar campo de energía
                    energy: undefined      // También vaciar campo legacy
                }));
            }
            
            // Regla 4, 5 y 6: Validar poder y descanso según tipo
            if (['rot', 'protector', 'ixim', 'bio'].includes(cardTypeStr)) {
                // Si es ROT, PROTECTOR, IXIM o BIO, el ataque y descanso deben estar vacíos
                setFormData(prev => ({
                    ...prev,
                    power: undefined,
                    sleep: undefined,
                }));
            } else if (cardTypeStr.includes('adendei')) {
                // Para todos los tipos de ADENDEI, mantener valores existentes o usar valores por defecto
                setFormData(prev => ({
                    ...prev,
                    power: prev.power !== undefined ? prev.power : 0,
                    sleep: prev.sleep !== undefined ? prev.sleep : 0,
                }));
            } else if (cardTypeStr === 'rava') {
                // Para RAVA, el ataque y descanso siempre es 0 y 0
                setFormData(prev => ({
                    ...prev,
                    power: 0,
                    sleep: 0,
                }));
            }
        }
    }, [formData.cardType]);

    // Extraer número de carta del fullId automáticamente
    useEffect(() => {
        if (formData.fullId && formData.fullId.includes('-')) {
            // Obtener la parte después del guión
            const afterHyphen = formData.fullId.split('-')[1];
            if (afterHyphen) {
                // Extraer solo los dígitos numéricos
                const numericOnly = afterHyphen.replace(/\D/g, '');
                // Convertir a número si hay dígitos
                if (numericOnly.length > 0) {
                    const cardNumber = parseInt(numericOnly, 10);
                    // Actualizar el cardNumber solo si es diferente al valor actual
                    if (cardNumber !== formData.cardNumber) {
                        setFormData(prev => ({
                            ...prev,
                            cardNumber
                        }));
                    }
                }
            }
        }
    }, [formData.fullId, formData.cardNumber]);

    // Manejar el cambio en los campos del formulario
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target;
        const { name, type } = target;
        let value: string | number | boolean | undefined;

        if (target instanceof HTMLInputElement && type === 'checkbox') {
            value = target.checked;
        } else {
            value = target.value;
            
            // Convertir fullId a mayúsculas automáticamente
            if (name === 'fullId' && typeof value === 'string') {
                value = value.toUpperCase();
            }
        }

        const isNumericField = ['cardNumber', 'power', 'sleep'].includes(name);
        const finalValue = isNumericField ? (value === '' ? undefined : Number(value)) : value;

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    // Actualizar manejo de Select para enums
    const handleSelectChange = (value: string | null, field: keyof CardState) => {
        if (value === null) return;

        let finalValue: string | CardType | CardEnergy | CardRarity | CardSet | undefined = value;

        // Convertir a enum específico si es necesario
        if (field === 'cardType' && Object.values(CardType).includes(value as CardType)) {
            finalValue = value as CardType;
            
            // También actualizar el campo legacy 'type'
            setFormData(prev => ({
                ...prev,
                type: value as CardType
            }));
        } else if (field === 'cardEnergy' && Object.values(CardEnergy).includes(value as CardEnergy)) {
            finalValue = value as CardEnergy;
            
            // También actualizar el campo legacy 'energy'
            setFormData(prev => ({
                ...prev,
                energy: value as CardEnergy
            }));
        } else if (field === 'rarity' && Object.values(CardRarity).includes(value as CardRarity)) {
            finalValue = value as CardRarity;
        } else if (field === 'cardSet' && Object.values(CardSet).includes(value as CardSet)) {
            finalValue = value as CardSet;
        }

        setFormData(prev => ({
            ...prev,
            [field]: finalValue
        }));
    };

    // Manejar cambios en las reglas
    const handleRuleChange = (index: number, value: string) => {
        setFormData(prev => {
            const updatedRules = [...(prev.rules || [''])];
            updatedRules[index] = value;
            return {
                ...prev,
                rules: updatedRules
            };
        });
    };

    // Agregar regla
    const addRule = () => {
        setFormData(prev => ({
            ...prev,
            rules: [...(prev.rules || []), '']
        }));
    };

    // Eliminar regla
    const removeRule = (index: number) => {
        setFormData(prev => {
            const updatedRules = [...(prev.rules || [''])];
            updatedRules.splice(index, 1);
            return {
                ...prev,
                rules: updatedRules.length ? updatedRules : ['']
            };
        });
    };

    // Manejar cambios en la rareza
    const handleRarityChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            rarity: value as CardRarity
        }));
    };

    // Manejar cambios en artistas
    const handleArtistChange = (index: number, value: string) => {
        setFormData(prev => {
            const updatedArtists = [...(prev.artist || [''])];
            updatedArtists[index] = value;
            return {
                ...prev,
                artist: updatedArtists
            };
        });
    };

    // Agregar artista
    const addArtist = () => {
        setFormData(prev => ({
            ...prev,
            artist: [...(prev.artist || []), '']
        }));
    };

    // Eliminar artista
    const removeArtist = (index: number) => {
        setFormData(prev => {
            const updatedArtists = [...(prev.artist || [''])];
            updatedArtists.splice(index, 1);
            return {
                ...prev,
                artist: updatedArtists.length ? updatedArtists : ['']
            };
        });
    };

    // Preparar datos para guardar
    const prepareCardDataForSave = (): Omit<CardInterface, 'id'> => {
        return {
            name: formData.name || '',
            cardType: formData.cardType || CardType.ADENDEI,
            cardEnergy: formData.cardEnergy || undefined,
            rarity: formData.rarity || CardRarity.COMUN,
            cardSet: formData.cardSet || CardSet.PROMOS,
            imageUrl: formData.imageUrl || '',
            cardNumber: formData.cardNumber || 0,
            fullId: formData.fullId || '',
            power: formData.power,
            sleep: formData.sleep,
            description: formData.description || '',
            rules: formData.rules || [''],
            artist: formData.artist || [''],
            languages: formData.languages || [],
            standardLegal: formData.standardLegal !== undefined ? formData.standardLegal : true,
            prices: { high: 0, market: 0, low: 0 },
            type: formData.cardType || CardType.ADENDEI,
            energy: formData.cardEnergy || undefined
        };
    };

    // Guardar carta
    const handleSaveCard = async () => {
        try {
            setIsSaving(true);

            if (!formData.name) {
                toast.error("El nombre de la carta es obligatorio");
                return;
            }

            // Preparar datos de la carta
            const cardData = prepareCardDataForSave();

            let savedCardId: string;

            if (editMode && currentCard) {
                // Actualizar carta existente
                await updateCard(currentCard.id, cardData);
                savedCardId = currentCard.id;
            } else {
                // Crear nueva carta
                savedCardId = await addCard(cardData);
            }

            // Obtener la carta guardada con todas sus propiedades
            const savedCard = await getCardById(savedCardId);

            if (savedCard) {
                // Reiniciar el formulario a los valores predeterminados después de guardar
                setFormData({
                    name: '',
                    type: CardType.ADENDEI,
                    energy: CardEnergy.PIRICA,
                    rarity: CardRarity.COMUN,
                    cardSet: CardSet.PROMOS,
                    imageUrl: '',
                    cardNumber: 0,
                    power: undefined,
                    sleep: undefined,
                    description: '',
                    rules: [''],
                    artist: [''],
                    fullId: '',
                    prices: { high: 0, market: 0, low: 0 },
                    languages: [],
                    standardLegal: true,
                });

                onCardSaved(savedCard as CardState);
                toast.success(`¡Carta "${savedCard.name}" guardada con éxito!`);
            } else {
                toast.error("Error al recuperar la carta guardada");
            }
        } catch (error: Error | unknown) {
            logger.error("Error al guardar la carta:", { error });
            toast.error(`Error al guardar la carta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Manejo de imágenes
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        setIsUploadingImage(true);
        setUploadProgress(10);

        try {
            // Verificaciones
            if (!formData.cardSet) {
                toast.error("Selecciona un set antes de subir una imagen");
                return;
            }

            if (!formData.fullId) {
                toast.error("Ingresa un ID completo antes de subir una imagen");
                return;
            }

            const folderName = sanitizeFileName(formData.cardSet);
            const fileName = sanitizeCardFileName(formData.fullId);
            const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

            const filePath = `cards/${folderName}/${fileName}.${extension}`;

            setUploadProgress(30);
            const downloadURL = await uploadFile(file, filePath);
            setUploadProgress(100);

            // Actualizar el formulario con la nueva URL
            setFormData(prev => ({
                ...prev,
                imageUrl: downloadURL
            }));

            toast.success("Imagen subida correctamente");
        } catch (error: Error | unknown) {
            logger.error("Error al subir la imagen:", { error });
            toast.error(`Error al subir la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsUploadingImage(false);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleImageUrlDownload = async () => {
        if (!formData.imageUrl) {
            toast.error("Ingresa una URL de imagen primero");
            return;
        }

        if (!formData.cardSet) {
            toast.error("Selecciona un set antes de descargar la imagen");
            return;
        }

        if (!formData.fullId) {
            toast.error("Ingresa un ID completo antes de descargar la imagen");
            return;
        }

        setIsUploadingImage(true);
        setUploadProgress(10);

        try {
            setUploadProgress(30);
            const downloadURL = await downloadAndUploadImage(
                formData.imageUrl,
                formData.cardSet,
                formData.fullId
            );
            setUploadProgress(100);

            // Actualizar el formulario con la nueva URL
            setFormData(prev => ({
                ...prev,
                imageUrl: downloadURL
            }));

            toast.success("Imagen descargada y almacenada correctamente");
        } catch (error: Error | unknown) {
            logger.error("Error al descargar la imagen:", { error });
            toast.error(`Error al procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsUploadingImage(false);
            setUploadProgress(0);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl bg-white">
                <DialogHeader className="mb-2">
                    <DialogTitle>{editMode ? 'Editar Carta' : 'Crear Nueva Carta'}</DialogTitle>
                    <DialogDescription>
                        {editMode
                            ? 'Estás editando una carta existente.'
                            : 'Completa los detalles para crear una nueva carta.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Columna de vista previa e imagen - 3 columnas */}
                    <div className="md:col-span-3 flex flex-col space-y-3">
                        <h3 className="text-sm font-medium">Vista Previa</h3>
                        <div className="w-full aspect-[2.5/3.5] rounded-lg border-2 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
                            {isUploadingImage ? (
                                <div className="flex flex-col items-center justify-center p-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                    <p className="text-xs text-gray-500">Subiendo... {uploadProgress}%</p>
                                </div>
                            ) : formData.imageUrl ? (
                                <img
                                    src={formData.imageUrl}
                                    alt={formData.name || 'Vista previa'}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/300x420/eee/999?text=Error+de+imagen';
                                    }}
                                />
                            ) : (
                                <div className="text-center p-4 text-gray-400">
                                    <p>Sin imagen</p>
                                    <p className="text-xs">Ingresa una URL o sube un archivo</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div>
                                <label className="block text-sm mb-1">URL de imagen</label>
                                <div className="flex space-x-1 mb-2">
                                    <Input
                                        name="imageUrl"
                                        value={formData.imageUrl || ''}
                                        onChange={handleInputChange}
                                        placeholder="URL de imagen"
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleImageUrlDownload}
                                        variant="outline"
                                        size="sm"
                                        disabled={isUploadingImage || !formData.imageUrl || !formData.fullId || !formData.cardSet}
                                        title="Descargar imagen"
                                    >
                                        <ArrowUpTrayIcon className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center justify-center">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/gif,image/webp"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        ref={fileInputRef}
                                        disabled={isUploadingImage || !formData.fullId || !formData.cardSet}
                                    />
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        disabled={isUploadingImage || !formData.fullId || !formData.cardSet}
                                    >
                                        Subir imagen
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna de datos básicos - 4 columnas */}
                    <div className="md:col-span-4 space-y-3">
                        <h3 className="text-sm font-medium">Datos Básicos</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm mb-1">Nombre</label>
                                <Input
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleInputChange}
                                    placeholder="Nombre de la carta"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm mb-1">Tipo</label>
                                    <Select
                                        value={formData.cardType || CardType.ADENDEI}
                                        onValueChange={(value) => handleSelectChange(value, 'cardType')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar tipo" />
                                        </SelectTrigger>
                                        <SelectContent className="capitalize">
                                            {Object.values(CardType).map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Energía</label>
                                    <Select
                                        value={formData.cardEnergy || ''}
                                        onValueChange={(value) => handleSelectChange(value, 'cardEnergy')}
                                        disabled={['rot', 'protector', 'ixim', 'bio'].includes(String(formData.cardType).toLowerCase())}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar energía" />
                                        </SelectTrigger>
                                        <SelectContent className="capitalize">
                                            {Object.values(CardEnergy).map((energy) => (
                                                <SelectItem key={energy} value={energy}>
                                                    {energy}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {['rot', 'protector', 'ixim', 'bio'].includes(String(formData.cardType).toLowerCase()) && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            No se requiere energía para este tipo de carta
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm mb-1">Ataque</label>
                                    <Input
                                        name="power"
                                        type="number"
                                        value={formData.power !== undefined ? formData.power : ''}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        disabled={
                                            ['rot', 'protector', 'ixim', 'bio'].includes(String(formData.cardType).toLowerCase()) ||
                                            String(formData.cardType).toLowerCase() === 'rava'
                                        }
                                    />
                                    {['rot', 'protector', 'ixim', 'bio'].includes(String(formData.cardType).toLowerCase()) && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            No aplica para este tipo de carta
                                        </p>
                                    )}
                                    {String(formData.cardType).toLowerCase() === 'rava' && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Siempre es 0 para Rava
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Descanso</label>
                                    <Input
                                        name="sleep"
                                        type="number"
                                        value={formData.sleep !== undefined ? formData.sleep : ''}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        disabled={
                                            ['rot', 'protector', 'ixim', 'bio'].includes(String(formData.cardType).toLowerCase()) ||
                                            String(formData.cardType).toLowerCase() === 'rava'
                                        }
                                    />
                                    {['rot', 'protector', 'ixim', 'bio'].includes(String(formData.cardType).toLowerCase()) && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            No aplica para este tipo de carta
                                        </p>
                                    )}
                                    {String(formData.cardType).toLowerCase() === 'rava' && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Siempre es 0 para Rava
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Descripción</label>
                                <Textarea
                                    name="description"
                                    value={formData.description || ''}
                                    onChange={handleInputChange}
                                    placeholder="Descripción de la carta"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Columna de datos adicionales - 5 columnas */}
                    <div className="md:col-span-5 space-y-3">
                        <h3 className="text-sm font-medium">Datos Adicionales</h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1">ID Completo</label>
                                <Input
                                    name="fullId"
                                    value={formData.fullId || ''}
                                    onChange={handleInputChange}
                                    placeholder="ej. IDRMP-001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Rareza</label>
                                <Select
                                    value={formData.rarity || CardRarity.COMUN}
                                    onValueChange={(value) => handleRarityChange(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar rareza" />
                                    </SelectTrigger>
                                    <SelectContent className="capitalize">
                                        {Object.values(CardRarity).map((rarity) => (
                                            <SelectItem key={rarity} value={rarity}>
                                                {rarity}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Set</label>
                                <Select
                                    value={formData.cardSet || CardSet.PROMOS}
                                    onValueChange={(value) => handleSelectChange(value, 'cardSet')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar set" />
                                    </SelectTrigger>
                                    <SelectContent className="capitalize">
                                        {Object.values(CardSet).map((set) => (
                                            <SelectItem key={set} value={set}>
                                                {set}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Número</label>
                                <Input
                                    name="cardNumber"
                                    type="number"
                                    value={formData.cardNumber || 0}
                                    onChange={handleInputChange}
                                    placeholder="Número"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm">Artistas</label>
                                    <Button onClick={addArtist} size="sm" variant="ghost" className="h-6 w-6 p-0">
                                        <PlusIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="space-y-1 max-h-[100px] overflow-y-auto">
                                    {formData.artist?.map((artist, index) => (
                                        <div key={index} className="flex items-center space-x-1">
                                            <Input
                                                value={artist}
                                                onChange={(e) => handleArtistChange(index, e.target.value)}
                                                placeholder={`Artista ${index + 1}`}
                                                className="h-8"
                                            />
                                            <Button
                                                onClick={() => removeArtist(index)}
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                                disabled={formData.artist?.length === 1}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm">Reglas de Carta</label>
                                <Button onClick={addRule} size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <PlusIcon className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-1 max-h-[150px] overflow-y-auto">
                                {formData.rules?.map((rule, index) => (
                                    <div key={index} className="flex items-start space-x-1">
                                        <Textarea
                                            value={rule}
                                            onChange={(e) => handleRuleChange(index, e.target.value)}
                                            placeholder={`Regla ${index + 1}`}
                                            rows={2}
                                            className="flex-1 text-sm"
                                        />
                                        <Button
                                            onClick={() => removeRule(index)}
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 mt-1"
                                            disabled={formData.rules?.length === 1}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="standardLegal"
                                checked={formData.standardLegal === true}
                                onCheckedChange={(checked) => setFormData(prev => ({
                                    ...prev,
                                    standardLegal: checked === true
                                }))}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-700"
                            />
                            <label htmlFor="standardLegal" className="text-sm cursor-pointer flex items-center">
                                Legal en formato estándar
                                {formData.standardLegal && (
                                    <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">Activo</span>
                                )}
                            </label>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSaveCard} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Carta'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}; 