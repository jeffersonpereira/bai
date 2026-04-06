"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "recent";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (val === "recent") {
      params.delete("sort"); // default backend fallback
    } else {
      params.set("sort", val);
    }
    
    params.set("page", "1"); // reseta paginação ao ordenar
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="shrink-0 relative">
      <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
        </svg>
        <select 
          value={currentSort} 
          onChange={handleSortChange}
          className="bg-transparent border-none outline-none text-slate-700 font-semibold cursor-pointer pr-4 appearance-none w-full"
        >
          <option value="recent">Mais Recentes</option>
          <option value="views">Mais Visualizados</option>
          <option value="price_asc">Menor Preço</option>
          <option value="price_desc">Maior Preço</option>
        </select>
        
        {/* Seta do Dropdown personalizada */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
           <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
           </svg>
        </div>
      </div>
    </div>
  );
}
