"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import PlanGate from "@/app/components/PlanGate";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

interface Fila {
  id: number;
  nome: string;
  cor: string;
  saudacao?: string;
  criado_em: string;
}

export default function FilasPage() {
  const { user, token } = useAuth();
  const hasWhatsApp = user?.tipo_plano === "pro" || user?.tipo_plano === "premium";

  const [filas, setFilas] = useState<Fila[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Fila | null>(null);
  const [form, setForm] = useState({ nome: "", cor: "#10b981", saudacao: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const headers = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  const carregar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/filas`, { headers: headers() });
      if (res.ok) setFilas(await res.json());
    } finally { setLoading(false); }
  }, [token, headers]);

  useEffect(() => { if (hasWhatsApp) carregar(); }, [hasWhatsApp, carregar]);

  const abrirForm = (f?: Fila) => {
    setEditando(f ?? null);
    setForm({ nome: f?.nome ?? "", cor: f?.cor ?? "#10b981", saudacao: f?.saudacao ?? "" });
    setError("");
    setShowForm(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) { setError("O nome é obrigatório."); return; }
    setSaving(true);
    setError("");
    try {
      const url = editando
        ? `${API}/api/v1/whatsapp/filas/${editando.id}`
        : `${API}/api/v1/whatsapp/filas`;
      const res = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify({ nome: form.nome.trim(), cor: form.cor, saudacao: form.saudacao || null }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || "Erro ao salvar."); return; }
      setShowForm(false);
      carregar();
    } finally { setSaving(false); }
  };

  const deletar = async (id: number) => {
    if (!confirm("Remover esta fila?")) return;
    await fetch(`${API}/api/v1/whatsapp/filas/${id}`, { method: "DELETE", headers: headers() });
    carregar();
  };

  if (!hasWhatsApp) {
    return <PlanGate hasFeature={false} featureName="Filas de Atendimento" requiredPlan="Pro"><></></PlanGate>;
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-slate-900">Filas de Atendimento</h1>
            <p className="text-xs text-slate-400 mt-0.5">Organize atendimentos em departamentos e filas</p>
          </div>
          <button onClick={() => abrirForm()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nova Fila
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 shrink-0">
          <h2 className="text-sm font-black text-slate-800 mb-3">{editando ? "Editar Fila" : "Nova Fila"}</h2>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nome *</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Suporte, Vendas..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Cor</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer" />
                <span className="text-xs text-slate-500">{form.cor}</span>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Mensagem de Saudação</label>
              <textarea value={form.saudacao} onChange={e => setForm(f => ({ ...f, saudacao: e.target.value }))} placeholder="Olá! Você foi direcionado para nossa fila de..." rows={2} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 resize-none" />
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
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filas configuradas</span>
            <span className="text-xs text-slate-400">{filas.length} fila{filas.length !== 1 ? "s" : ""}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : filas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </div>
              <p className="text-sm font-bold text-slate-600 mb-1">Nenhuma fila criada</p>
              <p className="text-xs text-slate-400">Crie filas para distribuir atendimentos por departamento.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filas.map(f => (
                <div key={f.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition">
                  <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: f.cor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{f.nome}</p>
                    {f.saudacao && <p className="text-xs text-slate-400 truncate mt-0.5">{f.saudacao}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => abrirForm(f)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => deletar(f.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Remover">
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
