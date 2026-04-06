import Link from "next/link";
import PropertyCard from "../components/PropertyCard";
import ActiveFilters from "./components/ActiveFilters";
import SearchClientWrapper from "./components/SearchClientWrapper";
import SortDropdown from "./components/SortDropdown";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

async function getProperties(params: any) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value as string);
      }
    }
  });
  
  try {
    const res = await fetch(`${API}/api/v1/properties/?${queryParams.toString()}`, { cache: 'no-store' });
    if (!res.ok) return { items: [], total: 0, page: 1, limit: 20 };
    return res.json();
  } catch (error) {
    console.error("Erro ao buscar imóveis:", error);
    return { items: [], total: 0, page: 1, limit: 20 };
  }
}

async function getLocations() {
  try {
    const res = await fetch(`${API}/api/v1/properties/locations`, { cache: 'no-store' });
    if (!res.ok) return {};
    return res.json();
  } catch (err) {
    return {};
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<any>
}) {
  const par = await searchParams;
  const propertiesData = await getProperties(par);
  const locations = await getLocations();
  const properties = propertiesData.items;
  const total = propertiesData.total;
  const currentPage = parseInt(par.page || '1');
  const totalPages = Math.ceil(total / (propertiesData.limit || 20));

  return (
    <SearchClientWrapper initialParams={par} locations={locations}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {total} {total === 1 ? 'Imóvel encontrado' : 'Imóveis encontrados'}
          {par.city && <span className="text-blue-600 font-bold"> em {par.city}</span>}
        </h1>
        
        {/* Futura implementação de ordenação / Dropdown */}
        {/* Dropdown real de ordenação */}
        <SortDropdown />
      </div>

      <ActiveFilters />
      
      {/* Botão de Salvar Busca (Mock visual/Facility) */}
      <div className="mb-6 flex">
        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-100 hover:border-blue-200 rounded-full text-xs font-bold transition shadow-sm group">
          <svg className="w-4 h-4 group-hover:fill-blue-500/20 transition" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          Salvar esta busca e receber alertas
        </button>
      </div>
      
      {properties.length === 0 ? (
        <div className="bg-white p-12 md:p-20 text-center rounded-3xl border-2 border-dashed border-slate-200 shadow-sm mt-8">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <span className="text-3xl text-slate-400">🔍</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Nada por aqui...</h3>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">Tente ajustar seus filtros, ou utilize nosso botão acima para ser alertado quando novos imóveis aparecerem nesta busca.</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {properties.map((imovel: any) => (
              <PropertyCard key={imovel.id} imovel={imovel} />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-8 border-t border-slate-100">
              {currentPage > 1 && (
                <Link 
                  href={`/search?${new URLSearchParams({...par, page: String(currentPage - 1)}).toString()}`}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                  scroll={true}
                >
                  Anterior
                </Link>
              )}
              <div className="flex gap-2 flex-wrap justify-center">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum = i + 1;
                  // Simplificação para manter a janela correta
                  if (totalPages > 5 && currentPage > 3) {
                     pageNum = currentPage - 3 + i + 1;
                     if (pageNum > totalPages) return null;
                  }
                  
                  const isActive = pageNum === currentPage;
                  return (
                    <Link 
                      key={pageNum}
                      href={`/search?${new URLSearchParams({...par, page: String(pageNum)}).toString()}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      scroll={true}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>
              {currentPage < totalPages && (
                <Link 
                  href={`/search?${new URLSearchParams({...par, page: String(currentPage + 1)}).toString()}`}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                  scroll={true}
                >
                  Próximo
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </SearchClientWrapper>
  );
}
