/**
 * Tournament status types
 */
export type TournamentStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

/**
 * Tournament format types
 */
export type TournamentFormat = 'standard' | 'sealed' | 'draft' | 'custom';

/**
 * Ban types for tournaments
 */
export type BanType = 'card_type' | 'set' | 'protector' | 'ixim' | 'bio' | 'specific_card';

/**
 * Tournament ban item
 */
export interface TournamentBan {
	id: string;
	type: BanType;
	name: string;
	description?: string;
	icon?: string;
	reason?: string;
}

/**
 * Tournament participant information
 */
export interface TournamentParticipant {
	id: string;
	user_id: string;
	username: string;
	avatar_url?: string;
	deck_id?: string;
	deck_name?: string;
	registered_at: string;
	checked_in: boolean;
	wins: number;
	losses: number;
	draws: number;
	points: number;
	rank?: number;
}

/**
 * Tournament round information
 */
export interface TournamentRound {
	id: string;
	round_number: number;
	name: string;
	matches: TournamentMatch[];
	status: 'pending' | 'active' | 'completed';
	created_at: string;
	completed_at?: string;
}

/**
 * Tournament match information
 */
export interface TournamentMatch {
	id: string;
	round_id: string;
	player1_id: string;
	player2_id?: string; // null for bye
	player1_username: string;
	player2_username?: string;
	player1_wins: number;
	player2_wins: number;
	status: 'pending' | 'active' | 'completed';
	winner_id?: string;
	created_at: string;
	completed_at?: string;
}

/**
 * Tournament main interface
 */
export interface Tournament {
	id: string;
	name: string;
	description: string;
	format: TournamentFormat;
	status: TournamentStatus;
	max_participants: number;
	current_participants: number;
	entry_fee: number;
	prize_pool: number;
	start_date: string;
	end_date?: string;
	registration_deadline: string;
	created_by: string;
	organizer_id: string;
	organizer_name: string;
	created_at: string;
	updated_at: string;
	participants: TournamentParticipant[];
	rounds: TournamentRound[];
	rules: string;
	banner_url?: string;
	is_public: boolean;
	requires_deck: boolean;
	min_deck_size?: number;
	max_deck_size?: number;
	banned_cards?: string[];
	banned_items?: TournamentBan[];
	location?: string;
	online: boolean;
}

/**
 * Tournament creation/edit form data
 */
export interface TournamentFormData {
	name: string;
	description: string;
	format: TournamentFormat;
	max_participants: number;
	entry_fee: number;
	prize_pool: number;
	start_date: string;
	registration_deadline: string;
	rules: string;
	banner_url?: string;
	is_public: boolean;
	requires_deck: boolean;
	min_deck_size?: number;
	max_deck_size?: number;
	banned_cards?: string[];
	location?: string;
	online: boolean;
}

/**
 * Tournament filters for listing
 */
export interface TournamentFilters {
	status?: TournamentStatus[];
	format?: TournamentFormat[];
	online?: boolean;
	date_range?: {
		start: string;
		end: string;
	};
	entry_fee_range?: {
		min: number;
		max: number;
	};
	search?: string;
} 