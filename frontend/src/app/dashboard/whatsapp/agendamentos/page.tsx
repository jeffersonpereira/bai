"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import PlanGate from "@/app/components/PlanGate";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

interface Agendamento {
  id: number;
  destinatario: string;
  mensagem: string;
  agendado_para: string;
  situacao: string;
  criado_em: string;
}

const SITUACAO_COLORS: Record<string, string> = {
  pendente: "bg-amber-50 text-amber-700",
  enviado: "bg-emerald-50 text-emerald-700",
  cancelado: "bg-slate-100 text-slate-500",
  falhou: "bg-red-50 text-red-600",
};

const SITUACAO_LABELS: Record<string, string> = {
  pendente: "Pendente",
  enviado: "Enviado",
  cancelado: "Cancelado",
  falhou: "Falhou",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AgendamentosPage() {
  const { user, token } = useAuth();
  const hasWhatsApp = user?.tipo_plano === "pro" || user?.tipo_plano === "premium";

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ destinatario: "", mensagem: "", agendado_para: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const headers = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  const carregar = useCallback(async (sit = "") => {
    if (!token) return;
    setLoading(true);
    try {
      const url = `${API}/api/v1/whatsapp/agendamentos${sit ? `?situacao=${sit}` : ""}`;
      const res = await fetch(url, { headers: headers() });
      if (res.ok) setAgendamentos(await res.json());
    } finally { setLoading(false); }
  }, [token, headers]);

  useEffect(() => { if (hasWhatsApp) carregar(filtro); }, [hasWhatsApp, carregar, filtro]);

  const salvar = async () => {
    if (!form.destinatario.trim() || !form.mensagem.trim() || !form.agendado_para) {
      setError("Todos os campos são obrigatórios."); return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/agendamentos`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          destinatario: form.destinatario.trim(),
          mensagem: form.mensagem.trim(),
          agendado_para: new Date(form.agendado_para).toISOString(),
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || "Erro ao salvar."); return; }
      setShowForm(false);
      setForm({ destinatario: "", mensagem: "", agendado_para: "" });
      carregar(filtro);
    } finally { setSaving(false); }
  };

  const cancelar = async (id: number) => {
    if (!confirm("Cancelar este agendamento?")) return;
    await fetch(`${API}/api/v1/whatsapp/agendamentos/${id}`, { method: "DELETE", headers: headers() });
    carregar(filtro);
  };

  if (!hasWhatsApp) {
    return <PlanGate hasFeature={false} featureName="Agendamentos WhatsApp" requiredPlan="Pro"><></></PlanGate>;
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-black text-slate-900">Agendamentos</h1>
            <p className="text-xs text-slate-400 mt-0.5">Programe mensagens para envio futuro</p>
          </div>
          <button onClick={() => { setShowForm(true); setError(""); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Novo Agendamento
          </button>
        </div>
        <div className="flex gap-1.5">
          {[{ v: "", l: "Todos" }, { v: "pendente", l: "Pendentes" }, { v: "enviado", l: "Enviados" }, { v: "cancelado", l: "Cancelados" }].map(f => (
            <button key={f.v} onClick={() => setFiltro(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filtro === f.v ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >{f.l}</button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 shrink-0">
          <h2 className="text-sm font-black text-slate-800 mb-3">Novo Agendamento</h2>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Destinatário *</label>
              <input value={form.destinatario} onChange={e => setForm(f => ({ ...f, destinatario: e.target.value }))} placeholder="+5511999999999" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Data e Hora *</label>
              <input type="datetime-local" value={form.agendado_para} onChange={e => setForm(f => ({ ...f, agendado_para: e.target.value }))} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Mensagem *</label>
              <textarea value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))} placeholder="Escreva a mensagem..." rows={2} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
            <button onClick={salvar} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">{saving ? "Salvando..." : "Agendar"}</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agendamentos</span>
            <span className="text-xs text-slate-400">{agendamentos.length} registro{agendamentos.length !== 1 ? "s" : ""}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : agendamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-sm font-bold text-slate-600 mb-1">Nenhum agendamento</p>
              <p className="text-xs text-slate-400">Programe mensagens para envio automático.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {agendamentos.map(a => (
                <div key={a.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition">
                  <div className="shrink-0 pt-0.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-slate-800">{a.destinatario}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SITUACAO_COLORS[a.situacao] ?? "bg-slate-100 text-slate-500"}`}>
                        {SITUACAO_LABELS[a.situacao] ?? a.situacao}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1 line-clamp-2">{a.mensagem}</p>
                    <p className="text-[10px] text-slate-400">{fmtDate(a.agendado_para)}</p>
                  </div>
                  {a.situacao === "pendente" && (
                    <button onClick={() => cancelar(a.id)} className="shrink-0 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">Cancelar</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
