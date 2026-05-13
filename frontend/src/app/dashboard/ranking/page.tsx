"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

const PERIOD_OPTIONS = [
  { label: "Mais Vistos", sort: "views" },
  { label: "Maior Preço", sort: "price_desc" },
  { label: "Menor Preço", sort: "price_asc" },
  { label: "Mais Recentes", sort: "recent" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
];

function fmtPrice(v: number) {
  return v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

const MEDAL: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

export default function RankingPage() {
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("views");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort, limit: "20" });
    if (propertyType) params.set("property_type", propertyType);
    if (listingType) params.set("listing_type", listingType);

    fetch(`${API}/api/v1/imoveis/?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((data) => setImoveis(data.items ?? []))
      .finally(() => setLoading(false));
  }, [sort, propertyType, listingType]);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Ranking de Imóveis</h1>
        <p className="text-slate-500 text-sm mt-1">Acompanhe os imóveis mais destacados da plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Sort tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.sort}
              onClick={() => setSort(opt.sort)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                sort === opt.sort
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Property type filter */}
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Listing type filter */}
        <select
          value={listingType}
          onChange={(e) => setListingType(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Venda + Aluguel</option>
          <option value="venda">Venda</option>
          <option value="aluguel">Aluguel</option>
          <option value="temporada">Temporada</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : imoveis.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg font-semibold">Nenhum imóvel encontrado</p>
          <p className="text-sm mt-1">Tente ajustar os filtros</p>
        </div>
      ) : (
        <div className="space-y-3">
          {imoveis.map((imovel, index) => (
            <Link
              key={imovel.id}
              href={`/properties/${imovel.id}`}
              className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 hover:border-blue-200 hover:shadow-sm transition-all group"
            >
              {/* Rank */}
              <div className="w-10 text-center shrink-0">
                {index < 3 ? (
                  <span className="text-2xl">{MEDAL[index]}</span>
                ) : (
                  <span className="text-lg font-black text-slate-300">#{index + 1}</span>
                )}
              </div>

              {/* Image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                {imovel.image_url ? (
                  <img src={imovel.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                  {imovel.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {imovel.neighborhood && `${imovel.neighborhood}, `}{imovel.city}
                  {imovel.property_type && (
                    <span className="ml-2 capitalize bg-slate-100 px-2 py-0.5 rounded-full">
                      {imovel.property_type}
                    </span>
                  )}
                </p>
              </div>

              {/* Stats */}
              <div className="text-right shrink-0 space-y-1">
                <p className="font-black text-slate-900 text-sm">
                  {fmtPrice(imovel.price ?? imovel.valor_aluguel)}
                </p>
                {sort === "views" && imovel.total_visualizacoes > 0 && (
                  <p className="text-xs text-slate-400 flex items-center justify-end gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {imovel.total_visualizacoes.toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
