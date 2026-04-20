"use client";

import { Marker, useMap } from "react-leaflet";
import L from "leaflet";

interface ClusterMarkerProps {
  lat: number;
  lng: number;
  count: number;
  expansionZoom: number;
}

function clusterIcon(count: number) {
  const size = count < 10 ? 36 : count < 100 ? 44 : 52;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;
      height:${size}px;
      background:#2563eb;
      color:#fff;
      font-size:13px;
      font-weight:900;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 2px 8px rgba(37,99,235,0.45);
      border:3px solid #fff;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function MarkerCluster({ lat, lng, count, expansionZoom }: ClusterMarkerProps) {
  const map = useMap();

  const handleClick = () => {
    map.flyTo([lat, lng], Math.min(expansionZoom, map.getMaxZoom()), { duration: 0.5 });
  };

  return (
    <Marker
      position={[lat, lng]}
      icon={clusterIcon(count)}
      eventHandlers={{ click: handleClick }}
    />
  );
}
