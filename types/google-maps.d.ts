/* Minimal Google Maps types for lazy-loaded tracking map. */
declare namespace google.maps {
  class Map {
    constructor(el: HTMLElement, opts: MapOptions);
    fitBounds(bounds: LatLngBounds, padding?: number | Padding): void;
  }
  class Marker {
    constructor(opts: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(latLng: LatLngLiteral | LatLng): void;
  }
  class Polyline {
    constructor(opts: PolylineOptions);
    setMap(map: Map | null): void;
  }
  class LatLngBounds {
    extend(point: LatLngLiteral | LatLng): void;
  }
  enum SymbolPath {
    CIRCLE = 0,
  }
  interface MapOptions {
    center?: LatLngLiteral;
    zoom?: number;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
  }
  interface MarkerOptions {
    map?: Map;
    position?: LatLngLiteral;
    title?: string;
    icon?: unknown;
  }
  interface PolylineOptions {
    path?: LatLngLiteral[];
    geodesic?: boolean;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    map?: Map;
  }
  interface LatLngLiteral {
    lat: number;
    lng: number;
  }
  interface LatLng {
    lat(): number;
    lng(): number;
  }
  interface Padding {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  }
}

declare namespace google {
  namespace maps {
    export import Map = google.maps.Map;
    export import Marker = google.maps.Marker;
    export import Polyline = google.maps.Polyline;
    export import LatLngBounds = google.maps.LatLngBounds;
    export import SymbolPath = google.maps.SymbolPath;
    export import LatLngLiteral = google.maps.LatLngLiteral;
  }
}

interface Window {
  google?: typeof google;
}
