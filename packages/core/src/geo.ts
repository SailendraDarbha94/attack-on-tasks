export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;

/** Straight-line distance between two points, in metres. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** "350 m" below a kilometre, "2.4 km" above. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function isValidLatLng(point: LatLng): boolean {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}
