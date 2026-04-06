"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React from "react";

// Mapeamento de chaves para títulos humanizados
const KEY_LABELS: Record<string, string> = {
  city: "Cidade",
  neighborhood: "Bairro",
  min_price: "Preço Mín.",
  max_price: "Preço Máx.",
  min_area: "Área Mín.",
  max_area: "Área Máx.",
  bedrooms: "Quartos",
  bathrooms: "Banheiros",
  garage_spaces: "Vagas",
  listing_type: "Negócio",
  property_type: "Tipo"
};

// Formatação visual do valor longo para legibilidade
const formatValue = (key: string, val: string) => {
  if (key.includes('price')) {
    const num = Number(val);
    if (num >= 1000000) return `R$ ${(num / 1000000).toFixed(1)}mi`;
    if (num >= 1000) return `R$ ${(num / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  }
  if (key.includes('area')) return `${val}m²`;
  if (key === 'listing_type' || key === 'property_type') return val.charAt(0).toUpperCase() + val.slice(1);
  return val;
};

export default function ActiveFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Ignorar keys de controle que não são filtros visuais primários
  const ignoreKeys = ['page', 'limit'];
  
  const activeParams: { key: string; value: string; displayValue: string }[] = [];
  
  searchParams.forEach((value, key) => {
    if (!ignoreKeys.includes(key) && value) {
      activeParams.push({
        key,
        value,
        displayValue: formatValue(key, value)
      });
    }
  });

  const removeFilter = (keyToRemove: string, valueToRemove: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    // If it's a multi-value param (like property_type or neighborhood might be in array form), 
    // we need to delete specific value or all of them. Next.js URLSearchParams `delete` removes all keys.
    // For arrays, if we appended multiple 'property_type', current.delete('property_type') deletes all.
    // Let's implement a safe multi-value delete:
    const values = current.getAll(keyToRemove);
    current.delete(keyToRemove);
    values.forEach(v => {
      if (v !== valueToRemove) current.append(keyToRemove, v);
    });

    // Reset pagination to 1
    if (current.has('page')) current.set('page', '1');

    router.push(`/search?${current.toString()}`);
  };

  if (activeParams.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm text-slate-500 font-medium mr-2">Filtros ativos:</span>
      {activeParams.map(({ key, value, displayValue }, idx) => (
        <span 
          key={`${key}-${value}-${idx}`} 
          className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1.5 min-h-[32px] rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-colors"
        >
          {KEY_LABELS[key] || key}: {displayValue}
          <button
            onClick={() => removeFilter(key, value)}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-blue-200/50 text-blue-500 hover:text-blue-800 transition"
            aria-label="Remover filtro"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <button 
        onClick={() => router.push('/search')}
        className="text-xs text-slate-400 hover:text-slate-600 font-medium ml-2 underline decoration-transparent hover:decoration-slate-400 transition"
      >
        Limpar todos
      </button>
    </div>
  );
}
