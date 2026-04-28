/* ReturnLegCard renders the return flight section for round-trip travel requests.
   Computes the return leg destination object from the last sorted destination and
   the request origin. Displays manual plane form fields and the Duffel search flow. */

import React from "react";
import Input from "../Refunds/InputField";
import TextArea from "../Refunds/TextArea";
import { DuffelOfferList } from "./DuffelOfferList";
import { DuffelPassengerForm } from "./DuffelPassengerForm";
import { DuffelOffer } from "../../types/duffel";

interface ReturnLegCardProps {
  request: any;
  formData: Record<string, any>;
  duffelSearchIds: Record<string, string>;
  selectedOffer: Record<string, DuffelOffer | null>;
  searchingDuffel: Record<string, boolean>;
  requestUser: { name: string; last_name: string; email: string };
  isOrderPending: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
  onFieldChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: string,
  ) => void;
  onDuffelSearch: (destination: any) => void;
  onSelectOffer: (destId: string, offer: DuffelOffer) => void;
  onSubmitDuffelOrder: (
    destId: string,
    passengerData: any,
    backendDestId?: string,
  ) => void;
  onClearDuffelSearch: (destId: string) => void;
  onClearSelectedOffer: (destId: string) => void;
}

/**
 * Renders the return leg card for round-trip requests.
 * Computes the return leg object from the last destination and exposes
 * manual form fields and the Duffel booking flow.
 * @param props - See ReturnLegCardProps.
 */
export const ReturnLegCard: React.FC<ReturnLegCardProps> = ({
  request,
  formData,
  duffelSearchIds,
  selectedOffer,
  searchingDuffel,
  requestUser,
  isOrderPending,
  onFileChange,
  onFieldChange,
  onDuffelSearch,
  onSelectOffer,
  onSubmitDuffelOrder,
  onClearDuffelSearch,
  onClearSelectedOffer,
}) => {
  const lastDest = [...(request.requests_destinations || [])].sort(
    (a: any, b: any) => b.destination_order - a.destination_order,
  )[0];

  if (!lastDest) return null;

  const returnLegId = "return_leg";
  const returnLeg = {
    id: returnLegId,
    requestDestinationId: lastDest.id,
    origin: lastDest.destination_full,
    origin_city: lastDest.destination_city,
    origin_country: lastDest.destination_country,
    origin_ref: lastDest.destination_ref,
    origin_airport_ref: lastDest.destination_airport_ref,
    origin_id: lastDest.destination_id,
    origin_airport_id: lastDest.destination_airport_id,
    destination_full:
      request.destination?.city + ", " + request.destination?.country,
    destination_city: request.destination?.city,
    destination_ref: request.destination,
    destination_airport_ref: request.origin_airport || request.originAirport,
    destination_id: request.id_origin_city,
    destination_airport_id: request.id_origin_airport,
    departure_date_raw: lastDest.arrival_date_raw,
    departure_date: lastDest.arrival_date,
    is_last_destination: false,
    is_plane_required: true,
    is_hotel_required: false,
  };

  return (
    <div className="rounded-md p-4 mb-6 space-y-4 bg-white shadow-sm">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-bold text-lg text-[var(--blue)]">
          Vuelo de regreso
        </h3>
        {!selectedOffer[returnLegId] && (
          <button
            type="button"
            onClick={() => onDuffelSearch(returnLeg)}
            disabled={searchingDuffel[returnLegId]}
            className="text-xs bg-[#6032b3] text-white px-3 py-1 rounded hover:bg-[#4c2891] transition-colors"
          >
            {searchingDuffel[returnLegId]
              ? "Buscando..."
              : "Buscar vuelos (Duffel)"}
          </button>
        )}
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Origen
          </label>
          <input
            type="text"
            readOnly
            value={returnLeg.origin}
            className="w-full bg-gray-100 text-gray-800 rounded-lg px-3 py-2 border border-gray-200"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Destino
          </label>
          <input
            type="text"
            readOnly
            value={returnLeg.destination_full}
            className="w-full bg-gray-100 text-gray-800 rounded-lg px-3 py-2 border border-gray-200"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            {`Regreso a ${returnLeg.destination_city} el`}
          </label>
          <input
            type="text"
            readOnly
            value={returnLeg.departure_date}
            className="w-full bg-gray-100 text-gray-800 rounded-lg px-3 py-2 border border-gray-200"
          />
        </div>
      </section>

      {!duffelSearchIds[returnLegId] && !selectedOffer[returnLegId] && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col gap-y-4">
            <h3 className="text-[var(--blue)] mb-4 font-bold">
              Información del vuelo
            </h3>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Título
              </label>
              <Input
                placeholder="Ingresa el título de la reservación"
                value={formData[returnLegId]?.plane_title || ""}
                onChange={(e) => onFieldChange(e, returnLegId)}
                name="plane_title"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Comentarios
              </label>
              <TextArea
                placeholder="Escribe tus comentarios"
                value={formData[returnLegId]?.plane_comments || ""}
                onChange={(e) => onFieldChange(e, returnLegId)}
                name="plane_comments"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Precio
              </label>
              <Input
                placeholder="Ingresa el precio del vuelo"
                value={formData[returnLegId]?.plane_price || ""}
                onChange={(e) => onFieldChange(e, returnLegId)}
                name="plane_price"
                type="number"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Subir archivos de avión
              </label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => onFileChange(e, returnLegId)}
                name="plane_file"
                selectedFileName={formData[returnLegId]?.plane_file_name}
              />
            </div>
          </div>
        </section>
      )}

      {duffelSearchIds[returnLegId] && !selectedOffer[returnLegId] && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-purple-900">
              Vuelos encontrados (Precios en tiempo real)
            </h4>
            <button
              onClick={() => onClearDuffelSearch(returnLegId)}
              className="text-xs text-purple-600 hover:underline"
            >
              Cambiar a carga manual
            </button>
          </div>
          <DuffelOfferList
            offerRequestId={duffelSearchIds[returnLegId] || ""}
            onSelectOffer={(offer) => onSelectOffer(returnLegId, offer)}
          />
        </div>
      )}

      {selectedOffer[returnLegId] && (
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="font-black text-green-900 uppercase tracking-tight">
                Vuelo Seleccionado
              </h4>
              <p className="text-xs text-green-700">
                Aerolínea: {selectedOffer[returnLegId]?.owner?.name} — ID:{" "}
                {(selectedOffer[returnLegId]?.id || "").substring(0, 8)}
              </p>
            </div>
            <button
              onClick={() => onClearSelectedOffer(returnLegId)}
              className="text-xs bg-white border border-green-300 px-2 py-1 rounded text-green-700 hover:bg-green-100"
            >
              Elegir otro vuelo
            </button>
          </div>
          <DuffelPassengerForm
            offer={selectedOffer[returnLegId]!}
            initialData={requestUser}
            isSubmitting={isOrderPending}
            onSubmit={(data) =>
              onSubmitDuffelOrder(returnLegId, data, lastDest.id)
            }
          />
        </div>
      )}
    </div>
  );
};

/*
Modification History:
- 2026-04-27 | Juan de Dios Gastélum | Initial file creation. Extracted from Reservations.tsx to keep file under 1000 lines.
*/
