import { Linking } from 'react-native';

export const MADISON_CENTER = { lat: 43.0753, lng: -89.3962 };

export async function geocodePlaceQuery(
  query: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> {
  if (!apiKey?.trim()) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    query
  )}&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    status: string;
    results?: { geometry: { location: { lat: number; lng: number } } }[];
  };
  if (data.status !== 'OK' || !data.results?.[0]) return null;
  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

export function openGoogleDirections(
  dest: { lat: number; lng: number },
  origin: { lat: number; lng: number } | null
): void {
  const d = `${dest.lat},${dest.lng}`;
  const url = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${d}`
    : `https://www.google.com/maps/dir/?api=1&destination=${d}`;
  Linking.openURL(url);
}
