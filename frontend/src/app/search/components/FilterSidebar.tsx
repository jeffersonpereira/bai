"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import RegionTagsInput from "../../components/RegionTagsInput";
import CurrencyInput from "../../components/ui/CurrencyInput";
import NumberMaskInput from "../../components/ui/NumberMaskInput";

interface FilterSidebarProps {
  initialParams: Record<string, any>;
  locations: Record<string, string[]>;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
  basePath?: string;
  additionalParams?: Record<string, string>;
}

export default function FilterSidebar({ initialParams, locations, isMobileOpen, setIsMobileOpen, basePath = "/search", additionalParams }: FilterSidebarProps) {
  const router = useRouter();

  // Local copy of params to allow users to play with inputs before applying
  const [params, setParams] = useState<Record<string, any>>(initialParams);
  
  // Sync if URL changes outside (like Active Chips removal)
  useEffect(() => {
    setParams(initialParams);
  }, [initialParams]);

  // Handle radio/select/inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const isChecked = (e.target as HTMLInputElement).checked;
      const currentList = Array.isArray(params[name]) 
        ? params[name] 
        : (params[name] ? [params[name]] : []);
      
      let newList;
      if (isChecked) {
        newList = [...currentList, value];
      } else {
        newList = currentList.filter((v: string) => v !== value);
      }
      setParams({ ...params, [name]: newList });
    } else {
      setParams({ ...params, [name]: value });
    }
  };

  // Dedicated handlers for custom inputs
  const handleCustomChange = (name: string, value: any) => {
    setParams(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, val]) => {
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach(v => query.append(key, v));
      } else {
        // Reset page to 1 on fresh search filter
        if (key === 'page') {
           query.append('page', '1');
        } else {
           query.append(key, String(val));
        }
      }
    });

    if (!params.page || !Object.keys(params).includes('page')) {
       query.set('page', '1');
    }

    if (additionalParams) {
      Object.entries(additionalParams).forEach(([k, v]) => query.set(k, v));
    }

    router.push(`${basePath}?${query.toString()}`);
    setIsMobileOpen(false);
  };

  const handleClear = () => {
    setParams({});
    router.push(basePath);
    setIsMobileOpen(false);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity md:hidden ${isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:relative md:inset-auto md:w-80 md:-translate-x-0 md:bg-transparent md:shadow-none md:z-10 shrink-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        
        {/* Mobile Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 md:hidden">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m4.5 12h9.75M10.5 18a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m4.5-6h9.75M8.25 12a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0zm0 0H4.5" />
            </svg>
            Filtros
          </h2>
          <button onClick={() => setIsMobileOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-white p-6 md:p-8 md:rounded-3xl md:shadow-sm md:border md:border-slate-100 md:sticky md:top-24 h-[calc(100vh-80px)] md:h-auto md:max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
          <h2 className="text-xl font-extrabold mb-6 items-center gap-2 hidden md:flex text-slate-900">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m4.5 12h9.75M10.5 18a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m4.5-6h9.75M8.25 12a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0zm0 0H4.5" />
            </svg>
            Filtros
          </h2>

          <form className="space-y-7 text-sm" onSubmit={handleApply}>
            {/* Localização */}
            <fieldset className="space-y-4">
              <legend className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Localização</legend>
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5 text-[11px] uppercase tracking-wider">Cidade</label>
                <div className="relative">
                  <select name="city" value={params.city || ""} onChange={handleChange} className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none text-slate-900 font-medium">
                    <option value="">Qualquer cidade...</option>
                    {Object.keys(locations).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <svg className="w-4 h-4 text-slate-400 absolute right-4 top-[14px] pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5 text-[11px] uppercase tracking-wider">Bairro(s)</label>
                <RegionTagsInput 
                  name="neighborhood" 
                  value={params.neighborhood || ""} 
                  onChange={(val: string) => handleCustomChange('neighborhood', val)}
                  placeholder="Ex: Moema, Pinheiros" 
                  suggestions={params.city ? locations[params.city] || [] : []}
                />
              </div>
            </fieldset>

            <div className="border-t border-slate-100"></div>

            {/* Tipo de Negócio */}
            <div>
              <label className="block text-slate-500 font-semibold mb-3 text-[11px] uppercase tracking-wider">Negócio</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-xl">
                {['venda', 'aluguel', 'temporada'].map((type) => {
                  const isActive = (!params.listing_type && type === 'venda') || params.listing_type === type;
                  return (
                    <label key={type} className={`cursor-pointer text-center py-2.5 rounded-lg transition-all text-xs font-bold capitalize select-none ${isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      <input type="radio" name="listing_type" value={type} checked={isActive} onChange={handleChange} className="hidden" />
                      {type}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Faixa de Preço */}
            <fieldset>
              <legend className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Faixa de Preço</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5 text-[11px] uppercase tracking-wider">Mínimo</label>
                  <CurrencyInput name="min_price" value={params.min_price || ""} onChange={(val) => handleCustomChange('min_price', val)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5 text-[11px] uppercase tracking-wider">Máximo</label>
                  <CurrencyInput name="max_price" value={params.max_price || ""} onChange={(val) => handleCustomChange('max_price', val)} placeholder="Ilimitado" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 font-medium" />
                </div>
              </div>
            </fieldset>

            <div className="border-t border-slate-100"></div>

            {/* Tipo de Imóvel */}
            <div>
              <label className="block text-slate-500 font-semibold mb-3 text-[11px] uppercase tracking-wider">Tipo de Imóvel</label>
              <div className="grid grid-cols-2 gap-3">
                {['apartamento', 'casa', 'terreno', 'comercial'].map(type => {
                  const isChecked = Array.isArray(params.property_type) 
                      ? params.property_type.includes(type) 
                      : params.property_type === type;
                  return (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          name="property_type" 
                          value={type} 
                          checked={isChecked}
                          onChange={handleChange}
                          className="peer h-[22px] w-[22px] cursor-pointer appearance-none rounded-md border-2 border-slate-200 bg-slate-50 transition-all checked:border-blue-600 checked:bg-blue-600 hover:border-blue-400 outline-none"
                        />
                        <svg className="absolute h-[14px] w-[14px] pointer-events-none hidden peer-checked:block left-[4px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 capitalize select-none">{type}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100"></div>

            {/* Detalhes */}
            <fieldset>
              <legend className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Detalhes</legend>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5 text-[11px] uppercase tracking-wider">Quartos</label>
                  <div className="relative">
                    <select name="bedrooms" value={params.bedrooms || ""} onChange={handleChange} className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none text-slate-900 font-medium tracking-wide">
                      <option value="">Todos</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                    <svg className="w-4 h-4 text-slate-400 absolute right-3.5 top-[14px] pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5 text-[11px] uppercase tracking-wider">Banheiros</label>
                  <div className="relative">
                    <select name="bathrooms" value={params.bathrooms || ""} onChange={handleChange} className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none text-slate-900 font-medium tracking-wide">
                      <option value="">Todos</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                    </select>
                    <svg className="w-4 h-4 text-slate-400 absolute right-3.5 top-[14px] pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5 text-[11px] uppercase tracking-wider">Área Mín. (m²)</label>
                  <NumberMaskInput name="min_area" value={params.min_area || ""} onChange={(val) => handleCustomChange('min_area', val)} suffix=" m²" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1.5 text-[11px] uppercase tracking-wider">Área Máx. (m²)</label>
                  <NumberMaskInput name="max_area" value={params.max_area || ""} onChange={(val) => handleCustomChange('max_area', val)} placeholder="Ilimitado" suffix=" m²" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-slate-900" />
                </div>
              </div>
            </fieldset>



            <div className="pt-4  space-y-3 pb-8 md:pb-0">
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-full font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 tracking-wide text-[15px]"
              >
                Aplicar Filtros
              </button>
              <button 
                type="button" 
                onClick={handleClear} 
                className="w-full text-center text-slate-500 text-sm font-medium hover:text-slate-900 transition py-2"
              >
                Limpar todos os filtros
              </button>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
}
