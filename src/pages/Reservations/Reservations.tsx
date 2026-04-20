/*This component (Reservations) renders a page for assigning hotel and/or flight reservations for each destination in a travel request. It reads the request id from the URL, fetches the request data with GET /requests/{id}, and transforms each requests_destinations entry into display-friendly fields (origin/destination strings, formatted departure/arrival dates, “Sí/No” flags for whether hotel/plane are required, and other details). The UI then iterates through each destination and shows a read-only summary grid plus conditional form sections: if a destination requires a hotel, it shows inputs for hotel title, comments, price, and a PDF upload; if it requires a flight, it shows the equivalent flight fields. User input is stored in a formData object keyed by destination ID, and file uploads store both the File and its name for display. On submit, it validates that all required reservation fields/files are provided according to what each destination needs, builds a reservations payload, and uploads each reservation as FormData via POST /reservations; if successful, it marks the request as finished with PATCH /requests/finished-reservations/{id}, shows a success toast, clears the form, and navigates back to the dashboard. The page is wrapped in a Tutorial flow and also tracks the page visit via handleVisitPage. */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Input from "../../components/Refunds/InputField";
import TextArea from "../../components/Refunds/TextArea";
import { toast } from "react-toastify";
import { getRequest, patchRequest } from "../../utils/apiService";
import formatDate from "../../utils/formatDate";
import { postRequest } from "../../utils/apiService";
import { Tutorial } from "../../components/Tutorial";
import { useApp } from "../../hooks/app/appContext";
import { useDuffel } from "../../hooks/requests/useDuffel";
import { DuffelOfferList } from "../../components/Reservations/DuffelOfferList";
import { DuffelPassengerForm } from "../../components/Reservations/DuffelPassengerForm";
import { DuffelOffer } from "../../types/duffel";
import dayjs from "dayjs";

export const Reservations = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [request, setRequest] = useState<any>({});
  const [isFormValid, _setIsFormValid] = useState(true);
  const { handleVisitPage, tutorial } = useApp();
  const { createOfferRequest, createOrder } = useDuffel();
    const [duffelSearchIds, setDuffelSearchIds] = useState<Record<string, string>>({});
    const [searchingDuffel, setSearchingDuffel] = useState<Record<string, boolean>>({});
    const [selectedOffer, setSelectedOffer] = useState<Record<string, DuffelOffer | null>>({});

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        // Simulate an API call to fetch data
        const response = await getRequest(`/requests/${id}`);
        setRequest({
          ...response,
          requests_destinations: response.requests_destinations.map(
            (destination: any) => ({
              ...destination,
              origin:
                response.destination.city + ", " + response.destination.country,
              origin_city: response.destination.city,
              origin_country: response.destination.country,
              destination_full:
                destination.destination.city +
                ", " +
                destination.destination.country,
              destination_city: destination.destination.city,
              destination_country: destination.destination.country,
              departure_date: formatDate(destination.departure_date),
              arrival_date: formatDate(destination.arrival_date),
              hotel_required: destination.is_hotel_required ? "Sí" : "No",
              plane_required: destination.is_plane_required ? "Sí" : "No",
              stay_days: destination.stay_days,
              details: destination.details,
            }),
          ),
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
    const extractIATA = (cityString: string): string => {
      if (!cityString) return "";
      // Busca 3 letras mayúsculas rodeadas de espacios, comas o inicio/fin de línea
      const matches = cityString.match(/\b[A-Z]{3}\b/);
      return matches ? matches[0] : "";
    };

    let originCode = extractIATA(destination.origin); 
    let destinationCode = extractIATA(destination.destination_full);

    // Si el Regex falla (ej. si escribiste "jfk" en minúsculas en el seed)
    const rawDate = destination.departure_date;
    let finalDate = "";

    if (rawDate.includes("/")) {
      // Si viene del formato transformado "DD/MM/YYYY", lo invertimos manualmente para asegurar éxito
      const [day, month, year] = rawDate.split("/");
      finalDate = `${year}-${month}-${day}`;
    } else {
      // Si viene como ISO string directo de la DB
      finalDate = dayjs(rawDate).format("YYYY-MM-DD");
    }

    // Verificación final
    if (finalDate === "Invalid Date" || !finalDate) {
      toast.error("Error en el formato de fecha del viaje");
      return;
    }
    setSearchingDuffel(prev => ({ ...prev, [destId]: true }));

    try {
      const payload = {
        requestDestinationId: destId,
        data: {
          slices: [{
            origin: originCode,
            destination: destinationCode,
            departure_date: dayjs(destination.departure_date, "DD/MM/YYYY").format("YYYY-MM-DD"),
          }],
          passengers: [{ type: 'adult' as const }],
          cabin_class: 'economy' as const,
        },
      };

      const response = await createOfferRequest.mutateAsync(payload as any);
      
      console.log(" RESPUESTA COMPLETA DE DUFFEL:", response);

      // Intentamos obtener el ID de varias formas por si el backend lo envolvió
      const offerRequestId = response?.offer_request_id || response?.data?.id || response?.id;

      if (offerRequestId) {
        console.log(" ID DE BÚSQUEDA CAPTURADO:", offerRequestId);
        setDuffelSearchIds(prev => ({ ...prev, [destId]: offerRequestId }));
        toast.success(`Vuelos encontrados para ${originCode}`);
      } else {
        console.warn(" No se encontró un ID en la respuesta");
        toast.warning("Duffel respondió, pero no se generó un ID de búsqueda.");
      }

    } catch (error: any) {
      console.error(" Error en la petición:", error);
      toast.error("Hubo un problema al conectar con Duffel.");
    } finally {
      setSearchingDuffel(prev => ({ ...prev, [destId]: false }));
     }
  

      try {
        const payload = {
          requestDestinationId: destId, // Trazabilidad para el Backend
          data: {
            slices: [
              {
                origin: originCode,
                destination: destinationCode,
                departure_date: dayjs(destination.departure_date, "DD/MM/YYYY").format("YYYY-MM-DD"),
              },
            ],
            passengers: [{ type: 'adult' as const }], // Por defecto 1 adulto para el flujo base
            cabin_class: 'economy' as const,
          },
        };

        const response = await createOfferRequest.mutateAsync(payload as any);
        
        if (response && response.data) {
          setDuffelSearchIds(prev => ({ ...prev, [destId]: response.data.id }));
          toast.success(`Vuelos encontrados para ${originCode} -> ${destinationCode}`);
        }
      } catch (error: any) {
        console.error("Duffel Search Error:", error);
        // Mostramos el error real que devuelve el Backend
        const msg = error.response?.data?.details?.message || error.response?.data?.message || "Error en la búsqueda";
        toast.error(`Duffel dice: ${msg}`);
      } finally {
        setSearchingDuffel(prev => ({ ...prev, [destId]: false }));
      }
    };

    const handleSelectOffer = (destId: string, offer: DuffelOffer) => {
      setSelectedOffer(prev => ({ ...prev, [destId]: offer }));
      // Al seleccionar, podemos ocultar la lista y mostrar un resumen con el botón de "Confirmar Reserva"
    };

    const handleSubmitDuffelOrder = async (destId: string, passengerData: any) => {
      const offer = selectedOffer[destId];
      if (!offer) return;

      const finalOfferId = offer.id || offer.offer_id;
      const finalPrice = parseFloat(offer.price?.total_amount || offer.total_amount || "0");


      try {
        const payload = {
          requestDestinationId: destId,
          offerId: finalOfferId,
          reservationTitle: `Vuelo Duffel: ${offer.owner?.name || 'Aerolínea'}`,
          reservationComments: `Reserva digital emitida para ${passengerData.given_name}.`,
          reservationPrice: finalPrice,
          data: {
            selected_offers: [finalOfferId],
            passengers: [{
              ...passengerData,
              // Detalle: Las aerolíneas son estrictas con el formato del teléfono
               phone_number: passengerData.phone_number.replace(/\s/g, '')
            }],
            type: 'instant' as const, // Emisión inmediata
          },
        };

        console.log(" ENVIANDO ORDEN FINAL A MONARCA:", payload);

        await createOrder.mutateAsync(payload as any);
        
        toast.success("¡Vuelo reservado y emitido correctamente!");
        
        // Limpiamos los estados de Duffel para este destino para mostrar la reserva finalizada
        setDuffelSearchIds(prev => ({ ...prev, [destId]: "" }));
        setSelectedOffer(prev => ({ ...prev, [destId]: null }));
        
        // Opcional: Refrescar la solicitud completa para mostrar la nueva reservación en la lista
        // El hook de la Parte 1 ya tiene un onSuccess que invalida las queries
      } catch (error: any) {
        console.error("Duffel Order Error:", error);
        // Detalle importante: Duffel devuelve errores muy específicos (ej. "Passport required")
        const errorMsg = error.response?.data?.message || "Error al emitir el boleto. Verifique los datos.";
        toast.error(errorMsg);
      }
    };




  /**
   * Handles reservation form submission.
   * Calculates the total number of required reservations (hotel + plane) per destination
   * before validating. Allows submission with an empty form when no destination
   * requires hotel or plane, so the request can still advance its status.
   * @param e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate expected reservations count before any form validation
    const hotelLength = request.requests_destinations.filter(
      (destination: any) => destination.is_hotel_required,
    ).length;
    const planeLength = request.requests_destinations.filter(
      (destination: any) => destination.is_plane_required,
    ).length;
    const totalLength = hotelLength + planeLength;

    // Only block empty submissions when there are reservations actually required
    if (
      totalLength > 0 &&
      (formData === null || Object.keys(formData).length === 0)
    ) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    const formattedData = {
      reservations: Object.entries(formData).flatMap(([key, value]) => {
        const hotelReservation = value.hotel_title && {
          title: value.hotel_title,
          comments: value.hotel_comments,
          price: parseFloat(value.hotel_price),
          file: value.hotel_file,
          id_request_destination: key,
        };
        const planeReservation = value.plane_title && {
          title: value.plane_title,
          comments: value.plane_comments,
          price: parseFloat(value.plane_price),
          file: value.plane_file,
          id_request_destination: key,
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
      const requestDestination = request.requests_destinations.find(
        (destination: any) => destination.id === key,
      );
      if (!requestDestination) {
        return false;
      }
      if (
        requestDestination.is_hotel_required &&
        requestDestination.is_plane_required
      ) {
        return hotelValid && planeValid;
      } else if (
        requestDestination.is_hotel_required &&
        !requestDestination.is_plane_required
      ) {
        return hotelValid;
      } else if (
        requestDestination.is_plane_required &&
        !requestDestination.is_hotel_required
      ) {
        return planeValid;
      }
      return true;
    });

    if (!isValid) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    const responses = await Promise.all(
      formattedData.reservations.map(async (reservation) => {
        // Renamed from formData to avoid shadowing the component state variable
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

    if (responses) {
      toast.success("Reservaciones enviadas correctamente.");
      setFormData({});
      await patchRequest(`/requests/finished-reservations/${id}`, {});
      navigate("/dashboard");
    } else {
      toast.error("Error al enviar las reservaciones.");
    }
  };

  const labels: { key: keyof typeof request; label: string }[] = [
    { key: "origin", label: "Origen" },
    { key: "destination_full", label: "Destino" },
    { key: "departure_date", label: "Fecha de Salida" },
    { key: "arrival_date", label: "Fecha de Llegada" },
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
              {request?.requests_destinations?.map((destination: any) => (
                <div
                  key={destination.id}
                  className="rounded-md p-4 mb-6 space-y-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-lg text-[var(--blue)]">Destino #{destination.destination_order}</h3>
                    {destination.is_plane_required && !selectedOffer[destination.id] && (
                     
                      <button
                        type="button"
                        onClick={() => handleDuffelSearch(destination)}
                        disabled={searchingDuffel[destination.id]}
                        className="text-xs bg-[#6032b3] text-white px-3 py-1 rounded hover:bg-[#4c2891] transition-colors"
                      >
                        {searchingDuffel[destination.id] ? "Buscando..." : "Buscar vuelos (Duffel)"}
                      </button>
                    )}
                  </div>
                  
                  <section
                    className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8"
                    id="reservation-info"
                  >
                    {labels.map(({ key, label }) => (
                      <div key={key as string}>
                        <label
                          htmlFor={key as string}
                          className="block text-xs font-semibold text-gray-500 mb-1"
                        >
                          {label}
                        </label>
                        <input
                          id={key as string}
                          type="text"
                          readOnly
                          value={destination[key] || ""}
                          className="w-full bg-gray-100 text-gray-800 rounded-lg px-3 py-2 border border-gray-200"
                        />
                      </div>
                    ))}
                  </section>
                  {!duffelSearchIds[destination.id] && (
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                      {destination.is_hotel_required && (
                        <div
                          className="flex flex-col gap-y-4"
                          id="hotel-reservation"
                        >
                          <h3 className="text-[var(--blue)] mb-4 font-bold">
                            Información del hotel
                          </h3>
                          <div>
                            <label
                              className="block mb-2 text-sm font-medium text-gray-900"
                              htmlFor={`hotel_title_${destination.id}`}
                            >
                              Título
                            </label>
                            <Input
                              placeholder="Ingresa el título de la reservación"
                              value={formData[destination.id]?.hotel_title || ""}
                              onChange={(e) => handleChange(e, destination.id)}
                              name="hotel_title"
                              id={`hotel_title_${destination.id}`}
                            />
                          </div>

                          <div>
                            <label
                              className="block mb-2 text-sm font-medium text-gray-900"
                              htmlFor={`hotel_comments_${destination.id}`}
                            >
                              Comentarios
                            </label>
                            <TextArea
                              placeholder="Escribe tus comentarios"
                              value={
                                formData[destination.id]?.hotel_comments || ""
                              }
                              onChange={(e) => handleChange(e, destination.id)}
                              name="hotel_comments"
                              id={`hotel_comments_${destination.id}`}
                            />
                          </div>

                          <div>
                            <label
                              className="block mb-2 text-sm font-medium text-gray-900"
                              htmlFor={`hotel_price_${destination.id}`}
                            >
                              Precio
                            </label>
                            <Input
                              placeholder="Ingresa el precio del hotel"
                              value={formData[destination.id]?.hotel_price || ""}
                              onChange={(e) => handleChange(e, destination.id)}
                              name="hotel_price"
                              type="number"
                              id={`hotel_price_${destination.id}`}
                            />
                          </div>

                          <div>
                            <label
                              className="block mb-2 text-sm font-medium text-gray-900"
                              htmlFor={`hotel_file_${destination.id}`}
                            >
                              Subir archivos de hotel
                            </label>

                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={(e) =>
                                handleFileChange(e, destination.id)
                              }
                              name="hotel_file"
                              id={`hotel_file_${destination.id}`}
                              selectedFileName={
                                formData[destination.id]?.hotel_file_name
                              }
                            />
                          </div>
                        </div>
                      )}
                      {destination.is_plane_required && (
                        <div
                          className="flex flex-col gap-y-4"
                          id="plane-reservation"
                        >
                          <h3 className="text-[var(--blue)] mb-4 font-bold">
                            Información del vuelo
                          </h3>
                          <div>
                            <label
                              className="block mb-2 text-sm font-medium text-gray-900"
                              htmlFor={`plane_title_${destination.id}`}
                            >
                              Título
                            </label>
                            <Input
                              placeholder="Ingresa el título de la reservación"
                              value={formData[destination.id]?.plane_title || ""}
                              onChange={(e) => handleChange(e, destination.id)}
                              name="plane_title"
                              id={`plane_title_${destination.id}`}
                            />
                          </div>

                          <div>
                            <label
                              className="block mb-2 text-sm font-medium text-gray-900"
                              htmlFor={`plane_comments_${destination.id}`}
                            >
                              Comentarios
                            </label>
                            <TextArea
                              placeholder="Escribe tus comentarios"
                              value={
                                formData[destination.id]?.plane_comments || ""
                              }
                              onChange={(e) => handleChange(e, destination.id)}
                              name="plane_comments"
                              id={`plane_comments_${destination.id}`}
                            />
                          </div>

                          <div>
                            <label
                              className="block mb-2 text-sm font-medium text-gray-900"
                              htmlFor={`plane_price_${destination.id}`}
                            >
                              Precio
                            </label>
                            <Input
                              placeholder="Ingresa el precio del vuelo"
                              value={formData[destination.id]?.plane_price || ""}
                              onChange={(e) => handleChange(e, destination.id)}
                              name="plane_price"
                              type="number"
                              id={`plane_price_${destination.id}`}
                            />
                          </div>

                          <div>
                            <label
                              className="block mb-2 text-sm font-medium text-gray-900"
                              htmlFor={`plane_file_${destination.id}`}
                            >
                              Subir archivos de avión
                            </label>
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={(e) =>
                                handleFileChange(e, destination.id)
                              }
                              name="plane_file"
                              id={`plane_file_${destination.id}`}
                              selectedFileName={
                                formData[destination.id]?.plane_file_name
                              }
                            />
                          </div>
                        </div>
                      )}
                    </section>
                  )}
                  {duffelSearchIds[destination.id] && !selectedOffer[destination.id] && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 shadow-inner">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-purple-900">Vuelos encontrados (Precios en tiempo real)</h4>
                        <button 
                          onClick={() => setDuffelSearchIds(prev => ({ ...prev, [destination.id]: "" }))}
                          className="text-xs text-purple-600 hover:underline"
                        >
                          Cambiar a carga manual
                        </button>
                      </div>
                      <DuffelOfferList 
                        offerRequestId={duffelSearchIds[destination.id] || ""} 
                        onSelectOffer={(offer) => handleSelectOffer(destination.id, offer)}
                      />
                    </div>
                  )}

                  {selectedOffer[destination.id] && (
                    <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="font-black text-green-900 uppercase tracking-tight">Vuelo Seleccionado</h4>
                          <p className="text-xs text-green-700">
                            Aerolínea: {selectedOffer[destination.id]?.owner?.name} Vuelo ID: {(selectedOffer[destination.id]?.id || selectedOffer[destination.id]?.offer_id || "").substring(0, 8)}
                          </p>
                        </div>
                        <button 
                          onClick={() => setSelectedOffer(prev => ({ ...prev, [destination.id]: null }))}
                          className="text-xs bg-white border border-green-300 px-2 py-1 rounded text-green-700 hover:bg-green-100"
                        >
                          Elegir otro vuelo
                        </button>
                      </div>
                      <DuffelPassengerForm 
                        offer={selectedOffer[destination.id]!}
                        initialData={{
                          name: request?.user?.name || "",
                          last_name: request?.user?.last_name || "",
                          email: request?.user?.email || "",
                        }}
                        isSubmitting={createOrder.isPending}
                        onSubmit={(data) => handleSubmitDuffelOrder(destination.id, data)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

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
    </Tutorial>
  );
};

export default Reservations;
