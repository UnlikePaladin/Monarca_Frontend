import React from "react";
import { DuffelOffer } from "../../types/duffel";
import formatMoney from "../../utils/formatMoney";
import dayjs from "dayjs";

interface Props {
  offer: any;
  onSelect: (offer: any) => void;
}

export const DuffelOfferItem: React.FC<Props> = ({ offer, onSelect }) => {
  // Duffel organiza los vuelos en 'slices'. Para este MVP tomamos el primero (ida).
  const slice = offer.slices[0];
  const firstSegment = slice.segments[0];
  // DETALLE: Agarramos el último segmento para mostrar el destino final (JFK)
  const lastSegment = slice.segments[slice.segments.length - 1];
  
  // DETALLE: Ajuste de precio según el log de tu consola
  const amount = offer.total_amount || offer.price?.total_amount || "0";
  const currency = offer.total_currency || offer.price?.total_currency || "USD";

  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-4 mb-4 bg-[#1a1a1a] border border-gray-700 rounded-lg hover:border-purple-500 transition-all shadow-inner">
      {/* Aerolínea y Logo */}
      <div className="flex items-center gap-4 w-full md:w-1/4">
        <img 
          src={offer.owner.logo_symbol_url} 
          alt={offer.owner.name} 
          className="w-12 h-12 object-contain bg-white p-1 rounded"
        />
        <div>
          <p className="text-sm font-bold text-white">{offer.owner.name}</p>
          <p className="text-[10px] text-gray-400 uppercase">{slice.segments.length > 1 ? `${slice.segments.length - 1} Escala(s)` : 'Vuelo Directo'}</p>
        </div>
      </div>

      {/* Itinerario (Horas y Duración) */}
      <div className="flex items-center justify-around w-full md:w-2/4 py-4 md:py-0">
        <div className="text-center">
          <p className="text-lg font-bold text-white">
            {dayjs(firstSegment.departing_at).format("HH:mm")}
          </p>
          <p className="text-xs text-gray-400">{firstSegment.origin.iata_code}</p>
        </div>

        <div className="flex flex-col items-center px-4 flex-1">
          <p className="text-[9px] text-gray-500 uppercase font-bold">Duración</p>
          <div className="w-full h-[1px] bg-gray-600 relative my-2">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_#a855f7]"></div>
          </div>
          <p className="text-xs text-gray-300">{slice.duration.replace('PT', '').toLowerCase()}</p>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-white">
            {dayjs(lastSegment.arriving_at).format("HH:mm")}
          </p>
          <p className="text-xs text-gray-400">{lastSegment.destination.iata_code}</p>
        </div>
      </div>

      {/* Precio y Selección */}
      <div className="flex flex-col items-end w-full md:w-1/4">
        <p className="text-2xl font-black text-green-400">
          {formatMoney(parseFloat(amount))}
          <span className="text-xs ml-1 text-gray-500">{currency}</span>
        </p>
        <button
          onClick={() => onSelect(offer)}
          disabled={!offer} 
          className=""
        >
          Seleccionar
        </button>
      </div>
    </div>
  );
};