"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/app/components/ui/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

export default function DashboardPage() {
  const { success, error: toastError } = useToast();
  const { user, token } = useAuth();
  
  // Estados de Dados
  const [properties, setProperties] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  
  // Estados de UI/Fluxo
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  
  // Estados de Filtro e Paginação
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  // Estados de Ações (Modal)
  const [assigningProperty, setAssigningProperty] = useState<any>(null);
  const [selectedBroker, setSelectedBroker] = useState<string>("");

  useEffect(() => {
    if (!token) return;

    const initDashboard = async () => {
      try {
        if (user?.role === 'agency') {
          const teamRes = await fetch(`${API}/api/v1/team/brokers`, { 
            headers: { "Authorization": `Bearer ${token}` } 
          });
          if (teamRes.ok) setTeam(await teamRes.json());
        }
      } catch (err) {
        console.error("Erro ao carregar inicialização", err);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [token, user?.role]);

  const fetchMyProperties = async (page = 1) => {
    setLoading(true);
    setHasSearched(true);
    setError("");
    try {
      const url = new URL(`${API}/api/v1/properties/user/me`);
      url.searchParams.append("page", page.toString());
      if (filterTitle) url.searchParams.append("title", filterTitle);
      if (filterStatus) url.searchParams.append("status", filterStatus);

      const propRes = await fetch(url.toString(), { 
        headers: { "Authorization": `Bearer ${token}` } 
      });

      if (!propRes.ok) throw new Error("Erro ao carregar seus imóveis");
      
      const data = await propRes.json();
      setProperties(data.items);
      setPagination({ 
        page: data.page, 
        limit: data.limit, 
        total: data.total 
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedBroker || !assigningProperty) return;
    try {
      const res = await fetch(`${API}/api/v1/properties/${assigningProperty.id}/assign?user_id=${selectedBroker}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg("✓ Corretor atribuído com sucesso!");
        setTimeout(() => { setMsg(""); setAssigningProperty(null); }, 2000);
      }
    } catch (err) { console.error(err); }
  };

  const handleMarkAs = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${API}/api/v1/properties/${id}/status`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setProperties(prev => prev.map((p: any) => p.id === id ? { ...p, status: newStatus } : p));
      } else {
        const errorData = await res.json();
        toastError(errorData.detail || "Erro ao alterar status");
      }
    } catch (err) { console.error(err); }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    try {
      const res = await fetch(`${API}/api/v1/properties/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setProperties(prev => prev.map((p: any) => p.id === id ? { ...p, status: newStatus } : p));
      } else {
        const errorData = await res.json();
        toastError(errorData.detail || "Erro ao alterar status");
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Meu Dashboard</h1>
            <p className="text-slate-500 font-medium">Gerencie seus anúncios e sua carteira de clientes.</p>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <Link href="/dashboard/admin" className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-100 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-purple-100 transition shadow-sm hover:shadow-md">
                ⚡ Cockpit Global
              </Link>
            )}
            <Link href="/announce" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
              <span>+</span> Novo Anúncio
            </Link>
          </div>
        </div>

        {user?.role === 'broker' && (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link href="/dashboard/crm" className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all group">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🎯</div>
                <div>
                  <div className="text-xl font-black text-slate-900 mb-1">Painel CRM</div>
                  <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">Gestão de Leads e Vendas</div>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/owners" className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all group">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🤝</div>
                <div>
                  <div className="text-xl font-black text-slate-900 mb-1">Proprietários</div>
                  <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">Minha Carteira de Clientes</div>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link href="/dashboard/seller" className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all group">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🏡</div>
              <div>
                <div className="text-xl font-black text-slate-900 mb-1">Painel do Vendedor</div>
                <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">Propostas e Visitas</div>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/appointments" className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all group">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">📅</div>
              <div>
                <div className="text-xl font-black text-slate-900 mb-1">Agenda de Visitas</div>
                <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">Gestão de Agendamentos</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Filtros de Busca Interna */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-12 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Buscar por Título</label>
            <input 
              type="text" 
              placeholder="Digite o nome do imóvel..."
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition outline-none font-medium"
              value={filterTitle}
              onChange={e => setFilterTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchMyProperties(1)}
            />
          </div>
          <div className="w-full md:w-64 space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Status</label>
            <select 
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition outline-none font-medium appearance-none"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="pending">Pendentes</option>
              <option value="sold">Vendidos</option>
              <option value="rented">Alugados</option>
              <option value="archived">Arquivados</option>
            </select>
          </div>
          <button 
            onClick={() => fetchMyProperties(1)}
            className="w-full md:w-auto px-10 h-14 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition active:scale-95"
          >
            Filtrar
          </button>
        </div>

        {hasSearched && !loading && !error && properties.length > 0 && (
          <div className="flex items-center justify-between mb-8">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {pagination.total} imóveis encontrados
            </div>
            <div className="flex bg-white rounded-xl border border-slate-100 p-1 shadow-sm">
              <button 
                onClick={() => setViewMode("card")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${viewMode === 'card' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                🗂️ Card
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                ≡ Lista
              </button>
            </div>
          </div>
        )}

        {!hasSearched ? (
          <div className="bg-slate-50 p-20 text-center rounded-[3rem] border border-dashed border-slate-200">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">🔍</div>
             <h3 className="text-xl font-black text-slate-900 mb-2">Pronto para gerenciar sua carteira?</h3>
             <p className="text-slate-500 max-w-sm mx-auto font-medium">Utilize os filtros acima para listar seus imóveis de forma rápida e organizada.</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-slate-100 italic text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            Refinando resultados...
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-3xl text-center font-bold border border-red-100">
            {error}
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white p-20 text-center rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🏠</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Tente ajustar seus filtros para encontrar o que procura.</p>
          </div>
        ) : (
          <>
            {viewMode === 'card' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map((imovel: any) => (
                  <div key={imovel.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 group relative">
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img src={imovel.image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"} alt={imovel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 flex flex-col gap-1">
                        <span>{imovel.listing_type}</span>
                        {user?.role === 'agency' && (
                          <span className="text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded-md">🏢 {imovel.owner?.name || 'Agência'}</span>
                        )}
                      </div>
                      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                        <div className={`backdrop-blur px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest ${
                          imovel.status === 'active' ? 'bg-slate-900/40 text-white' :
                          imovel.status === 'sold' ? 'bg-emerald-600/90 text-white shadow-lg shadow-emerald-500/30' :
                          imovel.status === 'rented' ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/30' :
                          'bg-red-500/90 text-white shadow-lg shadow-red-500/20'
                        }`}>
                          {imovel.status === 'active' ? 'Ativo' : imovel.status === 'sold' ? '✓ Vendido' : imovel.status === 'rented' ? '✓ Alugado' : 'Inativo'}
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-slate-900 mb-4 line-clamp-1 h-6">{imovel.title}</h3>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-black text-slate-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.price)}
                        </div>
                        <Link href={`/properties/${imovel.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition">Ver detalhes →</Link>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Link href={`/announce/edit/${imovel.id}`} className="flex-1 py-2 text-center text-[10px] bg-blue-50 text-blue-600 border border-blue-100 font-black uppercase tracking-widest rounded-xl hover:bg-blue-100 transition">Editar</Link>
                        <button onClick={() => handleToggleStatus(imovel.id, imovel.status)} className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition border bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100">{imovel.status === 'active' ? 'Pausar' : 'Reativar'}</button>
                        {user?.role === 'agency' && (
                          <button onClick={() => setAssigningProperty(imovel)} className="flex-1 py-2 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition border border-transparent hover:border-blue-100">Atribuir</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {properties.map((imovel: any) => (
                  <div key={imovel.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-40 h-24 rounded-2xl overflow-hidden bg-slate-100 relative shrink-0">
                      <img src={imovel.image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80"} alt={imovel.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-blue-600">
                        {imovel.listing_type}
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-slate-900 mb-1">{imovel.title}</h3>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                              imovel.status === 'active' ? 'bg-slate-900 text-white' :
                              imovel.status === 'sold' ? 'bg-emerald-600 text-white' :
                              imovel.status === 'rented' ? 'bg-blue-600 text-white' :
                              'bg-red-500 text-white'
                            }`}>
                              {imovel.status === 'active' ? 'Ativo' : imovel.status === 'sold' ? 'Vendido' : imovel.status === 'rented' ? 'Alugado' : 'Inativo'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">📍 {imovel.neighborhood}, {imovel.city}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-black text-slate-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.price)}
                          </div>
                          <Link href={`/properties/${imovel.id}`} className="text-xs font-bold text-blue-600 hover:underline">Ver detalhes</Link>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Link href={`/announce/edit/${imovel.id}`} className="px-5 py-3 h-11 flex items-center bg-blue-50 text-blue-600 border border-blue-100 font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-blue-100 transition">Editar</Link>
                            <button onClick={() => handleToggleStatus(imovel.id, imovel.status)} className="px-5 py-3 h-11 flex items-center bg-orange-50 text-orange-600 border border-orange-100 font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-orange-100 transition">
                                {imovel.status === 'active' ? 'Pausar' : 'Ativar'}
                            </button>
                            {user?.role === 'agency' && (
                                <button onClick={() => setAssigningProperty(imovel)} className="px-5 py-3 h-11 flex items-center bg-slate-50 text-slate-500 border border-slate-100 font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-slate-100 transition">Atribuir</button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pagination.total > pagination.limit && (
              <div className="flex items-center justify-center gap-2 mt-12 py-8 border-t border-slate-100">
                <button 
                  onClick={() => fetchMyProperties(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                >Anterior</button>
                <div className="px-6 py-3 bg-slate-50 rounded-xl text-sm font-black text-slate-900 border border-slate-100">
                  Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)}
                </div>
                <button 
                  onClick={() => fetchMyProperties(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                  className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                >Próxima</button>
              </div>
            )}
          </>
        )}

        {/* Modal de Atribuição */}
        {assigningProperty && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-2xl font-black text-slate-900 mb-2">Atribuir Corretor</h2>
              <p className="text-slate-500 mb-8 text-sm font-medium">Selecione um membro da equipe para <span className="text-slate-900 font-bold">{assigningProperty.title}</span>.</p>
              {msg && <p className="mb-4 text-emerald-600 bg-emerald-50 p-3 rounded-xl text-center font-bold text-sm animate-pulse">{msg}</p>}
              <div className="space-y-4">
                <select 
                  className="w-full px-4 py-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-700 font-medium"
                  value={selectedBroker}
                  onChange={e => setSelectedBroker(e.target.value)}
                >
                  <option value="">Selecione um corretor...</option>
                  {team.map(broker => (
                    <option key={broker.id} value={broker.id}>{broker.name} ({broker.email})</option>
                  ))}
                </select>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setAssigningProperty(null)} className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition">Cancelar</button>
                  <button onClick={handleAssign} disabled={!selectedBroker} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50">Confirmar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
