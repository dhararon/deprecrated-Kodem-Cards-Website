import React, { useState, useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import {
    ChevronLeft,
    Copy,
    Printer,
    Eye,
    User,
    Calendar,
    Download,
    Grid,
    List,
    X,
    CheckCircle,
    AlertCircle,
    Share2
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Separator } from '@/components/atoms/Separator';
import { getDeckWithCards, getDeckById, incrementDeckViews } from '@/lib/firebase/services/deckService';
import { DeckWithCards } from '@/types/deck';
import { CardDetails } from '@/types/card';
import DeckCard from '@/components/atoms/DeckCard';
import DeckCardRow from '@/components/molecules/DeckCardRow';
import DeckDetailHeader from '@/components/organisms/DeckDetailHeader';
import DeckSelectedCard from '@/components/organisms/DeckSelectedCard';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';

/**
 * Página para visualizar un mazo existente
 */
const DeckDetail: React.FC = () => {
    // Obtener el ID del mazo de la URL
    const [match, params] = useRoute<{ id: string }>('/decks/:id');
    const id = match && params ? params.id : '';
    const [, navigate] = useLocation();
    const { user, isLoading: authLoading } = useAuth();

    // Estados
    const [deck, setDeck] = useState<DeckWithCards | null>(null);
    const [selectedCard, setSelectedCard] = useState<CardDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showBackgroundModal, setShowBackgroundModal] = useState(false);
    const [selectedBackground, setSelectedBackground] = useState<string>('default');
    const [deckLoaded, setDeckLoaded] = useState(false);
    
    // Estados para la generación de imagen
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStep, setGenerationStep] = useState('');
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

    // Opciones de fondo
    const backgroundOptions = [
        { id: 'default', name: 'Por defecto', color: '#ffffff' },
        { id: 'dark', name: 'Oscuro', color: '#1e293b' },
        { id: 'blue', name: 'Azul', color: '#dbeafe' },
        { id: 'green', name: 'Verde', color: '#dcfce7' },
        { id: 'purple', name: 'Púrpura', color: '#f3e8ff' },
        { id: 'brown', name: 'Marrón', color: '#f5d0a9' }
    ];

    // Detectar si es pantalla móvil
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);

        return () => {
            window.removeEventListener('resize', checkIfMobile);
        };
    }, []);

    // Cargar datos del mazo
    useEffect(() => {
        const loadDeckData = async () => {
            if (!id || deckLoaded) {
                return;
            }
            
            if (authLoading) {
                // Todavía estamos cargando la autenticación
                return;
            }

            if (!id) {
                setError('ID de mazo no válido');
                setIsLoading(false);
                setDeckLoaded(true);
                return;
            }
            try {
                setIsLoading(true);
                
                // Obtener el deck completo con cartas
                // Las reglas de Firestore ya manejan los permisos:
                // - Mazos públicos: accesibles para todos
                // - Mazos privados: solo para el propietario
                const deckData = await getDeckWithCards(id);
                if (!deckData) {
                    setError('No se pudo encontrar el mazo. Puede ser privado o no existir.');
                    setIsLoading(false);
                    setDeckLoaded(true);
                    return;
                }
                
                setSelectedCard(null);
                setDeck(deckData);
                if (deckData.cards.length > 0) {
                    setSelectedCard(deckData.cards[0]);
                }
                
                // Incrementar contador de vistas si es público
                if (deckData.isPublic) {
                    try {
                        await incrementDeckViews(id);
                    } catch (err) {
                        console.warn('No se pudo incrementar vistas:', err);
                    }
                }
            } catch (err) {
                console.error('Error al cargar el mazo:', err);
                setError('Error al cargar el mazo. Verifica que sea público o que tengas permiso para verlo.');
            } finally {
                setIsLoading(false);
                setDeckLoaded(true);
            }
        };
        loadDeckData();
    }, [id, authLoading, user, deckLoaded]);

    // Forzar recarga al volver de la edición (cuando la pestaña se vuelve visible)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                setDeckLoaded(false);
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    // Sincronizar selectedCard con el deck cargado
    useEffect(() => {
        if (deck && deck.cards && deck.cards.length > 0) {
            // Si la carta seleccionada no existe en el nuevo deck, seleccionar la primera
            if (!selectedCard || !deck.cards.some(card => card.id === selectedCard.id)) {
                setSelectedCard(deck.cards[0]);
            }
        } else {
            setSelectedCard(null);
        }
    }, [deck]);

    // Helpers y lógica de negocio

    // Agrupar cartas por tipo
    const getCardsByType = () => {
        if (!deck?.cards) return {};

        const grouped: Record<string, CardDetails[]> = {};

        deck.cards.forEach(card => {
            const type = card.type || 'Otros';
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(card);
        });

        return grouped;
    };

    // Normalizar tipo de carta para comparación
    const normalizeCardType = (type: string): string => {
        if (!type) return 'Adendei';
        const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        return normalizedType;
    };

    // Contar cartas por ID (para manejar duplicados)
    const getCardCount = (cardId: string): number => {
        if (!deck?.cards) return 0;
        return deck.cards.filter(card => card.id === cardId).length;
    };

    // Obtener cartas únicas (para mostrar en la lista)
    const getUniqueCards = (cards: CardDetails[]): CardDetails[] => {
        const uniqueMap = new Map<string, CardDetails>();
        cards.forEach(card => {
            if (!uniqueMap.has(card.id)) {
                uniqueMap.set(card.id, card);
            }
        });
        return Array.from(uniqueMap.values());
    };

    // Formatear fecha
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Fecha desconocida';

        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    // Obtener la cantidad real de cartas en el mazo
    const getDeckCardCount = (): number => {
        if (deck?.deckSlots) return deck.deckSlots.length;
        if (deck?.cardIds) return deck.cardIds.length;
        return deck?.cards?.length || 0;
    };

    // Copiar lista de mazo al portapapeles
    const copyDeckList = () => {
        if (!deck) return;

        // Obtener cartas ordenadas
        const orderedCards = getOrderedCards();

        let deckText = `# ${deck.name}\n\n`;
        deckText += `## Lista de cartas en orden estratégico (${getDeckCardCount()})\n`;

        // Añadir cada carta con su información
        orderedCards.forEach(card => {
            deckText += `${card.fullId || 'ID-???'} | ${card.name} | ${card.type || 'Sin tipo'} | ${card.setName || card.cardSet || 'Sin set'}\n`;
        });

        navigator.clipboard.writeText(deckText);
        alert('Lista de mazo copiada al portapapeles');
    };

    // Compartir mazo - copiar URL al portapapeles
    const handleShareDeck = async () => {
        try {
            if (!id) {
                toast.error('No se pudo obtener el ID del mazo');
                return;
            }

            const deckUrl = `${window.location.origin}/decks/${id}`;
            await navigator.clipboard.writeText(deckUrl);
            toast.success('URL del mazo copiada al portapapeles');
        } catch (error) {
            console.error('Error al copiar URL:', error);
            toast.error('No se pudo copiar la URL del mazo');
        }
    };

    // Obtener las cartas en el orden visual (prioridad: deckSlots > cardIds > cards)
    const getCardsInVisualOrder = (): CardDetails[] => {
        if (deck?.deckSlots && deck.cards) {
            // Ordenar slots por fila y columna
            const cardMap = new Map(deck.cards.map(card => [card.id, card]));
            const sortedSlots = [...deck.deckSlots].sort((a, b) =>
                a.row !== b.row ? a.row - b.row : a.col - b.col
            );
            return sortedSlots
                .map(slot => cardMap.get(slot.cardId))
                .filter((card): card is CardDetails => !!card);
        }
        if (deck?.cardIds && deck.cards) {
            return deck.cardIds
                .map(cardId => deck.cards.find(card => card.id === cardId))
                .filter((card): card is CardDetails => !!card);
        }
        return deck?.cards || [];
    };

    // Obtener las cartas en el orden específico de la vista de lista
    const getOrderedCards = (): CardDetails[] => {
        // Usar el orden visual como base
        const visualCards = getCardsInVisualOrder();
        if (!visualCards.length) return [];

        // Filtrar cartas por tipo
        const protectorCards = visualCards.filter(card => normalizeCardType(card.type) === 'Protector');
        const adendeiCards = visualCards.filter(card => normalizeCardType(card.type).toLowerCase().includes('adendei'));
        const bioCards = visualCards.filter(card => normalizeCardType(card.type) === 'Bio');
        const iximCards = visualCards.filter(card => normalizeCardType(card.type) === 'Ixim');
        const rotCards = visualCards.filter(card => normalizeCardType(card.type) === 'Rot');
        const otherCards = visualCards.filter(card =>
            normalizeCardType(card.type) !== 'Protector' &&
            !normalizeCardType(card.type).toLowerCase().includes('adendei') &&
            normalizeCardType(card.type) !== 'Bio' &&
            normalizeCardType(card.type) !== 'Ixim' &&
            normalizeCardType(card.type) !== 'Rot'
        );

        // Crear una lista ordenada según las especificaciones
        const orderedCards: CardDetails[] = [];

        // 1. Protector principal y 3 adendei principales
        if (protectorCards.length > 0) {
            orderedCards.push(protectorCards[0]);
        }
        for (let i = 0; i < 3; i++) {
            if (adendeiCards.length > i) {
                orderedCards.push(adendeiCards[i]);
            }
        }
        // 2. Segundo protector y bio
        if (protectorCards.length > 1) {
            orderedCards.push(protectorCards[1]);
        }
        if (bioCards.length > 0) {
            orderedCards.push(bioCards[0]);
        }
        // 3. Cartas Ixim
        iximCards.forEach(card => {
            if (!orderedCards.some(c => c.id === card.id)) {
                orderedCards.push(card);
            }
        });
        // 4. Cartas Rot
        rotCards.forEach(card => {
            if (!orderedCards.some(c => c.id === card.id)) {
                orderedCards.push(card);
            }
        });
        // 5. Resto de adendei y otras cartas
        const remainingAdendeis = adendeiCards.slice(3);
        const combinedOtherCards = [...remainingAdendeis, ...otherCards];
        combinedOtherCards.forEach(card => {
            if (!orderedCards.some(c => c.id === card.id)) {
                orderedCards.push(card);
            }
        });
        // Agregar cualquier carta que no haya sido incluida aún
        visualCards.forEach(card => {
            if (!orderedCards.some(c => c.id === card.id)) {
                orderedCards.push(card);
            }
        });
        return orderedCards;
    };

    // Imprimir el mazo
    const handlePrintDeck = () => {
        if (!deck) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor permite las ventanas emergentes para imprimir el mazo');
            return;
        }

        // Obtener cartas ordenadas según la vista de lista
        const orderedCards = getOrderedCards();
        
        // Obtener cartas únicas para imprimir
        const uniqueCardMap = new Map<string, { card: CardDetails, count: number }>();
        
        // Contar las cartas
        deck.cards.forEach(card => {
            if (!uniqueCardMap.has(card.id)) {
                uniqueCardMap.set(card.id, { 
                    card, 
                    count: 1 
                });
            } else {
                const current = uniqueCardMap.get(card.id);
                if (current) {
                    uniqueCardMap.set(card.id, {
                        ...current,
                        count: current.count + 1
                    });
                }
            }
        });

        // Crear el contenido HTML para la impresión
        let printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mazo: ${deck.name}</title>
                <meta charset="utf-8" />
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 800px;
                        margin: 20px auto;
                        padding: 0 20px;
                        line-height: 1.5;
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 5px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 5px;
                    }
                    .deck-info {
                        font-size: 14px;
                        color: #555;
                        margin-bottom: 20px;
                    }
                    .section-title {
                        font-size: 18px;
                        margin-top: 20px;
                        margin-bottom: 10px;
                        font-weight: bold;
                        border-bottom: 1px solid #ddd;
                    }
                    .card-list {
                        list-style-type: none;
                        padding: 0;
                        margin: 0 0 20px 0;
                    }
                    .card-item {
                        padding: 3px 0;
                        display: grid;
                        grid-template-columns: 120px 1fr 120px;
                        align-items: center;
                        margin-bottom: 4px;
                    }
                    .card-id {
                        font-family: monospace;
                        font-size: 12px;
                        color: #666;
                        padding-right: 10px;
                    }
                    .card-set {
                        text-align: right;
                        padding: 2px 5px;
                        background-color: #f0f4f9;
                        border-radius: 3px;
                        font-size: 12px;
                        color: #4a5568;
                        font-style: italic;
                    }
                    .card-name {
                        font-size: 14px;
                    }
                    .card-type {
                        font-size: 12px;
                        color: #666;
                    }
                    .footer {
                        border-top: 1px solid #ddd;
                        margin-top: 30px;
                        padding-top: 10px;
                        font-size: 12px;
                        color: #777;
                        text-align: center;
                    }
                    @media print {
                        body {
                            padding: 0;
                            margin: 10px;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <button class="no-print" onclick="window.print()" style="position: fixed; top: 20px; right: 20px; padding: 10px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Imprimir mazo
                </button>
                
                <h1>${deck.name}</h1>
                <div class="deck-info">
                    ${getDeckCardCount()} cartas • Creado por ${deck.userName || 'Usuario anónimo'} • ${formatDate(deck.createdAt)}
                </div>
                
                <div class="section-title">Lista de cartas en orden estratégico</div>
                <ul class="card-list">`;

        // Agregar cartas en el orden estratégico
        orderedCards.forEach(card => {
            const uniqueCardData = uniqueCardMap.get(card.id);
            if (uniqueCardData) {
                printContent += `
                    <li class="card-item">
                        <span class="card-id">${card.fullId || 'ID-???'}</span>
                        <div>
                            <span class="card-name">${card.name}</span>
                            <span class="card-type"> - ${card.type || 'Sin tipo'}</span>
                        </div>
                        <span class="card-set">${card.setName || card.cardSet || 'Sin set'}</span>
                    </li>`;
            }
        });

        // Agregar pie de página y cerrar el documento
        printContent += `
                </ul>
                <div class="footer">
                    Impreso desde Kodem Cards • ${new Date().toLocaleDateString()}
                </div>
            </body>
            </html>`;

        // Escribir en la ventana y prepararla para imprimir
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Esperar a que los estilos se carguen y luego enfocar la ventana
        setTimeout(() => {
            printWindow.focus();
        }, 300);
    };
    
    // Descargar imagen del mazo
    const handleDownloadDeckImage = () => {
        // Mostrar el modal para seleccionar fondo
        setShowBackgroundModal(true);
    };
    
    // Generar la imagen con el fondo seleccionado
    const generateDeckImage = async () => {
        if (!deck) return;
        try {
            setIsGeneratingImage(true);
            setGenerationProgress(0);
            setGenerationStep('Iniciando proceso...');
            setGenerationError(null);
            setGeneratedImageUrl(null);
            setShowBackgroundModal(false);
            const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

            // Función para cargar una imagen y dibujarla en el canvas
            const loadAndDrawImage = (url: string, x: number, y: number, width: number, height: number): Promise<void> => {
                return new Promise((resolve) => {
                    const imageUrl = url;
                    try {
                        const parsedUrl = new URL(imageUrl);
                        if (parsedUrl.host === 'firebasestorage.googleapis.com' && !imageUrl.includes('token=')) {
                            // Aquí podrías agregar lógica adicional para obtener una URL firmada
                        }
                    } catch (e) {}
                    const img = new window.Image();
                    img.crossOrigin = 'anonymous';
                    img.onerror = () => {
                        ctx.fillStyle = '#f1f5f9';
                        ctx.fillRect(x, y, width, height);
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = `14px Arial`;
                        ctx.fillText('Imagen no disponible', x + 10, y + height/2);
                        ctx.strokeStyle = '#e2e8f0';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, width, height);
                        resolve();
                    };
                    img.onload = () => {
                        try {
                            ctx.save();
                            ctx.beginPath();
                            const radius = 10;
                            ctx.moveTo(x + radius, y);
                            ctx.lineTo(x + width - radius, y);
                            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                            ctx.lineTo(x + width, y + height - radius);
                            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                            ctx.lineTo(x + radius, y + height);
                            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                            ctx.lineTo(x, y + radius);
                            ctx.quadraticCurveTo(x, y, x + radius, y);
                            ctx.closePath();
                            ctx.clip();
                            ctx.drawImage(img, x, y, width, height);
                            ctx.strokeStyle = selectedBackground === 'dark' ? '#475569' : '#e2e8f0';
                            ctx.lineWidth = 2;
                            ctx.stroke();
                            ctx.restore();
                        } catch (err) {
                            ctx.fillStyle = '#fee2e2';
                            ctx.fillRect(x, y, width, height);
                            ctx.fillStyle = '#ef4444';
                            ctx.font = `14px Arial`;
                            ctx.fillText('Error al dibujar', x + 10, y + height/2);
                        }
                        resolve();
                    };
                    setTimeout(() => {
                        if (!img.complete) {
                            img.src = '';
                            ctx.fillStyle = '#fef3c7';
                            ctx.fillRect(x, y, width, height);
                            ctx.fillStyle = '#d97706';
                            ctx.font = `14px Arial`;
                            ctx.fillText('Tiempo excedido', x + 10, y + height/2);
                            resolve();
                        }
                    }, 5000);
                    img.src = imageUrl;
                });
            };

            // Paso 1: Preparar datos y layout
            setGenerationStep('Preparando canvas...');
            setGenerationProgress(5);
            await wait(100);

            // Filtrar cartas por tipo
            const protectors = deck.cards.filter(card => normalizeCardType(card.type) === 'Protector');
            const bio = deck.cards.filter(card => normalizeCardType(card.type) === 'Bio');
            const rots = deck.cards.filter(card => normalizeCardType(card.type) === 'Rot');
            const ixims = deck.cards.filter(card => normalizeCardType(card.type) === 'Ixim');
            const adendeis = deck.cards.filter(card => normalizeCardType(card.type).toLowerCase().includes('adendei') || normalizeCardType(card.type).toLowerCase().includes('rava'));

            // Layout: filas y columnas como en el detalle
            // Fila 1: 3 columnas (2 protectores, 1 bio)
            const row1 = [protectors[0] || null, protectors[1] || null, bio[0] || null];
            // Fila 2: Rots (4 columnas, múltiples filas)
            const rotsRows = [];
            for (let i = 0; i < rots.length; i += 4) {
                rotsRows.push(rots.slice(i, i + 4));
            }
            // Fila 3: Ixim (3 columnas, múltiples filas)
            const iximRows = [];
            for (let i = 0; i < ixims.length; i += 3) {
                iximRows.push(ixims.slice(i, i + 3));
            }
            // Fila 4: Adendei/Rava (3 columnas, múltiples filas)
            const adendeiRows = [];
            for (let i = 0; i < adendeis.length; i += 3) {
                adendeiRows.push(adendeis.slice(i, i + 3));
            }

            // Paso 2: Calcular dimensiones
            const scaleFactor = 2.5;
            const cardWidth = 160 * scaleFactor;
            const cardHeight = 220 * scaleFactor;
            const padding = 15 * scaleFactor;
            const headerHeight = 80 * scaleFactor;
            const sectionSpacing = 22 * scaleFactor;
            const footerHeight = 30 * scaleFactor;
            const marginX = padding * 2;
            const marginY = padding * 2;
            // Calcular alto total
            let rowsNeeded = 1; // Fila 1
            rowsNeeded += rotsRows.length;
            rowsNeeded += iximRows.length;
            rowsNeeded += adendeiRows.length;
            const sectionCount = 1 + (rotsRows.length > 0 ? 1 : 0) + (iximRows.length > 0 ? 1 : 0) + (adendeiRows.length > 0 ? 1 : 0);
            const canvasWidth = Math.max(3 * cardWidth + 4 * padding, 4 * cardWidth + 5 * padding) + marginX;
            const canvasHeight = headerHeight + (sectionCount * sectionSpacing) + (rowsNeeded * (cardHeight + padding)) + footerHeight + marginY;

            setGenerationStep('Configurando canvas...');
            setGenerationProgress(20);
            await wait(100);

            // Paso 3: Crear canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Tu navegador no soporta la generación de imágenes');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const bgColor = backgroundOptions.find(bg => bg.id === selectedBackground)?.color || '#ffffff';
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            setGenerationStep('Dibujando título...');
            setGenerationProgress(30);
            await wait(100);

            // Título
            ctx.fillStyle = selectedBackground === 'dark' ? '#ffffff' : '#000000';
            ctx.font = `bold ${24 * scaleFactor}px Arial`;
            ctx.fillText(deck.name, padding, padding + 20 * scaleFactor);
            ctx.font = `${12 * scaleFactor}px Arial`;
            ctx.fillStyle = selectedBackground === 'dark' ? '#cbd5e1' : '#555555';
            ctx.fillText(`${getDeckCardCount()} cartas • Creado por ${deck.userName || 'Usuario anónimo'} • ${formatDate(deck.createdAt)}`, padding, padding + 40 * scaleFactor);

            setGenerationStep('Dibujando cartas...');
            setGenerationProgress(40);
            await wait(100);

            // Helper para dibujar una fila de cartas
            const drawRow = async (cards: (CardDetails|null)[], y: number, columns: number) => {
                for (let i = 0; i < columns; i++) {
                    const card = cards[i];
                    const x = padding + i * (cardWidth + padding);
                    if (card) {
                        await loadAndDrawImage(card.imageUrl, x, y, cardWidth, cardHeight);
                    }
                }
            };

            // Helper para dibujar varias filas
            let currentY = headerHeight + sectionSpacing;
            // Fila 1
            await drawRow(row1, currentY, 3);
            currentY += cardHeight + padding + sectionSpacing;
            // Fila 2: Rots
            for (const row of rotsRows) {
                await drawRow(row, currentY, 4);
                currentY += cardHeight + padding;
            }
            if (rotsRows.length > 0) currentY += sectionSpacing;
            // Fila 3: Ixim
            for (const row of iximRows) {
                await drawRow(row, currentY, 3);
                currentY += cardHeight + padding;
            }
            if (iximRows.length > 0) currentY += sectionSpacing;
            // Fila 4: Adendei/Rava
            for (const row of adendeiRows) {
                await drawRow(row, currentY, 3);
                currentY += cardHeight + padding;
            }
            if (adendeiRows.length > 0) currentY += sectionSpacing;

            setGenerationProgress(90);
            setGenerationStep('Finalizando imagen...');
            await wait(100);

            // Pie de página
            ctx.fillStyle = selectedBackground === 'dark' ? '#94a3b8' : '#6b7280';
            ctx.font = `${10 * scaleFactor}px Arial`;
            ctx.textAlign = 'left';
            ctx.fillText(`Kodem Cards • ${new Date().toLocaleDateString()} • https://kodemcards.xyz`, padding, canvas.height - padding * 1.5);

            // Convertir canvas a imagen y descargar
            setGenerationProgress(95);
            setGenerationStep('Guardando imagen...');
            await wait(100);
            const dataUrl = canvas.toDataURL('image/png');
            const filename = `${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_deck.png`;
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            setGeneratedImageUrl(dataUrl);
            setGenerationProgress(100);
            setGenerationStep('¡Imagen generada exitosamente!');
            setTimeout(() => {
                link.click();
                setTimeout(() => {
                    setIsGeneratingImage(false);
                }, 1500);
            }, 500);
        } catch (err) {
            console.error('Error general en generación de imagen:', err);
            setGenerationError('Error inesperado al generar la imagen. Por favor, intenta de nuevo.');
            setIsGeneratingImage(false);
        }
    };
    
    // Alternativa para generar la imagen sin cargar las imágenes reales
    const generateDeckTextImage = () => {
        try {
            setShowBackgroundModal(false);
            
            // Obtener el color de fondo seleccionado
            const bgColor = backgroundOptions.find(bg => bg.id === selectedBackground)?.color || '#ffffff';
            
            // Crear un elemento canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                alert('Tu navegador no soporta la generación de imágenes');
                return;
            }
            
            // Definir dimensiones del canvas
            canvas.width = 1200;
            canvas.height = 1600;
            
            // Fondo
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Título
            ctx.fillStyle = selectedBackground === 'dark' ? '#ffffff' : '#000000';
            ctx.font = 'bold 36px Arial';
            ctx.fillText(deck.name, 50, 70);
            
            // Subtítulo
            ctx.font = '16px Arial';
            ctx.fillStyle = selectedBackground === 'dark' ? '#cbd5e1' : '#555555';
            ctx.fillText(`${getDeckCardCount()} cartas • Creado por ${deck.userName || 'Usuario anónimo'} • ${formatDate(deck.createdAt)}`, 50, 110);
            
            // Separador
            ctx.strokeStyle = '#cccccc';
            ctx.beginPath();
            ctx.moveTo(50, 140);
            ctx.lineTo(canvas.width - 50, 140);
            ctx.stroke();
            
            // Agrupar cartas por tipo
            const grouped = getCardsByType();
            let yPosition = 180;
            
            // Dibujar cada tipo de carta
            Object.entries(grouped).forEach(([type, cards]) => {
                // Título del tipo
                ctx.fillStyle = selectedBackground === 'dark' ? '#ffffff' : '#000000';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(`${type} (${cards.length})`, 50, yPosition);
                yPosition += 40;
                
                // Obtener cartas únicas
                const uniqueCards = getUniqueCards(cards);
                
                // Dibujar cada carta (solo texto)
                uniqueCards.forEach(card => {
                    const count = getCardCount(card.id);
                    
                    // Cantidad
                    ctx.fillStyle = selectedBackground === 'dark' ? '#ffffff' : '#000000';
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText(count.toString(), 70, yPosition);
                    
                    // Nombre de la carta
                    ctx.font = '18px Arial';
                    ctx.fillText(card.name, 110, yPosition);
                    
                    yPosition += 30;
                    
                    // Si nos acercamos al final del canvas, detener para evitar cortar texto
                    if (yPosition > canvas.height - 100) {
                        return;
                    }
                });
                
                yPosition += 20;
                
                // Si nos acercamos al final del canvas, detener
                if (yPosition > canvas.height - 80) {
                    return;
                }
            });
            
            // Pie de página
            ctx.fillStyle = '#888888';
            ctx.font = '14px Arial';
            ctx.fillText(`Generado desde Kodem Cards • ${new Date().toLocaleDateString()}`, 50, canvas.height - 50);
            
            // Convertir canvas a imagen y descargar
            try {
                const dataUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                const filename = `${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_deck_text.png`;
                
                link.download = filename;
                link.href = dataUrl;
                link.click();
                
                alert(`Imagen de texto guardada como: ${filename}`);
            } catch (err) {
                console.error('Error al generar la imagen de texto:', err);
                alert('Error al generar la imagen del mazo (texto)');
            }
        } catch (err) {
            console.error('Error general en generación de imagen de texto:', err);
            alert('Error inesperado al generar la imagen de texto');
        }
    };
    
    // Modal de selección de fondo - actualizado con opción de texto
    const renderBackgroundModal = () => {
        if (!showBackgroundModal) return null;
        
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-xl font-bold text-black">Seleccionar fondo</h2>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowBackgroundModal(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-gray-600 mb-4">
                            Selecciona el color de fondo para tu imagen:
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            {backgroundOptions.map(bg => (
                                <div 
                                    key={bg.id}
                                    className={`border rounded-lg p-2 cursor-pointer transition-all ${selectedBackground === bg.id ? 'ring-2 ring-primary' : 'hover:bg-gray-100'}`}
                                    onClick={() => setSelectedBackground(bg.id)}
                                >
                                    <div 
                                        className="w-full h-12 rounded mb-2" 
                                        style={{ backgroundColor: bg.color }}
                                    />
                                    <p className="text-sm text-center text-black">{bg.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowBackgroundModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="outline"
                            onClick={generateDeckTextImage}
                        >
                            Versión texto
                        </Button>
                        <Button 
                            onClick={generateDeckImage}
                        >
                            Generar imagen
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // Reemplazar el renderizado del modal de progreso por el nuevo componente
    const renderProgressModal = () => (
      <GenerationProgressModal
        isOpen={isGeneratingImage}
        onClose={() => setIsGeneratingImage(false)}
        error={generationError}
        progress={generationProgress}
        step={generationStep}
        imageUrl={generatedImageUrl}
      />
    );

    // Refactor del renderCardGrid usando los nuevos componentes
    const renderCardGrid = () => {
      if (!deck?.cards || deck.cards.length === 0) {
        return (
          <EmptyState
            title="No hay cartas"
            description="Este mazo no contiene cartas"
            icon={<Eye className="h-10 w-10 text-muted-foreground" />}
          />
        );
      }
      const protectors = deck.cards.filter(card => normalizeCardType(card.type) === 'Protector');
      const bio = deck.cards.filter(card => normalizeCardType(card.type) === 'Bio');
      const rots = deck.cards.filter(card => normalizeCardType(card.type) === 'Rot');
      const ixims = deck.cards.filter(card => normalizeCardType(card.type) === 'Ixim');
      const adendeis = deck.cards.filter(card => normalizeCardType(card.type).toLowerCase().includes('adendei') || normalizeCardType(card.type).toLowerCase().includes('rava'));
      // Fila 1: 2 protectores, 1 bio
      const row1 = [protectors[0] || null, protectors[1] || null, bio[0] || null];
      // Fila 2: Rots (4 columnas, múltiples filas)
      const rotsRows = [];
      for (let i = 0; i < rots.length; i += 4) rotsRows.push(rots.slice(i, i + 4));
      // Fila 3: Ixim (3 columnas, múltiples filas)
      const iximRows = [];
      for (let i = 0; i < ixims.length; i += 3) iximRows.push(ixims.slice(i, i + 3));
      // Fila 4: Adendei/Rava (3 columnas, múltiples filas)
      const adendeiRows = [];
      for (let i = 0; i < adendeis.length; i += 3) adendeiRows.push(adendeis.slice(i, i + 3));
      return (
        <div className="space-y-4">
          <DeckCardRow cards={row1} columns={3} onCardClick={setSelectedCard} selectedCardId={selectedCard?.id} />
          {rotsRows.map((row, idx) => (
            <DeckCardRow key={`rots-row-${idx}`} cards={row} columns={4} onCardClick={setSelectedCard} selectedCardId={selectedCard?.id} />
          ))}
          {iximRows.map((row, idx) => (
            <DeckCardRow key={`ixim-row-${idx}`} cards={row} columns={3} onCardClick={setSelectedCard} selectedCardId={selectedCard?.id} />
          ))}
          {adendeiRows.map((row, idx) => (
            <DeckCardRow key={`adendei-row-${idx}`} cards={row} columns={3} onCardClick={setSelectedCard} selectedCardId={selectedCard?.id} />
          ))}
        </div>
      );
    };

    // Refactor del renderCardList usando DeckCard
    const renderCardList = () => {
      const orderedCards = getOrderedCards();
      if (orderedCards.length === 0) {
        return (
          <div className="text-center p-6 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">Este mazo no contiene cartas</p>
          </div>
        );
      }
      return (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {orderedCards.map(card => (
                <div
                  key={card.id}
                  className={`flex items-center p-3 hover:bg-muted/50 cursor-pointer ${selectedCard?.id === card.id ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedCard(card)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedCard?.id === card.id}
                >
                  <span className="w-24 text-start font-mono text-xs text-muted-foreground overflow-hidden">{card.fullId || 'ID-???'}</span>
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 mr-3">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{card.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span>{card.type}</span>
                      {card.energy && <span className="mx-1">•</span>}
                      {card.energy && <span>{card.energy}</span>}
                      <span className="ml-auto italic text-xs text-slate-500">{card.setName || card.cardSet || 'Sin set'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    };

    // Mejorar getGridFromDeckSlots para rellenar huecos correctamente
    const getGridFromDeckSlots = () => {
        if (!deck?.deckSlots || !deck.cards) return [];
        const cardMap = new Map(deck.cards.map(card => [card.id, card]));
        // Determinar dimensiones máximas
        const maxRow = Math.max(...deck.deckSlots.map(s => s.row));
        const maxCol = Math.max(...deck.deckSlots.map(s => s.col));
        // Inicializar matriz
        const rows: (CardDetails | null)[][] = Array.from({ length: maxRow + 1 }, () => Array(maxCol + 1).fill(null));
        deck.deckSlots.forEach(slot => {
            rows[slot.row][slot.col] = cardMap.get(slot.cardId) || null;
        });
        return rows;
    };

    // Renderizado de estados de carga y error
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Spinner size="lg" className="mb-4" />
                <p className="text-muted-foreground">Cargando mazo...</p>
            </div>
        );
    }

    if (error || !deck) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <EmptyState
                    title="No se pudo cargar el mazo"
                    description={error || 'Información no disponible'}
                    icon={<Eye className="h-10 w-10 text-red-500" />}
                    action={
                        <div className="flex gap-2 mt-4">
                            {error?.includes('privado') ? (
                                <>
                                    <Link href="/login">
                                        <Button>
                                            Iniciar sesión
                                        </Button>
                                    </Link>
                                    <Link href="/">
                                        <Button variant="outline">
                                            Volver al inicio
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <Link href="/decks">
                                    <Button>
                                        Volver a mis mazos
                                    </Button>
                                </Link>
                            )}
                        </div>
                    }
                />
            </div>
        );
    }

    // Botones de acciones rápidas para móvil
    const actionButtons = (
        <div className="flex justify-between gap-2 mt-4 md:hidden">
            <Button variant="primary" size="sm" className="flex-1" onClick={copyDeckList}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar lista
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handlePrintDeck}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleShareDeck}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadDeckImage}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
            </Button>
        </div>
    );

    // Render principal
    return (
        <div className="flex flex-col w-full min-h-screen bg-background">
            {showBackgroundModal && renderBackgroundModal()}
            {renderProgressModal()}
            {/* Barra superior (cabecera original restaurada) */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                <div className="flex items-center">
                    <Link href="/decks">
                        <Button variant="ghost" size="sm" className="mr-2">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{deck?.name || ''}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{getDeckCardCount()} cartas</span>
                            {deck?.isPublic ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Público
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Privado
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="hidden md:flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
                        {viewMode === 'list' ? (
                            <>
                                <Grid className="h-4 w-4 mr-2" />
                                Ver grid
                            </>
                        ) : (
                            <>
                                <List className="h-4 w-4 mr-2" />
                                Ver lista
                            </>
                        )}
                    </Button>
                    <Button variant="primary" size="sm" className="flex-1" onClick={copyDeckList}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar lista
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrintDeck}>
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShareDeck}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartir
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadDeckImage}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                    </Button>
                </div>
            </div>
            <div className="flex flex-col md:flex-row flex-1 p-4 gap-6">
                <div className="w-full md:w-2/3">
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                {/* Aquí puedes agregar info del creador, fecha, etc. */}
                            </div>
                            {deck?.description && (
                                <>
                                    <Separator className="my-4" />
                                    <p className="text-sm">{deck.description}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <div className="flex justify-between items-center mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                            className="md:hidden"
                        >
                            {viewMode === 'list' ? <><Grid className="h-4 w-4 mr-2" />Ver como grid</> : <><List className="h-4 w-4 mr-2" />Ver como lista</>}
                        </Button>
                    </div>
                    {isMobile && actionButtons}
                    {viewMode === 'list' ? renderCardList() : renderCardGrid()}
                </div>
                {!isMobile && (
                    <div className="w-full md:w-1/3 flex flex-col gap-4">
                        <DeckSelectedCard card={selectedCard} />
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente atómico para el modal de progreso de generación de imagen
const GenerationProgressModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  error?: string | null;
  progress: number;
  step: string;
  imageUrl?: string | null;
}> = React.memo(({ isOpen, onClose, error, progress, step, imageUrl }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-black">Generando imagen</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          {error ? (
            <div className="flex flex-col items-center">
              <AlertCircle className="h-16 w-16 text-red-500 mb-3" />
              <p className="text-red-500 font-medium text-center mb-2">¡Ups! Algo salió mal</p>
              <p className="text-sm text-gray-600 text-center mb-4">{error}</p>
              <Button variant="primary" size="sm" onClick={onClose}>Cerrar</Button>
            </div>
          ) : progress === 100 ? (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-3" />
              <p className="text-green-500 font-medium text-center mb-2">¡Imagen generada correctamente!</p>
              <p className="text-sm text-gray-600 text-center mb-4">La descarga debería iniciar automáticamente</p>
              {imageUrl && (
                <div className="w-full bg-gray-100 p-2 rounded-lg mb-4 relative">
                  <div className="h-32 overflow-hidden rounded">
                    <img src={imageUrl} alt="Vista previa" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}
              <Button variant="primary" size="sm" onClick={onClose}>Cerrar</Button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <Spinner size="lg" className="text-primary" />
              </div>
              <p className="text-center text-sm text-gray-600 mb-3">{step}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-center text-xs text-gray-500">
                {progress < 90 ? 'Este proceso puede tardar unos segundos...' : 'Casi listo...'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
GenerationProgressModal.displayName = 'GenerationProgressModal';

export default DeckDetail;