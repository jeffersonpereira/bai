"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import PlanGate from "@/app/components/PlanGate";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

interface Campanha {
  id: number;
  nome: string;
  mensagem: string;
  situacao: string;
  total_envios: number;
  criado_em: string;
}

interface ListaContatos {
  id: number;
  nome: string;
  total: number;
  criado_em: string;
}

interface Config {
  mensagem_fora_horario: string | null;
  intervalo_campanha_seg: number;
  variacao_campanha_seg: number;
}

type Tab = "lista" | "listas-contatos" | "configuracoes";

const SIT_COLORS: Record<string, string> = {
  rascunho: "bg-slate-100 text-slate-500",
  em_andamento: "bg-blue-50 text-blue-700",
  concluida: "bg-emerald-50 text-emerald-700",
  cancelada: "bg-red-50 text-red-600",
};

const SIT_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function CampanhasPage() {
  const { user, token } = useAuth();
  const hasWhatsApp = user?.tipo_plano === "pro" || user?.tipo_plano === "premium";
  const [tab, setTab] = useState<Tab>("lista");

  // Campanhas
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [campLoading, setCampLoading] = useState(true);
  const [showCampForm, setShowCampForm] = useState(false);
  const [campForm, setCampForm] = useState({ nome: "", mensagem: "" });

  // Listas
  const [listas, setListas] = useState<ListaContatos[]>([]);
  const [listaLoading, setListaLoading] = useState(true);
  const [showListaForm, setShowListaForm] = useState(false);
  const [listaNome, setListaNome] = useState("");

  // Config
  const [config, setConfig] = useState<Config>({ mensagem_fora_horario: null, intervalo_campanha_seg: 5, variacao_campanha_seg: 3 });
  const [cfgLoading, setCfgLoading] = useState(false);
  const [cfgSaving, setCfgSaving] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const headers = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  const carregarCampanhas = useCallback(async () => {
    if (!token) return;
    setCampLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/campanhas`, { headers: headers() });
      if (res.ok) setCampanhas(await res.json());
    } finally { setCampLoading(false); }
  }, [token, headers]);

  const carregarListas = useCallback(async () => {
    if (!token) return;
    setListaLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/listas-contatos`, { headers: headers() });
      if (res.ok) setListas(await res.json());
    } finally { setListaLoading(false); }
  }, [token, headers]);

  const carregarConfig = useCallback(async () => {
    if (!token) return;
    setCfgLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/config`, { headers: headers() });
      if (res.ok) setConfig(await res.json());
    } finally { setCfgLoading(false); }
  }, [token, headers]);

  useEffect(() => {
    if (!hasWhatsApp) return;
    carregarCampanhas();
    carregarListas();
    carregarConfig();
  }, [hasWhatsApp, carregarCampanhas, carregarListas, carregarConfig]);

  const salvarCampanha = async () => {
    if (!campForm.nome.trim() || !campForm.mensagem.trim()) { setError("Nome e mensagem são obrigatórios."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/campanhas`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ nome: campForm.nome.trim(), mensagem: campForm.mensagem.trim() }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || "Erro."); return; }
      setShowCampForm(false);
      setCampForm({ nome: "", mensagem: "" });
      carregarCampanhas();
    } finally { setSaving(false); }
  };

  const deletarCampanha = async (id: number) => {
    if (!confirm("Remover esta campanha?")) return;
    await fetch(`${API}/api/v1/whatsapp/campanhas/${id}`, { method: "DELETE", headers: headers() });
    carregarCampanhas();
  };

  const salvarLista = async () => {
    if (!listaNome.trim()) { setError("Nome é obrigatório."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API}/api/v1/whatsapp/listas-contatos`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ nome: listaNome.trim() }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || "Erro."); return; }
      setShowListaForm(false); setListaNome("");
      carregarListas();
    } finally { setSaving(false); }
  };

  const deletarLista = async (id: number) => {
    if (!confirm("Remover esta lista?")) return;
    await fetch(`${API}/api/v1/whatsapp/listas-contatos/${id}`, { method: "DELETE", headers: headers() });
    carregarListas();
  };

  const salvarConfig = async () => {
    setCfgSaving(true);
    try {
      await fetch(`${API}/api/v1/whatsapp/config`, {
        method: "PUT", headers: headers(),
        body: JSON.stringify({ intervalo_campanha_seg: config.intervalo_campanha_seg, variacao_campanha_seg: config.variacao_campanha_seg }),
      });
    } finally { setCfgSaving(false); }
  };

  if (!hasWhatsApp) {
    return <PlanGate hasFeature={false} featureName="Campanhas WhatsApp" requiredPlan="Pro"><></></PlanGate>;
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "lista", label: "Campanhas" },
    { id: "listas-contatos", label: "Listas de Contatos" },
    { id: "configuracoes", label: "Configurações" },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 pt-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-black text-slate-900">Campanhas</h1>
            <p className="text-xs text-slate-400 mt-0.5">Envie mensagens em massa para listas de contatos</p>
          </div>
          {tab === "lista" && (
            <button onClick={() => { setShowCampForm(true); setError(""); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Nova Campanha
            </button>
          )}
          {tab === "listas-contatos" && (
            <button onClick={() => { setShowListaForm(true); setError(""); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Nova Lista
            </button>
          )}
        </div>
        <div className="flex gap-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition ${tab === t.id ? "border-emerald-600 text-emerald-700 bg-emerald-50" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Inline form */}
      {tab === "lista" && showCampForm && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 shrink-0">
          <h2 className="text-sm font-black text-slate-800 mb-3">Nova Campanha</h2>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="space-y-3 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nome *</label>
              <input value={campForm.nome} onChange={e => setCampForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome da campanha" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mensagem *</label>
              <textarea value={campForm.mensagem} onChange={e => setCampForm(f => ({ ...f, mensagem: e.target.value }))} placeholder="Escreva a mensagem que será enviada..." rows={3} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowCampForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
            <button onClick={salvarCampanha} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">{saving ? "Salvando..." : "Criar Campanha"}</button>
          </div>
        </div>
      )}
      {tab === "listas-contatos" && showListaForm && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 shrink-0">
          <h2 className="text-sm font-black text-slate-800 mb-3">Nova Lista de Contatos</h2>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-600 mb-1">Nome *</label>
            <input value={listaNome} onChange={e => setListaNome(e.target.value)} placeholder="Ex: Clientes VIP" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowListaForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
            <button onClick={salvarLista} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">{saving ? "Salvando..." : "Criar Lista"}</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {tab === "lista" && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campanhas</span>
              <span className="text-xs text-slate-400">{campanhas.length}</span>
            </div>
            {campLoading ? (
              <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : campanhas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                </div>
                <p className="text-sm font-bold text-slate-600 mb-1">Nenhuma campanha criada</p>
                <p className="text-xs text-slate-400">Crie campanhas para enviar mensagens em massa.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {campanhas.map(c => (
                  <div key={c.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-slate-800">{c.nome}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SIT_COLORS[c.situacao] ?? "bg-slate-100 text-slate-500"}`}>{SIT_LABELS[c.situacao] ?? c.situacao}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-1">{c.mensagem}</p>
                      <p className="text-[10px] text-slate-400">{fmtDate(c.criado_em)} · {c.total_envios} envio{c.total_envios !== 1 ? "s" : ""}</p>
                    </div>
                    <button onClick={() => deletarCampanha(c.id)} className="shrink-0 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Remover">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "listas-contatos" && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Listas</span>
              <span className="text-xs text-slate-400">{listas.length}</span>
            </div>
            {listaLoading ? (
              <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : listas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <p className="text-sm font-bold text-slate-600 mb-1">Nenhuma lista criada</p>
                <p className="text-xs text-slate-400">Crie listas de contatos para usar em campanhas.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {listas.map(l => (
                  <div key={l.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">{l.nome}</p>
                      <p className="text-xs text-slate-400">{l.total} contato{l.total !== 1 ? "s" : ""} · criada em {fmtDate(l.criado_em)}</p>
                    </div>
                    <button onClick={() => deletarLista(l.id)} className="shrink-0 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Remover">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "configuracoes" && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
            <div>
              <h2 className="text-sm font-black text-slate-800 mb-1">Configurações de Disparo</h2>
              <p className="text-xs text-slate-400">Controle o intervalo de envio para evitar bloqueios.</p>
            </div>
            {cfgLoading ? (
              <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Intervalo entre mensagens (segundos)</label>
                    <input type="number" min="1" value={config.intervalo_campanha_seg}
                      onChange={e => setConfig(c => ({ ...c, intervalo_campanha_seg: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Variação aleatória (segundos)</label>
                    <input type="number" min="0" value={config.variacao_campanha_seg}
                      onChange={e => setConfig(c => ({ ...c, variacao_campanha_seg: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={salvarConfig} disabled={cfgSaving} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">
                    {cfgSaving ? "Salvando..." : "Salvar Configurações"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
