import React from "react";
import { DuffelCarrier, DuffelOffer } from "../../types/duffel";
import formatMoney from "../../utils/formatMoney";
import dayjs from "dayjs";

interface Props {
  offer: DuffelOffer;
  onSelect: (offer: DuffelOffer) => void;
}

export const DuffelOfferItem: React.FC<Props> = ({ offer, onSelect }) => {
  const formatIsoDuration = (duration?: string) => {
    if (!duration) return "N/A";
    const hoursMatch = duration.match(/(\d+)H/);
    const minutesMatch = duration.match(/(\d+)M/);
    const hours = hoursMatch ? `${hoursMatch[1]}h` : "";
    const minutes = minutesMatch ? `${minutesMatch[1]}m` : "";
    return [hours, minutes].filter(Boolean).join(" ") || duration;
  };

  const getPolicyLabel = (
    allowed?: boolean,
    penaltyAmount?: string,
    penaltyCurrency?: string,
  ) => {
    if (allowed === false) return "No permitido";
    if (allowed === true && penaltyAmount) {
      return `Con penalidad ${penaltyAmount} ${penaltyCurrency || ""}`.trim();
    }
    if (allowed === true) return "Permitido";
    return "Sin dato";
  };

  const getBestLogo = (carrier?: DuffelCarrier | null) =>
    carrier?.logo_lockup_url || carrier?.logo_symbol_url || null;

  const getCarrierLabel = (carrier?: DuffelCarrier | null) =>
    carrier?.name || carrier?.iata_code || "Aerolínea";

  const outboundSlice = offer.slices?.[0];
  const returnSlice = offer.slices?.[1];
  const isRoundTrip = Boolean(returnSlice);

  const getSliceSummary = (slice?: DuffelOffer["slices"][number]) => {
    const firstSegment = slice?.segments?.[0];
    const lastSegment = slice?.segments?.[slice?.segments?.length - 1];

    if (!slice || !firstSegment || !lastSegment) {
      return null;
    }

    return {
      firstSegment,
      lastSegment,
      departureTime: dayjs(firstSegment.departing_at).format("HH:mm"),
      arrivalTime: dayjs(lastSegment.arriving_at).format("HH:mm"),
      originCode: firstSegment.origin?.iata_code || "---",
      destinationCode: lastSegment.destination?.iata_code || "---",
      stopCount: Math.max((slice?.segments?.length || 1) - 1, 0),
      duration: formatIsoDuration(slice.duration),
    };
  };

  const outbound = getSliceSummary(outboundSlice);
  const inbound = getSliceSummary(returnSlice);

  const renderSliceRow = (label: string, summary: NonNullable<typeof outbound>) => (
    <div className="flex items-center justify-around w-full py-2">
      <div className="text-center min-w-[52px]">
        <p className="text-[9px] text-gray-500 uppercase font-bold">{label}</p>
        <p className="text-lg font-bold text-white">{summary.departureTime}</p>
        <p className="text-xs text-gray-400">{summary.originCode}</p>
      </div>

      <div className="flex flex-col items-center px-4 flex-1">
        <p className="text-[9px] text-gray-500 uppercase font-bold">
          {summary.stopCount > 0 ? `${summary.stopCount} escala(s)` : "Directo"}
        </p>
        <div className="w-full h-[1px] bg-gray-600 relative my-2">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_#a855f7]"></div>
        </div>
        <p className="text-xs text-gray-300">{summary.duration}</p>
      </div>

      <div className="text-center min-w-[52px]">
        <p className="text-lg font-bold text-white">{summary.arrivalTime}</p>
        <p className="text-xs text-gray-400">{summary.destinationCode}</p>
      </div>
    </div>
  );

  const ownerCarrier: DuffelCarrier = {
    name: offer.owner?.name,
    iata_code: offer.owner?.iata_code,
    logo_lockup_url: offer.owner?.logo_lockup_url,
    logo_symbol_url: offer.owner?.logo_symbol_url,
  };
  const ownerLogoUrl = getBestLogo(ownerCarrier);

  const marketingCarrierLogo = getBestLogo(outbound?.firstSegment?.marketing_carrier);
  const operatingCarrierLogo = getBestLogo(outbound?.firstSegment?.operating_carrier);
  const segmentCarrier = outbound?.firstSegment?.marketing_carrier || outbound?.firstSegment?.operating_carrier;
  
  // DETALLE: Ajuste de precio según el log de tu consola
  const amount = offer.total_amount || offer.price?.total_amount || "0";
  const currency = offer.total_currency || offer.price?.total_currency || "USD";
  const baseAmount = offer.base_amount;
  const taxAmount = offer.tax_amount;
  const emissions = offer.total_emissions_kg;
  const expiresLabel = offer.expires_at ? dayjs(offer.expires_at).format("DD/MM/YYYY HH:mm") : "Sin dato";

  if (!outbound) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-4 mb-4 bg-[#1a1a1a] border border-gray-700 rounded-lg hover:border-purple-500 transition-all shadow-inner">
      {/* Aerolínea y Logo */}
      <div className="flex items-center gap-4 w-full">
        {ownerLogoUrl ? (
          <img
            src={ownerLogoUrl}
            alt={offer.owner?.name || "Aerolínea"}
            className="w-16 h-12 object-contain bg-white p-1 rounded"
          />
        ) : (
          <div className="min-w-16 h-12 px-2 flex items-center justify-center bg-white rounded text-[10px] font-bold text-gray-800 uppercase text-center">
            {offer.owner?.name || offer.owner?.iata_code || outbound?.firstSegment?.marketing_carrier?.iata_code || "N/A"}
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{offer.owner?.name || "Aerolínea"}</p>
          <p className="text-[10px] text-gray-400 uppercase">
            {isRoundTrip ? "Ida y vuelta" : outbound.stopCount > 0 ? `${outbound.stopCount} Escala(s)` : "Vuelo Directo"}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {marketingCarrierLogo && (
              <img
                src={marketingCarrierLogo}
                alt={getCarrierLabel(outbound?.firstSegment?.marketing_carrier)}
                className="w-6 h-6 object-contain bg-white rounded p-[2px]"
              />
            )}
            {operatingCarrierLogo && (
              <img
                src={operatingCarrierLogo}
                alt={getCarrierLabel(outbound?.firstSegment?.operating_carrier)}
                className="w-6 h-6 object-contain bg-white rounded p-[2px]"
              />
            )}
            {!marketingCarrierLogo && !operatingCarrierLogo && (
              <span className="text-[10px] text-gray-500 uppercase">
                {getCarrierLabel(segmentCarrier)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400">Expira</p>
          <p className="text-xs text-amber-300 font-medium">{expiresLabel}</p>
        </div>
      </div>

      {/* Itinerario (Horas y Duración) */}
      <div className="w-full">
        {renderSliceRow("Ida", outbound)}
        {inbound && (
          <>
            <div className="h-px bg-gray-700" />
            {renderSliceRow("Vuelta", inbound)}
          </>
        )}
      </div>

      {/* Datos clave de la oferta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <div className="rounded bg-[#242424] p-2 border border-gray-700">
          <p className="text-gray-400">Cambio antes de salida</p>
          <p className="text-gray-100">
            {getPolicyLabel(
              offer.conditions?.change_before_departure?.allowed,
              offer.conditions?.change_before_departure?.penalty_amount,
              offer.conditions?.change_before_departure?.penalty_currency,
            )}
          </p>
        </div>
        <div className="rounded bg-[#242424] p-2 border border-gray-700">
          <p className="text-gray-400">Reembolso antes de salida</p>
          <p className="text-gray-100">
            {getPolicyLabel(
              offer.conditions?.refund_before_departure?.allowed,
              offer.conditions?.refund_before_departure?.penalty_amount,
              offer.conditions?.refund_before_departure?.penalty_currency,
            )}
          </p>
        </div>
        <div className="rounded bg-[#242424] p-2 border border-gray-700">
          <p className="text-gray-400">Pago</p>
          <p className="text-gray-100">
            {offer.payment_requirements?.requires_instant_payment
              ? "Inmediato"
              : offer.payment_requirements?.payment_required_by
              ? `Antes de ${dayjs(offer.payment_requirements.payment_required_by).format("DD/MM HH:mm")}`
              : "Sin dato"}
          </p>
        </div>
      </div>

      {/* Precio y acción */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-black text-green-400">
            {formatMoney(parseFloat(amount))}
            <span className="text-xs ml-1 text-gray-500">{currency}</span>
          </p>
          <p className="text-xs text-gray-400">
            {baseAmount ? `Tarifa: ${baseAmount} ${offer.base_currency || currency}` : ""}
            {baseAmount && taxAmount ? " | " : ""}
            {taxAmount ? `Impuestos: ${taxAmount} ${offer.tax_currency || currency}` : ""}
          </p>
          <p className="text-xs text-gray-500">
            {emissions ? `Emisiones estimadas: ${emissions} kg CO2` : "Emisiones no disponibles"}
          </p>
        </div>
        <button
          onClick={() => onSelect(offer)}
          disabled={!offer}
          className="px-4 py-2 rounded bg-[#2f6feb] text-white font-semibold hover:bg-[#2559be] transition-colors"
        >
          Seleccionar
        </button>
      </div>
    </div>
  );
};