/*
* requestDestinations.ts 
*
* This file defines the RequestDestination type, which 
* represents the structure of a destination object that is sent in API 
* requests when creating or updating travel itineraries. This type includes properties such as the
* destination ID, order, stay duration, arrival and departure dates, and flags for 
* hotel and plane requirements. Used for type checking in API requests to ensure that the data being sent 
* conforms to the expected structure.
*/

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
