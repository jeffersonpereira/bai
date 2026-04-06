"use client";

import React, { useState } from "react";
import FilterSidebar from "./FilterSidebar";

interface SearchLayoutProps {
  initialParams: Record<string, any>;
  locations: Record<string, string[]>;
  children: React.ReactNode;
}

export default function SearchClientWrapper({ initialParams, locations, children }: SearchLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row gap-6 md:gap-8 min-h-screen">
      
      {/* Botão Mobile para abrir filtros */}
      <div className="md:hidden flex items-center justify-between mt-2 sticky top-[72px] z-30 bg-slate-50/80 p-2 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-sm">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-800 font-bold py-3.5 px-6 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all"
        >
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m4.5 12h9.75M10.5 18a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m4.5-6h9.75M8.25 12a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0zm0 0H4.5" />
          </svg>
          Filtrar Resultados
          {Object.keys(initialParams).filter(k => k !== 'page' && k !== 'limit').length > 0 && (
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs ml-1 shadow-sm shadow-blue-200">
              {Object.keys(initialParams).filter(k => k !== 'page' && k !== 'limit').length}
            </span>
          )}
        </button>
      </div>

      <FilterSidebar 
        initialParams={initialParams} 
        locations={locations} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />

      <section className="flex-1 w-full relative z-10">
        {children}
      </section>
    </div>
  );
}
