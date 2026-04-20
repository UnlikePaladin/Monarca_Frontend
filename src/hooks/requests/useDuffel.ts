// src/hooks/requests/useDuffel.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "../../utils/apiService";
import { 
  CreateOfferRequestPayload, 
  CreateDuffelOrderPayload,
  DuffelOrderResponse 
} from "../../types/duffel";

export function useDuffel() {
  const queryClient = useQueryClient();
  const DUFFEL_TIMEOUT_MS = 30000;

  // 1. Crear solicitud de ofertas (Inicia búsqueda en Duffel)
  const createOfferRequest = useMutation({
    mutationFn: (payload: CreateOfferRequestPayload) => 
      postRequest("/travel-integrations/duffel/offer-requests", payload as unknown as Record<string, unknown>, {
        timeout: DUFFEL_TIMEOUT_MS,
      }),
  });

  // 2. Obtener lista de ofertas para una búsqueda específica
  const useListOffers = (offerRequestId: string | null) => useQuery({
    queryKey: ["duffel-offers", offerRequestId],
    queryFn: () => getRequest(`/travel-integrations/duffel/offers?offerRequestId=${offerRequestId}`),
    enabled: !!offerRequestId,
    refetchOnWindowFocus: false,
  });

  // 3. Crear la Orden (Reserva final)
  // Este es el paso crítico que consume el nuevo ReservationsService.createReservation del back
  const createOrder = useMutation({
    mutationFn: (payload: CreateDuffelOrderPayload): Promise<DuffelOrderResponse> => 
      postRequest("/travel-integrations/duffel/orders", payload as unknown as Record<string, unknown>, {
        timeout: DUFFEL_TIMEOUT_MS,
      }),
    onSuccess: (data) => {
      // Invalidamos para que las vistas de reservaciones muestren el nuevo registro
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      console.log("Reserva de Duffel creada con éxito:", data);
    },
  });

  return {
    createOfferRequest,
    useListOffers,
    createOrder
  };
}