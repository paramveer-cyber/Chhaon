import { studyAreaBoundingBox } from "../config";

const earthRadiusInMetres = 6371000;

export const metresPerDegreeLatitude = (earthRadiusInMetres * Math.PI) / 180;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export const isInsideStudyArea = ({ latitude, longitude }: Coordinates) =>
  latitude >= studyAreaBoundingBox.southLatitude &&
  latitude <= studyAreaBoundingBox.northLatitude &&
  longitude >= studyAreaBoundingBox.westLongitude &&
  longitude <= studyAreaBoundingBox.eastLongitude;

export const degreesToRadians =(degrees: number) => (degrees * Math.PI) / 180;

export const degreesOfLongitudeForMetres = (metres: number, latitude: number) =>
  metres / (metresPerDegreeLatitude * Math.cos(degreesToRadians(latitude)));

export const distanceInMetres = (firstPoint: Coordinates, secondPoint: Coordinates) => {
  const latitudeDifference = degreesToRadians(secondPoint.latitude - firstPoint.latitude);
  const longitudeDifference = degreesToRadians(secondPoint.longitude - firstPoint.longitude);
  const haversineValue =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(degreesToRadians(firstPoint.latitude)) *
      Math.cos(degreesToRadians(secondPoint.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;
  return 2 * earthRadiusInMetres * Math.asin(Math.sqrt(haversineValue));
};

export const bearingInDegrees = (fromPoint: Coordinates, toPoint: Coordinates) => {
  const longitudeDifference = degreesToRadians(toPoint.longitude - fromPoint.longitude);
  const fromLatitude = degreesToRadians(fromPoint.latitude);
  const toLatitude = degreesToRadians(toPoint.latitude);
  const eastComponent = Math.sin(longitudeDifference) * Math.cos(toLatitude);
  const northComponent =
    Math.cos(fromLatitude) * Math.sin(toLatitude) -
    Math.sin(fromLatitude) * Math.cos(toLatitude) * Math.cos(longitudeDifference);
  return ((Math.atan2(eastComponent, northComponent) * 180) / Math.PI + 360) % 360;
};

export const isWithinRadius = (firstPoint: Coordinates, secondPoint: Coordinates, radiusInMetres: number) => {
  const latitudeLimitInDegrees = radiusInMetres / metresPerDegreeLatitude;
  if (Math.abs(firstPoint.latitude - secondPoint.latitude) > latitudeLimitInDegrees) return false;
  const longitudeLimitInDegrees = degreesOfLongitudeForMetres(radiusInMetres, firstPoint.latitude);
  if (Math.abs(firstPoint.longitude - secondPoint.longitude) > longitudeLimitInDegrees) return false;
  return distanceInMetres(firstPoint, secondPoint) <= radiusInMetres;
};
