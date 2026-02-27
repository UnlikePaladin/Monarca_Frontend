/*
* requests.ts 
*
* This file defines the CreateRequest type, which represents the structure of a 
* request object that is sent in API requests when creating new travel itineraries. 
* This type includes properties such as the origin city ID, title, motive, requirements, 
* priority level, and an array of destination objects.
* The RequestDestination type is imported from the requestDestinations.ts 
* file and represents the structure of each destination included in the request.
*  
* This type is used for type checking in API requests to ensure that the data being sent 
* conforms to the expected structure.
*/

import { RequestDestination } from "./requestDestinations";

export type CreateRequest = {
  id_origin_city: string;
  title: string;
  motive: string;
  requirements?: string;
  priority: "alta" | "media" | "baja";
  requests_destinations: RequestDestination[];
};
