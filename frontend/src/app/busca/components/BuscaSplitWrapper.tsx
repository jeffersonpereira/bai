"use client";

import { useState, useCallback } from "react";
import FilterSidebar from "@/app/search/components/FilterSidebar";
import PropertyCard from "@/app/components/PropertyCard";
import MapViewDynamic from "@/app/components/map/MapViewDynamic";

interface BuscaSplitWrapperProps {
  initialParams: Record<string, any>;
  locations: Record<string, string[]>;
  initialProperties: any[];
  total: number;
}

function parseMapParam(mapStr?: string): { center: [number, number]; zoom: number } {
  if (!mapStr) return { center: [-23.55, -46.63], zoom: 12 };
  const parts = mapStr.split(",").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return { center: [-23.55, -46.63], zoom: 12 };
  return { center: [parts[0], parts[1]], zoom: parts[2] };
}

export default function BuscaSplitWrapper({ initialParams, locations, initialProperties, total }: BuscaSplitWrapperProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "map">("list");
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  const { center: initialCenter, zoom: initialZoom } = parseMapParam(initialParams.map);

  const handleMapMove = useCallback((lat: number, lng: number, zoom: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("map", `${lat.toFixed(6)},${lng.toFixed(6)},${zoom}`);
    window.history.replaceState(null, "", url.toString());
  }, []);

  const handleMarkerClick = useCallback((id: number) => {
    setHighlightedId(id);
    setActiveView("list");
    requestAnimationFrame(() => {
      document.getElementById(`property-card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const mapParamValue = initialParams.map as string | undefined;
  const additionalParams = mapParamValue ? { map: mapParamValue } : undefined;

  const filterCount = Object.keys(initialParams).filter((k) => k !== "page" && k !== "limit" && k !== "map").length;

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 72px)" }}>
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 shrink-0">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
        >
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m4.5 12h9.75M10.5 18a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m4.5-6h9.75M8.25 12a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0zm0 0H4.5" />
          </svg>
          Filtros
          {filterCount > 0 && (
            <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">
              {filterCount}
            </span>
          )}
        </button>

        <span className="text-sm text-slate-400 hidden sm:block">
          {total} {total === 1 ? "imóvel" : "imóveis"}
        </span>

        {/* Mobile List/Map toggle */}
        <div className="md:hidden ml-auto flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveView("list")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeView === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
          >
            Lista
          </button>
          <button
            onClick={() => setActiveView("map")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeView === "map" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
          >
            Mapa
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* List Panel — 40% desktop, full width mobile */}
        <div
          className={`w-full md:w-2/5 overflow-y-auto bg-slate-50 ${activeView === "map" ? "hidden md:block" : "block"}`}
        >
          <div className="p-4 space-y-3">
            {initialProperties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-4xl mb-4">🔍</span>
                <p className="font-bold text-slate-700">Nenhum imóvel encontrado</p>
                <p className="text-sm text-slate-400 mt-1">Ajuste os filtros ou mova o mapa</p>
              </div>
            ) : (
              initialProperties.map((imovel: any) => (
                <div
                  key={imovel.id}
                  id={`property-card-${imovel.id}`}
                  onMouseEnter={() => setHighlightedId(imovel.id)}
                  onMouseLeave={() => setHighlightedId(null)}
                  className={`rounded-3xl transition-all ${highlightedId === imovel.id ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
                >
                  <PropertyCard imovel={imovel} imageHeight="h-40" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map Panel — 60% desktop, full width mobile */}
        <div
          className={`w-full md:w-3/5 ${activeView === "list" ? "hidden md:block" : "block"}`}
        >
          <MapViewDynamic
            initialCenter={initialCenter}
            initialZoom={initialZoom}
            highlightedId={highlightedId}
            onMarkerClick={handleMarkerClick}
            onMapMove={handleMapMove}
          />
        </div>
      </div>

      <FilterSidebar
        initialParams={initialParams}
        locations={locations}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        basePath="/busca"
        additionalParams={additionalParams}
      />
    </div>
  );
}
