/*This component (Reservations) renders a page for assigning hotel and/or flight reservations for each destination in a travel request. It reads the request id from the URL, fetches the request data with GET /requests/{id}, and transforms each requests_destinations entry into display-friendly fields (origin/destination strings, formatted departure/arrival dates, “Sí/No” flags for whether hotel/plane are required, and other details). The UI then iterates through each destination and shows a read-only summary grid plus conditional form sections: if a destination requires a hotel, it shows inputs for hotel title, comments, price, and a PDF upload; if it requires a flight, it shows the equivalent flight fields. User input is stored in a formData object keyed by destination ID, and file uploads store both the File and its name for display. On submit, it validates that all required reservation fields/files are provided according to what each destination needs, builds a reservations payload, and uploads each reservation as FormData via POST /reservations; if successful, it marks the request as finished with PATCH /requests/finished-reservations/{id}, shows a success toast, clears the form, and navigates back to the dashboard. The page is wrapped in a Tutorial flow and also tracks the page visit via handleVisitPage. */

import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getRequest, patchRequest } from "../../utils/apiService";
import formatDate from "../../utils/formatDate";
import { postRequest } from "../../utils/apiService";
import { Tutorial } from "../../components/Tutorial";
import { useApp } from "../../hooks/app/appContext";
import { useDuffel } from "../../hooks/requests/useDuffel";
import { useDestinations } from "../../hooks/destinations/useDestinations";
import dayjs from "dayjs";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { DestinationCard } from "../../components/Reservations/DestinationCard";
import { ReturnLegCard } from "../../components/Reservations/ReturnLegCard";
import { DuffelOffer } from "../../types/duffel";

/**
 * Shows a warning toast when the API response includes email delivery warnings.
 * Otherwise, shows the normal success toast for the completed operation.
 *
 * @param response API response that may include emailWarnings.
 * @param successMessage Message shown when no email warning exists.
 * @param warningMessage Message shown when email delivery failed.
 */
const showEmailAwareToast = (
  response: unknown,
  successMessage: string,
  warningMessage: string,
) => {
  const responseData = response as { emailWarnings?: unknown };
  const emailWarnings = Array.isArray(responseData.emailWarnings)
    ? responseData.emailWarnings
    : [];

  if (emailWarnings.length > 0) {
    toast.warning(warningMessage, {
      position: "top-right",
      autoClose: 6000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
    return;
  }

  toast.success(successMessage, {
    position: "top-right",
    autoClose: 3000,
  });
};

export const Reservations = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [request, setRequest] = useState<any>({});
  const [isFormValid, _setIsFormValid] = useState(true);
  const { handleVisitPage, tutorial } = useApp();
  const { createOfferRequest } = useDuffel();
  const { destinations } = useDestinations();
  const [duffelSearchIds, setDuffelSearchIds] = useState<
    Record<string, string>
  >({});
  const [searchingDuffel, setSearchingDuffel] = useState<
    Record<string, boolean>
  >({});
  const [confirmReservationsModal, setConfirmReservationsModal] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencyOptions = ["MXN", "USD", "EUR", "JPY", "CNY"];

  const updateFormData = (destId: string, updates: Record<string, unknown>) => {
    setFormData((prev) => ({
      ...prev,
      [destId]: {
        ...prev[destId],
        ...updates,
      },
    }));
  };

  const handleCurrencyChange = (
    destId: string,
    field: "hotel" | "plane",
    currency: string,
  ) => {
    updateFormData(destId, {
      [`${field}_currency`]: currency,
      [`${field}_rate`]: currency === "MXN" ? 1 : undefined,
    });
  };

  const handleRateChange = useCallback(
    (destId: string, field: "hotel" | "plane", rate?: number) => {
    setFormData((prev) => {
      const prevRate = prev[destId]?.[`${field}_rate`];
      if (prevRate === rate) return prev;

      return {
        ...prev,
        [destId]: {
          ...prev[destId],
          [`${field}_rate`]: rate,
        },
      };
    });
    },
    [],
);

  const getMxnPrice = (data: any, field: "hotel" | "plane") => {
    const rawAmount = Number(data?.[`${field}_price`]);
    if (Number.isNaN(rawAmount)) return NaN;

    const currency = String(data?.[`${field}_currency`] || "MXN");
    if (currency === "MXN") return rawAmount;

    const rate = Number(data?.[`${field}_rate`]);
    if (Number.isNaN(rate)) return NaN;

    return rawAmount * rate;
  };

  const isRateReady = (data: any, field: "hotel" | "plane") => {
    const rawAmount = data?.[`${field}_price`];
    if (rawAmount === undefined || rawAmount === "") return true;

    const currency = String(data?.[`${field}_currency`] || "MXN");
    if (currency === "MXN") return true;

    const rate = Number(data?.[`${field}_rate`]);
    return !Number.isNaN(rate) && rate > 0;
  };

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        // Simulate an API call to fetch data
        const response = await getRequest(`/requests/${id}`);
        setRequest({
          ...response,
          requests_destinations: (() => {
            const sorted = [...response.requests_destinations].sort(
              (a: any, b: any) => a.destination_order - b.destination_order,
            );
            return sorted.map((destination: any, index: number) => {
              const prev = index === 0 ? null : sorted[index - 1];
              const isLast = index === sorted.length - 1;

              const originCity =
                index === 0
                  ? response.destination.city +
                    ", " +
                    response.destination.country
                  : prev.destination.city + ", " + prev.destination.country;

              const originCityName =
                index === 0 ? response.destination.city : prev.destination.city;

              const originCountry =
                index === 0
                  ? response.destination.country
                  : prev.destination.country;

              const originId =
                index === 0 ? response.id_origin_city : prev.id_destination;

              const originAirportId =
                index === 0 ? response.id_origin_airport : prev.id_airport;

              const originRef =
                index === 0 ? response.destination : prev.destination;

              const originAirportRef =
                index === 0
                  ? response.origin_airport || response.originAirport
                  : prev.airport || prev.destination_airport;

              return {
                ...destination,
                origin: originCity,
                origin_city: originCityName,
                origin_country: originCountry,
                destination_full:
                  destination.destination.city +
                  ", " +
                  destination.destination.country,
                destination_city: destination.destination.city,
                destination_country: destination.destination.country,
                origin_id: originId,
                origin_airport_id: originAirportId,
                destination_id: destination.id_destination,
                destination_airport_id: destination.id_airport,
                origin_ref: originRef,
                origin_airport_ref: originAirportRef,
                destination_ref: destination.destination,
                destination_airport_ref:
                  destination.airport || destination.destination_airport,
                departure_date_raw: destination.departure_date,
                arrival_date_raw: destination.arrival_date,
                departure_date: formatDate(destination.departure_date),
                arrival_date: formatDate(destination.arrival_date),
                hotel_required: destination.is_hotel_required ? "Sí" : "No",
                plane_required: destination.is_plane_required ? "Sí" : "No",
                stay_days: destination.stay_days,
                details: destination.details,
                is_last_destination: isLast,
              };
            });
          })(),
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error fetching data");
      }
    };
    fetchRequest();
  }, []);

  useEffect(() => {
    // Get the visited pages from localStorage
    const visitedPages = JSON.parse(
      localStorage.getItem("visitedPages") || "[]",
    );
    // Check if the current page is already in the visited pages
    const isPageVisited = visitedPages.includes(location.pathname);

    // If the page is not visited, set the tutorial to true
    if (!isPageVisited) {
      // setTutorial(true);
    }
    // Add the current page to the visited pages
    handleVisitPage();
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
  ) => {
    const { name, files } = e.target;
    const file = files ? files[0] : null;
    const fileName = file ? file.name : "";

    const updatedFormData = {
      ...formData,
      [id]: {
        ...formData[id],
        [name]: file,
        // Guardar también el nombre del archivo para mostrarlo
        [`${name}_name`]: fileName,
      },
    };
    setFormData(updatedFormData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: string,
  ) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [id]: {
        ...formData[id],
        [name]: value,
      },
    };
    setFormData(updatedFormData);
  };

  const handleDuffelSearch = async (destination: any) => {
    const destId = destination.id;
    const backendDestId = destination.requestDestinationId ?? destination.id;
    const normalizeDate = (value: unknown): string => {
      if (typeof value !== "string") {
        return "";
      }

      const trimmed = value.trim();
      if (!trimmed) return "";

      // Preserve calendar date from ISO/timestamp values and avoid timezone shifts.
      const isoLike = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
      if (isoLike?.[1]) return isoLike[1];

      const ymdSlash = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
      if (ymdSlash) {
        const [, year = "", month = "", day = ""] = ymdSlash;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }

      const dmySlash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dmySlash) {
        const [, day = "", month = "", year = ""] = dmySlash;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }

      const parsed = dayjs(trimmed);
      return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
    };

    const extractIATA = (value: unknown): string => {
      if (!value) return "";

      if (typeof value === "string") {
        const trimmed = value.trim();
        if (/^[A-Z]{3}$/.test(trimmed)) {
          return trimmed;
        }
        const matches = trimmed.match(/\b[A-Z]{3}\b/);
        return matches ? matches[0] : "";
      }

      return "";
    };

    const getIataFromObject = (obj: any): string => {
      if (!obj || typeof obj !== "object") return "";
      const candidates = [
        obj.iata_code,
        obj.iataCode,
        obj.iata,
        obj.airport_code,
        obj.airportCode,
        obj.code,
      ];

      for (const candidate of candidates) {
        const code = extractIATA(candidate);
        if (code) return code;
      }

      return "";
    };

    const getIataByDestinationId = (destinationId: unknown): string => {
      if (!destinationId) return "";
      const match = destinations.find(
        (d: any) => String(d.id) === String(destinationId),
      );
      return getIataFromObject(match);
    };

    const getIataByAirportId = (
      airportId: unknown,
      destinationId?: unknown,
    ): string => {
      if (!airportId) return "";

      const destinationMatch = destinationId
        ? destinations.find((d: any) => String(d.id) === String(destinationId))
        : null;

      const destinationAirports = destinationMatch?.airports || [];
      const scopedAirport = destinationAirports.find(
        (airport: any) => String(airport.id) === String(airportId),
      );

      if (scopedAirport) {
        return getIataFromObject(scopedAirport);
      }

      const allAirports = destinations.flatMap((d: any) => d.airports || []);
      const anyAirport = allAirports.find(
        (airport: any) => String(airport.id) === String(airportId),
      );

      return getIataFromObject(anyAirport);
    };

    const originCode =
      getIataFromObject(destination.origin_airport_ref) ||
      getIataByAirportId(
        destination.origin_airport_id,
        destination.origin_id,
      ) ||
      getIataFromObject(destination.origin_ref) ||
      getIataByDestinationId(destination.origin_id) ||
      extractIATA(destination.origin);

    const destinationCode =
      getIataFromObject(destination.destination_airport_ref) ||
      getIataByAirportId(
        destination.destination_airport_id,
        destination.destination_id,
      ) ||
      getIataFromObject(destination.destination_ref) ||
      getIataByDestinationId(destination.destination_id) ||
      extractIATA(destination.destination_full);

    if (!originCode || !destinationCode) {
      const missing = [
        !originCode ? "origen" : null,
        !destinationCode ? "destino" : null,
      ]
        .filter(Boolean)
        .join(" y ");
      toast.error(
        `No se encontró código IATA para ${missing}. Verifica la configuración de aeropuertos en destinos.`,
      );
      return;
    }

    const departureDateSource =
      destination.departure_date_raw || destination.departure_date;
    const outboundDate = normalizeDate(departureDateSource);

    if (!dayjs(outboundDate, "YYYY-MM-DD", true).isValid()) {
      toast.error("Error en el formato de la fecha de salida");
      return;
    }

    const today = dayjs().startOf("day");
    if (!dayjs(outboundDate).isAfter(today)) {
      toast.error(
        "La fecha de salida debe ser posterior al día de hoy para buscar en Duffel",
      );
      return;
    }
    setSearchingDuffel((prev) => ({ ...prev, [destId]: true }));

    try {
      const payload = {
        requestDestinationId: backendDestId,
        data: {
          slices: [
            {
              origin: originCode,
              destination: destinationCode,
              departure_date: outboundDate,
            },
          ],
          passengers: [{ type: "adult" as const }],
          cabin_class: "economy" as const,
        },
      };

      const response = await createOfferRequest.mutateAsync(payload as any);

      console.log(" RESPUESTA COMPLETA DE DUFFEL:", response);

      // Intentamos obtener el ID de varias formas por si el backend lo envolvió
      const offerRequestId =
        response?.offer_request_id || response?.data?.id || response?.id;

      if (offerRequestId) {
        console.log(" ID DE BÚSQUEDA CAPTURADO:", offerRequestId);
        setDuffelSearchIds((prev) => ({ ...prev, [destId]: offerRequestId }));
        toast.success(`Vuelos encontrados para ${originCode}`);
      } else {
        console.warn(" No se encontró un ID en la respuesta");
        toast.warning("Duffel respondió, pero no se generó un ID de búsqueda.");
      }
    } catch (error: any) {
      console.error(" Error en la petición:", error);
      if (error?.code === "ECONNABORTED") {
        toast.error(
          "Duffel tardó demasiado en responder. Intenta de nuevo en unos segundos.",
        );
        return;
      }
      const msg =
        error.response?.data?.details?.message ||
        error.response?.data?.message ||
        "Hubo un problema al conectar con Duffel.";
      toast.error(`Duffel dice: ${msg}`);
    } finally {
      setSearchingDuffel((prev) => ({ ...prev, [destId]: false }));
    }
  };

  const handleSelectOffer = (destId: string, offer: DuffelOffer) => {
    const rawAmount = offer.total_amount || offer.price?.total_amount || "";
    const parsedAmount = Number.parseFloat(String(rawAmount));
    const amount = Number.isFinite(parsedAmount) ? String(parsedAmount) : "";
    const rawCurrency = offer.total_currency || offer.price?.total_currency || "";
    const currency = currencyOptions.includes(rawCurrency)
      ? rawCurrency
      : "MXN";
    const ownerName = offer.owner?.name || "Aerolínea";
    const outbound = offer.slices?.[0];
    const firstSegment = outbound?.segments?.[0];
    const lastSegment = outbound?.segments?.[outbound.segments.length - 1];
    const fallbackOrigin = (outbound as any)?.origin?.iata_code || "---";
    const fallbackDestination = (outbound as any)?.destination?.iata_code || "---";
    const originCode = firstSegment?.origin?.iata_code || fallbackOrigin;
    const destinationCode = lastSegment?.destination?.iata_code || fallbackDestination;
    const departureTime = firstSegment?.departing_at
      ? dayjs(firstSegment.departing_at).format("HH:mm")
      : "";
    const arrivalTime = lastSegment?.arriving_at
      ? dayjs(lastSegment.arriving_at).format("HH:mm")
      : "";
    const routeLabel = `${originCode}-${destinationCode}`;
    const timeLabel = departureTime && arrivalTime
      ? ` ${departureTime}-${arrivalTime}`
      : "";
    const title = `Vuelo ${ownerName} ${routeLabel}${timeLabel}`.trim();
    const comments = `Aerolínea: ${ownerName}. Ruta ${routeLabel}.`;

    updateFormData(destId, {
      plane_title: title,
      plane_comments: comments,
      plane_price: amount,
      plane_currency: currency,
      ...(currency === "MXN" ? { plane_rate: 1 } : {}),
    });

    setDuffelSearchIds((prev) => ({ ...prev, [destId]: "" }));
    toast.success("Vuelo seleccionado. Datos cargados en la forma manual.");
  };

  /**
   * Validates the reservation form and opens the confirmation modal if valid.
   * Actual API submission happens in executeSubmit after user confirms.
   * @param e - Form submit event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hotelLength = request.requests_destinations.filter(
      (destination: any) => destination.is_hotel_required,
    ).length;
    const planeLength = request.requests_destinations.filter(
      (destination: any) => destination.is_plane_required,
    ).length;
    const returnLegLength = request.is_round_trip ? 1 : 0;
    const totalLength = hotelLength + planeLength + returnLegLength;

    if (
      totalLength > 0 &&
      (formData === null || Object.keys(formData).length === 0)
    ) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    const rateMissing = Object.values(formData).some(
      (data) => !isRateReady(data, "hotel") || !isRateReady(data, "plane"),
    );

    if (rateMissing) {
      toast.error("No hay tipo de cambio para la moneda seleccionada.");
      return;
    }

    const formattedData = {
      reservations: Object.entries(formData).flatMap(([key, value]) => {
        const lastDestId = [...(request.requests_destinations || [])].sort(
          (a: any, b: any) => b.destination_order - a.destination_order,
        )[0]?.id;
        const hotelReservation = value.hotel_title && {
          title: value.hotel_title,
          comments: value.hotel_comments,
          price: getMxnPrice(value,"hotel"),
          file: value.hotel_file,
          id_request_destination: key === "return_leg" ? lastDestId : key,
        };
        const planeReservation = value.plane_title && {
          title: value.plane_title,
          comments: value.plane_comments,
          price: getMxnPrice(value,"plane"),
          file: value.plane_file,
          id_request_destination: key === "return_leg" ? lastDestId : key,
        };
        return [hotelReservation, planeReservation].filter(Boolean);
      }),
    };

    if (formattedData.reservations.length !== totalLength) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    const isValid = Object.values(formData).every((data, index) => {
      const key = Object.keys(formData)[index];
      const hotelValid =
        data.hotel_title && data.hotel_comments && data.hotel_file;
      const planeValid =
        data.plane_title && data.plane_comments && data.plane_file;
      const hotelRateValid = isRateReady(data, "hotel");
      const planeRateValid = isRateReady(data, "plane");
      if (key === "return_leg") {
        return (
          !!(data.plane_title && data.plane_comments && data.plane_file) &&
          planeRateValid
        );
      }
      const requestDestination = request.requests_destinations.find(
        (destination: any) => destination.id === key,
      );
      if (!requestDestination) return false;
      if (
        requestDestination.is_hotel_required &&
        requestDestination.is_plane_required
      ) {
        return hotelValid && planeValid && hotelRateValid && planeRateValid;
      } else if (
        requestDestination.is_hotel_required &&
        !requestDestination.is_plane_required
      ) {
        return hotelValid && hotelRateValid;
      } else if (
        requestDestination.is_plane_required &&
        !requestDestination.is_hotel_required
      ) {
        return planeValid && planeRateValid;
      }
      return true;
    });

    if (!isValid) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    setConfirmReservationsModal(true);
  };

  /**
   * Executes the reservation submission after user confirms the modal.
   * Uploads each reservation and marks the request as finished.
   */
  const executeSubmit = async () => {
    setConfirmReservationsModal(false);
    setIsSubmitting(true);

    const lastDestId = [...(request.requests_destinations || [])].sort(
      (a: any, b: any) => b.destination_order - a.destination_order,
    )[0]?.id;

    const formattedData = {
      reservations: Object.entries(formData).flatMap(([key, value]) => {
        const hotelReservation = value.hotel_title && {
          title: value.hotel_title,
          comments: value.hotel_comments,
          price: getMxnPrice(value,"hotel"),
          file: value.hotel_file,
          id_request_destination: key === "return_leg" ? lastDestId : key,
        };
        const planeReservation = value.plane_title && {
          title: value.plane_title,
          comments: value.plane_comments,
          price: getMxnPrice(value,"plane"),
          file: value.plane_file,
          id_request_destination: key === "return_leg" ? lastDestId : key,
        };
        return [hotelReservation, planeReservation].filter(Boolean);
      }),
    };

    const responses = await Promise.all(
      formattedData.reservations.map(async (reservation) => {
        const reservationFormData = new FormData();
        reservationFormData.append("title", reservation.title);
        reservationFormData.append("comments", reservation.comments);
        reservationFormData.append("price", reservation.price);
        reservationFormData.append("file", reservation.file);
        reservationFormData.append(
          "id_request_destination",
          reservation.id_request_destination,
        );
        try {
          await postRequest("/reservations", reservationFormData);
        } catch (error) {
          console.error("Error sending reservation data:", error);
        }
      }),
    );

    setIsSubmitting(false);

    if (responses) {
      const response = await patchRequest(
        `/requests/finished-reservations/${id}`,
        {},
      );

      showEmailAwareToast(
        response,
        "Reservaciones enviadas correctamente.",
        "Reservaciones enviadas. No se pudo enviar la notificación por correo.",
      );

      setFormData({});

      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
    } else {
      toast.error("Error al enviar las reservaciones.");
    }
  };

  /**
   * Generates destination-specific date labels based on position in the itinerary.
   * First destination uses a generic departure label; subsequent ones name the city explicitly.
   * @param destination - The destination object with city and position data.
   * @param isFirst - Whether this is the first destination in the itinerary.
   */
  const getDestinationLabels = (
    destination: any,
    isFirst: boolean,
  ): { key: string; label: string }[] => [
    { key: "origin", label: "Origen" },
    { key: "destination_full", label: "Destino" },
    {
      key: "departure_date",
      label: isFirst
        ? "Fecha de Salida"
        : `Llega a ${destination.destination_city} el`,
    },
    {
      key: "arrival_date",
      label:
        destination.is_last_destination && !request.is_round_trip
          ? "Fecha de Llegada"
          : `Sale de ${destination.destination_city} el`,
    },
    { key: "details", label: "Detalles" },
    { key: "hotel_required", label: "¿Se necesita hotel?" },
    { key: "plane_required", label: "¿Se necesita avión?" },
    { key: "stay_days", label: "Días de estancia" },
  ];

  return (
    <Tutorial page="reservations" run={tutorial}>
      <div className="bg-gray-200 rounded-md mb-10 max-w-5xl mx-auto">
        <div className="p-10 mx-auto">
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">
            Asignar reservaciones
          </h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="">
              {request?.requests_destinations?.map(
                (destination: any, index: number) => (
                  <DestinationCard
                    key={destination.id}
                    destination={destination}
                    formData={formData}
                    duffelSearchIds={duffelSearchIds}
                    searchingDuffel={searchingDuffel}
                    labels={getDestinationLabels(destination, index === 0)}
                    onFileChange={handleFileChange}
                    onFieldChange={handleChange}
                    currencyOptions={currencyOptions}
                    onCurrencyChange={handleCurrencyChange}
                    onRateChange={handleRateChange}
                    onDuffelSearch={handleDuffelSearch}
                    onSelectOffer={handleSelectOffer}
                    onClearDuffelSearch={(destId) =>
                      setDuffelSearchIds((prev) => ({ ...prev, [destId]: "" }))
                    }
                  />
                ),
              )}
            </div>

            {request.is_round_trip && (
              <ReturnLegCard
                request={request}
                formData={formData}
                duffelSearchIds={duffelSearchIds}
                searchingDuffel={searchingDuffel}
                onFileChange={handleFileChange}
                onFieldChange={handleChange}
                currencyOptions={currencyOptions}
                onCurrencyChange={handleCurrencyChange}
                onRateChange={handleRateChange}
                onDuffelSearch={handleDuffelSearch}
                onSelectOffer={handleSelectOffer}
                onClearDuffelSearch={(destId) =>
                  setDuffelSearchIds((prev) => ({ ...prev, [destId]: "" }))
                }
              />
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                id="assign-reservations"
                className={`px-4 py-2 rounded-md transition-colors ${
                  isFormValid
                    ? "bg-[#0a2c6d] text-white hover:bg-[#0d3d94]"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                Enviar reservaciones
              </button>
            </div>
          </form>
        </div>
      </div>
      <ConfirmationModal
        isOpen={confirmReservationsModal}
        onClose={() => setConfirmReservationsModal(false)}
        onConfirm={executeSubmit}
        title="Confirmar envío de reservaciones"
        description="Estás a punto de enviar todas las reservaciones y marcar la solicitud como lista. No podrás modificar esta información después."
        confirmText="Enviar reservaciones"
        warningNote="Esta acción es irreversible. La solicitud avanzará de estado automáticamente."
        isLoading={isSubmitting}
      />
    </Tutorial>
  );
};

export default Reservations;

/*
Modification History:
- 2026-04-20 | Fabrizio | Integrated Duffel search and order flow inside the agent booking view.
- 2026-04-23 | Juan de Dios Gastélum | Fixed sequential origin mapping, one-way per leg search, and added independent return leg box for round-trip reservations.
- 2026-04-27 | Juan de Dios Gastélum | Added confirmation modals before Duffel order emission and reservation submission.Split destination map and return leg into DestinationCard and ReturnLegCard components to keep file under 1000 lines. Made date labels dynamic per destination to clarify arrival vs departure context in multi-destination trips. Fixed arrival_date label for last destination in round-trip itineraries.
- 2026-04-29 | Juan de Dios Gastélum Flores | Added email warning toast handling after finishing reservations.
- 2026-04-30 | Fabrizio Barrios Blanco | Wired exchange rate handling for reservation price conversions.
*/
