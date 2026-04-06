"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/app/components/ui/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

export default function OwnersPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingOwnerId, setEditingOwnerId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", document: "", address: "", notes: ""
  });
  const [properties, setProperties] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchOwners();
  }, [page, searchTerm]);

  const fetchOwners = async () => {
    const token = localStorage.getItem("bai_token");
    if (!token) return router.push("/login");
    
    setLoading(true);
    try {
      const query = new URLSearchParams({
        skip: String((page - 1) * limit),
        limit: String(limit),
        ...(searchTerm ? { search: searchTerm } : {})
      });

      const res = await fetch(`${API}/api/v1/crm/owners?${query.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOwners(data.items);
        setTotal(data.total);
      }

      const propRes = await fetch(`${API}/api/v1/properties/user/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (propRes.ok) setProperties(await propRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOwner = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem("bai_token");
    const method = editMode ? "PUT" : "POST";
    const url = editMode 
      ? `${API}/api/v1/crm/owners/${editingOwnerId}` 
      : `${API}/api/v1/crm/owners`;

    // Preparar dados: converter strings vazias em null para evitar erro de validação (EmailStr)
    const payload = {
      ...formData,
      email: formData.email || null,
      phone: formData.phone || null,
      document: formData.document || null,
      address: formData.address || null,
      notes: formData.notes || null
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowForm(false);
        setEditMode(false);
        setEditingOwnerId(null);
        setFormData({ name: "", email: "", phone: "", document: "", address: "", notes: "" });
        fetchOwners();
        success(editMode ? "Cadastro atualizado!" : "Proprietário cadastrado com sucesso!");
      } else {
        const err = await res.json();
        toastError(`Erro ao salvar: ${err.detail || "Verifique os dados"}`);
      }
    } catch (err) {
      console.error(err);
      toastError("Erro de conexão.");
    }
  };

  const handleEditOwner = (owner: any) => {
    setFormData({
      name: owner.name || "",
      email: owner.email || "",
      phone: owner.phone || "",
      document: owner.document || "",
      address: owner.address || "",
      notes: owner.notes || ""
    });
    setEditingOwnerId(owner.id);
    setEditMode(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Minha Carteira</h1>
          <p className="text-slate-500 font-medium">Gestão profissional de proprietários e clientes.</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditMode(false);
              setEditingOwnerId(null);
              setFormData({ name: "", email: "", phone: "", document: "", address: "", notes: "" });
            } else {
              setShowForm(true);
            }
          }}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          {showForm ? "Cancelar" : "+ Novo Proprietário"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-900/5 mb-12 max-w-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-2xl font-black text-slate-900 mb-6">{editMode ? 'Editar Proprietário' : 'Novo Proprietário'}</h2>
          <form onSubmit={handleSubmitOwner} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">CPF / CNPJ</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.document}
                  onChange={(e) => setFormData({...formData, document: e.target.value})}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">WhatsApp</label>
                <input 
                  type="tel" 
                  placeholder="(00) 00000-0000"
                  className="w-full bg-slate-50 border border-slate-100 px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-mail</label>
                <input 
                  type="email" 
                  className="w-full bg-slate-50 border border-slate-100 px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Observações Internas</label>
              <textarea 
                rows={3}
                className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
            <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition">
              {editMode ? 'Salvar Alterações' : 'Salvar Proprietário'}
            </button>
          </form>
        </div>
      )}

      {/* Barra de Ferramentas */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou CPF..."
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition font-medium text-slate-700"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <div className="bg-white border border-slate-100 px-6 py-4 rounded-2xl flex items-center gap-3 text-sm font-bold text-slate-500 shadow-sm">
          <span>Total:</span>
          <span className="text-blue-600 font-black">{total}</span>
          Clientes
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Nome / Identificação</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Contato</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Patrimônio Gerido</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Comissão Prevista</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(owners || []).map((owner: any) => {
                const ownerProperties = (properties || []).filter((p: any) => p.actual_owner_id === owner.id);
                const totalAssets = ownerProperties.reduce((acc, curr) => acc + (curr.price || 0), 0);
                const potentialCommission = ownerProperties.reduce((acc, curr) => {
                  const pct = curr.commission_percentage || 0;
                  return acc + (curr.price * (pct / 100));
                }, 0);

                return (
                  <tr key={owner.id} className="hover:bg-slate-50/30 transition group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-lg">
                          👤
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{owner.name}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{owner.document || 'Sem Documento'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-semibold text-slate-700">{owner.email || '-'}</div>
                      <div className="text-xs text-blue-600 font-bold mt-0.5">{owner.phone || '-'}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(totalAssets)}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{ownerProperties.length} {ownerProperties.length === 1 ? 'imóvel' : 'imóveis'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {potentialCommission > 0 ? (
                        <div className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(potentialCommission)}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 font-bold">R$ 0,00</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/dashboard/proprietario/${owner.id}`}
                          className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800 transition"
                        >
                          Ver Painel
                        </Link>
                        <button
                          onClick={() => handleEditOwner(owner)}
                          className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {owners.length === 0 && !loading && (
          <div className="py-24 text-center">
            <div className="text-4xl mb-4 grayscale opacity-20">📭</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum cliente encontrado</h3>
            <p className="text-sm text-slate-400 font-medium">Tente ajustar sua busca ou cadastrar um novo proprietário.</p>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="bg-slate-50/30 border-t border-slate-100 p-6 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-400">
              Página {page} de {totalPages}
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
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
