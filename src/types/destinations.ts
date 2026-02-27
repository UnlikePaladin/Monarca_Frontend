/*Defines TypeScript types for handling destination data within the application. The Destination interface represents the full structure of a destination object, including its id, country, and city. The DestinationOption type defines a simplified version of that data, containing only an id and a formatted name string, typically used for UI components like dropdowns or select inputs. This separation allows the application to maintain a clear distinction between raw API data and UI-friendly formatted data.*/

export interface Destination {
  id: string;
  country: string;
  city: string;
}

export type DestinationOption = {
  id: string;
  name: string;
};
