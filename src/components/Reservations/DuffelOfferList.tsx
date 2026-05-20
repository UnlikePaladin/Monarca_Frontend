/*
DuffelOfferList.tsx
Container component that fetches and maps available flight offers 
using an existing offer request ID.
*/

import React from "react";
import { useDuffel } from "../../hooks/requests/useDuffel";
import { DuffelOfferItem } from "./DuffelOfferItem";
import { DuffelOffer } from "../../types/duffel";

interface Props {
  offerRequestId: string;
  onSelectOffer: (offer: DuffelOffer) => void;
}

/**
Component responsible for listing all flights returned by the GDS.
@param offerRequestId The unique ID from the search request.
@param onSelectOffer Selection handler passed to children items.
*/
export const DuffelOfferList: React.FC<Props> = ({ offerRequestId, onSelectOffer }) => {
  const { useListOffers } = useDuffel();
  const { data, isLoading, error } = useListOffers(offerRequestId);

  if (isLoading) return (
    <div className="flex flex-col items-center py-10">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--blue)] mb-2"></div>
      <p className="text-sm text-[var(--blue)]">
        Consultando con las aerolíneas...
      </p>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 text-red-700 rounded text-sm border border-red-200">
      Error al obtener las ofertas de Duffel. Intenta de nuevo más tarde.
    </div>
  );

  // Detalle importante: Duffel devuelve las ofertas en el campo 'data'
  const offers = data?.data || data?.offers || (Array.isArray(data) ? data : []);

  console.log("✈️ OFERTAS RECIBIDAS DESDE EL BACKEND:", offers);

  if (offers.length === 0) return (
    <div className="text-center py-10 text-gray-500">
      No se encontraron vuelos para esta fecha y ruta.
    </div>
  );

  return (
    <div className="mt-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {offers.map((offer: DuffelOffer) => (
        <DuffelOfferItem 
          // DETALLE: Usamos offer_id o id para que React no mande advertencias
          key={offer.id || offer.offer_id} 
          offer={offer} 
          onSelect={onSelectOffer} 
        />
      ))}
    </div>
  );
};

/*
Modification History:
2026-04-20 | Fabrizio | Implemented asynchronous fetching and list rendering for Duffel offers.
*/