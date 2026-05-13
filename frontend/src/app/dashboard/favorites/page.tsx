"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

type ViewMode = "grid" | "list";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    const token = localStorage.getItem("bai_token");
    if (!token) return;
    fetch(`${API}/api/v1/favoritos/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then(setFavorites)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const removeFavorite = async (propertyId: number) => {
    const token = localStorage.getItem("bai_token");
    await fetch(`${API}/api/v1/favoritos/${propertyId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setFavorites((prev) => prev.filter((f) => f.imovel_id !== propertyId));
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="h-8 w-40 bg-slate-100 animate-pulse rounded-xl mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Favoritos</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {favorites.length === 0
              ? "Nenhum imóvel salvo ainda."
              : `${favorites.length} imóvel${favorites.length !== 1 ? "is" : ""} salvo${favorites.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* View toggle */}
        {favorites.length > 0 && (
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
              title="Visualização em grade"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
              title="Visualização em lista"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {favorites.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sua lista está vazia</h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">Explore o marketplace e salve os imóveis que combinam com você.</p>
          <Link href="/search" className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm">
            Explorar Imóveis
          </Link>
        </div>
      )}

      {/* Grid view */}
      {viewMode === "grid" && favorites.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((fav) => {
            const im = fav.imovel;
            if (!im) return null;
            return (
              <div key={fav.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative">
                <button
                  onClick={() => removeFavorite(im.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition shadow-sm"
                  title="Remover dos favoritos"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={im.url_imagem || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80"}
                    alt={im.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {im.tipo_oferta && (
                    <span className="absolute bottom-3 left-3 bg-slate-900/70 backdrop-blur text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg">
                      {im.tipo_oferta === "venda" ? "Venda" : im.tipo_oferta === "aluguel" ? "Aluguel" : im.tipo_oferta}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  {(im.bairro || im.cidade) && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                      {[im.bairro, im.cidade].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <h3 className="font-bold text-slate-900 text-sm mb-3 line-clamp-2" title={im.titulo}>{im.titulo}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mb-3">
                    {im.area && <span>{im.area}m²</span>}
                    {im.quartos > 0 && <span>{im.quartos} qts</span>}
                    {im.banheiros > 0 && <span>{im.banheiros} bnh</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-slate-900">{fmt(im.preco)}</span>
                    <Link
                      href={`/properties/${im.id}`}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Ver imóvel →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && favorites.length > 0 && (
        <div className="space-y-3">
          {favorites.map((fav) => {
            const im = fav.imovel;
            if (!im) return null;
            return (
              <div key={fav.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 p-4">
                <div className="w-24 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={im.url_imagem || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80"}
                    alt={im.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {(im.bairro || im.cidade) && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-0.5">
                      {[im.bairro, im.cidade].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <h3 className="font-bold text-slate-900 text-sm truncate" title={im.titulo}>{im.titulo}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mt-1">
                    {im.area && <span>{im.area}m²</span>}
                    {im.quartos > 0 && <span>{im.quartos} qts</span>}
                    {im.banheiros > 0 && <span>{im.banheiros} bnh</span>}
                    {im.tipo_oferta && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md uppercase font-bold text-[9px] text-slate-500">
                        {im.tipo_oferta}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-black text-slate-900">{fmt(im.preco)}</div>
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    <Link
                      href={`/properties/${im.id}`}
                      className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                    >
                      Ver imóvel
                    </Link>
                    <button
                      onClick={() => removeFavorite(im.id)}
                      className="text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                      title="Remover"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
