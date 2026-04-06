"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface PropertyCardProps {
  imovel: any;
  className?: string;
  imageHeight?: string;
}

export default function PropertyCard({ 
  imovel, 
  className = "", 
  imageHeight = "h-52" 
}: PropertyCardProps) {
  const [imgSrc, setImgSrc] = useState(imovel.image_url || "/placeholder-property.jpg");
  const [hasError, setHasError] = useState(false);

  // Fallback robusto para imagens quebradas
  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc("https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80");
    }
  };

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: "BRL", 
      maximumFractionDigits: 0 
    }).format(value);
  };

  return (
    <Link
      href={`/properties/${imovel.id}`}
      className={`group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-soft transition-all duration-300 block ${className}`}
    >
      {/* Imagem Container */}
      <div className={`relative ${imageHeight} overflow-hidden bg-slate-100`}>
        <Image
          src={imgSrc}
          alt={imovel.title}
          fill
          unoptimized={imgSrc.startsWith("http")}
          onError={handleImageError}
          className={`object-cover transition-transform duration-700 ${!hasError ? 'group-hover:scale-110' : ''}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        
        {/* Overlay para suavizar texto alternativo se a imagem falhar antes do fallback */}
        {hasError && (
          <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-[2px] flex items-center justify-center">
             <span className="text-slate-300 text-4xl">🏠</span>
          </div>
        )}
        {/* Right Badges */}
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
          {imovel.views_count > 0 && (
            <div className="bg-slate-900/70 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-white shadow-sm flex items-center gap-1.5 border border-white/10" title={`${imovel.views_count} pessoas visualizaram este imóvel`}>
              <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {imovel.views_count}
            </div>
          )}
          {imovel.source && (
            <div className="bg-slate-900/60 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-sm border border-white/10">
              {imovel.source}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap z-10">
          {imovel.is_star === 1 && (
            <span className="bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1 animate-pulse">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Destaque
            </span>
          )}
          
          <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl shadow-sm">
            Novo
          </span>

          {imovel.listing_type && (
            <span className="bg-white/90 text-slate-700 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl shadow-sm border border-white/20">
              {imovel.listing_type === "venda" ? "Venda" : imovel.listing_type === "aluguel" ? "Aluguel" : "Temporada"}
            </span>
          )}

          {/* Freemium & FSBO Feature */}
          {imovel.owner && imovel.owner.role === "user" && (
            <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl shadow-sm border border-emerald-500">
              🤝 Direto c/ Dono
            </span>
          )}
          {imovel.owner && (imovel.owner.role === "broker" || imovel.owner.role === "agency") && (
            <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl shadow-sm">
              Corretor Parceiro
            </span>
          )}
        </div>

        {/* Area Badge (on image) */}
        {imovel.area && (
          <div className="absolute bottom-4 left-4 z-10">
             <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-slate-900 shadow-sm border border-slate-100">
                {imovel.area}m²
             </div>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        {(imovel.neighborhood || imovel.city) && (
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-600 mb-2 truncate">
            {[imovel.neighborhood, imovel.city].filter(Boolean).join(", ")}
          </p>
        )}
        
        <h3 className="text-lg font-bold text-slate-900 mb-4 line-clamp-2 leading-tight h-12 group-hover:text-blue-600 transition-colors" title={imovel.title}>
          {imovel.title}
        </h3>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-6 pt-4 border-t border-slate-50">
          {imovel.bedrooms != null && (
            <span className="flex items-center gap-1.5">
              <span className="text-base">🛏️</span> {imovel.bedrooms} {imovel.bedrooms === 1 ? "Quarto" : "Quartos"}
            </span>
          )}
          {imovel.bathrooms != null && (
             <span className="flex items-center gap-1.5">
               <span className="text-base">🚿</span> {imovel.bathrooms} {imovel.bathrooms === 1 ? "Banho" : "Banhos"}
             </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {formatBRL(imovel.price)}
          </p>
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
