"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/components/ui/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pendente:  { label: "Pendente",  cls: "bg-amber-100 text-amber-700" },
  pago:      { label: "Pago",      cls: "bg-emerald-100 text-emerald-700" },
  cancelado: { label: "Cancelado", cls: "bg-red-100 text-red-500" },
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ComissoesPage() {
  const { token } = useAuth();
  const { success, error: toastError } = useToast();

  const [resumo, setResumo] = useState<any>(null);
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    imovel_id: "",
    corretor_id: "",
    percentual: "",
    proposta_id: "",
    observacoes: "",
  });

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async (situacao = filtroStatus) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = situacao ? `?situacao=${situacao}` : "";
      const [resumoRes, listRes] = await Promise.all([
        fetch(`${API}/api/v1/comissoes/resumo`, { headers }),
        fetch(`${API}/api/v1/comissoes/${params}`, { headers }),
      ]);
      if (resumoRes.ok) setResumo(await resumoRes.json());
      if (listRes.ok) setComissoes(await listRes.json());
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    if (!token) return;
    const [brokersRes, propsRes] = await Promise.all([
      fetch(`${API}/api/v1/equipe/brokers`, { headers }),
      fetch(`${API}/api/v1/imoveis/user/me`, { headers }),
    ]);
    if (brokersRes.ok) setBrokers(await brokersRes.json());
    if (propsRes.ok) {
      const d = await propsRes.json();
      setProperties(d.items || d);
    }
  };

  useEffect(() => {
    fetchData();
    fetchFormData();
  }, [token]);

  const handleFilter = (s: string) => {
    setFiltroStatus(s);
    fetchData(s);
  };

  const handleStatusChange = async (id: number, situacao: string) => {
    try {
      const res = await fetch(`${API}/api/v1/comissoes/${id}/status`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ situacao }),
      });
      if (res.ok) {
        success("Status atualizado.");
        fetchData();
      } else {
        toastError("Erro ao atualizar status.");
      }
    } catch {
      toastError("Erro de conexão.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/comissoes/`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          imovel_id: parseInt(form.imovel_id),
          corretor_id: parseInt(form.corretor_id),
          percentual: parseFloat(form.percentual),
          proposta_id: form.proposta_id ? parseInt(form.proposta_id) : null,
          observacoes: form.observacoes || null,
        }),
      });
      if (res.ok) {
        success("Comissão registrada.");
        setShowForm(false);
        setForm({ imovel_id: "", corretor_id: "", percentual: "", proposta_id: "", observacoes: "" });
        fetchData();
      } else {
        const d = await res.json();
        toastError(d.detail || "Erro ao registrar comissão.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const FILTROS = [
    { key: "",          label: "Todas" },
    { key: "pendente",  label: "Pendente" },
    { key: "pago",      label: "Pago" },
    { key: "cancelado", label: "Cancelado" },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Comissões</h1>
          <p className="text-slate-500 font-medium">Controle financeiro das comissões da equipe.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 self-start md:self-auto"
        >
          + Registrar Comissão
        </button>
      </div>

      {/* Stat Cards */}
      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white">
            <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Total de Registros</div>
            <div className="text-4xl font-black">{resumo.total_comissoes}</div>
          </div>
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
            <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Gerado</div>
            <div className="text-2xl font-black text-slate-900">{fmt(resumo.total_gerado)}</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6">
            <div className="text-amber-600 text-xs font-black uppercase tracking-widest mb-2">Pendente</div>
            <div className="text-2xl font-black text-amber-700">{fmt(resumo.total_pendente)}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6">
            <div className="text-emerald-600 text-xs font-black uppercase tracking-widest mb-2">Pago</div>
            <div className="text-2xl font-black text-emerald-700">{fmt(resumo.total_pago)}</div>
          </div>
        </div>
      )}

      {/* Modal Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900">Nova Comissão</h2>
              <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold hover:bg-slate-200 transition">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Imóvel</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800"
                  value={form.imovel_id}
                  onChange={e => setForm({ ...form, imovel_id: e.target.value })}
                >
                  <option value="">Selecione um imóvel...</option>
                  {properties.map((p: any) => (
                    <option key={p.id} value={p.id}>#{p.id} — {p.titulo || p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Corretor</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800"
                  value={form.corretor_id}
                  onChange={e => setForm({ ...form, corretor_id: e.target.value })}
                >
                  <option value="">Selecione um corretor...</option>
                  {brokers.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name || b.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Percentual (%)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Ex: 5"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800"
                  value={form.percentual}
                  onChange={e => setForm({ ...form, percentual: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Proposta ID <span className="font-normal text-slate-400">(opcional)</span></label>
                <input
                  type="number"
                  placeholder="ID da proposta vinculada"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800"
                  value={form.proposta_id}
                  onChange={e => setForm({ ...form, proposta_id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Observações <span className="font-normal text-slate-400">(opcional)</span></label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-800 resize-none"
                  value={form.observacoes}
                  onChange={e => setForm({ ...form, observacoes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-60">
                  {submitting ? "Salvando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filtro de Status */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => handleFilter(f.key)}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${
              filtroStatus === f.key
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex justify-center items-center gap-3">
            <div className="w-6 h-6 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-sm text-slate-400 font-medium">Carregando...</span>
          </div>
        ) : comissoes.length === 0 ? (
          <div className="py-20 text-center text-slate-400 italic">Nenhuma comissão encontrada.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Imóvel</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Corretor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Imóvel</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">%</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Comissão</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {comissoes.map((c: any) => {
                const s = STATUS_LABELS[c.situacao_pagamento] ?? STATUS_LABELS["pendente"];
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">#{c.imovel_id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{c.corretor?.nome ?? `#${c.corretor_id}`}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{fmt(parseFloat(c.valor_imovel))}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{(parseFloat(c.percentual) * 100).toFixed(2)}%</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{fmt(parseFloat(c.valor_comissao))}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(c.criado_em).toLocaleDateString("pt-BR")}</td>
                    <td className="px-6 py-4">
                      {c.situacao_pagamento === "pendente" && (
                        <button
                          onClick={() => handleStatusChange(c.id, "pago")}
                          className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition mr-1"
                        >
                          Marcar Pago
                        </button>
                      )}
                      {c.situacao_pagamento === "pendente" && (
                        <button
                          onClick={() => handleStatusChange(c.id, "cancelado")}
                          className="text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
                        >
                          Cancelar
                        </button>
                      )}
                      {c.situacao_pagamento !== "pendente" && (
                        <span className="text-[10px] text-slate-300 font-bold">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
