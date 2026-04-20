// src/types/duffel.ts

export type DuffelPassengerTitle = 'mr' | 'ms' | 'mrs' | 'miss';
export type DuffelPassengerType = 'adult' | 'child' | 'infant';
export type DuffelCabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

export interface DuffelSlice {
  origin: string;      // Código IATA (ej. MEX)
  destination: string; // Código IATA (ej. JFK)
  departure_date: string; // YYYY-MM-DD
}

export interface CreateOfferRequestPayload {
  requestDestinationId: string;
  data: {
    slices: DuffelSlice[];
    passengers: { type: DuffelPassengerType }[];
    cabin_class: DuffelCabinClass;
  };
}

export interface DuffelOffer {
  id?: string;
  offer_id?: string;
  total_amount: string;
  total_currency: string;
  price?: {
    total_amount: string;
    total_currency: string;
  };
  owner: {
    name: string;
    logo_symbol_url: string;
  };
  slices: any[]; 
  expires_at: string; // Importante para el agente
}

export interface CreateDuffelOrderPayload {
  requestDestinationId: string;
  offerId: string;
  reservationTitle: string;
  reservationComments: string;
  reservationPrice: number;
  data: {
    selected_offers: string[];
    passengers: {
      title: DuffelPassengerTitle;
      given_name: string;
      family_name: string;
      born_on: string; // YYYY-MM-DD
      email: string;
      phone_number: string;
    }[];
    type: 'instant' | 'hold'; // 'hold' permite reservar sin pagar inmediatamente
  };
}

export interface DuffelOrderResponse {
  order: any;
  reservation: {
    id: string;
    booking_reference: string;
    hold_expires_at: string | null;
    provider_name: string;
  };
}