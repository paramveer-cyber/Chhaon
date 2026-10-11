const earthRadiusInMetres = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

type PathPoint = { latitude: number; longitude: number };

/** Length of a walking route, so the distance we show matches the walking time. */
export const routeLengthInMetres = (path: PathPoint[]) => {
  let totalMetres = 0;
  for (let pointIndex = 1; pointIndex < path.length; pointIndex++) {
    const from = path[pointIndex - 1]!;
    const to = path[pointIndex]!;
    const latitudeDelta = toRadians(to.latitude - from.latitude);
    const longitudeDelta = toRadians(to.longitude - from.longitude);
    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
    totalMetres += 2 * earthRadiusInMetres * Math.asin(Math.sqrt(haversine));
  }
  return totalMetres;
};
