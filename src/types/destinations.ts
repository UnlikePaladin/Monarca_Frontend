/*
* destinations.ts 
*
* This file defines interfaces and types related to travel destinations for use in 
* type checking for API responses and other parts of the application that deal with destination data.
*/

export interface Destination {
  id: string;
  country: string;
  city: string;
}

export type DestinationOption = {
  id: string;
  name: string;
};
