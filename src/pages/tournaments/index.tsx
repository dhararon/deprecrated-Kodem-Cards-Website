import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
	Plus, 
	Trophy, 
	Calendar, 
	Users, 
	MapPin, 
	DollarSign, 
	Filter, 
	Search,
	ArrowRight,
	Clock,
	CheckCircle,
	XCircle,
	Globe,
	Monitor
} from 'lucide-react';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Spinner } from '@/components/atoms/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Badge } from '@/components/atoms/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tournament, TournamentStatus, TournamentFormat } from '@/types/tournament';
import { useAuth } from '@/hooks/useAuth';

/**
 * Page for displaying all tournaments (available and past)
 */
const Tournaments: React.FC = () => {
	const { user, isLoading: authLoading } = useAuth();
	const [tournaments, setTournaments] = useState<Tournament[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedFormat, setSelectedFormat] = useState<TournamentFormat | 'all'>('all');
	const [selectedStatus, setSelectedStatus] = useState<TournamentStatus | 'all'>('all');
	const [activeTab, setActiveTab] = useState<'available' | 'past'>('available');

	// Mock data para demostración (remover cuando se implemente el backend)
	useEffect(() => {
		const mockTournaments: Tournament[] = [
			{
				id: '1',
				name: 'Copa Kódem Primavera 2024',
				description: 'El torneo más esperado del año. Únete y demuestra tus habilidades en el TCG Kódem.',
				format: 'standard',
				max_participants: 32,
				current_participants: 18,
				entry_fee: 25.00,
				prize_pool: 500.00,
				start_date: '2024-04-15T10:00:00Z',
				registration_deadline: '2024-04-12T23:59:59Z',
				status: 'upcoming',
				is_public: true,
				online: false,
				location: 'Centro de Convenciones - Ciudad de México',
				created_by: 'admin',
				organizer_id: 'org1',
				organizer_name: 'Federación Kódem MX',
				requires_deck: true,
				created_at: '2024-01-15T10:00:00Z',
				updated_at: '2024-01-15T10:00:00Z',
				banner_url: 'https://picsum.photos/800/400?random=1',
				rules: 'Torneo estándar siguiendo las reglas oficiales del TCG Kódem.',
				participants: [],
				rounds: []
			},
			{
				id: '2',
				name: 'Torneo Draft Nocturno',
				description: 'Draft competitivo todos los viernes. Experimenta con nuevas estrategias.',
				format: 'draft',
				max_participants: 16,
				current_participants: 12,
				entry_fee: 15.00,
				prize_pool: 180.00,
				start_date: '2024-03-29T19:00:00Z',
				registration_deadline: '2024-03-29T18:00:00Z',
				status: 'upcoming',
				is_public: true,
				online: true,
				created_by: 'admin',
				organizer_id: 'org2',
				organizer_name: 'Club Kódem Elite',
				requires_deck: false,
				created_at: '2024-01-20T10:00:00Z',
				updated_at: '2024-01-20T10:00:00Z',
				banner_url: 'https://picsum.photos/800/400?random=2',
				rules: 'Formato draft con 3 sobres por jugador.',
				participants: [],
				rounds: []
			},
			{
				id: '3',
				name: 'Campeonato Regional Norte',
				description: 'Clasificatorio para el campeonato nacional. Solo los mejores avanzarán.',
				format: 'standard',
				max_participants: 64,
				current_participants: 64,
				entry_fee: 50.00,
				prize_pool: 2000.00,
				start_date: '2024-03-20T09:00:00Z',
				registration_deadline: '2024-03-18T23:59:59Z',
				status: 'active',
				is_public: true,
				online: false,
				location: 'Arena Kódem - Monterrey',
				created_by: 'admin',
				organizer_id: 'org3',
				organizer_name: 'Liga Profesional Kódem',
				requires_deck: true,
				created_at: '2024-02-01T10:00:00Z',
				updated_at: '2024-02-01T10:00:00Z',
				banner_url: 'https://picsum.photos/800/400?random=3',
				rules: 'Clasificatorio oficial con reglas estrictas.',
				participants: [],
				rounds: []
			},
			{
				id: '4',
				name: 'Copa de Invierno 2023',
				description: 'El torneo que marcó el final del año anterior. Grandes batallas y momentos épicos.',
				format: 'sealed',
				max_participants: 24,
				current_participants: 24,
				entry_fee: 30.00,
				prize_pool: 600.00,
				start_date: '2023-12-15T10:00:00Z',
				registration_deadline: '2023-12-12T23:59:59Z',
				status: 'completed',
				is_public: true,
				online: false,
				location: 'Centro Kódem - Guadalajara',
				created_by: 'admin',
				organizer_id: 'org1',
				organizer_name: 'Federación Kódem MX',
				requires_deck: true,
				created_at: '2023-11-01T10:00:00Z',
				updated_at: '2023-12-16T20:00:00Z',
				banner_url: 'https://picsum.photos/800/400?random=4',
				rules: 'Formato sellado con 6 sobres por jugador.',
				participants: [],
				rounds: []
			}
		];

		// Simular carga de datos
		setTimeout(() => {
			setTournaments(mockTournaments);
			setIsLoading(false);
		}, 1000);
	}, []);

	// Filtrar torneos basado en criterios de búsqueda
	const filteredTournaments = tournaments.filter(tournament => {
		const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			tournament.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			tournament.organizer_name.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesFormat = selectedFormat === 'all' || tournament.format === selectedFormat;
		
		const matchesStatus = selectedStatus === 'all' || tournament.status === selectedStatus;

		const matchesTab = activeTab === 'available' 
			? tournament.status === 'upcoming' || tournament.status === 'active'
			: tournament.status === 'completed' || tournament.status === 'cancelled';

		return matchesSearch && matchesFormat && matchesStatus && matchesTab;
	});

	// Formatear fecha para mostrar
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('es', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	};

	// Obtener badge de estado
	const getStatusBadge = (status: TournamentStatus) => {
		const variants = {
			upcoming: { variant: 'secondary' as const, icon: Clock, text: 'Próximo' },
			active: { variant: 'destructive' as const, icon: Trophy, text: 'En Curso' },
			completed: { variant: 'outline' as const, icon: CheckCircle, text: 'Finalizado' },
			cancelled: { variant: 'destructive' as const, icon: XCircle, text: 'Cancelado' }
		};

		const config = variants[status];
		const Icon = config.icon;

		return (
			<Badge variant={config.variant} className="flex items-center gap-1">
				<Icon className="h-3 w-3" />
				{config.text}
			</Badge>
		);
	};

	// Obtener badge de formato
	const getFormatBadge = (format: TournamentFormat) => {
		const formatNames = {
			standard: 'Estándar',
			draft: 'Draft',
			sealed: 'Sellado',
			custom: 'Personalizado'
		};

		return (
			<Badge variant="outline">
				{formatNames[format]}
			</Badge>
		);
	};

	// Renderizar estado de carga
	if (authLoading || isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4">
				<Spinner size="lg" className="mb-4" />
				<p className="text-muted-foreground">Cargando torneos...</p>
			</div>
		);
	}

	// Renderizar error
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4">
				<EmptyState
					title="Error al cargar torneos"
					description={error}
					icon={<Trophy className="h-10 w-10 text-red-500" />}
					action={
						<Button
							onClick={() => window.location.reload()}
							className="mt-4"
						>
							Reintentar
						</Button>
					}
				/>
			</div>
		);
	}

	return (
		<div className="min-h-[calc(100vh-4rem)] flex flex-col p-4 w-full">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<Trophy className="h-6 w-6 text-primary" />
						Torneos
					</h1>
					<p className="text-muted-foreground mt-1">
						Descubre y participa en torneos de Kódem TCG
					</p>
				</div>
				
				{user && (
					<Link href="/tournaments/create">
						<Button>
							<Plus className="h-4 w-4 mr-2" />
							Crear Torneo
						</Button>
					</Link>
				)}
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4 mb-6">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder="Buscar torneos..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>
				
				<Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as TournamentFormat | 'all')}>
					<SelectTrigger className="w-full sm:w-[140px]">
						<SelectValue placeholder="Formato" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos</SelectItem>
						<SelectItem value="standard">Estándar</SelectItem>
						<SelectItem value="draft">Draft</SelectItem>
						<SelectItem value="sealed">Sellado</SelectItem>
						<SelectItem value="custom">Personalizado</SelectItem>
					</SelectContent>
				</Select>

				<Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TournamentStatus | 'all')}>
					<SelectTrigger className="w-full sm:w-[140px]">
						<SelectValue placeholder="Estado" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos</SelectItem>
						<SelectItem value="upcoming">Próximos</SelectItem>
						<SelectItem value="active">En Curso</SelectItem>
						<SelectItem value="completed">Finalizados</SelectItem>
						<SelectItem value="cancelled">Cancelados</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'available' | 'past')} className="flex-1">
				<TabsList className="grid w-full grid-cols-2 mb-6">
					<TabsTrigger value="available">Disponibles</TabsTrigger>
					<TabsTrigger value="past">Pasados</TabsTrigger>
				</TabsList>

				<TabsContent value="available">
					{filteredTournaments.length === 0 ? (
						<EmptyState
							title="No hay torneos disponibles"
							description="No se encontraron torneos que coincidan con tus criterios de búsqueda"
							icon={<Trophy className="h-10 w-10 text-primary/60" />}
							action={
								user && (
									<Link href="/tournaments/create">
										<Button className="mt-4">
											<Plus className="h-4 w-4 mr-2" />
											Crear Torneo
										</Button>
									</Link>
								)
							}
						/>
					) : (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{filteredTournaments.map((tournament) => (
								<Card key={tournament.id} className="overflow-hidden hover:shadow-lg transition-shadow">
									<CardHeader className="pb-3">
										<div className="flex justify-between items-start gap-2">
											<CardTitle className="text-lg line-clamp-2">
												{tournament.name}
											</CardTitle>
											{getStatusBadge(tournament.status)}
										</div>
										<p className="text-sm text-muted-foreground line-clamp-2">
											{tournament.description}
										</p>
									</CardHeader>
									
									<CardContent className="space-y-4">
										{/* Format and Type */}
										<div className="flex flex-wrap gap-2">
											{getFormatBadge(tournament.format)}
											<Badge variant="outline" className="flex items-center gap-1">
												{tournament.online ? (
													<>
														<Monitor className="h-3 w-3" />
														Online
													</>
												) : (
													<>
														<MapPin className="h-3 w-3" />
														Presencial
													</>
												)}
											</Badge>
										</div>

										{/* Tournament Info */}
										<div className="space-y-2 text-sm">
											<div className="flex items-center gap-2">
												<Calendar className="h-4 w-4 text-muted-foreground" />
												<span>{formatDate(tournament.start_date)}</span>
											</div>
											
											<div className="flex items-center gap-2">
												<Users className="h-4 w-4 text-muted-foreground" />
												<span>
													{tournament.current_participants}/{tournament.max_participants} participantes
												</span>
											</div>
											
											{tournament.entry_fee > 0 && (
												<div className="flex items-center gap-2">
													<DollarSign className="h-4 w-4 text-muted-foreground" />
													<span>Entrada: ${tournament.entry_fee}</span>
												</div>
											)}
											
											{tournament.prize_pool > 0 && (
												<div className="flex items-center gap-2">
													<Trophy className="h-4 w-4 text-muted-foreground" />
													<span>Premio: ${tournament.prize_pool}</span>
												</div>
											)}
											
											{!tournament.online && tournament.location && (
												<div className="flex items-center gap-2">
													<MapPin className="h-4 w-4 text-muted-foreground" />
													<span className="line-clamp-1">{tournament.location}</span>
												</div>
											)}
										</div>

										{/* Action Button */}
										<Link href={`/tournaments/${tournament.id}`}>
											<Button className="w-full" variant="outline">
												Ver Detalles
												<ArrowRight className="h-4 w-4 ml-2" />
											</Button>
										</Link>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="past">
					{filteredTournaments.length === 0 ? (
						<EmptyState
							title="No hay torneos pasados"
							description="No se encontraron torneos finalizados que coincidan con tus criterios"
							icon={<Trophy className="h-10 w-10 text-primary/60" />}
						/>
					) : (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{filteredTournaments.map((tournament) => (
								<Card key={tournament.id} className="overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
									<CardHeader className="pb-3">
										<div className="flex justify-between items-start gap-2">
											<CardTitle className="text-lg line-clamp-2">
												{tournament.name}
											</CardTitle>
											{getStatusBadge(tournament.status)}
										</div>
										<p className="text-sm text-muted-foreground line-clamp-2">
											{tournament.description}
										</p>
									</CardHeader>
									
									<CardContent className="space-y-4">
										{/* Format and Type */}
										<div className="flex flex-wrap gap-2">
											{getFormatBadge(tournament.format)}
											<Badge variant="outline" className="flex items-center gap-1">
												{tournament.online ? (
													<>
														<Monitor className="h-3 w-3" />
														Online
													</>
												) : (
													<>
														<MapPin className="h-3 w-3" />
														Presencial
													</>
												)}
											</Badge>
										</div>

										{/* Tournament Info */}
										<div className="space-y-2 text-sm">
											<div className="flex items-center gap-2">
												<Calendar className="h-4 w-4 text-muted-foreground" />
												<span>{formatDate(tournament.start_date)}</span>
												{tournament.end_date && (
													<span className="text-muted-foreground">
														- {formatDate(tournament.end_date)}
													</span>
												)}
											</div>
											
											<div className="flex items-center gap-2">
												<Users className="h-4 w-4 text-muted-foreground" />
												<span>{tournament.current_participants} participantes</span>
											</div>
											
											{tournament.prize_pool > 0 && (
												<div className="flex items-center gap-2">
													<Trophy className="h-4 w-4 text-muted-foreground" />
													<span>Premio: ${tournament.prize_pool}</span>
												</div>
											)}
										</div>

										{/* Action Button */}
										<Link href={`/tournaments/${tournament.id}`}>
											<Button className="w-full" variant="outline">
												Ver Resultados
												<ArrowRight className="h-4 w-4 ml-2" />
											</Button>
										</Link>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default Tournaments; 