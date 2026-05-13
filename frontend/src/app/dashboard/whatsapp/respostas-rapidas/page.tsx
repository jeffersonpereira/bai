"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import PlanGate from "@/app/components/PlanGate";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

interface RespostaRapida {
  id: number;
  atalho: string;
  mensagem: string;
  criado_em: string;
}

export default function RespostasRapidasPage() {
  const { user, token } = useAuth();
  const hasWhatsApp = user?.tipo_plano === "pro" || user?.tipo_plano === "premium";

  const [respostas, setRespostas] = useState<RespostaRapida[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<RespostaRapida | null>(null);
  const [atalho, setAtalho] = useState("");
  const [mensagem, setMensagem] = useState("");
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
      const res = await fetch(`${API}/api/v1/whatsapp/respostas-rapidas`, { headers: headers() });
      if (res.ok) setRespostas(await res.json());
    } finally { setLoading(false); }
  }, [token, headers]);

  useEffect(() => { if (hasWhatsApp) carregar(); }, [hasWhatsApp, carregar]);

  const abrirForm = (r?: RespostaRapida) => {
    setEditando(r ?? null);
    setAtalho(r?.atalho ?? "");
    setMensagem(r?.mensagem ?? "");
    setError("");
    setShowForm(true);
  };

  const salvar = async () => {
    if (!atalho.trim() || !mensagem.trim()) { setError("Atalho e mensagem são obrigatórios."); return; }
    setSaving(true);
    setError("");
    try {
      const url = editando
        ? `${API}/api/v1/whatsapp/respostas-rapidas/${editando.id}`
        : `${API}/api/v1/whatsapp/respostas-rapidas`;
      const res = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify({ atalho: atalho.trim(), mensagem: mensagem.trim() }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || "Erro ao salvar."); return; }
      setShowForm(false);
      carregar();
    } finally { setSaving(false); }
  };

  const deletar = async (id: number) => {
    if (!confirm("Remover esta resposta rápida?")) return;
    await fetch(`${API}/api/v1/whatsapp/respostas-rapidas/${id}`, { method: "DELETE", headers: headers() });
    carregar();
  };

  if (!hasWhatsApp) {
    return <PlanGate hasFeature={false} featureName="Respostas Rápidas" requiredPlan="Pro"><></></PlanGate>;
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-slate-900">Respostas Rápidas</h1>
            <p className="text-xs text-slate-400 mt-0.5">Crie atalhos para mensagens frequentes</p>
          </div>
          <button onClick={() => abrirForm()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nova Resposta
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 shrink-0">
          <h2 className="text-sm font-black text-slate-800 mb-3">{editando ? "Editar Resposta" : "Nova Resposta Rápida"}</h2>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Atalho *</label>
              <input value={atalho} onChange={e => setAtalho(e.target.value)} placeholder="/ola" className="w-full max-w-xs px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
              <p className="text-[10px] text-slate-400 mt-1">Use / no início. Ex: /boa-tarde</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mensagem *</label>
              <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} placeholder="Escreva a mensagem completa..." rows={3} className="w-full max-w-2xl px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 resize-none" />
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
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Respostas cadastradas</span>
            <span className="text-xs text-slate-400">{respostas.length} resposta{respostas.length !== 1 ? "s" : ""}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : respostas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-sm font-bold text-slate-600 mb-1">Nenhuma resposta rápida</p>
              <p className="text-xs text-slate-400">Crie atalhos para agilizar o atendimento.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {respostas.map(r => (
                <div key={r.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition">
                  <div className="shrink-0 mt-0.5">
                    <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg">{r.atalho}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600 leading-relaxed">{r.mensagem}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => abrirForm(r)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => deletar(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Remover">
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
