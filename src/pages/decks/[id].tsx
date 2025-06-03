import React, { useState, useEffect } from 'react';
import { Link, useRoute } from 'wouter';
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
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Separator } from '@/components/atoms/Separator';
import { getDeckWithCards } from '@/lib/firebase/services/deckService';
import { DeckWithCards } from '@/types/deck';
import { CardDetails } from '@/types/card';

/**
 * Página para visualizar un mazo existente
 */
const DeckDetail: React.FC = () => {
    // Obtener el ID del mazo de la URL
    const [match, params] = useRoute<{ id: string }>('/decks/:id');
    const id = match && params ? params.id : '';

    // Estados
    const [deck, setDeck] = useState<DeckWithCards | null>(null);
    const [selectedCard, setSelectedCard] = useState<CardDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showBackgroundModal, setShowBackgroundModal] = useState(false);
    const [selectedBackground, setSelectedBackground] = useState<string>('default');
    
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
            if (!id) {
                setError('ID de mazo no válido');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const deckData = await getDeckWithCards(id);

                if (deckData) {
                    setDeck(deckData);
                    // Seleccionar la primera carta para mostrarla
                    if (deckData.cards.length > 0) {
                        setSelectedCard(deckData.cards[0]);
                    }
                } else {
                    setError('No se pudo encontrar el mazo');
                }
            } catch (err) {
                console.error('Error al cargar el mazo:', err);
                setError('Error al cargar el mazo');
            } finally {
                setIsLoading(false);
            }
        };

        loadDeckData();
    }, [id]);

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

    // Copiar lista de mazo al portapapeles
    const copyDeckList = () => {
        if (!deck) return;

        // Obtener cartas ordenadas
        const orderedCards = getOrderedCards();

        let deckText = `# ${deck.name}\n\n`;
        deckText += `## Lista de cartas en orden estratégico (${deck.cards.length})\n`;

        // Añadir cada carta con su información
        orderedCards.forEach(card => {
            deckText += `${card.fullId || 'ID-???'} | ${card.name} | ${card.type || 'Sin tipo'} | ${card.setName || card.cardSet || 'Sin set'}\n`;
        });

        navigator.clipboard.writeText(deckText);
        alert('Lista de mazo copiada al portapapeles');
    };

    // Obtener las cartas en el orden específico de la vista de lista
    const getOrderedCards = (): CardDetails[] => {
        if (!deck?.cards) return [];
        
        // Filtrar cartas por tipo
        const protectorCards = deck.cards.filter(card => normalizeCardType(card.type) === 'Protector');
        const adendeiCards = deck.cards.filter(card => normalizeCardType(card.type).toLowerCase().includes('adendei'));
        const bioCards = deck.cards.filter(card => normalizeCardType(card.type) === 'Bio');
        const iximCards = deck.cards.filter(card => normalizeCardType(card.type) === 'Ixim');
        const rotCards = deck.cards.filter(card => normalizeCardType(card.type) === 'Rot');
        const otherCards = deck.cards.filter(card => 
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
        
        // Añadir los 3 primeros adendei
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
        deck.cards.forEach(card => {
            if (!orderedCards.some(c => c.id === card.id)) {
                orderedCards.push(card);
            }
        });
        
        return orderedCards;
    };

    // Obtener las cartas en el orden original del mazo
    const getCardsInOriginalOrder = (): CardDetails[] => {
        if (!deck?.cardIds || !deck.cards) return [];
        // Mapear cada ID a su carta correspondiente
        return deck.cardIds
            .map(cardId => deck.cards.find(card => card.id === cardId))
            .filter((card): card is CardDetails => !!card);
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
                    ${deck.cards.length} cartas • Creado por ${deck.userName || 'Usuario anónimo'} • ${formatDate(deck.createdAt)}
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
            // Inicializar estados de generación
            setIsGeneratingImage(true);
            setGenerationProgress(0);
            setGenerationStep('Iniciando proceso...');
            setGenerationError(null);
            setGeneratedImageUrl(null);
            
            // Cerrar el modal de selección de fondo
            setShowBackgroundModal(false);
            
            // Obtener el color de fondo seleccionado
            const bgColor = backgroundOptions.find(bg => bg.id === selectedBackground)?.color || '#ffffff';
            
            // Mostrar paso actual
            setGenerationStep('Preparando canvas...');
            setGenerationProgress(5);
            
            // Crear un elemento canvas para renderizar el mazo como imagen
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                throw new Error('Tu navegador no soporta la generación de imágenes');
            }
            
            // Mostrar paso actual
            setGenerationStep('Calculando dimensiones...');
            setGenerationProgress(10);
            
            // Factor de escala para aumentar la resolución
            const scaleFactor = 2.5; // Ajustar para un equilibrio entre resolución y tamaño
            
            // Definir dimensiones del canvas basadas en el contenido y layout
            // Ajustar estos valores para un mejor diseño
            const cardWidth = 160 * scaleFactor; // Aumentamos el ancho con el factor de escala
            const cardHeight = 220 * scaleFactor; // Aumentamos la altura con el factor de escala
            const padding = 15 * scaleFactor; // Aumentamos el espacio entre cartas
            const headerHeight = 80 * scaleFactor; // Aumentamos el espacio para el título
            const sectionSpacing = 22 * scaleFactor; // Aumentamos el espacio entre secciones
            const footerHeight = 30 * scaleFactor; // Altura reservada para el pie de página
            
            // Número de filas y columnas basado en los tipos de cartas
            const protectorCards = deck.cards.filter(card => normalizeCardType(card.type) === 'Protector');
            const adendeiCards = deck.cards.filter(card => normalizeCardType(card.type).toLowerCase().includes('adendei'));
            const bioCards = deck.cards.filter(card => normalizeCardType(card.type) === 'Bio');
            const iximCards = deck.cards.filter(card => normalizeCardType(card.type) === 'Ixim');
            const rotCards = deck.cards.filter(card => normalizeCardType(card.type) === 'Rot');
            const otherCards = deck.cards.filter(card => 
                normalizeCardType(card.type) !== 'Protector' && 
                !normalizeCardType(card.type).toLowerCase().includes('adendei') &&
                normalizeCardType(card.type) !== 'Bio' &&
                normalizeCardType(card.type) !== 'Ixim' &&
                normalizeCardType(card.type) !== 'Rot'
            );
            
            // Definir número de columnas para cada sección
            const protectorAdendeiCols = 4;
            const bioProtectorCols = 2;
            const rotIximCols = 4;
            const otherCardsCols = 3; // Reducir a 3 columnas para "Otras cartas"
            
            // Recalcular el número de columnas máximo para el ancho del canvas
            const maxCols = Math.max(protectorAdendeiCols, rotIximCols, otherCardsCols);
            
            // Añadir margen adicional para evitar cortes
            const marginX = padding * 2;
            const marginY = padding * 2;
            
            // Ancho fijo basado en el ancho máximo de columnas + margen
            const canvasWidth = (cardWidth * maxCols) + (padding * (maxCols + 1)) + marginX;
            
            // Calcular filas necesarias para cada sección
            let rowsNeeded = 0;
            
            // Sección 1: Protector y Adendeis principales
            if (protectorCards.length > 0 || adendeiCards.slice(0, 3).length > 0) {
                rowsNeeded += 1;
            }
            
            // Sección 2: Bio y segundo Protector
            if (bioCards.length > 0 || protectorCards.length > 1) {
                rowsNeeded += 1;
            }
            
            // Sección 3: Rot
            if (rotCards.length > 0) {
                rowsNeeded += Math.ceil(rotCards.length / rotIximCols);
            }
            
            // Sección 4: Ixim
            if (iximCards.length > 0) {
                rowsNeeded += Math.ceil(iximCards.length / rotIximCols);
            }
            
            // Sección 5: Otras cartas
            const remainingAdendeis = adendeiCards.slice(3);
            const combinedOtherCards = [...remainingAdendeis, ...otherCards];
            if (combinedOtherCards.length > 0) {
                rowsNeeded += Math.ceil(combinedOtherCards.length / otherCardsCols);
            }
            
            // Espacio para títulos de sección (solo para secciones con cartas)
            let sectionCount = 0;
            if (protectorCards.length > 0 || adendeiCards.slice(0, 3).length > 0) sectionCount++;
            if (bioCards.length > 0 || protectorCards.length > 1) sectionCount++;
            if (rotCards.length > 0) sectionCount++;
            if (iximCards.length > 0) sectionCount++;
            if (combinedOtherCards.length > 0) sectionCount++;
            
            // Altura total: encabezado + espacio para títulos + espacio para cartas + pie de página + margen adicional
            const canvasHeight = headerHeight + (sectionCount * sectionSpacing) + (rowsNeeded * (cardHeight + padding)) + footerHeight + marginY;
            
            // Mostrar paso actual
            setGenerationStep('Configurando canvas...');
            setGenerationProgress(15);
            
            console.log(`Canvas dimensions: ${canvasWidth}x${canvasHeight}`);
            
            // Configurar el tamaño del canvas
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            
            // Fondo
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Título
            ctx.fillStyle = selectedBackground === 'dark' ? '#ffffff' : '#000000';
            ctx.font = `bold ${24 * scaleFactor}px Arial`;
            ctx.fillText(deck.name, padding, padding + 20 * scaleFactor);
            
            // Subtítulo
            ctx.font = `${12 * scaleFactor}px Arial`;
            ctx.fillStyle = selectedBackground === 'dark' ? '#cbd5e1' : '#555555';
            ctx.fillText(`${deck.cards.length} cartas • Creado por ${deck.userName || 'Usuario anónimo'} • ${formatDate(deck.createdAt)}`, padding, padding + 40 * scaleFactor);
            
            // Función para cargar una imagen y dibujarla en el canvas
            const loadAndDrawImage = (url: string, x: number, y: number, width: number, height: number): Promise<void> => {
                return new Promise((resolve) => {
                    // Para imágenes de Firebase Storage, asegurar que tenemos una URL directa
                    const imageUrl = url;
                    
                    // Si la URL no tiene un token de acceso y es de Firebase Storage, intentar obtener una URL firmada
                    try {
                        const parsedUrl = new URL(imageUrl);
                        if (parsedUrl.host === 'firebasestorage.googleapis.com' && !imageUrl.includes('token=')) {
                            console.log('Detectada URL de Firebase Storage, intentando acceso directo');
                            // Aquí podrías agregar lógica adicional para obtener una URL firmada
                        }
                    } catch (e) {
                        // Si no es una URL válida, continuar sin validación
                    }
                    
                    const img = new Image();
                    
                    // Importante: este atributo debe estar ANTES de asignar src
                    img.crossOrigin = 'anonymous';
                    
                    // Función de manejo de error
                    img.onerror = () => {
                        console.error(`Error al cargar imagen (CORS o acceso): ${imageUrl}`);
                        
                        // Si hay error al cargar, intentar con proxy CORS (si aplica)
                        if (!imageUrl.includes('cors-anywhere') && !imageUrl.includes('firebasestorage')) {
                            console.log('Intentando con proxy CORS...');
                            // Esto es un ejemplo, necesitarías configurar tu propio proxy CORS
                            // const proxyUrl = `https://cors-anywhere.herokuapp.com/${imageUrl}`;
                            // img.src = proxyUrl;
                            // return; // No resolvemos aún, esperamos el segundo intento
                        }
                        
                        // Dibujar un placeholder para esta imagen
                        ctx.fillStyle = '#f1f5f9';
                        ctx.fillRect(x, y, width, height);
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = `${14 * scaleFactor}px Arial`;
                        ctx.fillText('Imagen no disponible', x + 10 * scaleFactor, y + height/2);
                        
                        // Dibujar al menos un borde para la carta
                        ctx.strokeStyle = '#e2e8f0';
                        ctx.lineWidth = 2 * scaleFactor;
                        ctx.strokeRect(x, y, width, height);
                        
                        resolve();
                    };
                    
                    // Función de carga exitosa
                    img.onload = () => {
                        console.log(`Imagen cargada con éxito: ${imageUrl}`);
                        try {
                            // Dibujar la carta con bordes redondeados
                            ctx.save();
                            ctx.beginPath();
                            const radius = 10 * scaleFactor;
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
                            
                            // Añadir borde
                            ctx.strokeStyle = selectedBackground === 'dark' ? '#475569' : '#e2e8f0';
                            ctx.lineWidth = 2 * scaleFactor;
                            ctx.stroke();
                            
                            ctx.restore();
                        } catch (err) {
                            console.error('Error al dibujar imagen:', err);
                            // Si hay error al dibujar, mostrar placeholder
                            ctx.fillStyle = '#fee2e2';
                            ctx.fillRect(x, y, width, height);
                            ctx.fillStyle = '#ef4444';
                            ctx.font = `${14 * scaleFactor}px Arial`;
                            ctx.fillText('Error al dibujar', x + 10 * scaleFactor, y + height/2);
                        }
                        resolve();
                    };
                    
                    // Agregar un timeout para no quedarse esperando indefinidamente
                    setTimeout(() => {
                        if (!img.complete) {
                            console.warn(`Timeout esperando imagen: ${imageUrl}`);
                            img.src = ''; // Cancelar la carga
                            // Dibujar placeholder por timeout
                            ctx.fillStyle = '#fef3c7';
                            ctx.fillRect(x, y, width, height);
                            ctx.fillStyle = '#d97706';
                            ctx.font = `${14 * scaleFactor}px Arial`;
                            ctx.fillText('Tiempo excedido', x + 10 * scaleFactor, y + height/2);
                            resolve();
                        }
                    }, 5000); // 5 segundos máximo por imagen
                    
                    // Intentar cargar la imagen
                    console.log(`Intentando cargar imagen: ${imageUrl}`);
                    img.src = imageUrl;
                });
            };
            
            // Comenzar a dibujar las cartas
            const drawCards = async () => {
                if (deck?.deckSlots && deck.deckSlots.length > 0 && deck.cards) {
                    const cardMap = new Map(deck.cards.map(card => [card.id, card]));
                    const slots = deck.deckSlots;
                    // Calcular filas y columnas
                    const maxRow = Math.max(...slots.map(s => s.row));
                    const maxCol = Math.max(...slots.map(s => s.col));
                    const cardWidth = 180 * scaleFactor;
                    const cardHeight = 260 * scaleFactor;
                    const cardSpacing = 16 * scaleFactor;
                    for (let row = 0; row <= maxRow; row++) {
                        for (let col = 0; col <= maxCol; col++) {
                            const slot = slots.find(s => s.row === row && s.col === col);
                            if (slot) {
                                const card = cardMap.get(slot.cardId);
                                if (card) {
                                    const x = marginX + col * (cardWidth + cardSpacing);
                                    const y = headerHeight + row * (cardHeight + cardSpacing);
                                    await loadAndDrawImage(card.imageUrl, x, y, cardWidth, cardHeight);
                                }
                            }
                        }
                    }
                    return;
                }
                // Fallback: lógica anterior
                try {
                    let currentY = headerHeight;
                    const sectionSpacing = 32 * scaleFactor;
                    const cardSpacing = 16 * scaleFactor;
                    const cardHeight = 180 * scaleFactor;
                    const cardWidth3 = (canvasWidth - marginX - (cardSpacing * 2)) / 3;
                    const orderedCards = getCardsInOriginalOrder();

                    // Título de sección
                    ctx.fillStyle = selectedBackground === 'dark' ? '#ffffff' : '#000000';
                    ctx.font = `bold ${16 * scaleFactor}px Arial`;
                    ctx.fillText('Cartas del mazo', padding, currentY);
                    currentY += sectionSpacing;

                    for (let i = 0; i < orderedCards.length; i++) {
                        const row = Math.floor(i / 3);
                        const col = i % 3;
                        await loadAndDrawImage(
                            orderedCards[i].imageUrl,
                            padding + (cardWidth3 + cardSpacing) * col,
                            currentY + (cardHeight + cardSpacing) * row,
                            cardWidth3,
                            cardHeight
                        );
                    }
                    currentY += Math.ceil(orderedCards.length / 3) * (cardHeight + cardSpacing) + sectionSpacing;

                    // Pie de página
                    ctx.fillStyle = selectedBackground === 'dark' ? '#94a3b8' : '#6b7280';
                    ctx.font = `${10 * scaleFactor}px Arial`;
                    ctx.textAlign = 'left';
                    ctx.fillText(`Kodem Cards • ${new Date().toLocaleDateString()} • https://kodemcards.xyz`, padding, canvas.height - padding * 1.5);

                    setGenerationProgress(90);
                    setGenerationStep('Finalizando imagen...');
                } catch (err) {
                    console.error('Error general al dibujar cartas:', err);
                    setGenerationError('Error al generar la imagen. Revisa la consola para más detalles.');
                    setIsGeneratingImage(false);
                    return;
                }
                // Convertir canvas a imagen y descargar
                try {
                    console.log('Generando imagen final...');
                    setGenerationStep('Guardando imagen...');
                    setGenerationProgress(95);
                    
                    const dataUrl = canvas.toDataURL('image/png');
                    const filename = `${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_deck.png`;
                    
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = dataUrl;
                    
                    // Guardar URL de vista previa
                    setGeneratedImageUrl(dataUrl);
                    
                    // Completar proceso
                    setGenerationProgress(100);
                    setGenerationStep('¡Imagen generada exitosamente!');
                    
                    // Pequeña pausa para ver el 100%
                    setTimeout(() => {
                        link.click();
                        
                        // No cerramos el modal inmediatamente para que el usuario pueda ver el resultado
                        setTimeout(() => {
                            setIsGeneratingImage(false);
                        }, 1500);
                    }, 500);
                    
                    console.log('Imagen guardada como:', filename);
                } catch (err) {
                    console.error('Error al generar la imagen final:', err);
                    setGenerationError('Error al generar la imagen del mazo. Revisa la consola para más detalles.');
                    setIsGeneratingImage(false);
                }
            };
            
            // Iniciar el proceso de dibujo
            await drawCards();
            
            // Esto mejora la calidad de la imagen final
            console.log(`Imagen generada con factor de escala ${scaleFactor}x (resolución aumentada)`);
            
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
            ctx.fillText(`${deck.cards.length} cartas • Creado por ${deck.userName || 'Usuario anónimo'} • ${formatDate(deck.createdAt)}`, 50, 110);
            
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

    // Modal de progreso para la generación de imagen
    const renderProgressModal = () => {
        if (!isGeneratingImage) return null;
        
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-xl font-bold text-black">Generando imagen</h2>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIsGeneratingImage(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    
                    <div className="p-4">
                        {generationError ? (
                            <div className="flex flex-col items-center">
                                <AlertCircle className="h-16 w-16 text-red-500 mb-3" />
                                <p className="text-red-500 font-medium text-center mb-2">¡Ups! Algo salió mal</p>
                                <p className="text-sm text-gray-600 text-center mb-4">{generationError}</p>
                                <Button 
                                    variant="primary" 
                                    size="sm"
                                    onClick={() => setIsGeneratingImage(false)}
                                >
                                    Cerrar
                                </Button>
                            </div>
                        ) : generationProgress === 100 ? (
                            <div className="flex flex-col items-center">
                                <CheckCircle className="h-16 w-16 text-green-500 mb-3" />
                                <p className="text-green-500 font-medium text-center mb-2">¡Imagen generada correctamente!</p>
                                <p className="text-sm text-gray-600 text-center mb-4">La descarga debería iniciar automáticamente</p>
                                
                                {generatedImageUrl && (
                                    <div className="w-full bg-gray-100 p-2 rounded-lg mb-4 relative">
                                        <div className="h-32 overflow-hidden rounded">
                                            <img 
                                                src={generatedImageUrl} 
                                                alt="Vista previa" 
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                <Button 
                                    variant="primary" 
                                    size="sm"
                                    onClick={() => setIsGeneratingImage(false)}
                                >
                                    Cerrar
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 flex justify-center">
                                    <Spinner size="lg" className="text-primary" />
                                </div>
                                
                                <p className="text-center text-sm text-gray-600 mb-3">{generationStep}</p>
                                
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                                    <div 
                                        className="bg-primary h-2.5 rounded-full" 
                                        style={{ width: `${generationProgress}%` }}
                                    ></div>
                                </div>
                                
                                <p className="text-center text-xs text-gray-500">
                                    {generationProgress < 90 
                                        ? 'Este proceso puede tardar unos segundos...' 
                                        : 'Casi listo...'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Renderizar grid visual usando deckSlots si existen
    const renderCardGrid = () => {
        if (deck?.deckSlots && deck.deckSlots.length > 0) {
            const grid = getGridFromDeckSlots();
            return (
                <div className="space-y-4">
                    {grid.map((row, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-3 gap-3">
                            {row.map((card, colIdx) => (
                                <div key={colIdx} className="border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors">
                                    {card ? (
                                        <img src={card.imageUrl} alt={card.name} className="object-cover w-full h-full" />
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            );
        }
        // Fallback: lógica anterior
        const orderedCards = getCardsInOriginalOrder();
        if (!orderedCards.length) {
            return (
                <EmptyState
                    title="No hay cartas"
                    description="Este mazo no contiene cartas"
                    icon={<Eye className="h-10 w-10 text-muted-foreground" />}
                />
            );
        }
        return (
            <div className="space-y-8">
                {Array.from({ length: Math.ceil(orderedCards.length / 3) }).map((_, rowIdx) => (
                    <div key={`row-${rowIdx}`} className="grid grid-cols-3 gap-3 mb-3">
                        {orderedCards.slice(rowIdx * 3, rowIdx * 3 + 3).map((card, idx) => (
                            <Card
                                key={`card-${rowIdx * 3 + idx}`}
                                className="cursor-pointer transition-transform hover:scale-105 group relative"
                                onClick={() => setSelectedCard(card)}
                            >
                                <CardContent className="p-0 relative">
                                    <img
                                        src={card.imageUrl}
                                        alt={card.name}
                                        className="w-full h-auto rounded-lg"
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ))}
            </div>
        );
    };
    
    // Renderizar la vista de lista de cartas con orden específico
    const renderCardList = () => {
        if (!deck?.cards || deck.cards.length === 0) {
            return (
                <div className="text-center p-6 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">Este mazo no contiene cartas</p>
                </div>
            );
        }
        
        // Obtener cartas ordenadas
        const orderedCards = getOrderedCards();
        
        return (
            <Card>
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {orderedCards.map(card => {
                            return (
                                <div
                                    key={card.id}
                                    className={`flex items-center p-3 hover:bg-muted/50 cursor-pointer ${selectedCard?.id === card.id ? 'bg-muted' : ''}`}
                                    onClick={() => setSelectedCard(card)}
                                >
                                    <span className="w-24 text-start font-mono text-xs text-muted-foreground overflow-hidden">{card.fullId || 'ID-???'}</span>
                                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 mr-3">
                                        <img
                                            src={card.imageUrl}
                                            alt={card.name}
                                            className="w-full h-full object-cover"
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
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Utilidad: obtener matriz de cartas por fila y columna desde deckSlots
    const getGridFromDeckSlots = () => {
        if (!deck?.deckSlots || !deck.cards) return [];
        // Crear un mapa de id -> CardDetails
        const cardMap = new Map(deck.cards.map(card => [card.id, card]));
        // Agrupar por fila
        const rows: CardDetails[][] = [];
        deck.deckSlots.forEach(slot => {
            if (!rows[slot.row]) rows[slot.row] = [];
            rows[slot.row][slot.col] = cardMap.get(slot.cardId) || null;
        });
        // Rellenar huecos con null para mantener la estructura
        const maxCols = Math.max(...rows.map(r => r.length));
        return rows.map(row => {
            const filled = Array(maxCols).fill(null);
            row.forEach((card, idx) => { filled[idx] = card; });
            return filled;
        });
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
                        <Link href="/decks">
                            <Button className="mt-4">
                                Volver a mis mazos
                            </Button>
                        </Link>
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
            <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadDeckImage}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
            </Button>
        </div>
    );

    return (
        <div className="flex flex-col w-full min-h-screen bg-background">
            {/* Modal de selección de fondo */}
            {showBackgroundModal && renderBackgroundModal()}
            
            {/* Modal de progreso de generación de imagen */}
            {renderProgressModal()}
            
            {/* Barra superior */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                <div className="flex items-center">
                    <Link href="/decks">
                        <Button variant="ghost" size="sm" className="mr-2">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{deck.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{deck.cards.length} cartas</span>
                            {deck.isPublic ? (
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
                    {/* Vista toggle */}
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                    >
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
                    <Button variant="outline" size="sm" onClick={handleDownloadDeckImage}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                    </Button>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="flex flex-col md:flex-row flex-1 p-4 gap-6">
                {/* Lista de cartas - en móvil ocupa todo el ancho */}
                <div className="w-full md:w-2/3">
                    {/* Información del creador */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium">Creado por {deck.userName || 'Usuario anónimo'}</h3>
                                    <div className="flex items-center flex-wrap text-sm text-muted-foreground gap-4 mt-1">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            {formatDate(deck.createdAt)}
                                        </div>
                                        {/* {deck.views !== undefined && (
                                            <div className="flex items-center">
                                                <Eye className="h-4 w-4 mr-1" />
                                                {deck.views} visualizaciones
                                            </div>
                                        )}
                                        {deck.likes !== undefined && (
                                            <div className="flex items-center">
                                                <Heart className="h-4 w-4 mr-1" />
                                                {deck.likes} me gusta
                                            </div>
                                        )} */}
                                    </div>
                                </div>
                                <Link href={`/decks/editor/${deck.id}`}>
                                    <Button variant="outline" size="sm">
                                        Editar
                                    </Button>
                                </Link>
                            </div>
                            {deck.description && (
                                <>
                                    <Separator className="my-4" />
                                    <p className="text-sm">{deck.description}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Toggle para vistas en móvil */}
                    <div className="flex justify-between items-center mb-4">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                            className="md:hidden"
                        >
                            {viewMode === 'list' ? (
                                <>
                                    <Grid className="h-4 w-4 mr-2" />
                                    Ver como grid
                                </>
                            ) : (
                                <>
                                    <List className="h-4 w-4 mr-2" />
                                    Ver como lista
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Acciones rápidas solo en móvil */}
                    {isMobile && actionButtons}

                    {/* Mostrar cartas según la vista seleccionada */}
                    {viewMode === 'list' ? renderCardList() : renderCardGrid()}
                </div>

                {/* Visualización de carta seleccionada - solo en desktop */}
                {!isMobile && (
                    <div className="w-full md:w-1/3 flex flex-col gap-4">
                        {selectedCard ? (
                            <Card className="sticky top-4">
                                <CardContent className="p-4 flex flex-col items-center">
                                    <div className="w-full max-w-[300px] rounded-lg overflow-hidden mb-4">
                                        <img
                                            src={selectedCard.imageUrl}
                                            alt={selectedCard.name}
                                            className="w-full h-auto"
                                        />
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">{selectedCard.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {selectedCard.type} {selectedCard.energy && `• ${selectedCard.energy}`}
                                    </p>

                                    {selectedCard.description && (
                                        <div className="w-full mb-3">
                                            <h4 className="text-sm font-semibold mb-1">Descripción</h4>
                                            <p className="text-sm">{selectedCard.description}</p>
                                        </div>
                                    )}

                                    {selectedCard.rules && selectedCard.rules.length > 0 && (
                                        <div className="w-full">
                                            <h4 className="text-sm font-semibold mb-1">Reglas</h4>
                                            <div className="space-y-2">
                                                {selectedCard.rules.map((rule, idx) => (
                                                    <p key={idx} className="text-sm">{rule}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="sticky top-4">
                                <CardContent className="p-8">
                                    <EmptyState
                                        title="Selecciona una carta"
                                        description="Haz clic en una carta del mazo para ver sus detalles"
                                        icon={<Eye className="h-10 w-10 text-primary/60" />}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeckDetail; 