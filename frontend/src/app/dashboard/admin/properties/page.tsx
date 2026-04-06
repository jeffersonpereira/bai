"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ui/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

export default function AdminPropertiesPage() {
  const { success, error: toastError } = useToast();
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchProperties();
  }, [user, token, authLoading, router, pagination.page]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let url = new URL(`${API}/api/v1/admin/properties`);
      url.searchParams.append("page", pagination.page.toString());
      if (searchTitle) url.searchParams.append("title", searchTitle);
      if (statusFilter) url.searchParams.append("status", statusFilter);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(data.items);
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    if (!confirm(`Tem certeza que deseja forçar o status deste imóvel para '${newStatus}'?`)) return;
    try {
      const res = await fetch(`${API}/api/v1/admin/properties/${id}/status`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      } else {
        toastError("Falha ao atualizar o status do imóvel.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) return <div className="p-20 text-center animate-pulse">Carregando Auditoria...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/dashboard/admin" className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2 mb-2">
            ← Voltar ao Cockpit
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Auditoria: Anúncios Globais</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Supervisão e moderação de todos os imóveis listados no catálogo da BAI.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Título do Imóvel</label>
          <input 
            type="text" 
            placeholder="Buscar por nome..."
            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-red-500 transition outline-none font-medium"
            value={searchTitle}
            onChange={e => setSearchTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchProperties()}
          />
        </div>
        <div className="w-full md:w-64 space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Status Auditado</label>
          <select 
            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-red-500 transition outline-none font-medium appearance-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="pending">Pendentes</option>
            <option value="archived">Arquivados (Takedown)</option>
            <option value="sold">Vendidos</option>
          </select>
        </div>
        <button 
          onClick={fetchProperties}
          className="w-full md:w-auto px-8 h-12 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition shadow-sm"
        >
          Aplicar Filtros
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center animate-pulse flex flex-col items-center">
             <div className="w-6 h-6 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin mb-4"></div>
             Buscando catálogo...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="p-5 font-bold w-16">Foto</th>
                  <th className="p-5 font-bold">Imóvel & Preço</th>
                  <th className="p-5 font-bold">Tipo</th>
                  <th className="p-5 font-bold">Status</th>
                  <th className="p-5 text-right font-bold w-48">Moderação (Takedown)</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="p-5 align-middle">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-100">
                         {p.image_url ? (
                            <img src={p.image_url} alt="Thumb" className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">N/A</div>
                         )}
                      </div>
                    </td>
                    <td className="p-5 align-middle">
                      <div className="font-bold text-slate-900 line-clamp-1" title={p.title}>{p.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                          p.owner?.role === 'user' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {p.owner?.role === 'user' ? 'Autônomo' : p.owner?.role || 'Desconhecido'}
                        </span>
                        <span className="text-xs font-black text-slate-500">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                          <span className="ml-2 font-medium">| {p.city}</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-5 align-middle">
                       <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700">
                         {p.listing_type}
                       </span>
                    </td>
                    <td className="p-5 align-middle">
                       <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                         p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                         p.status === 'archived' ? 'bg-red-100 text-red-700 shadow-sm' :
                         'bg-slate-100 text-slate-600'
                       }`}>
                         {p.status}
                       </span>
                    </td>
                    <td className="p-5 text-right align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/properties/${p.id}`} target="_blank" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-2 py-1 bg-white border border-slate-200 rounded-md transition shadow-sm">
                          Ver Anúncio
                        </Link>
                        {p.status === 'active' ? (
                          <button 
                            onClick={() => updateStatus(p.id, 'archived')}
                            className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-white bg-red-50 hover:bg-red-600 px-3 py-1.5 rounded-lg transition shadow-sm"
                            title="Remover sumariamente do catálogo"
                          >
                            Suspender
                          </button>
                        ) : (
                          <button 
                            onClick={() => updateStatus(p.id, 'active')}
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition shadow-sm"
                            title="Reativar no catálogo"
                          >
                            Liberar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {properties.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">Nenhum imóvel encontrado no sistema global.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Paginação global */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-center gap-2 mt-8 py-8 border-t border-slate-100">
           <button 
             onClick={() => setPagination(prev => ({...prev, page: prev.page - 1}))}
             disabled={pagination.page === 1}
             className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
           >Anterior</button>
           <div className="px-6 py-3 bg-slate-50 rounded-xl text-sm font-black text-slate-900 border border-slate-100">
             Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)}
           </div>
           <button 
             onClick={() => setPagination(prev => ({...prev, page: prev.page + 1}))}
             disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
             className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
           >Próxima</button>
         </div>
      )}
    </div>
  );
}
