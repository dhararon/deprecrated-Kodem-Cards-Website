import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { 
	Calendar, 
	MapPin, 
	Users, 
	Trophy, 
	DollarSign, 
	Clock, 
	CheckCircle,
	XCircle,
	UserPlus,
	Crown,
	Medal,
	Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Tournament, TournamentParticipant, TournamentMatch } from '@/types/tournament';

// Mock data para desarrollo
const getMockTournament = (id: string): Tournament => ({
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
	rounds: [
		{
			id: 'r1',
			round_number: 1,
			status: 'completed',
			created_at: '2024-03-15T10:00:00Z',
			completed_at: '2024-03-15T11:30:00Z',
			matches: [
				{
					id: 'm1', round_id: 'r1', player1_id: 'u1', player2_id: 'u4',
					player1_username: 'dhargames', player2_username: 'Avalon_Tcg',
					player1_wins: 0, player2_wins: 2, status: 'completed',
					winner_id: 'u4', created_at: '2024-03-15T10:00:00Z', completed_at: '2024-03-15T10:45:00Z'
				}
			]
		}
	],
	rules: 'Formato estándar. Prohibido el uso de cartas proxy. Mazos deben ser verificados antes del inicio.',
	banner_url: '/banners/tournament-spring.jpg',
	is_public: true,
	requires_deck: true,
	min_deck_size: 40,
	max_deck_size: 60,
	banned_cards: ['carta-prohibida-1', 'carta-prohibida-2'],
	location: 'Centro de Convenciones',
	online: false
});

const getMockMatches = (): TournamentMatch[] => [
	// Ronda 1
	{ id: 'm1', round_id: 'r1', player1_id: 'u1', player1_username: 'dhargames', player1_wins: 0, player2_id: 'u2', player2_username: 'Avalon_Tcg', player2_wins: 2, status: 'completed', winner_id: 'u2', created_at: '2024-03-15T10:00:00Z' },
	{ id: 'm2', round_id: 'r1', player1_id: 'u3', player1_username: 'MiguelOxxO', player1_wins: 2, player2_id: 'u4', player2_username: 'neilmv', player2_wins: 1, status: 'completed', winner_id: 'u3', created_at: '2024-03-15T10:00:00Z' },
	{ id: 'm3', round_id: 'r1', player1_id: 'u5', player1_username: 'Yeriko', player1_wins: 0, player2_id: 'u6', player2_username: 'EmiVZ0', player2_wins: 2, status: 'completed', winner_id: 'u6', created_at: '2024-03-15T10:00:00Z' },
	{ id: 'm4', round_id: 'r1', player1_id: 'u7', player1_username: 'KERVEROZ', player1_wins: 2, player2_id: 'u8', player2_username: 'Martin_Pasten', player2_wins: 1, status: 'completed', winner_id: 'u7', created_at: '2024-03-15T10:00:00Z' },
	{ id: 'm5', round_id: 'r1', player1_id: 'u9', player1_username: 'FJVR', player1_wins: 2, player2_id: 'u10', player2_username: 'Blitzer21', player2_wins: 0, status: 'completed', winner_id: 'u9', created_at: '2024-03-15T10:00:00Z' },
	{ id: 'm6', round_id: 'r1', player1_id: 'u11', player1_username: 'Karusso', player1_wins: 1, player2_id: 'u12', player2_username: 'Emmageek78', player2_wins: 2, status: 'completed', winner_id: 'u12', created_at: '2024-03-15T10:00:00Z' },
	{ id: 'm7', round_id: 'r1', player1_id: 'u13', player1_username: 'L_G2', player1_wins: 1, player2_id: 'u14', player2_username: 'miguelsnam', player2_wins: 2, status: 'completed', winner_id: 'u14', created_at: '2024-03-15T10:00:00Z' },
	
	// Ronda 2
	{ id: 'm8', round_id: 'r2', player1_id: 'u5', player1_username: 'Yeriko', player1_wins: 1, player2_id: 'u9', player2_username: 'FJVR', player2_wins: 2, status: 'completed', winner_id: 'u9', created_at: '2024-03-15T11:00:00Z' },
	{ id: 'm9', round_id: 'r2', player1_id: 'u2', player1_username: 'Avalon_Tcg', player1_wins: 2, player2_id: 'u10', player2_username: 'Blitzer21', player2_wins: 1, status: 'completed', winner_id: 'u2', created_at: '2024-03-15T11:00:00Z' },
	{ id: 'm10', round_id: 'r2', player1_id: 'u8', player1_username: 'Martin_Pasten', player1_wins: 1, player2_id: 'u11', player2_username: 'Karusso', player2_wins: 2, status: 'completed', winner_id: 'u11', created_at: '2024-03-15T11:00:00Z' },
	{ id: 'm11', round_id: 'r2', player1_id: 'u14', player1_username: 'miguelsnam', player1_wins: 2, player2_id: 'u1', player2_username: 'dhargames', player2_wins: 1, status: 'completed', winner_id: 'u14', created_at: '2024-03-15T11:00:00Z' },
	{ id: 'm12', round_id: 'r2', player1_id: 'u4', player1_username: 'neilmv', player1_wins: 1, player2_id: 'u12', player2_username: 'Emmageek78', player2_wins: 2, status: 'completed', winner_id: 'u12', created_at: '2024-03-15T11:00:00Z' },
	{ id: 'm13', round_id: 'r2', player1_id: 'u7', player1_username: 'KERVEROZ', player1_wins: 2, player2_id: 'u6', player2_username: 'EmiVZ0', player2_wins: 0, status: 'completed', winner_id: 'u7', created_at: '2024-03-15T11:00:00Z' },
	{ id: 'm14', round_id: 'r2', player1_id: 'u3', player1_username: 'MiguelOxxO', player1_wins: 2, player2_id: 'u13', player2_username: 'L_G2', player2_wins: 0, status: 'completed', winner_id: 'u3', created_at: '2024-03-15T11:00:00Z' }
];

interface MatchCardProps {
	match: TournamentMatch;
	roundNumber: number;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, roundNumber }) => {
	const getWinnerStyle = (playerId: string, winnerId?: string) => {
		if (!winnerId) return '';
		return playerId === winnerId ? 'bg-orange-500 text-white' : 'bg-gray-600 text-gray-300';
	};

	return (
		<div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
			<div className="space-y-2">
				<div className={`flex items-center justify-between p-2 rounded ${getWinnerStyle(match.player1_id, match.winner_id)}`}>
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
					<div className={`flex items-center justify-between p-2 rounded ${getWinnerStyle(match.player2_id, match.winner_id)}`}>
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

const TournamentDetail: React.FC = () => {
	const [, params] = useRoute('/tournaments/:id');
	const { user } = useAuth();
	const [tournament, set_tournament] = useState<Tournament | null>(null);
	const [all_matches, set_all_matches] = useState<TournamentMatch[]>([]);
	const [is_registering, set_is_registering] = useState(false);
	const [loading, set_loading] = useState(true);

	const tournament_id = params?.id;

	useEffect(() => {
		if (tournament_id) {
			// Simular carga de datos
			setTimeout(() => {
				set_tournament(getMockTournament(tournament_id));
				set_all_matches(getMockMatches());
				set_loading(false);
			}, 500);
		}
	}, [tournament_id]);

	const can_register = tournament && 
		tournament.status === 'upcoming' && 
		new Date(tournament.registration_deadline) > new Date() &&
		tournament.current_participants < tournament.max_participants;

	const is_registered = tournament?.participants.some(p => p.user_id === user?.uid);

	const handle_register = async () => {
		if (!user || !tournament) return;

		set_is_registering(true);
		
		try {
			// Simular registro
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			const new_participant: TournamentParticipant = {
				id: Date.now().toString(),
				user_id: user.uid,
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
					
					{[1, 2, 3, 4].map(round_number => {
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
												<MatchCard match={match} roundNumber={round_number} />
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

			{/* Reglas del torneo */}
			<Card>
				<CardHeader>
					<CardTitle>Reglas del Torneo</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">{tournament.rules}</p>
					
					{tournament.banned_cards && tournament.banned_cards.length > 0 && (
						<div className="mt-4">
							<h4 className="font-medium mb-2">Cartas Prohibidas:</h4>
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