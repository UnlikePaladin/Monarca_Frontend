/*Defines a custom React hook called useDestinations that fetches destination data from the /destinations endpoint using React Query. It leverages useQuery to handle asynchronous data fetching, caching, and loading/error states. Once the data is retrieved, it safely transforms the list of Destination objects into a simplified DestinationOption array (containing id and a formatted name like "city, country") for use in UI components such as a Select dropdown. The hook returns the raw destinations array (ensuring it is always an array), the formatted options, and the corresponding loading and error states for easy consumption in components.*/

import { useQuery } from "@tanstack/react-query";
import { getRequest } from "../../utils/apiService";
import { Destination, DestinationOption } from "../../types/destinations";

async function fetchDestinations(): Promise<Destination[]> {
  return getRequest("/destinations");
}

export function useDestinations() {
  const {
    data: destinations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["destinations"],
    queryFn: fetchDestinations,
  });

  // Transform destinations into options format for the Select component
  // Ensure destinations is an array before mapping
  const destinationOptions: DestinationOption[] = Array.isArray(destinations)
    ? destinations.map((dest) => ({
        id: dest.id,
        name: `${dest.city}, ${dest.country}`,
      }))
    : [];

  return {
    destinations: Array.isArray(destinations) ? destinations : [],
    destinationOptions,
    isLoading,
    error,
  };
}
