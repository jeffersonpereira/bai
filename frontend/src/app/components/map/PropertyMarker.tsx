"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Image from "next/image";
import Link from "next/link";

interface PropertyMapItem {
  id: number;
  lat: number;
  lng: number;
  price: number;
  type?: string | null;
  thumbnail_url?: string | null;
  slug?: string | null;
}

const propertyIcon = L.divIcon({
  className: "",
  html: `<div style="
    background:#2563eb;
    color:#fff;
    font-size:11px;
    font-weight:800;
    padding:4px 8px;
    border-radius:20px;
    white-space:nowrap;
    box-shadow:0 2px 8px rgba(0,0,0,0.25);
    border:2px solid #fff;
  ">R$</div>`,
  iconAnchor: [20, 16],
});

function makePriceIcon(price: number, highlighted = false) {
  const label = new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 0,
    style: "currency",
    currency: "BRL",
  }).format(price);
  const bg = highlighted ? "#f59e0b" : "#2563eb";
  const scale = highlighted ? "transform:scale(1.18);transform-origin:center bottom;" : "";
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${bg};
      color:#fff;
      font-size:11px;
      font-weight:800;
      padding:4px 8px;
      border-radius:20px;
      white-space:nowrap;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
      border:2px solid #fff;
      ${scale}
    ">${label}</div>`,
    iconAnchor: [28, 16],
  });
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

interface PropertyMarkerProps {
  item: PropertyMapItem;
  isHighlighted?: boolean;
  onMarkerClick?: (id: number) => void;
}

export default function PropertyMarker({ item, isHighlighted = false, onMarkerClick }: PropertyMarkerProps) {
  const icon = makePriceIcon(item.price, isHighlighted);

  return (
    <Marker
      position={[item.lat, item.lng]}
      icon={icon}
      eventHandlers={{ click: () => onMarkerClick?.(item.id) }}
    >
      <Popup>
        <div className="w-44">
          {item.thumbnail_url ? (
            <div className="relative h-24 rounded-lg overflow-hidden mb-2">
              <Image
                src={item.thumbnail_url}
                alt="Imóvel"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-16 bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-slate-300 text-2xl">
              🏠
            </div>
          )}
          <p className="font-black text-slate-900 text-base leading-tight mb-2">
            {formatBRL(item.price)}
          </p>
          {item.type && (
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-2">
              {item.type}
            </p>
          )}
          <Link
            href={`/properties/${item.slug ?? item.id}`}
            className="block text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition"
          >
            Ver detalhes
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
