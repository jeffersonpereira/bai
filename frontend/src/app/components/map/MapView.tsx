"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import Supercluster from "supercluster";
import type { BBox } from "geojson";
import type { PointFeature } from "supercluster";
import PropertyMarker from "./PropertyMarker";
import MarkerCluster from "./MarkerCluster";
import { apiUrl } from "@/lib/api";

interface PropertyMapItem {
  id: number;
  lat: number;
  lng: number;
  price: number;
  type?: string | null;
  thumbnail_url?: string | null;
  slug?: string | null;
}

interface MapPoint {
  propertyId: number;
  item: PropertyMapItem;
}

const SAO_PAULO: [number, number] = [-23.55, -46.63];
const DEBOUNCE_MS = 400;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

interface ViewState {
  south: number;
  west: number;
  north: number;
  east: number;
  zoom: number;
}

function MapEventHandler({
  onViewChange,
}: {
  onViewChange: (v: ViewState) => void;
}) {
  const map = useMapEvents({
    moveend() {
      const b = map.getBounds();
      onViewChange({
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
        zoom: map.getZoom(),
      });
    },
    zoomend() {
      const b = map.getBounds();
      onViewChange({
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
        zoom: map.getZoom(),
      });
    },
  });
  return null;
}

export default function MapView() {
  const [viewState, setViewState] = useState<ViewState | null>(null);
  const debouncedView = useDebounce(viewState, DEBOUNCE_MS);
  const [properties, setProperties] = useState<PropertyMapItem[]>([]);
  const [clusters, setClusters] = useState<
    Array<
      | { type: "cluster"; lat: number; lng: number; count: number; expansionZoom: number; key: string }
      | { type: "point"; item: PropertyMapItem; key: string }
    >
  >([]);
  const superclusterRef = useRef<Supercluster<MapPoint>>(new Supercluster({ radius: 60, maxZoom: 17 }));

  useEffect(() => {
    if (!debouncedView) return;
    const { south, west, north, east } = debouncedView;
    const bbox = `${south},${west},${north},${east}`;
    fetch(apiUrl(`/api/v1/properties/map?bbox=${bbox}`))
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PropertyMapItem[]) => {
        const valid = data.filter((p) => p.lat != null && p.lng != null);
        setProperties(valid);
      })
      .catch(() => {});
  }, [debouncedView]);

  useEffect(() => {
    if (!debouncedView) return;
    const index = superclusterRef.current;
    const points: PointFeature<MapPoint>[] = properties.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { propertyId: p.id, item: p },
    }));
    index.load(points);
    const bbox: BBox = [
      debouncedView.west,
      debouncedView.south,
      debouncedView.east,
      debouncedView.north,
    ];
    const rawClusters = index.getClusters(bbox, debouncedView.zoom);
    setClusters(
      rawClusters.map((c) => {
        const [lng, lat] = c.geometry.coordinates;
        const props = c.properties as (MapPoint & { cluster?: boolean; point_count?: number; cluster_id?: number });
        if (props.cluster) {
          return {
            type: "cluster" as const,
            lat,
            lng,
            count: props.point_count ?? 0,
            expansionZoom: index.getClusterExpansionZoom(props.cluster_id!),
            key: `cluster-${props.cluster_id}`,
          };
        }
        return {
          type: "point" as const,
          item: props.item,
          key: `point-${props.propertyId}`,
        };
      })
    );
  }, [properties, debouncedView]);

  const handleViewChange = useCallback((v: ViewState) => setViewState(v), []);

  return (
    <MapContainer
      center={SAO_PAULO}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventHandler onViewChange={handleViewChange} />
      {clusters.map((c) =>
        c.type === "cluster" ? (
          <MarkerCluster
            key={c.key}
            lat={c.lat}
            lng={c.lng}
            count={c.count}
            expansionZoom={c.expansionZoom}
          />
        ) : (
          <PropertyMarker key={c.key} item={c.item} />
        )
      )}
    </MapContainer>
  );
}
