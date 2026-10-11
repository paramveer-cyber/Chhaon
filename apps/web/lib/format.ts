const metresPerKilometre = 1000;
const distanceRoundingInMetres = 10;
const compassDirections = [
  "north",
  "north-east",
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
];
const degreesPerCompassDirection = 360 / compassDirections.length;

export const formatDistance = (distanceInMetres: number) =>
  distanceInMetres < metresPerKilometre
    ? `${Math.round(distanceInMetres / distanceRoundingInMetres) * distanceRoundingInMetres} m`
    : `${(distanceInMetres / metresPerKilometre).toFixed(1)} km`;

export const compassDirectionFor = (bearingInDegrees: number) =>
  compassDirections[Math.round(bearingInDegrees / degreesPerCompassDirection) % compassDirections.length];

export const formatPeople = (peopleCount: number) => Math.round(peopleCount).toLocaleString("en-IN");

export const formatDegrees = (degreesCelsius: number) => `${Math.round(degreesCelsius)}°C`;

export const formatPercent = (percentValue: number) => `${percentValue.toFixed(1)}%`;

export const formatLongDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export const walkingDirectionsUrlFor = ({ latitude, longitude }: { latitude: number; longitude: number }) =>
  `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${latitude},${longitude}`;
