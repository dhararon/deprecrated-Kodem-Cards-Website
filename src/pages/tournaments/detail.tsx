import React, { useState, useEffect } from 'react';
import { useRoute, useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { 
	Calendar, 
	Users, 
	Trophy, 
	DollarSign, 
	Clock, 
	CheckCircle,
	XCircle,
	UserPlus,
	Crown,
	Medal,
	Award,
	ArrowLeft,
	User,
	Check,
	X,
	AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/Avatar';
import { Separator } from '@/components/atoms/Separator';
import { toast } from 'sonner';
import { Tournament, TournamentParticipant, TournamentMatch, TournamentBan, BanType } from '@/types/tournament';
import { CardDetails } from '@/types/card';
import { getAllCards } from '@/lib/firebase/services/cardService';

// Mock data para desarrollo
const get_mock_tournament = (id: string, realCards: CardDetails[] = []): Tournament => ({
	id,
	name: 'Torneo Regional Kódem - Primavera 2024',
	description: 'Torneo oficial de temporada con premios en efectivo y clasificación para el campeonato nacional.',
	format: 'standard',
	status: 'active',
	max_participants: 32,
	current_participants: 16,
	entry_fee: 25,
	prize_pool: 800,
	start_date: '2024-03-15T10:00:00Z',
	end_date: '2024-03-15T18:00:00Z',
	registration_deadline: '2024-03-14T23:59:59Z',
	created_by: 'admin',
	organizer_id: 'org123',
	organizer_name: 'Liga Kódem Oficial',
	created_at: '2024-02-15T10:00:00Z',
	updated_at: '2024-03-10T15:30:00Z',
	participants: [
		{
			id: '1', user_id: 'u1', username: 'Blitzer21', avatar_url: '/avatars/blitzer21.jpg',
			registered_at: '2024-02-16T10:00:00Z', checked_in: true,
			wins: 4, losses: 0, draws: 0, points: 12, rank: 1
		},
		{
			id: '2', user_id: 'u2', username: 'FJVR', avatar_url: '/avatars/fjvr.jpg',
			registered_at: '2024-02-17T11:00:00Z', checked_in: true,
			wins: 3, losses: 1, draws: 0, points: 9, rank: 2
		},
		{
			id: '3', user_id: 'u3', username: 'Emmageek78', avatar_url: '/avatars/emmageek78.jpg',
			registered_at: '2024-02-18T12:00:00Z', checked_in: true,
			wins: 3, losses: 1, draws: 0, points: 9, rank: 3
		}
	],
	rounds: [],
	rules: 'Formato estándar. Prohibido el uso de cartas proxy. Mazos deben ser verificados antes del inicio.',
	banner_url: '/banners/tournament-spring.jpg',
	is_public: true,
	requires_deck: true,
	min_deck_size: 40,
	max_deck_size: 60,
	banned_cards: ['carta-prohibida-1', 'carta-prohibida-2'],
	banned_items: [
		{
			id: 'ban1',
			type: 'card_type',
			name: 'Adendei Legendarios',
			description: 'Todos los Adendei de rareza Legendaria',
			reason: 'Balance competitivo'
		},
		{
			id: 'ban2',
			type: 'set',
			name: 'Set Primordial',
			description: 'Cartas del set de lanzamiento',
			reason: 'Poder desbalanceado'
		},
		{
			id: 'ban3',
			type: 'protector',
			name: realCards[0]?.name || 'Guardián Ancestral',
			description: 'Protector con habilidad de robo excesivo',
			reason: 'Ventaja injusta',
			icon: realCards[0]?.imageUrl || '/images/cards/protector/guardian-ancestral.jpg'
		},
		{
			id: 'ban4',
			type: 'ixim',
			name: realCards[1]?.name || 'Espada del Vacío',
			description: 'Equipamiento que otorga inmunidad',
			reason: 'Rompe mecánicas base',
			icon: realCards[1]?.imageUrl || '/images/cards/ixim/espada-del-vacio.jpg'
		},
		{
			id: 'ban5',
			type: 'bio',
			name: realCards[2]?.name || 'Esencia Corrupta',
			description: 'Bio que permite múltiples invocaciones',
			reason: 'Acelera excesivamente el juego',
			icon: realCards[2]?.imageUrl || '/images/cards/bio/esencia-corrupta.jpg'
		},
		{
			id: 'ban6',
			type: 'specific_card',
			name: realCards[3]?.name || 'Tormenta Eterna',
			description: 'Carta específica que causa loops infinitos',
			reason: 'Partidas sin fin',
			icon: realCards[3]?.imageUrl || '/images/cards/adendei/tormenta-eterna.jpg'
		},
		{
			id: 'ban7',
			type: 'protector',
			name: realCards[4]?.name || 'Alma de Hierro',
			description: 'Protector defensivo indestructible',
			reason: 'Partidas extremadamente largas',
			icon: realCards[4]?.imageUrl || '/images/cards/protector/alma-de-hierro.jpg'
		},
		{
			id: 'ban8',
			type: 'ixim',
			name: realCards[5]?.name || 'Anillo del Tiempo',
			description: 'Equipamiento que manipula turnos',
			reason: 'Mecánica no balanceada',
			icon: realCards[5]?.imageUrl || '/images/cards/ixim/anillo-del-tiempo.jpg'
		}
	],
	location: 'Centro de Convenciones',
	online: false
});

const get_mock_matches = (): TournamentMatch[] => [
	// Ronda 1
	{ id: 'm1', round_id: 'r1', player1_id: 'u1', player1_username: 'dhargames', player1_wins: 0, player2_id: 'u2', player2_username: 'Avalon_Tcg', player2_wins: 2, status: 'completed', winner_id: 'u2', created_at: '2024-03-15T10:00:00Z' },
	{ id: 'm2', round_id: 'r1', player1_id: 'u3', player1_username: 'MiguelOxxO', player1_wins: 2, player2_id: 'u4', player2_username: 'neilmv', player2_wins: 1, status: 'completed', winner_id: 'u3', created_at: '2024-03-15T10:00:00Z' },
	{ id: 'm3', round_id: 'r1', player1_id: 'u5', player1_username: 'Yeriko', player1_wins: 0, player2_id: 'u6', player2_username: 'EmiVZ0', player2_wins: 2, status: 'completed', winner_id: 'u6', created_at: '2024-03-15T10:00:00Z' },
	{ id: 'm4', round_id: 'r1', player1_id: 'u7', player1_username: 'KERVEROZ', player1_wins: 2, player2_id: 'u8', player2_username: 'Martin_Pasten', player2_wins: 1, status: 'completed', winner_id: 'u7', created_at: '2024-03-15T10:00:00Z' },
	{ id: 'm5', round_id: 'r1', player1_id: 'u9', player1_username: 'FJVR', player1_wins: 2, player2_id: 'u10', player2_username: 'Blitzer21', player2_wins: 0, status: 'completed', winner_id: 'u9', created_at: '2024-03-15T10:00:00Z' },
	{ id: 'm6', round_id: 'r1', player1_id: 'u11', player1_username: 'Karusso', player1_wins: 1, player2_id: 'u12', player2_username: 'Emmageek78', player2_wins: 2, status: 'completed', winner_id: 'u12', created_at: '2024-03-15T10:00:00Z' },
	{ id: 'm7', round_id: 'r1', player1_id: 'u13', player1_username: 'L_G2', player1_wins: 1, player2_id: 'u14', player2_username: 'miguelsnam', player2_wins: 2, status: 'completed', winner_id: 'u14', created_at: '2024-03-15T10:00:00Z' },
];

interface MatchCardProps {
	match: TournamentMatch;
	round_number: number;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, round_number }) => {
	const get_winner_style = (player_id: string, winner_id?: string) => {
		if (!winner_id) return '';
		return player_id === winner_id ? 'bg-orange-500 text-white' : 'bg-gray-600 text-gray-300';
	};

	return (
		<div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
			<div className="space-y-2">
				<div className={`flex items-center justify-between p-2 rounded ${get_winner_style(match.player1_id, match.winner_id)}`}>
					<div className="flex items-center space-x-2">
						<Avatar className="h-6 w-6">
							<AvatarFallback className="text-xs bg-gray-600 text-white">
								{match.player1_username.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<span className="text-sm font-medium">{match.player1_username}</span>
					</div>
					<span className="font-bold">{match.player1_wins}</span>
				</div>
				
				{match.player2_id ? (
					<div className={`flex items-center justify-between p-2 rounded ${get_winner_style(match.player2_id, match.winner_id)}`}>
						<div className="flex items-center space-x-2">
							<Avatar className="h-6 w-6">
								<AvatarFallback className="text-xs bg-gray-600 text-white">
									{match.player2_username?.slice(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span className="text-sm font-medium">{match.player2_username}</span>
						</div>
						<span className="font-bold">{match.player2_wins}</span>
					</div>
				) : (
					<div className="flex items-center justify-center p-2 bg-yellow-600 rounded text-white">
						<span className="text-sm font-medium">BYE</span>
					</div>
				)}
			</div>
		</div>
	);
};

interface BannedCardImageProps {
	ban: TournamentBan;
}

const BannedCardImage: React.FC<BannedCardImageProps> = ({ ban }) => {
	const [image_error, set_image_error] = useState(false);

	return (
		<div className="relative group cursor-pointer transition-transform duration-200 hover:scale-105">
			{/* Imagen de la carta */}
			<div className="relative overflow-hidden rounded-lg border-2 border-red-500 shadow-lg bg-gray-100">
				{!image_error ? (
					<img
						src={ban.icon || '/images/cards/placeholder.jpg'}
						alt={ban.name}
						className="w-full h-48 object-cover transition-all duration-300 grayscale hover:grayscale-0"
						onError={() => set_image_error(true)}
					/>
				) : (
					<div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
						<div className="text-center text-gray-500">
							<XCircle className="h-8 w-8 mx-auto mb-2" />
							<p className="text-xs font-medium">{ban.name}</p>
						</div>
					</div>
				)}
				
				{/* Overlay de prohibido */}
				<div className="absolute inset-0 bg-red-500 bg-opacity-30 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
					<div className="bg-red-600 text-white px-2 py-1 rounded-full font-bold text-xs shadow-lg transform rotate-12 border border-red-400">
						PROHIBIDO
					</div>
				</div>

				{/* Icono X en la esquina */}
				<div className="absolute top-2 right-2 bg-red-600 rounded-full p-1">
					<XCircle className="h-4 w-4 text-white" />
				</div>
			</div>
			
			{/* Información de la carta */}
			<div className="mt-2 text-center">
				<h5 className="font-medium text-red-600 text-sm truncate" title={ban.name}>
					{ban.name}
				</h5>
				{ban.reason && (
					<p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={ban.reason}>
						{ban.reason}
					</p>
				)}
			</div>
		</div>
	);
};

const TournamentDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const [, setLocation] = useLocation();
	const { user } = useAuth();
	const [tournament, set_tournament] = useState<Tournament | null>(null);
	const [all_matches, set_all_matches] = useState<TournamentMatch[]>([]);
	const [is_registering, set_is_registering] = useState(false);
	const [loading, set_loading] = useState(true);
	const [realCards, setRealCards] = useState<CardDetails[]>([]);

	useEffect(() => {
		if (id) {
			// Simular carga de datos
			setTimeout(() => {
				set_tournament(get_mock_tournament(id, realCards));
				set_all_matches(get_mock_matches());
				set_loading(false);
			}, 500);
		}
	}, [id, realCards]);

	// Obtener cartas reales de Firestore
	useEffect(() => {
		const fetchRealCards = async () => {
			try {
				const cards = await getAllCards();
				// Tomar solo unas pocas cartas como ejemplo
				const sampleCards = cards.slice(0, 6);
				setRealCards(sampleCards);
			} catch (error) {
				console.error('Error al obtener cartas reales:', error);
				// Mantener las imágenes mock como fallback
				setRealCards([]);
			}
		};

		fetchRealCards();
	}, []);

	const can_register = tournament && 
		tournament.status === 'upcoming' && 
		new Date(tournament.registration_deadline) > new Date() &&
		tournament.current_participants < tournament.max_participants;

	const is_registered = tournament?.participants.some(p => p.user_id === user?.id);

	const handle_register = async () => {
		if (!user || !tournament) return;

		set_is_registering(true);
		
		try {
			// Simular registro
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			const new_participant: TournamentParticipant = {
				id: Date.now().toString(),
				user_id: user.id || '',
				username: user.name || 'Usuario',
				registered_at: new Date().toISOString(),
				checked_in: false,
				wins: 0,
				losses: 0,
				draws: 0,
				points: 0
			};

			set_tournament(prev => prev ? {
				...prev,
				participants: [...prev.participants, new_participant],
				current_participants: prev.current_participants + 1
			} : null);

			toast.success('¡Te has registrado exitosamente al torneo!');
		} catch (error) {
			toast.error('Error al registrarse al torneo');
		} finally {
			set_is_registering(false);
		}
	};

	const get_matches_by_round = (round_number: number) => {
		return all_matches.filter(match => {
			const round_id = `r${round_number}`;
			return match.round_id === round_id;
		});
	};

	const get_status_badge = (status: string) => {
		const variants = {
			upcoming: 'bg-blue-100 text-blue-800',
			active: 'bg-green-100 text-green-800',
			completed: 'bg-gray-100 text-gray-800',
			cancelled: 'bg-red-100 text-red-800'
		};

		const labels = {
			upcoming: 'Próximo',
			active: 'Activo',
			completed: 'Completado',
			cancelled: 'Cancelado'
		};

		return (
			<Badge className={variants[status as keyof typeof variants]}>
				{labels[status as keyof typeof labels]}
			</Badge>
		);
	};

	const get_format_label = (format: string) => {
		const labels = {
			standard: 'Estándar',
			sealed: 'Sellado',
			draft: 'Draft',
			custom: 'Personalizado'
		};
		return labels[format as keyof typeof labels] || format;
	};

	const get_ban_type_info = (type: BanType) => {
		const ban_types = {
			card_type: { label: 'Tipo de Carta', icon: '🃏', color: 'bg-blue-100 text-blue-800' },
			set: { label: 'Set', icon: '📦', color: 'bg-purple-100 text-purple-800' },
			protector: { label: 'Protector', icon: '🛡️', color: 'bg-green-100 text-green-800' },
			ixim: { label: 'Ixim', icon: '⚔️', color: 'bg-yellow-100 text-yellow-800' },
			bio: { label: 'Bio', icon: '🧬', color: 'bg-red-100 text-red-800' },
			specific_card: { label: 'Carta Específica', icon: '🎯', color: 'bg-gray-100 text-gray-800' }
		};
		return ban_types[type] || ban_types.specific_card;
	};

	const get_bans_by_type = (bans: TournamentBan[]) => {
		return bans.reduce((acc, ban) => {
			if (!acc[ban.type]) {
				acc[ban.type] = [];
			}
			acc[ban.type].push(ban);
			return acc;
		}, {} as Record<BanType, TournamentBan[]>);
	};

	const should_show_card_image = (type: BanType) => {
		return ['protector', 'ixim', 'bio', 'specific_card'].includes(type);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (!tournament) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen space-y-4">
				<XCircle className="h-16 w-16 text-red-500" />
				<h1 className="text-2xl font-bold">Torneo no encontrado</h1>
				<p className="text-muted-foreground">El torneo que buscas no existe o ha sido eliminado.</p>
			</div>
		);
	}

	const top_finishers = tournament.participants
		.filter(p => p.rank && p.rank <= 3)
		.sort((a, b) => (a.rank || 999) - (b.rank || 999));

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-8">
			{/* Header del torneo */}
			<div className="space-y-4">
				<div className="flex items-start justify-between">
					<div className="space-y-2">
						<h1 className="text-3xl font-bold">{tournament.name}</h1>
						<p className="text-lg text-muted-foreground">{tournament.description}</p>
						<div className="flex items-center gap-4">
							{get_status_badge(tournament.status)}
							<Badge variant="outline">{get_format_label(tournament.format)}</Badge>
							{tournament.online ? (
								<Badge variant="outline">En línea</Badge>
							) : (
								<Badge variant="outline">Presencial</Badge>
							)}
						</div>
					</div>
					{can_register && !is_registered && (
						<Button 
							size="lg" 
							onClick={handle_register}
							disabled={is_registering}
							className="flex items-center gap-2"
						>
							<UserPlus className="h-4 w-4" />
							{is_registering ? 'Registrando...' : 'Registrarse'}
						</Button>
					)}
					{is_registered && (
						<div className="flex items-center gap-2 text-green-600">
							<CheckCircle className="h-5 w-5" />
							<span className="font-medium">Registrado</span>
						</div>
					)}
				</div>
			</div>

			{/* Información del torneo */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4 flex items-center space-x-3">
						<Calendar className="h-8 w-8 text-blue-500" />
						<div>
							<p className="text-sm text-muted-foreground">Fecha</p>
							<p className="font-medium">
								{new Date(tournament.start_date).toLocaleDateString('es-ES', {
									day: '2-digit',
									month: 'short',
									year: 'numeric'
								})}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 flex items-center space-x-3">
						<Users className="h-8 w-8 text-green-500" />
						<div>
							<p className="text-sm text-muted-foreground">Participantes</p>
							<p className="font-medium">{tournament.current_participants}/{tournament.max_participants}</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 flex items-center space-x-3">
						<DollarSign className="h-8 w-8 text-yellow-500" />
						<div>
							<p className="text-sm text-muted-foreground">Premio</p>
							<p className="font-medium">${tournament.prize_pool}</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 flex items-center space-x-3">
						<Clock className="h-8 w-8 text-purple-500" />
						<div>
							<p className="text-sm text-muted-foreground">Inscripciones hasta</p>
							<p className="font-medium">
								{new Date(tournament.registration_deadline).toLocaleDateString('es-ES', {
									day: '2-digit',
									month: 'short'
								})}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Resultados finales */}
			{tournament.status === 'completed' && top_finishers.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Trophy className="h-5 w-5 text-yellow-500" />
							Resultados Finales
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{top_finishers.map((participant, index) => {
								const icons = [Crown, Medal, Award];
								const colors = ['text-yellow-500', 'text-gray-400', 'text-orange-500'];
								const Icon = icons[index];
								const color = colors[index];
								
								return (
									<div key={participant.id} className="flex items-center space-x-3 p-4 border rounded-lg">
										<Icon className={`h-8 w-8 ${color}`} />
										<Avatar className="h-12 w-12">
											<AvatarImage src={participant.avatar_url} />
											<AvatarFallback>{participant.username.slice(0, 2).toUpperCase()}</AvatarFallback>
										</Avatar>
										<div>
											<p className="font-medium">{participant.username}</p>
											<p className="text-sm text-muted-foreground">
												{participant.wins}-{participant.losses}-{participant.draws}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Emparejamientos por ronda */}
			{tournament.status !== 'upcoming' && all_matches.length > 0 && (
				<div className="space-y-6">
					<h2 className="text-2xl font-bold">Emparejamientos</h2>
					
					{[1].map(round_number => {
						const round_matches = get_matches_by_round(round_number);
						if (round_matches.length === 0) return null;

						return (
							<Card key={round_number} className="bg-gray-900 border-gray-700">
								<CardHeader>
									<CardTitle className="text-white">Ronda {round_number}</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
										{round_matches.map((match, index) => (
											<div key={match.id} className="relative">
												<div className="absolute -top-2 -left-2 bg-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs text-white font-bold">
													{index + 1}
												</div>
												<MatchCard match={match} round_number={round_number} />
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{/* Lista de participantes */}
			<Card>
				<CardHeader>
					<CardTitle>Participantes Registrados</CardTitle>
					<CardDescription>
						{tournament.current_participants} de {tournament.max_participants} jugadores registrados
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{tournament.participants.map((participant) => (
							<div key={participant.id} className="flex items-center space-x-3 p-3 border rounded-lg">
								<Avatar>
									<AvatarImage src={participant.avatar_url} />
									<AvatarFallback>{participant.username.slice(0, 2).toUpperCase()}</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<p className="font-medium">{participant.username}</p>
									{tournament.status !== 'upcoming' && (
										<p className="text-sm text-muted-foreground">
											{participant.wins}W-{participant.losses}L-{participant.draws}D
										</p>
									)}
								</div>
								{participant.checked_in && (
									<CheckCircle className="h-4 w-4 text-green-500" />
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Sección de Baneos */}
			{tournament.banned_items && tournament.banned_items.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<XCircle className="h-5 w-5 text-red-500" />
							Elementos Prohibidos
						</CardTitle>
						<CardDescription>
							Los siguientes elementos están prohibidos en este torneo
						</CardDescription>
					</CardHeader>
					<CardContent>
						{(() => {
							const bans_by_type = get_bans_by_type(tournament.banned_items!);
							return (
								<div className="space-y-6">
									{Object.entries(bans_by_type).map(([type, bans]) => {
										const type_info = get_ban_type_info(type as BanType);
										return (
											<div key={type} className="space-y-3">
												<div className="flex items-center gap-2">
													<span className="text-lg">{type_info.icon}</span>
													<h4 className="font-semibold text-lg">{type_info.label}</h4>
													<Badge className={type_info.color}>
														{bans.length} {bans.length === 1 ? 'elemento' : 'elementos'}
													</Badge>
												</div>
												{should_show_card_image(type as BanType) ? (
													<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
														{bans.map((ban) => (
															<BannedCardImage key={ban.id} ban={ban} />
														))}
													</div>
												) : (
													<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
														{bans.map((ban) => (
															<div key={ban.id} className="border rounded-lg p-4 space-y-2">
																<div className="flex items-start justify-between">
																	<h5 className="font-medium text-red-600">{ban.name}</h5>
																	<Badge variant="destructive" className="text-xs">
																		PROHIBIDO
																	</Badge>
																</div>
																{ban.description && (
																	<p className="text-sm text-muted-foreground">
																		{ban.description}
																	</p>
																)}
																{ban.reason && (
																	<div className="flex items-center gap-2 text-xs">
																		<span className="font-medium text-orange-600">Razón:</span>
																		<span className="text-muted-foreground">{ban.reason}</span>
																	</div>
																)}
															</div>
														))}
													</div>
												)}
											</div>
										);
									})}
								</div>
							);
						})()}
					</CardContent>
				</Card>
			)}

			{/* Reglas del torneo */}
			<Card>
				<CardHeader>
					<CardTitle>Reglas del Torneo</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">{tournament.rules}</p>
					
					{tournament.banned_cards && tournament.banned_cards.length > 0 && (
						<div className="mt-4">
							<h4 className="font-medium mb-2">Cartas Prohibidas (Legado):</h4>
							<div className="flex flex-wrap gap-2">
								{tournament.banned_cards.map((card, index) => (
									<Badge key={index} variant="destructive">
										{card}
									</Badge>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default TournamentDetail;
