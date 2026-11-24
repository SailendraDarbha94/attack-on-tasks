import type { LatLng } from './geo';

export type Locality = LatLng & { id: string; name: string; pincode: string };

/**
 * Neighbourhoods a customer can pick when they do not share their location.
 * The point is the middle of the area, close enough to choose a store by.
 */
export const LOCALITIES: readonly Locality[] = [
  { id: 'jayanagar', name: 'Jayanagar', pincode: '560041', lat: 12.9299, lng: 77.5826 },
  { id: 'jp-nagar', name: 'JP Nagar', pincode: '560078', lat: 12.9063, lng: 77.5857 },
  { id: 'basavanagudi', name: 'Basavanagudi', pincode: '560004', lat: 12.9416, lng: 77.5712 },
  { id: 'banashankari', name: 'Banashankari', pincode: '560070', lat: 12.9255, lng: 77.5468 },
  { id: 'btm-layout', name: 'BTM Layout', pincode: '560076', lat: 12.9166, lng: 77.6101 },
  { id: 'koramangala', name: 'Koramangala', pincode: '560034', lat: 12.9352, lng: 77.6245 },
  { id: 'indiranagar', name: 'Indiranagar', pincode: '560038', lat: 12.9719, lng: 77.6412 },
  { id: 'domlur', name: 'Domlur', pincode: '560071', lat: 12.9609, lng: 77.6387 },
  { id: 'ulsoor', name: 'Ulsoor', pincode: '560008', lat: 12.9817, lng: 77.6286 },
  { id: 'hsr-layout', name: 'HSR Layout', pincode: '560102', lat: 12.9116, lng: 77.6474 },
  { id: 'whitefield', name: 'Whitefield', pincode: '560066', lat: 12.9698, lng: 77.75 },
  { id: 'yelahanka', name: 'Yelahanka', pincode: '560064', lat: 13.1005, lng: 77.5963 },
];
