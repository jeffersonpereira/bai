"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface PropertyCardProps {
  imovel: any;
  className?: string;
  imageHeight?: string;
}

function isNew(createdAt?: string): boolean {
  if (!createdAt) return false;
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

export default function PropertyCard({
  imovel,
  className = "",
  imageHeight = "h-52"
}: PropertyCardProps) {
  const [imgSrc, setImgSrc] = useState(imovel.image_url || "/placeholder-property.jpg");
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc("https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80");
    }
  };

  const formatBRL = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

  const novel = isNew(imovel.created_at);

  return (
    <Link
      href={`/properties/${imovel.id}`}
      className={`group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 block ${className}`}
    >
      {/* Imagem */}
      <div className={`relative ${imageHeight} overflow-hidden bg-slate-100`}>
        <Image
          src={imgSrc}
          alt={imovel.title}
          fill
          unoptimized={imgSrc.startsWith("http")}
          onError={handleImageError}
          className={`object-cover transition-transform duration-700 ${!hasError ? "group-hover:scale-105" : ""}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient bottom overlay para legibilidade */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />

        {hasError && (
          <div className="absolute inset-0 bg-slate-100/60 backdrop-blur-[2px] flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
        )}

        {/* Badges direita */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
          {imovel.views_count > 0 && (
            <div className="bg-slate-900/70 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
              <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {imovel.views_count}
            </div>
          )}
          {imovel.source && (
            <div className="bg-slate-900/60 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white border border-white/10">
              {imovel.source}
            </div>
          )}
        </div>

        {/* Badges esquerda */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap z-10 max-w-[65%]">
          {imovel.is_star === 1 && (
            <span className="bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              Destaque
            </span>
          )}
          {novel && (
            <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-sm">
              Novo
            </span>
          )}
          {imovel.listing_type && (
            <span className="bg-white/90 text-slate-700 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-sm border border-white/20">
              {imovel.listing_type === "venda" ? "Venda" : imovel.listing_type === "aluguel" ? "Aluguel" : "Temporada"}
            </span>
          )}
          {imovel.owner?.role === "user" && (
            <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-sm">
              Direto c/ Dono
            </span>
          )}
          {(imovel.owner?.role === "broker" || imovel.owner?.role === "agency") && (
            <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-sm">
              Corretor
            </span>
          )}
        </div>

        {/* Area badge sobreposta ao gradiente inferior */}
        {imovel.area && (
          <div className="absolute bottom-3 left-3 z-10">
            <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-900 shadow-sm">
              {imovel.area} m²
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-5">
        {(imovel.neighborhood || imovel.city) && (
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-600 mb-1.5 truncate">
            {[imovel.neighborhood, imovel.city].filter(Boolean).join(", ")}
          </p>
        )}

        <h3
          className="text-base font-bold text-slate-900 mb-4 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors"
          title={imovel.title}
        >
          {imovel.title}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mb-5 pt-3.5 border-t border-slate-100 flex-wrap">
          {imovel.bedrooms != null && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {imovel.bedrooms} {imovel.bedrooms === 1 ? "Quarto" : "Quartos"}
            </span>
          )}
          {imovel.bathrooms != null && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {imovel.bathrooms} {imovel.bathrooms === 1 ? "Banho" : "Banhos"}
            </span>
          )}
          {imovel.garage_spaces != null && imovel.garage_spaces > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              {imovel.garage_spaces} {imovel.garage_spaces === 1 ? "Vaga" : "Vagas"}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Preço</p>
            <p className="text-xl font-black text-slate-900 tracking-tight leading-none">
              {formatBRL(imovel.price)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
