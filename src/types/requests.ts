/*Defines a TypeScript type called CreateRequest, which represents the structure of a travel request to be created in the system. It includes general information such as the origin city ID (id_origin_city), a title, a motive, optional requirements, and a priority level restricted to "alta", "media", or "baja". Additionally, it contains an array of RequestDestination objects (requests_destinations), allowing the request to include multiple destinations with detailed itinerary and booking information. */

import { RequestDestination } from "./requestDestinations";

export type CreateRequest = {
  id_origin_city: string;
  title: string;
  motive: string;
  requirements?: string;
  priority: "alta" | "media" | "baja";
  requests_destinations: RequestDestination[];
};
