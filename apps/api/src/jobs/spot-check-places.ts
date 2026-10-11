export type SpotCheckPlaceKind = "park" | "market";

export type SpotCheckPlace = {
  name: string;
  kind: SpotCheckPlaceKind;
  latitude: number;
  longitude: number;
};

export const spotCheckPlaces: SpotCheckPlace[] = [
  { name: "Lodhi Garden", kind: "park", latitude: 28.5931, longitude: 77.2197 },
  { name: "Nehru Park", kind: "park", latitude: 28.5953, longitude: 77.1862 },
  { name: "Deer Park Hauz Khas", kind: "park", latitude: 28.5494, longitude: 77.2001 },
  { name: "Sunder Nursery", kind: "park", latitude: 28.5932, longitude: 77.2441 },
  { name: "Garden of Five Senses", kind: "park", latitude: 28.512, longitude: 77.199 },
  { name: "Buddha Jayanti Park", kind: "park", latitude: 28.624, longitude: 77.185 },
  { name: "Roshanara Bagh", kind: "park", latitude: 28.6694, longitude: 77.2012 },
  { name: "Talkatora Garden", kind: "park", latitude: 28.6372, longitude: 77.2023 },
  { name: "India Gate Lawns", kind: "park", latitude: 28.6129, longitude: 77.2295 },
  { name: "Mehrauli Archaeological Park", kind: "park", latitude: 28.5195, longitude: 77.184 },
  { name: "Chandni Chowk", kind: "market", latitude: 28.6506, longitude: 77.2303 },
  { name: "Sarojini Nagar Market", kind: "market", latitude: 28.5758, longitude: 77.1983 },
  { name: "Lajpat Nagar Central Market", kind: "market", latitude: 28.5677, longitude: 77.2433 },
  { name: "Karol Bagh", kind: "market", latitude: 28.6519, longitude: 77.1907 },
  { name: "Sadar Bazar", kind: "market", latitude: 28.6623, longitude: 77.2123 },
  { name: "Nehru Place", kind: "market", latitude: 28.5491, longitude: 77.253 },
  { name: "Paharganj", kind: "market", latitude: 28.643, longitude: 77.2138 },
  { name: "Gandhi Nagar Market", kind: "market", latitude: 28.656, longitude: 77.265 },
  { name: "Kamla Nagar Market", kind: "market", latitude: 28.683, longitude: 77.205 },
  { name: "Azadpur Mandi", kind: "market", latitude: 28.707, longitude: 77.17 },
];
