import React, { useState, useEffect } from 'react';
import { queryCards } from '@/lib/firebase/services/cardService';
import { CardDetails, CardType, CardEnergy, CardRarity, CardSet } from '@/types/card';
import { Input } from '@/components/atoms/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';
import { Image } from '@/components/atoms/Image';
import { X } from 'lucide-react';

/**
 * Página de selección de cartas (2 columnas):
 * - Izquierda: cartas seleccionadas
 * - Derecha: catálogo de cartas con filtros y búsqueda
 */
export default function CardSelectorPage() {
	const [allCards, setAllCards] = useState<CardDetails[]>([]);
	const [filteredCards, setFilteredCards] = useState<CardDetails[]>([]);
	const [selectedCards, setSelectedCards] = useState<CardDetails[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedType, setSelectedType] = useState<string>('all_types');
	const [selectedEnergy, setSelectedEnergy] = useState<string>('all_energies');
	const [selectedRarity, setSelectedRarity] = useState<string>('all_rarities');
	const [selectedSet, setSelectedSet] = useState<string>('all_sets');
	const [isLoadingCards, setIsLoadingCards] = useState(false);

	// Cargar todas las cartas al montar
	useEffect(() => {
		const loadCards = async () => {
			setIsLoadingCards(true);
			try {
				const fetchedCards = await queryCards({});
				setAllCards(fetchedCards);
				setFilteredCards(fetchedCards);
			} catch (err) {
				console.error('Error al cargar cartas:', err);
			} finally {
				setIsLoadingCards(false);
			}
		};
		loadCards();
	}, []);

	// Filtrar cartas cuando cambian los filtros
	useEffect(() => {
		const applyFilters = async () => {
			setIsLoadingCards(true);
			try {
				const filters: any = { searchTerm: searchTerm || undefined };
				if (selectedType !== 'all_types') filters.type = selectedType as CardType;
				if (selectedEnergy !== 'all_energies') filters.energy = selectedEnergy as CardEnergy;
				if (selectedRarity !== 'all_rarities') filters.rarity = selectedRarity as CardRarity;
				if (selectedSet !== 'all_sets') filters.set = selectedSet as CardSet;
				const filteredResults = await queryCards(filters);
				setFilteredCards(filteredResults);
			} catch (error) {
				console.error('Error al filtrar cartas:', error);
			} finally {
				setIsLoadingCards(false);
			}
		};
		applyFilters();
	}, [searchTerm, selectedType, selectedEnergy, selectedRarity, selectedSet]);

	const handleAddCard = (card: CardDetails) => {
		if (selectedCards.some(c => c.id === card.id)) return;
		setSelectedCards(prev => [...prev, card]);
	};

	const handleRemoveCard = (cardId: string) => {
		setSelectedCards(prev => prev.filter(c => c.id !== cardId));
	};

	return (
		<div className="flex h-screen">
			{/* Columna izquierda: cartas seleccionadas */}
			<div className="w-1/2 border-r overflow-y-auto p-6 bg-gray-50">
				<h2 className="text-lg font-bold mb-4">Cartas seleccionadas</h2>
				{selectedCards.length === 0 ? (
					<p className="text-muted-foreground">No has seleccionado cartas aún.</p>
				) : (
					<div className="grid grid-cols-4 gap-4">
						{selectedCards.map(card => (
							<div key={card.id} className="relative group flex justify-center">
								<Image 
									src={card.imageUrl} 
									alt={card.name} 
									className="w-45 object-contain rounded-lg bg-white" 
								/>
								<Button
									variant="danger"
									size="sm"
									className="absolute top-2 right-2 opacity-80 group-hover:opacity-100 transition"
									onClick={() => handleRemoveCard(card.id)}
								>
									<X className="w-4 h-4" />
								</Button>
							</div>
						))}
					</div>
				)}
			</div>
			{/* Columna derecha: catálogo de cartas y filtros */}
			<div className="w-1/2 overflow-y-auto p-6">
				<h2 className="text-lg font-bold mb-4">Buscar cartas</h2>
				<div className="flex gap-2 mb-4">
					<Input
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						placeholder="Buscar carta"
						className="w-full"
					/>
					<Select value={selectedType} onValueChange={setSelectedType}>
						<SelectTrigger className="w-[120px]">
							<SelectValue placeholder="Tipo" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all_types">Tipo</SelectItem>
							{Object.values(CardType).map(type => (
								<SelectItem key={type} value={type}>{type}</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={selectedEnergy} onValueChange={setSelectedEnergy}>
						<SelectTrigger className="w-[120px]">
							<SelectValue placeholder="Energía" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all_energies">Energía</SelectItem>
							{Object.values(CardEnergy).map(energy => (
								<SelectItem key={energy} value={energy}>{energy}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{isLoadingCards ? (
					<div className="flex justify-center items-center min-h-[200px]">
						<Spinner size="md" />
					</div>
				) : filteredCards.length === 0 ? (
					<p className="text-muted-foreground">No se encontraron cartas.</p>
				) : (
					<div className="grid grid-cols-3 gap-4">
						{filteredCards.map(card => (
							<div
								key={card.id}
								className="relative cursor-pointer group flex justify-center"
								onClick={() => handleAddCard(card)}
							>
								<Image 
									src={card.imageUrl} 
									alt={card.name} 
									className="w-45 object-contain rounded-lg bg-white" 
								/>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
} 