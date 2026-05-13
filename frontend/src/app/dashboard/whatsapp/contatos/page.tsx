"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import PlanGate from "@/app/components/PlanGate";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

interface Contato {
  id: number;
  nome: string;
  telefone: string;
  email?: string;
  notas?: string;
  criado_em: string;
}

export default function ContatosPage() {
  const { user, token } = useAuth();
  const hasWhatsApp = user?.tipo_plano === "pro" || user?.tipo_plano === "premium";

  const [contatos, setContatos] = useState<Contato[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Contato | null>(null);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", notas: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const headers = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  const carregar = useCallback(async (q = "") => {
    if (!token) return;
    setLoading(true);
    try {
      const url = `${API}/api/v1/whatsapp/contatos${q ? `?busca=${encodeURIComponent(q)}` : ""}`;
      const res = await fetch(url, { headers: headers() });
      if (res.ok) setContatos(await res.json());
    } finally { setLoading(false); }
  }, [token, headers]);

  useEffect(() => { if (hasWhatsApp) carregar(); }, [hasWhatsApp, carregar]);

  const abrirForm = (c?: Contato) => {
    if (c) {
      setEditando(c);
      setForm({ nome: c.nome, telefone: c.telefone, email: c.email ?? "", notas: c.notas ?? "" });
    } else {
      setEditando(null);
      setForm({ nome: "", telefone: "", email: "", notas: "" });
    }
    setError("");
    setShowForm(true);
  };

  const salvar = async () => {
    if (!form.nome.trim() || !form.telefone.trim()) { setError("Nome e telefone são obrigatórios."); return; }
    setSaving(true);
    setError("");
    try {
      const url = editando
        ? `${API}/api/v1/whatsapp/contatos/${editando.id}`
        : `${API}/api/v1/whatsapp/contatos`;
      const res = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify({ nome: form.nome, telefone: form.telefone, email: form.email || null, notas: form.notas || null }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || "Erro ao salvar."); return; }
      setShowForm(false);
      carregar(busca);
    } finally { setSaving(false); }
  };

  const deletar = async (id: number) => {
    if (!confirm("Remover este contato?")) return;
    await fetch(`${API}/api/v1/whatsapp/contatos/${id}`, { method: "DELETE", headers: headers() });
    carregar(busca);
  };

  if (!hasWhatsApp) {
    return <PlanGate hasFeature={false} featureName="Contatos WhatsApp" requiredPlan="Pro"><></></PlanGate>;
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-black text-slate-900">Contatos</h1>
            <p className="text-xs text-slate-400 mt-0.5">Gerencie seus contatos do WhatsApp</p>
          </div>
          <button onClick={() => abrirForm()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Novo Contato
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === "Enter" && carregar(busca)}
            placeholder="Buscar por nome ou telefone..."
            className="flex-1 max-w-sm px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          <button onClick={() => carregar(busca)} className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition">Buscar</button>
          {busca && <button onClick={() => { setBusca(""); carregar(""); }} className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600">Limpar</button>}
        </div>
      </div>

      {showForm && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 shrink-0">
          <h2 className="text-sm font-black text-slate-800 mb-3">{editando ? "Editar Contato" : "Novo Contato"}</h2>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nome *</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do contato" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Telefone *</label>
              <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="+5511999999999" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Notas</label>
              <input value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Observações..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
            <button onClick={salvar} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Todos os contatos</span>
            <span className="text-xs text-slate-400">{contatos.length} contato{contatos.length !== 1 ? "s" : ""}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : contatos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <p className="text-sm font-bold text-slate-600 mb-1">Nenhum contato cadastrado</p>
              <p className="text-xs text-slate-400">Clique em "Novo Contato" para adicionar.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {contatos.map(c => (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                    {c.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{c.nome}</p>
                    <p className="text-xs text-slate-400">{c.telefone}{c.email ? ` · ${c.email}` : ""}</p>
                    {c.notas && <p className="text-xs text-slate-300 truncate">{c.notas}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => abrirForm(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => deletar(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Remover">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
