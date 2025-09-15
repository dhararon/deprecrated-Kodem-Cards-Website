/**
 * Tipos de cartas para la aplicación Kodem Cards
 */

// SETS
export enum CardSet {
    GANADOR = "ganador",
    PASE = "pase de batalla",
    CUSTOM = "custom",
    PROMOS = "promos",
    RAICE_MITICAS = "raices misticas",
    GUERRA_ROJA = "guerra roja",
    TITANES_DE_LA_CORTEZA = "titanes de la corteza (Mazo)",
    MINI_FLORES_Y_TUMBAS = "mini flores y tumbas",
    TITANES_DE_LA_CORTEZA_Y_OJOS_DEL_OCEANO = "titanes de la corteza y ojos del oceano",
    OJOS_DEL_OCEANO = "ojos del oceano (Mazo)"
}

// Tipos de cartas
export enum CardType {
    ADENDEI_INFECTADO = "adendei infectado",
    ADENDEI_ABISMAL = "adendei abismal",
    ADENDEI_EQUINO = "adendei equino",
    ADENDEI_KOSMICO = "adendei kósmico",
    ADENDEI_CATRIN = "adendei catrin",
    ADENDEI_GUARDIAN = "adendei guardian",
    ADENDEI_TITAN = "adendei titán",
    ADENDEI = "adendei",
    ROT = "rot",
    PROTECTOR = "protector",
    BIO = "bio",
    IXIM = "ixim",
    RAVA = "rava",
    TOKEN = "token"
}

// Elementos de cartas
export enum CardEnergy {
    PIRICA = "pírica",
    CHAAKTICA = "cháaktica",
    ATLICA = "átlica",
    FERAL = "feral",
    LITICA = "lítica",
    HUUMICA = "húumica",
    GELIDA = "gélida",
    DEMOTICA = "demótica"
}

// Rarezas de cartas
export enum CardRarity {
    COMUN = 'común',
    RARA = "rara",
    SUPER_RARA = "super rara",
    ULTRA_RARA = "ultra rara",
    KOSMICA = "kósmica",
    TITANICA = "titanica",
    EVENTO = "evento",
    FULL_ART = "full art",
    ESPECIAL = "especial"
}

export interface Prices {
    amount: number;
    currency: string;
    lastUpdate: string;
}

// Tipo base para una carta con propiedades mínimas
export interface BaseCard {
    fullId?: string;
    rarity: CardRarity;
    cardSet: CardSet;
    imageUrl: string;
    cardNumber: number;
    prices: Prices;
}

// Carta con detalles completos
export interface Card extends BaseCard {
    id?: string;
    name: string;
    cardType: CardType;
    cardEnergy: CardEnergy;
    power?: number;
    sleep?: number;
    description?: string;
    rules?: string[];
    languages?: string[];
    artist?: string[];
    setName?: string;

    // Legalities
    standardLegal?: boolean;
    
    // Para compatibilidad con código existente - Estos campos serán deprecados
    type?: CardType;
    energy?: CardEnergy;
}


// Tipo para detalles de carta
export interface CardDetails extends Card {
    id: string;
    // Propiedades adicionales
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CardForDeck extends Card {
    quantity: number;
}

// Tipo para agrupar cartas por tipo
export interface CardsByType {
    [key: string]: Card[];
}
