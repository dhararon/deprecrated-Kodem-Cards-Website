import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    Layers, 
    Globe, 
    Lock, 
    CreditCard, 
    Zap, 
    TrendingUp, 
    Star,
    RefreshCw,
    Calendar,
    Users
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';
import { MetricCard } from '@/components/molecules/MetricCard';
import { ChartCard, SimpleBarChart, PieChartLegend } from '@/components/molecules/ChartCard';
import { TopCardsTable } from '@/components/molecules/TopCardsTable';
import { getAnalyticsData, clearAnalyticsCache } from '@/lib/firebase/services/analyticsService';
import { AnalyticsData } from '@/types/analytics';
import { toast } from 'sonner';

/**
 * Página de Analytics - Dashboard para mostrar estadísticas de decks
 */
export default function Analytics() {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Función para cargar datos de analytics
    const loadAnalyticsData = async (forceRefresh = false) => {
        try {
            if (forceRefresh) {
                setIsRefreshing(true);
                clearAnalyticsCache();
            } else {
                setIsLoading(true);
            }
            setError(null);

            const data = await getAnalyticsData();
            setAnalyticsData(data);

            if (forceRefresh) {
                toast.success('Datos actualizados correctamente');
            }
        } catch (err) {
            console.error('Error al cargar analytics:', err);
            setError('Error al cargar los datos de analytics');
            toast.error('Error al cargar los datos');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        loadAnalyticsData();
    }, []);

    // Función para formatear fecha
    const formatLastUpdated = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Preparar datos para gráficas de energía
    const energyChartData = analyticsData ? Object.values(analyticsData.energyDistribution).map(item => ({
        label: item.energy,
        value: item.count,
        percentage: item.percentage,
        color: getEnergyColor(item.energy)
    })).sort((a, b) => b.value - a.value) : [];

    function getEnergyColor(energy: string): string {
        const energyColors: { [key: string]: string } = {
            'átlica': 'bg-blue-500',
            'cháaktica': 'bg-green-500',
            'demótica': 'bg-purple-500',
            'feral': 'bg-orange-500',
            'gélida': 'bg-cyan-500',
            'húumica': 'bg-gray-500',
            'lítica': 'bg-yellow-500',
            'pírica': 'bg-red-500',
        };
        return energyColors[energy] || 'bg-gray-400';
    }

    if (isLoading && !analyticsData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Spinner size="lg" />
                <div className="text-center">
                    <h3 className="text-lg font-medium">Calculando estadísticas</h3>
                    <p className="text-muted-foreground">
                        Analizando todos los decks...
                    </p>
                </div>
            </div>
        );
    }

    if (error && !analyticsData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-destructive">Error al cargar analytics</h3>
                    <p className="text-muted-foreground mb-4">
                        {error.includes('permisos') 
                            ? 'No tienes permisos para ver las estadísticas completas. Solo se mostrarán mazos públicos.' 
                            : error
                        }
                    </p>
                    <Button onClick={() => loadAnalyticsData()} variant="outline">
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Analytics de Decks
                    </h1>
                    <p className="text-muted-foreground">
                        Estadísticas y métricas detalladas sobre los mazos de la plataforma
                        {analyticsData && analyticsData.deckStats.totalDecks < 10 && (
                            <span className="text-amber-600"> (Solo mazos públicos)</span>
                        )}
                    </p>
                </div>
                
                <div className="flex items-center space-x-3">
                    {analyticsData && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Actualizado: {formatLastUpdated(analyticsData.lastUpdated)}</span>
                        </div>
                    )}
                    <Button 
                        onClick={() => loadAnalyticsData(true)} 
                        variant="outline"
                        disabled={isRefreshing}
                        size="sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                    </Button>
                </div>
            </div>

            {analyticsData && (
                <>
                    {/* Métricas principales */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Total de Decks"
                            value={analyticsData.deckStats.totalDecks}
                            description="Mazos creados en total"
                            icon={Layers}
                        />
                        <MetricCard
                            title="Decks Públicos"
                            value={analyticsData.deckStats.publicDecks}
                            description={`${Math.round((analyticsData.deckStats.publicDecks / analyticsData.deckStats.totalDecks) * 100)}% del total`}
                            icon={Globe}
                        />
                        <MetricCard
                            title="Decks Privados"
                            value={analyticsData.deckStats.privateDecks}
                            description={`${Math.round((analyticsData.deckStats.privateDecks / analyticsData.deckStats.totalDecks) * 100)}% del total`}
                            icon={Lock}
                        />
                        <MetricCard
                            title="Cartas por Deck"
                            value={analyticsData.cardDistribution.avgCardsPerDeck}
                            description={`Rango: ${analyticsData.cardDistribution.minCardsPerDeck}-${analyticsData.cardDistribution.maxCardsPerDeck} cartas`}
                            icon={CreditCard}
                        />
                    </div>

                    {/* Gráficas y tablas */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Distribución por energía */}
                        <ChartCard
                            title="Distribución por Energía"
                            description={`${analyticsData.cardDistribution.totalCardsInDecks.toLocaleString()} cartas totales en decks`}
                        >
                            {energyChartData.length > 0 ? (
                                <SimpleBarChart data={energyChartData} />
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No hay datos de energía disponibles
                                </div>
                            )}
                        </ChartCard>

                        {/* Resumen de distribución */}
                        <ChartCard
                            title="Resumen de Mazos"
                            description="Distribución público/privado"
                        >
                            <PieChartLegend
                                data={[
                                    {
                                        label: 'Mazos Públicos',
                                        value: analyticsData.deckStats.publicDecks,
                                        percentage: Math.round((analyticsData.deckStats.publicDecks / analyticsData.deckStats.totalDecks) * 100),
                                        color: '#10b981'
                                    },
                                    {
                                        label: 'Mazos Privados',
                                        value: analyticsData.deckStats.privateDecks,
                                        percentage: Math.round((analyticsData.deckStats.privateDecks / analyticsData.deckStats.totalDecks) * 100),
                                        color: '#6b7280'
                                    }
                                ]}
                            />
                        </ChartCard>
                    </div>

                    {/* Top cards tables */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Top 10 cartas más utilizadas */}
                        <TopCardsTable
                            title="Top 10 Cartas Más Utilizadas"
                            description="Las cartas que aparecen en más decks"
                            cards={analyticsData.topCards}
                        />

                        {/* Top 10 cartas de inicio */}
                        <TopCardsTable
                            title="Top 10 Cartas de Inicio"
                            description={`Primeras 3 cartas más comunes (${analyticsData.topStarterCards.totalDecksAnalyzed} decks analizados)`}
                            cards={analyticsData.topStarterCards.cards}
                        />
                    </div>

                    {/* Información adicional */}
                    <div className="bg-muted/50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            Información de los Datos
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                            <div>
                                <div className="font-medium text-muted-foreground">Total de Decks Analizados</div>
                                <div className="text-lg font-bold">{analyticsData.deckStats.totalDecks}</div>
                            </div>
                            <div>
                                <div className="font-medium text-muted-foreground">Cartas Únicas</div>
                                <div className="text-lg font-bold">{analyticsData.topCards.length}</div>
                            </div>
                            <div>
                                <div className="font-medium text-muted-foreground">Decks con Estructura</div>
                                <div className="text-lg font-bold">{analyticsData.topStarterCards.totalDecksAnalyzed}</div>
                            </div>
                            <div>
                                <div className="font-medium text-muted-foreground">Última Actualización</div>
                                <div className="text-lg font-bold">{formatLastUpdated(analyticsData.lastUpdated)}</div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}