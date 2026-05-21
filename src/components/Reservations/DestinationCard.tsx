/* DestinationCard renders a single destination block within the reservation assignment form.
   Displays a read-only info grid and conditional hotel/plane form fields. When a flight
   is required, it also manages the Duffel search flow: offer list, selection, and
   passenger form submission trigger. */

import React, { useEffect } from "react";
import Input from "../Refunds/InputField";
import TextArea from "../Refunds/TextArea";
import { DuffelOfferList } from "./DuffelOfferList";
import { DuffelOffer } from "../../types/duffel";
import formatMoney from "../../utils/formatMoney";
import { useExchangeRate } from "../../hooks/exchange-rate/useExchangeRate";

interface DestinationCardProps {
  destination: any;
  formData: Record<string, any>;
  duffelSearchIds: Record<string, string>;
  searchingDuffel: Record<string, boolean>;
  labels: { key: string; label: string }[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
  onFieldChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: string,
  ) => void;
  currencyOptions: string[];
  onCurrencyChange: (id: string, field: "hotel" | "plane", currency: string) => void;
  onRateChange: (id: string, field: "hotel" | "plane", rate?: number) => void;
  onDuffelSearch: (destination: any) => void;
  onSelectOffer: (destId: string, offer: DuffelOffer) => void;
  onClearDuffelSearch: (destId: string) => void;
}

/**
 * Renders a single destination card in the reservation assignment page.
 * Handles hotel form, plane form, Duffel search flow, and passenger data collection.
 * @param props - See DestinationCardProps.
 */
export const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  formData,
  duffelSearchIds,
  searchingDuffel,
  labels,
  onFileChange,
  onFieldChange,
  currencyOptions,
  onCurrencyChange,
  onRateChange,
  onDuffelSearch,
  onSelectOffer,
  onClearDuffelSearch,
}) => {
  const destId = destination.id;

  const today = new Date().toISOString().split("T")[0]??"";
  const hotelCurrency = formData[destId]?.hotel_currency || "MXN";
  const planeCurrency = formData[destId]?.plane_currency || "MXN";
  const hotelRateQuery = useExchangeRate(
    today,
    hotelCurrency,
    hotelCurrency !== "MXN",
  );
  const planeRateQuery = useExchangeRate(
    today,
    planeCurrency,
    planeCurrency !== "MXN",
  );
  const hotelRate = Number(formData[destId]?.hotel_rate);
  const planeRate = Number(formData[destId]?.plane_rate);
  const hotelAmount = Number(formData[destId]?.hotel_price);
  const planeAmount = Number(formData[destId]?.plane_price);
  const normalizedHotelAmount = Number.isFinite(hotelAmount)
    ? Math.max(0, hotelAmount)
    : 0;
  const normalizedPlaneAmount = Number.isFinite(planeAmount)
    ? Math.max(0, planeAmount)
    : 0;
  const hotelRateValue = hotelRateQuery.data?.rate ?? hotelRate;
  const planeRateValue = planeRateQuery.data?.rate ?? planeRate;
  const hotelMxnValue =
    hotelCurrency === "MXN"
      ? normalizedHotelAmount
      : hotelRateValue
        ? Number((normalizedHotelAmount * hotelRateValue).toFixed(2))
        : null;
  const planeMxnValue =
    planeCurrency === "MXN"
      ? normalizedPlaneAmount
      : planeRateValue
        ? Number((normalizedPlaneAmount * planeRateValue).toFixed(2))
        : null;

  useEffect(() => {
    if (hotelCurrency === "MXN") {
      onRateChange(destId, "hotel", 1);
      return;
    }

    if (hotelRateQuery.data?.rate) {
      onRateChange(destId, "hotel", hotelRateQuery.data.rate);
    } else if (hotelRateQuery.isError) {
      onRateChange(destId, "hotel", undefined);
    }
  }, [
    destId,
    hotelCurrency,
    hotelRateQuery.data?.rate,
    hotelRateQuery.isError,
    onRateChange,
  ]);

  useEffect(() => {
    if (planeCurrency === "MXN") {
      onRateChange(destId, "plane", 1);
      return;
    }

    if (planeRateQuery.data?.rate) {
      onRateChange(destId, "plane", planeRateQuery.data.rate);
    } else if (planeRateQuery.isError) {
      onRateChange(destId, "plane", undefined);
    }
  }, [
    destId,
    onRateChange,
    planeCurrency,
    planeRateQuery.data?.rate,
    planeRateQuery.isError,
  ]);

  return (
    <div className="rounded-md p-4 mb-6 space-y-4 bg-white shadow-sm">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-bold text-lg text-[var(--blue)]">
          Destino #{destination.destination_order}
        </h3>
        {destination.is_plane_required && (
          <button
            type="button"
            onClick={() => onDuffelSearch(destination)}
            disabled={searchingDuffel[destId]}
            className="text-xs bg-[var(--blue)] text-white px-3 py-1 rounded hover:bg-[var(--light-blue)] transition-colors"
          >
            {searchingDuffel[destId] ? "Buscando..." : "Buscar vuelos (Duffel)"}
          </button>
        )}
      </div>

      <section
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8"
        id="reservation-info"
      >
        {labels.map(({ key, label }) => (
          <div key={key}>
            <label
              htmlFor={key}
              className="block text-xs font-semibold text-gray-500 mb-1"
            >
              {label}
            </label>
            <input
              id={key}
              type="text"
              readOnly
              value={destination[key] || ""}
              className="w-full bg-gray-100 text-gray-800 rounded-lg px-3 py-2 border border-gray-200"
            />
          </div>
        ))}
      </section>

      {!duffelSearchIds[destId] && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {destination.is_hotel_required && (
            <div className="flex flex-col gap-y-4" id="hotel-reservation">
              <h3 className="text-[var(--blue)] mb-4 font-bold">
                Información del hotel
              </h3>
              <div>
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor={`hotel_title_${destId}`}
                >
                  Título
                </label>
                <Input
                  placeholder="Ingresa el título de la reservación"
                  value={formData[destId]?.hotel_title || ""}
                  onChange={(e) => onFieldChange(e, destId)}
                  name="hotel_title"
                  id={`hotel_title_${destId}`}
                />
              </div>
              <div>
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor={`hotel_comments_${destId}`}
                >
                  Comentarios
                </label>
                <TextArea
                  placeholder="Escribe tus comentarios"
                  value={formData[destId]?.hotel_comments || ""}
                  onChange={(e) => onFieldChange(e, destId)}
                  name="hotel_comments"
                  id={`hotel_comments_${destId}`}
                />
              </div>
              <div>
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor={`hotel_price_${destId}`}
                >
                  Precio
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ingresa el precio del hotel"
                    value={formData[destId]?.hotel_price || ""}
                    onChange={(e) => onFieldChange(e, destId)}
                    name="hotel_price"
                    type="number"
                    min={0}
                    step="0.01"
                    id={`hotel_price_${destId}`}
                    className="flex-1"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                <div className="min-w-[120px]">
                  <label
                    htmlFor={`hotel_currency_${destId}`}
                    className="sr-only"
                  >
                    Divisa
                  </label>
                  <select
                    id={`hotel_currency_${destId}`}
                    value={hotelCurrency}
                    onChange={(e) =>
                      onCurrencyChange(destId, "hotel", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {hotelCurrency === "MXN"
                    ? `Se guardara en MXN: ${formatMoney(normalizedHotelAmount)}.`
                    : hotelRateQuery.isLoading
                      ? "Consultando tipo de cambio a MXN..."
                      : hotelRateQuery.isError || hotelMxnValue === null
                        ? "No se pudo obtener el tipo de cambio a MXN."
                        : `Equivalente en MXN: ${formatMoney(hotelMxnValue)}.`}
                </p>
                
              </div>
              <div>
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor={`hotel_file_${destId}`}
                >
                  Subir archivos de hotel
                </label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => onFileChange(e, destId)}
                  name="hotel_file"
                  id={`hotel_file_${destId}`}
                  selectedFileName={formData[destId]?.hotel_file_name}
                />
              </div>
            </div>
          )}

          {destination.is_plane_required && (
            <div className="flex flex-col gap-y-4" id="plane-reservation">
              <h3 className="text-[var(--blue)] mb-4 font-bold">
                Información del vuelo
              </h3>
              <div>
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor={`plane_title_${destId}`}
                >
                  Título
                </label>
                <Input
                  placeholder="Ingresa el título de la reservación"
                  value={formData[destId]?.plane_title || ""}
                  onChange={(e) => onFieldChange(e, destId)}
                  name="plane_title"
                  id={`plane_title_${destId}`}
                />
              </div>
              <div>
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor={`plane_comments_${destId}`}
                >
                  Comentarios
                </label>
                <TextArea
                  placeholder="Escribe tus comentarios"
                  value={formData[destId]?.plane_comments || ""}
                  onChange={(e) => onFieldChange(e, destId)}
                  name="plane_comments"
                  id={`plane_comments_${destId}`}
                />
              </div>
              <div>
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor={`plane_price_${destId}`}
                >
                  Precio
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ingresa el precio del vuelo"
                    value={formData[destId]?.plane_price || ""}
                    onChange={(e) => onFieldChange(e, destId)}
                    name="plane_price"
                    type="number"
                    min={0}
                    step="0.01"
                    id={`plane_price_${destId}`}
                    className="flex-1"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <div className="min-w-[120px]">
                    <label
                      htmlFor={`plane_currency_${destId}`}
                      className="sr-only"
                    >
                      Divisa
                    </label>
                    <select
                      id={`plane_currency_${destId}`}
                      value={planeCurrency}
                      onChange={(e) =>
                        onCurrencyChange(destId, "plane", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      {currencyOptions.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {planeCurrency === "MXN"
                    ? `Se guardara en MXN: ${formatMoney(normalizedPlaneAmount)}.`
                    : planeRateQuery.isLoading
                      ? "Consultando tipo de cambio a MXN..."
                      : planeRateQuery.isError || planeMxnValue === null
                        ? "No se pudo obtener el tipo de cambio a MXN."
                        : `Equivalente en MXN: ${formatMoney(planeMxnValue)}.`}
                </p>
                
              </div>
              <div>
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor={`plane_file_${destId}`}
                >
                  Subir archivos de avión
                </label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => onFileChange(e, destId)}
                  name="plane_file"
                  id={`plane_file_${destId}`}
                  selectedFileName={formData[destId]?.plane_file_name}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {duffelSearchIds[destId] && (
        <div className="bg-[var(--gray)] p-4 rounded-lg border border-[var(--light-blue)] shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-[var(--blue)]">
              Vuelos encontrados (Precios en tiempo real)
            </h4>
            <button
              onClick={() => onClearDuffelSearch(destId)}
              className="text-xs text-[var(--light-blue)] hover:underline"
            >
              Cambiar a carga manual
            </button>
          </div>
          <DuffelOfferList
            offerRequestId={duffelSearchIds[destId] || ""}
            onSelectOffer={(offer) => onSelectOffer(destId, offer)}
          />
        </div>
      )}
    </div>
  );
};

/*
Modification History:
- 2026-04-27 | Juan de Dios Gastélum | Initial file creation. Extracted from Reservations.tsx to keep file under 1000 lines.
- 2026-04-29 | Fabrizio Barrios Blanco | Applied exchange rate UI and inline currency layout for reservation prices.
*/