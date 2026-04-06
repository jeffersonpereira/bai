"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PhoneInput from '@/app/components/ui/PhoneInput';
import { useToast } from "@/app/components/ui/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

export default function CRMDashboard() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [owners, setOwners] = useState([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [newActivity, setNewActivity] = useState({ type: "comentario", desc: "" });
  
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", phone: "", email: "", property_id: "" });
  
  // Estados para Paginação e Busca
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const limit = 20;

  const fetchActivities = async (leadId: number) => {
    const token = localStorage.getItem("bai_token");
    try {
      const res = await fetch(`${API}/api/v1/crm/leads/${leadId}/activities`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setActivities(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleAddActivity = async () => {
    if (!newActivity.desc) return;
    const token = localStorage.getItem("bai_token");
    try {
      const res = await fetch(`${API}/api/v1/crm/leads/${selectedLead.id}/activities`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ activity_type: newActivity.type, description: newActivity.desc })
      });
      if (res.ok) {
        setNewActivity({ ...newActivity, desc: "" });
        fetchActivities(selectedLead.id);
      }
    } catch (err) { console.error(err); }
  };

  const handleCreateLead = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem("bai_token");
    const propertyId = parseInt(newLead.property_id);
    if (isNaN(propertyId)) {
      toastError("Por favor, selecione um imóvel.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/v1/crm/leads`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newLead.name,
          phone: newLead.phone || null,
          email: newLead.email || null,
          property_id: propertyId,
          source: "manual"
        })
      });
      if (res.ok) {
        setShowLeadForm(false);
        setNewLead({ name: "", phone: "", email: "", property_id: "" });
        fetchLeads();
        success("Lead cadastrado com sucesso!");
      } else {
        const errorData = await res.json();
        toastError(`Erro ao cadastrar lead: ${errorData.detail || "Erro desconhecido"}`);
      }
    } catch (err) { 
      console.error(err);
      toastError("Erro de conexão com o servidor.");
    }
  };

  const fetchLeads = async () => {
    const token = localStorage.getItem("bai_token");
    if (!token) return;
    try {
      const query = new URLSearchParams({
        skip: String((page - 1) * limit),
        limit: String(limit),
        ...(searchTerm ? { search: searchTerm } : {})
      });
      const res = await fetch(`${API}/api/v1/crm/leads?${query.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.items || []);
        setTotalLeads(data.total || 0);
      }
    } catch (err) { 
      console.error(err);
      setLeads([]); 
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("bai_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [ownersRes, userRes, propsRes] = await Promise.all([
          fetch(`${API}/api/v1/crm/owners`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${API}/api/v1/auth/me`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${API}/api/v1/properties/user/me`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        if (ownersRes.ok) {
          const ownersData = await ownersRes.json();
          setOwners(ownersData.items || ownersData);
        }
        if (propsRes.ok) setProperties(await propsRes.json());
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.role === 'broker' && userData.parent_id !== null) {
            router.push('/dashboard');
            return;
          }
          setUser(userData);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do CRM", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const updateLeadStatus = async (leadId: number, newStatus: string) => {
    const token = localStorage.getItem("bai_token");
    try {
      await fetch(`${API}/api/v1/crm/leads/${leadId}/status?status=${newStatus}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      // Refresh local state if it's an array
      if (Array.isArray(leads)) {
        setLeads(leads.map((l: any) => l.id === leadId ? { ...l, status: newStatus } : l));
      } else {
        fetchLeads();
      }
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Painel CRM</h1>
          <p className="text-slate-500 font-medium">Gestão de interessados e carteira de clientes.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowLeadForm(true)} className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-6 py-3.5 rounded-2xl font-bold hover:bg-indigo-100 transition shadow-sm">
            + Novo Lead
          </button>
          <Link href="/dashboard/owners" className="bg-white border border-slate-200 text-slate-700 px-6 py-3.5 rounded-2xl font-bold hover:bg-slate-50 transition">
            Gerenciar Proprietários
          </Link>
          <Link href="/announce" className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
            Novo Anúncio
          </Link>
        </div>
      </div>

      {showLeadForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-10 max-w-3xl relative">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Cadastrar Lead Manualmente</h2>
            <button onClick={() => setShowLeadForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition font-bold">×</button>
          </div>
          <form onSubmit={handleCreateLead} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Nome do Interessado</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Imóvel de Interesse</label>
                <select required className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition appearance-none text-slate-800" value={newLead.property_id} onChange={e => setNewLead({...newLead, property_id: e.target.value})}>
                  <option value="">Selecione um imóvel...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>#{p.id} — {p.title}</option>)}
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Telefone</label>
                <PhoneInput className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800" value={newLead.phone} onChange={(val) => setNewLead({...newLead, phone: val})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">E-mail</label>
                <input type="email" className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowLeadForm(false)} className="px-5 py-2.5 rounded-xl text-slate-500 font-semibold hover:bg-slate-50 transition">Cancelar</button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm">
                Salvar Lead
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200">
          <div className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-2">Leads Novos</div>
          <div className="text-5xl font-black">{(leads || []).filter((l: any) => l.status === 'novo').length}</div>
        </div>
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200">
          <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Proprietários</div>
          <div className="text-5xl font-black">{(owners || []).length}</div>
        </div>
        <div className="bg-white rounded-[2.5rem] p-8 text-slate-900 border border-slate-100 shadow-sm">
          <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Total de Leads</div>
          <div className="text-5xl font-black">{(leads || []).length}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-12">
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              Funil de Interessados (Leads)
            </h2>
            
            <div className="flex-1 max-w-md relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar lead por nome, email ou telefone..."
                className="w-full pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition font-medium text-slate-700 text-sm"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Interessado</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Imóvel (ID)</th>
                  {user?.role === 'agency' && (
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Corretor</th>
                  )}
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(leads || []).map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900">{user?.plan_type === 'free' ? 'Nome Oculto' : lead.name}</div>
                      
                      {user?.plan_type === 'free' ? (
                        <div className="mt-1 group relative inline-block">
                          <div className="text-xs text-slate-500 blur-sm select-none">(11) 99999-9999</div>
                          <Link href="/dashboard/settings/plan" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded">
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded shadow-sm">⭐ Ver Contato</span>
                          </Link>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">{lead.phone || lead.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-600">#{lead.property_id}</td>
                    {user?.role === 'agency' && (
                      <td className="px-6 py-5 text-xs font-bold text-blue-600">
                        {lead.broker_name || 'Agência'}
                      </td>
                    )}
                    <td className="px-6 py-5 text-xs text-slate-400 font-medium">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        lead.status === 'novo' ? 'bg-blue-100 text-blue-600' :
                        lead.status === 'contatado' ? 'bg-amber-100 text-amber-600' :
                        lead.status === 'fechado' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 flex items-center gap-2">
                        <select 
                          className="bg-transparent text-xs font-bold text-blue-600 focus:outline-none cursor-pointer"
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                        >
                          <option value="novo">Novo</option>
                          <option value="contatado">Contatado</option>
                          <option value="visita">Visita</option>
                          <option value="proposta">Proposta</option>
                          <option value="fechado">Fechado</option>
                          <option value="perdido">Perdido</option>
                        </select>
                        <button 
                          onClick={() => { setSelectedLead(lead); fetchActivities(lead.id); }}
                          className="text-blue-600 hover:text-blue-700 font-bold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg transition"
                        >
                          Atividades
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === 0 && (
              <div className="py-20 text-center text-slate-400 italic">Nenhum lead encontrado para sua busca.</div>
            )}

            {/* Pagination Controls */}
            {Math.ceil(totalLeads / limit) > 1 && (
              <div className="bg-slate-50/50 border-t border-slate-100 p-6 flex items-center justify-between">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Página {page} de {Math.ceil(totalLeads / limit)} • {totalLeads} total
                </div>
                <div className="flex gap-2">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
                  >
                    Anterior
                  </button>
                  <button 
                    disabled={page === Math.ceil(totalLeads / limit)}
                    onClick={() => setPage(p => Math.min(Math.ceil(totalLeads / limit), p + 1))}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modal de Atividades */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{selectedLead.name}</h2>
                <p className="text-slate-500 font-medium">Histórico de Negociação • Imóvel #{selectedLead.property_id}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition font-bold">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Nova Atividade */}
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {["comentario", "ligacao", "visita", "proposta"].map(type => (
                    <button 
                      key={type}
                      onClick={() => setNewActivity({...newActivity, type})}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${newActivity.type === type ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 hover:bg-slate-100'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                    placeholder="Descreva o que aconteceu..." 
                    value={newActivity.desc}
                    onChange={e => setNewActivity({...newActivity, desc: e.target.value})}
                    onKeyPress={e => e.key === 'Enter' && handleAddActivity()}
                  />
                  <button onClick={handleAddActivity} className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-slate-800 transition">Salvar</button>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-6">
                {activities.map((act, i) => (
                  <div key={act.id} className="relative pl-8 pb-4 group">
                    {i !== activities.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-100"></div>}
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                    </div>
                    <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{act.activity_type}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(act.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-slate-700 text-sm font-medium leading-relaxed">{act.description}</p>
                      <div className="mt-3 pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-bold flex items-center gap-2">
                         <div className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center">👤</div>
                         Por: {act.user_name}
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4 opacity-20">🕒</div>
                    <p className="text-slate-400 italic font-medium">Nenhuma atividade registrada ainda.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
