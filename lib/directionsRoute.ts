/**
 * Google Directions API: driving route + decoded polyline for react-native-maps.
 * Uses EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (Directions API must be enabled in Cloud Console).
 */

export type RouteStep = {
  instruction: string;
  distanceText: string;
  durationText: string;
};

export type DrivingRouteResult = {
  coordinates: { latitude: number; longitude: number }[];
  steps: RouteStep[];
};

export function decodeGooglePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export async function fetchDrivingRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  apiKey: string
): Promise<DrivingRouteResult | null> {
  if (!apiKey) return null;
  const o = `${origin.latitude},${origin.longitude}`;
  const d = `${destination.latitude},${destination.longitude}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    o
  )}&destination=${encodeURIComponent(d)}&mode=driving&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url);
  const data = (await res.json()) as {
    status: string;
    routes?: {
      overview_polyline: { points: string };
      legs: {
        steps: {
          html_instructions: string;
          distance: { text: string };
          duration: { text: string };
        }[];
      }[];
    }[];
  };

  if (data.status !== 'OK' || !data.routes?.[0]) {
    return null;
  }

  const route = data.routes[0];
  const encoded = route.overview_polyline?.points;
  if (!encoded) return null;

  const coordinates = decodeGooglePolyline(encoded);
  const steps: RouteStep[] = [];
  for (const leg of route.legs ?? []) {
    for (const step of leg.steps ?? []) {
      steps.push({
        instruction: stripHtml(step.html_instructions),
        distanceText: step.distance?.text ?? '',
        durationText: step.duration?.text ?? '',
      });
    }
  }

  return { coordinates, steps };
}
