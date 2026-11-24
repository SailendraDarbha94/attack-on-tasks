import type { LatLng } from '@nukkad/core';
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

type Located = { coords: LatLng; error: null } | { coords: null; error: string };

/** Where the phone is right now, asking for permission first. Never throws. */
async function currentCoords(): Promise<Located> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      return { coords: null, error: 'Location access is off. Turn it on in settings, or choose your area below.' };
    }
    const position = await Location.getCurrentPositionAsync({});
    return { coords: { lat: position.coords.latitude, lng: position.coords.longitude }, error: null };
  } catch {
    return { coords: null, error: 'Could not find your location. Choose your area below instead.' };
  }
}

/** One-shot "where am I", with the permission prompt and the failure messages handled. */
export function useCurrentLocation() {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Resolves with the position, or null after setting `error`. */
  const locate = useCallback(async (): Promise<LatLng | null> => {
    setLocating(true);
    setError(null);
    const found = await currentCoords();
    setError(found.error);
    setLocating(false);
    return found.coords;
  }, []);

  return { locate, locating, error };
}
