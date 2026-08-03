/* Minimal Google Maps types for lazy-loaded tracking map. */
declare namespace google.maps {
  class Map {
    constructor(el: HTMLElement, opts: MapOptions);
    fitBounds(bounds: LatLngBounds, padding?: number | Padding): void;
    panTo(latLng: LatLngLiteral | LatLng): void;
    addListener(eventName: string, handler: (event: MapMouseEvent) => void): MapsEventListener;
  }
  class Marker {
    constructor(opts: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(latLng: LatLngLiteral | LatLng): void;
    setTitle(title: string): void;
    setIcon(icon: unknown): void;
    addListener(eventName: string, handler: (event: MapMouseEvent) => void): MapsEventListener;
  }
  class Polyline {
    constructor(opts: PolylineOptions);
    setMap(map: Map | null): void;
  }
  class Polygon {
    constructor(opts: PolygonOptions);
    setMap(map: Map | null): void;
  }
  class Circle {
    constructor(opts: CircleOptions);
    setMap(map: Map | null): void;
    setCenter(center: LatLngLiteral | LatLng): void;
    setRadius(radius: number): void;
  }
  class LatLngBounds {
    extend(point: LatLngLiteral | LatLng): void;
  }
  enum SymbolPath {
    CIRCLE = 0,
    FORWARD_CLOSED_ARROW = 1,
    FORWARD_OPEN_ARROW = 2,
    BACKWARD_CLOSED_ARROW = 3,
    BACKWARD_OPEN_ARROW = 4,
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
    draggable?: boolean;
    label?: string;
  }
  interface PolylineOptions {
    path?: LatLngLiteral[];
    geodesic?: boolean;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    map?: Map;
  }
  interface PolygonOptions {
    map?: Map;
    paths?: LatLngLiteral[] | LatLngLiteral[][];
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    fillColor?: string;
    fillOpacity?: number;
  }
  interface CircleOptions {
    map?: Map;
    center?: LatLngLiteral;
    radius?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    fillColor?: string;
    fillOpacity?: number;
  }
  interface Symbol {
    path: SymbolPath;
    scale?: number;
    rotation?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
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
  interface MapMouseEvent {
    latLng: LatLng | null;
  }
  interface MapsEventListener {
    remove(): void;
  }
  namespace visualization {
    class HeatmapLayer {
      constructor(opts: HeatmapLayerOptions);
      setMap(map: Map | null): void;
    }
    interface HeatmapLayerOptions {
      map?: Map;
      data?: Array<{ location: LatLngLiteral | LatLng; weight: number }>;
      radius?: number;
      gradient?: string[];
    }
  }
}

declare namespace google {
  namespace maps {
    export import Map = google.maps.Map;
    export import Marker = google.maps.Marker;
    export import Polyline = google.maps.Polyline;
    export import Polygon = google.maps.Polygon;
    export import Circle = google.maps.Circle;
    export import LatLngBounds = google.maps.LatLngBounds;
    export import SymbolPath = google.maps.SymbolPath;
    export import LatLngLiteral = google.maps.LatLngLiteral;
    export import MapMouseEvent = google.maps.MapMouseEvent;
    export import MapsEventListener = google.maps.MapsEventListener;
    export import visualization = google.maps.visualization;
  }
}

interface Window {
  google?: typeof google;
}
