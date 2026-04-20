/*
duffel.ts
Defines types and interfaces for the Duffel flight integration, including
offers, slices, segments, and order payloads.
*/

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
  total_emissions_kg?: string;
  total_amount: string;
  total_currency: string;
  base_amount?: string;
  base_currency?: string;
  tax_amount?: string;
  tax_currency?: string;
  price?: {
    total_amount: string;
    total_currency: string;
  };
  owner: {
    name: string;
    iata_code?: string;
    logo_symbol_url?: string | null;
    logo_lockup_url?: string | null;
  };
  slices: DuffelOfferSlice[];
  expires_at: string; // Importante para el agente
  payment_requirements?: {
    requires_instant_payment?: boolean;
    payment_required_by?: string;
    price_guarantee_expires_at?: string;
  };
  conditions?: {
    change_before_departure?: DuffelPolicyCondition;
    refund_before_departure?: DuffelPolicyCondition;
  };
}

export interface DuffelPolicyCondition {
  allowed?: boolean;
  penalty_amount?: string;
  penalty_currency?: string;
}

export interface DuffelOfferSlice {
  duration: string;
  segments: DuffelOfferSegment[];
}

export interface DuffelOfferSegment {
  departing_at: string;
  arriving_at: string;
  origin: {
    iata_code: string;
  };
  destination: {
    iata_code: string;
  };
  marketing_carrier?: DuffelCarrier;
  operating_carrier?: DuffelCarrier;
}

export interface DuffelCarrier {
  name?: string;
  iata_code?: string;
  logo_symbol_url?: string | null;
  logo_lockup_url?: string | null;
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

/*
Modification History:
2026-04-20 | Fabrizio | Defined core interfaces for flight offer search and order creation.
*/