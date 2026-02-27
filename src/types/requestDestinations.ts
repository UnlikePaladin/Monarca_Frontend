/*Defines a TypeScript type called RequestDestination, which represents the structure of a destination associated with a travel request. It includes identifiers such as id_destination, ordering information (destination_order), and trip details like stay_days, arrival_date, and departure_date in ISO-8601 format. It also specifies boolean flags to indicate whether hotel or plane bookings are required and whether it is the final destination in the itinerary. An optional details field allows for additional notes or specific information related to that destination.*/

export type RequestDestination = {
  id_destination: string;
  destination_order: number;
  stay_days: number;
  arrival_date: string; // ISO-8601
  departure_date: string; // ISO-8601
  is_hotel_required: boolean;
  is_plane_required: boolean;
  is_last_destination: boolean;
  details?: string;
};
