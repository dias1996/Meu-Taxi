import React, { useEffect, useState, useRef } from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';

export interface PracaLocation {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  naFila: number;
  noCais: number;
  minEspera: string;
  status: 'Operacional' | 'Movimento Intenso' | 'Moderado' | 'Fila Rápida' | 'Fila Curta';
  corridor: string;
  destinations: string[];
  taxaKz?: number;
}

export const LUANDA_PRACAS: PracaLocation[] = [
  {
    id: 'kilamba',
    name: 'Praça do Kilamba',
    subtitle: 'Bloco W • Terminal Sul',
    lat: -8.9986,
    lng: 13.2683,
    naFila: 23,
    noCais: 18,
    minEspera: '15-25',
    status: 'Operacional',
    corridor: 'Via Expressa',
    destinations: ['Mutamba', 'Viana', 'Benfica', 'São Paulo'],
    taxaKz: 200,
  },
  {
    id: 'cacuaco',
    name: 'Praça do Cacuaco',
    subtitle: 'Vila de Cacuaco • Eixo Norte',
    lat: -8.7811,
    lng: 13.3712,
    naFila: 22,
    noCais: 12,
    minEspera: '10-15',
    status: 'Operacional',
    corridor: 'Estrada de Cacuaco / EN 100',
    destinations: ['São Paulo', 'Mutamba', 'Viana'],
    taxaKz: 300,
  },
  {
    id: 'viana',
    name: 'Praça de Viana',
    subtitle: 'Paragem da Ponte • Via Expressa',
    lat: -8.9036,
    lng: 13.3688,
    naFila: 35,
    noCais: 24,
    minEspera: '10-15',
    status: 'Operacional',
    corridor: 'Estrada de Catete',
    destinations: ['Kilamba', 'Mutamba', 'Cuca', 'São Paulo'],
    taxaKz: 200,
  },
  {
    id: 'mutamba',
    name: 'Praça da Mutamba',
    subtitle: 'Largo do Ambiente • Baixa',
    lat: -8.8147,
    lng: 13.2302,
    naFila: 12,
    noCais: 3,
    minEspera: '~30',
    status: 'Movimento Intenso',
    corridor: 'Baixa de Luanda',
    destinations: ['Kilamba', 'Benfica', 'Talatona', 'Viana'],
    taxaKz: 200,
  },
  {
    id: 'benfica',
    name: 'Praça do Benfica',
    subtitle: 'Rotunda do Mercado • Zona Verde',
    lat: -8.9389,
    lng: 13.1806,
    naFila: 19,
    noCais: 11,
    minEspera: '12-18',
    status: 'Operacional',
    corridor: 'EN 100 / Via Expressa',
    destinations: ['São Paulo', 'Mutamba', 'Kilamba', 'Talatona'],
    taxaKz: 250,
  },
  {
    id: 'talatona',
    name: 'Praça de Talatona',
    subtitle: 'Rotunda do Camama • Despacho Sul',
    lat: -8.9167,
    lng: 13.1950,
    naFila: 14,
    noCais: 9,
    minEspera: '10-12',
    status: 'Operacional',
    corridor: 'Avenida Pedro de Castro Van-Dúnem Loy',
    destinations: ['Mutamba', 'Viana', 'Benfica', 'Kilamba'],
    taxaKz: 200,
  },
  {
    id: 'saopaulo',
    name: 'Praça de São Paulo',
    subtitle: 'Largo do Mercado • Sambizanga',
    lat: -8.8112,
    lng: 13.2519,
    naFila: 28,
    noCais: 14,
    minEspera: '15-20',
    status: 'Movimento Intenso',
    corridor: 'Eixo Norte-Centro',
    destinations: ['Benfica', 'Viana', 'Cacuaco', 'Kilamba'],
    taxaKz: 200,
  }
];

interface RoutePolylineProps {
  origin: { lat: number; lng: number } | string;
  destination: { lat: number; lng: number } | string;
  onRouteCalculated?: (details: { distanceKm: string; durationMin: number }) => void;
}

export function RoutePolyline({ origin, destination, onRouteCalculated }: RoutePolylineProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const request = {
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    };

    (routesLib.Route as any)
      .computeRoutes(request)
      .then(({ routes }: { routes: any[] }) => {
        if (!routes || routes.length === 0) return;
        const primaryRoute = routes[0];

        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline: any) => {
          polyline.setOptions({
            strokeColor: '#fea619',
            strokeWeight: 5,
            strokeOpacity: 0.95,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }

        if (onRouteCalculated) {
          const distKm = ((primaryRoute.distanceMeters ?? 28000) / 1000).toFixed(1);
          const durMin = Math.round((primaryRoute.durationMillis ?? 1800000) / 60000);
          onRouteCalculated({ distanceKm: distKm, durationMin: durMin });
        }
      })
      .catch((err: any) => {
        const msg = String(err?.message || err);
        if (msg.includes('OVER_QUERY_LIMIT') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin, destination]);

  return null;
}

interface LiveMapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  userLocation: { lat: number; lng: number } | null;
  selectedPraca?: PracaLocation | null;
  onSelectPraca?: (praca: PracaLocation) => void;
  showRouteFrom?: { lat: number; lng: number };
  showRouteTo?: { lat: number; lng: number };
  movingTaxiPos?: { lat: number; lng: number } | null;
  heightClass?: string;
  interactive?: boolean;
  onRouteCalculated?: (details: { distanceKm: string; durationMin: number }) => void;
}

export function LiveMapView({
  center = { lat: -8.9186, lng: 13.2583 },
  zoom = 11,
  userLocation,
  selectedPraca,
  onSelectPraca,
  showRouteFrom,
  showRouteTo,
  movingTaxiPos,
  heightClass = 'h-48',
  interactive = true,
  onRouteCalculated,
}: LiveMapViewProps) {
  const [activeInfoPraca, setActiveInfoPraca] = useState<PracaLocation | null>(null);

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden shadow-sm bg-surface-container-high`}>
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling={interactive ? 'greedy' : 'none'}
        disableDefaultUI={!interactive}
        zoomControl={interactive}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="w-full h-full"
      >
        {/* Render all Luanda Praças */}
        {LUANDA_PRACAS.map((praca) => {
          const isSelected = selectedPraca?.id === praca.id;
          return (
            <AdvancedMarker
              key={praca.id}
              position={{ lat: praca.lat, lng: praca.lng }}
              title={praca.name}
              onClick={() => {
                setActiveInfoPraca(praca);
                if (onSelectPraca) onSelectPraca(praca);
              }}
            >
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full shadow-md border transition-transform ${
                  isSelected
                    ? 'bg-secondary-container text-on-secondary-fixed border-primary scale-110 font-bold z-20'
                    : 'bg-primary text-on-primary border-surface-container-lowest hover:scale-105'
                }`}
              >
                <span className="material-symbols-outlined text-[15px] text-secondary-container">
                  local_taxi
                </span>
                <span className="text-[11px] font-label-sm whitespace-nowrap">
                  {praca.name.replace('Praça do ', '').replace('Praça da ', '').replace('Praça de ', '')} ({praca.naFila})
                </span>
              </div>
            </AdvancedMarker>
          );
        })}

        {/* User Live Geolocation Marker */}
        {userLocation && (
          <AdvancedMarker
            position={userLocation}
            title="Sua Localização GPS em Tempo Real"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-emerald-500/40 animate-ping" />
              <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md" />
            </div>
          </AdvancedMarker>
        )}

        {/* Moving Taxi Simulation Marker (for Active Boarding / Trip) */}
        {movingTaxiPos && (
          <AdvancedMarker
            position={movingTaxiPos}
            title="Viatura LD-44-21-GP em Movimento"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute w-10 h-10 rounded-full bg-secondary-container/50 animate-ping" />
              <div className="w-8 h-8 rounded-full bg-secondary-container text-primary border-2 border-primary flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-[18px]">airport_shuttle</span>
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* Active InfoWindow when a Praça is clicked */}
        {activeInfoPraca && (
          <InfoWindow
            position={{ lat: activeInfoPraca.lat, lng: activeInfoPraca.lng }}
            onCloseClick={() => setActiveInfoPraca(null)}
            maxWidth={220}
          >
            <div className="p-1 text-on-surface font-body-sm">
              <div className="font-title-lg text-primary font-bold text-sm">
                {activeInfoPraca.name}
              </div>
              <div className="text-xs text-on-surface-variant mb-1.5">
                {activeInfoPraca.subtitle}
              </div>
              <div className="flex items-center justify-between text-xs bg-surface-container-low p-1.5 rounded font-semibold">
                <span>Fila: {activeInfoPraca.naFila} táxis</span>
                <span className="text-secondary">~{activeInfoPraca.minEspera} min</span>
              </div>
            </div>
          </InfoWindow>
        )}

        {/* Route Calculation */}
        {showRouteFrom && showRouteTo && (
          <RoutePolyline
            origin={showRouteFrom}
            destination={showRouteTo}
            onRouteCalculated={onRouteCalculated}
          />
        )}
      </Map>
    </div>
  );
}
