import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, X, Plus, Info, Calendar, Users, DollarSign, Trophy, MapPin, Monitor, Globe, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Textarea } from '@/components/atoms/Textarea';
import { Label } from '@/components/atoms/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select';
import { Switch } from '@/components/atoms/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/atoms/Dialog';
import { TournamentFormat } from '@/types/tournament';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FormData {
	name: string;
	description: string;
	format: TournamentFormat;
	max_participants: number;
	entry_fee: number;
	prize_pool: number;
	start_date: string;
	registration_deadline: string;
	rules: string;
	is_public: boolean;
	requires_deck: boolean;
	min_deck_size: number;
	max_deck_size: number;
	location: string;
	online: boolean;
}

const CreateTournament: React.FC = () => {
	const { user, isLoading: authLoading } = useAuth();
	const [location, setLocation] = useLocation();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [bannedCards, setBannedCards] = useState<string[]>([]);
	const [newBannedCard, setNewBannedCard] = useState('');
	const [showBannedCardsDialog, setShowBannedCardsDialog] = useState(false);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors }
	} = useForm<FormData>({
		defaultValues: {
			name: '',
			description: '',
			format: 'standard',
			max_participants: 16,
			entry_fee: 0,
			prize_pool: 0,
			start_date: '',
			registration_deadline: '',
			rules: 'Reglas estándar del TCG Kódem.',
			is_public: true,
			requires_deck: true,
			min_deck_size: 30,
			max_deck_size: 60,
			location: '',
			online: false
		}
	});

	const watchOnline = watch('online');
	const watchRequiresDeck = watch('requires_deck');
	const watchFormat = watch('format');

	const getMinDate = () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().slice(0, 16);
	};

	const onSubmit = async (data: FormData) => {
		if (!user) {
			toast.error('Debes iniciar sesión para crear un torneo');
			return;
		}

		try {
			setIsSubmitting(true);
			console.log('Datos del torneo:', { ...data, banned_cards: bannedCards });
			await new Promise(resolve => setTimeout(resolve, 2000));
			toast.success('Torneo creado exitosamente');
			setLocation('/tournaments');
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al crear el torneo');
		} finally {
			setIsSubmitting(false);
		}
	};

	const addBannedCard = () => {
		if (newBannedCard.trim() && !bannedCards.includes(newBannedCard.trim())) {
			setBannedCards([...bannedCards, newBannedCard.trim()]);
			setNewBannedCard('');
		}
	};

	const removeBannedCard = (cardName: string) => {
		setBannedCards(bannedCards.filter(card => card !== cardName));
	};

	if (authLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Cargando...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-screen p-4">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6 text-center">
						<AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
						<h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
						<p className="text-muted-foreground mb-4">
							Debes iniciar sesión para crear un torneo
						</p>
						<Button onClick={() => setLocation('/login')}>
							Iniciar Sesión
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-[calc(100vh-4rem)] p-4 w-full max-w-4xl mx-auto">
			<div className="flex items-center gap-4 mb-6">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setLocation('/tournaments')}
					className="flex items-center gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Volver
				</Button>
				<div>
					<h1 className="text-2xl font-bold">Crear Torneo</h1>
					<p className="text-muted-foreground">
						Organiza tu propio torneo de Kódem TCG
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Info className="h-5 w-5" />
							Información Básica
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">Nombre del Torneo *</Label>
								<Input
									id="name"
									{...register('name', { required: 'El nombre es requerido' })}
									placeholder="Copa Kódem Primavera 2024"
									className={errors.name ? 'border-red-500' : ''}
								/>
								{errors.name && (
									<p className="text-sm text-red-500">{errors.name.message}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="format">Formato *</Label>
								<Select value={watchFormat} onValueChange={(value) => setValue('format', value as TournamentFormat)}>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona un formato" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="standard">Estándar</SelectItem>
										<SelectItem value="draft">Draft</SelectItem>
										<SelectItem value="sealed">Sellado</SelectItem>
										<SelectItem value="custom">Personalizado</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Descripción *</Label>
							<Textarea
								id="description"
								{...register('description', { required: 'La descripción es requerida' })}
								placeholder="Describe tu torneo..."
								rows={3}
								className={errors.description ? 'border-red-500' : ''}
							/>
							{errors.description && (
								<p className="text-sm text-red-500">{errors.description.message}</p>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							Configuración
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="max_participants">Máximo Participantes *</Label>
								<Input
									id="max_participants"
									type="number"
									min="4"
									max="256"
									{...register('max_participants', { 
										required: 'Campo requerido',
										valueAsNumber: true,
										min: { value: 4, message: 'Mínimo 4 participantes' },
										max: { value: 256, message: 'Máximo 256 participantes' }
									})}
									className={errors.max_participants ? 'border-red-500' : ''}
								/>
								{errors.max_participants && (
									<p className="text-sm text-red-500">{errors.max_participants.message}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="entry_fee">Tarifa Entrada ($)</Label>
								<Input
									id="entry_fee"
									type="number"
									min="0"
									step="0.01"
									{...register('entry_fee', { valueAsNumber: true })}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="prize_pool">Premio ($)</Label>
								<Input
									id="prize_pool"
									type="number"
									min="0"
									step="0.01"
									{...register('prize_pool', { valueAsNumber: true })}
								/>
							</div>
						</div>

						<div className="space-y-4">
							<div className="flex items-center space-x-2">
								<Switch
									checked={watchOnline}
									onCheckedChange={(checked) => setValue('online', checked)}
								/>
								<Label htmlFor="online" className="flex items-center gap-2">
									{watchOnline ? <Monitor className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
									{watchOnline ? 'Torneo Online' : 'Torneo Presencial'}
								</Label>
							</div>

							{!watchOnline && (
								<div className="space-y-2">
									<Label htmlFor="location">Ubicación *</Label>
									<Input
										id="location"
										{...register('location', { 
											required: watchOnline ? false : 'Ubicación requerida para torneos presenciales'
										})}
										placeholder="Centro de Convenciones..."
										className={errors.location ? 'border-red-500' : ''}
									/>
									{errors.location && (
										<p className="text-sm text-red-500">{errors.location.message}</p>
									)}
								</div>
							)}

							<div className="flex items-center space-x-2">
								<Switch
									checked={watch('is_public')}
									onCheckedChange={(checked) => setValue('is_public', checked)}
								/>
								<Label htmlFor="is_public" className="flex items-center gap-2">
									<Globe className="h-4 w-4" />
									Torneo Público
								</Label>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							Fechas
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="registration_deadline">Límite Registro *</Label>
								<Input
									id="registration_deadline"
									type="datetime-local"
									{...register('registration_deadline', { required: 'Fecha límite requerida' })}
									className={errors.registration_deadline ? 'border-red-500' : ''}
								/>
								{errors.registration_deadline && (
									<p className="text-sm text-red-500">{errors.registration_deadline.message}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="start_date">Fecha Inicio *</Label>
								<Input
									id="start_date"
									type="datetime-local"
									min={getMinDate()}
									{...register('start_date', { required: 'Fecha de inicio requerida' })}
									className={errors.start_date ? 'border-red-500' : ''}
								/>
								{errors.start_date && (
									<p className="text-sm text-red-500">{errors.start_date.message}</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Trophy className="h-5 w-5" />
							Reglas del Mazo
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center space-x-2">
							<Switch
								checked={watchRequiresDeck}
								onCheckedChange={(checked) => setValue('requires_deck', checked)}
							/>
							<Label htmlFor="requires_deck">
								Requiere mazo propio
							</Label>
						</div>

						{watchRequiresDeck && (
							<>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="min_deck_size">Tamaño Mínimo</Label>
										<Input
											id="min_deck_size"
											type="number"
											min="1"
											{...register('min_deck_size', { valueAsNumber: true })}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="max_deck_size">Tamaño Máximo</Label>
										<Input
											id="max_deck_size"
											type="number"
											min="1"
											{...register('max_deck_size', { valueAsNumber: true })}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label>Cartas Prohibidas</Label>
									<div className="flex flex-wrap gap-2 mb-2">
										{bannedCards.map((card, index) => (
											<Badge key={index} variant="destructive" className="flex items-center gap-1">
												{card}
												<X
													className="h-3 w-3 cursor-pointer"
													onClick={() => removeBannedCard(card)}
												/>
											</Badge>
										))}
									</div>
									<Dialog open={showBannedCardsDialog} onOpenChange={setShowBannedCardsDialog}>
										<DialogTrigger asChild>
											<Button type="button" variant="outline" size="sm">
												<Plus className="h-4 w-4 mr-2" />
												Agregar Carta Prohibida
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Agregar Carta Prohibida</DialogTitle>
											</DialogHeader>
											<div className="space-y-4">
												<div className="space-y-2">
													<Label>Nombre de la Carta</Label>
													<Input
														value={newBannedCard}
														onChange={(e) => setNewBannedCard(e.target.value)}
														placeholder="Nombre exacto..."
														onKeyPress={(e) => {
															if (e.key === 'Enter') {
																e.preventDefault();
																addBannedCard();
															}
														}}
													/>
												</div>
												<div className="flex justify-end gap-2">
													<Button
														type="button"
														variant="outline"
														onClick={() => setShowBannedCardsDialog(false)}
													>
														Cancelar
													</Button>
													<Button
														type="button"
														onClick={() => {
															addBannedCard();
															setShowBannedCardsDialog(false);
														}}
														disabled={!newBannedCard.trim()}
													>
														Agregar
													</Button>
												</div>
											</div>
										</DialogContent>
									</Dialog>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Reglas del Torneo</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Label htmlFor="rules">Reglas *</Label>
							<Textarea
								id="rules"
								{...register('rules', { required: 'Las reglas son requeridas' })}
								rows={6}
								placeholder="Describe las reglas específicas..."
								className={errors.rules ? 'border-red-500' : ''}
							/>
							{errors.rules && (
								<p className="text-sm text-red-500">{errors.rules.message}</p>
							)}
						</div>
					</CardContent>
				</Card>

				<div className="flex flex-col sm:flex-row gap-4 justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => setLocation('/tournaments')}
						disabled={isSubmitting}
					>
						Cancelar
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting}
						className="flex items-center gap-2"
					>
						{isSubmitting ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
								Creando...
							</>
						) : (
							<>
								<Save className="h-4 w-4" />
								Crear Torneo
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
	);
};

export default CreateTournament; 