"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import PlanGate from "@/app/components/PlanGate";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

interface Tag {
  id: number;
  nome: string;
  cor: string;
  criado_em: string;
}

const CORES = [
  { label: "Vermelho", value: "bg-red-500" },
  { label: "Laranja", value: "bg-orange-500" },
  { label: "Amarelo", value: "bg-yellow-500" },
  { label: "Verde", value: "bg-emerald-500" },
  { label: "Azul", value: "bg-blue-500" },
  { label: "Roxo", value: "bg-purple-500" },
  { label: "Rosa", value: "bg-pink-500" },
  { label: "Cinza", value: "bg-slate-500" },
];

export default function TagsPage() {
  const { user, token } = useAuth();
  const hasWhatsApp = user?.tipo_plano === "pro" || user?.tipo_plano === "premium";

  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Tag | null>(null);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("bg-emerald-500");
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
      const res = await fetch(`${API}/api/v1/whatsapp/tags`, { headers: headers() });
      if (res.ok) setTags(await res.json());
    } finally { setLoading(false); }
  }, [token, headers]);

  useEffect(() => { if (hasWhatsApp) carregar(); }, [hasWhatsApp, carregar]);

  const abrirForm = (t?: Tag) => {
    setEditando(t ?? null);
    setNome(t?.nome ?? "");
    setCor(t?.cor ?? "bg-emerald-500");
    setError("");
    setShowForm(true);
  };

  const salvar = async () => {
    if (!nome.trim()) { setError("O nome é obrigatório."); return; }
    setSaving(true);
    setError("");
    try {
      const url = editando
        ? `${API}/api/v1/whatsapp/tags/${editando.id}`
        : `${API}/api/v1/whatsapp/tags`;
      const res = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify({ nome: nome.trim(), cor }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || "Erro ao salvar."); return; }
      setShowForm(false);
      carregar();
    } finally { setSaving(false); }
  };

  const deletar = async (id: number) => {
    if (!confirm("Remover esta tag?")) return;
    await fetch(`${API}/api/v1/whatsapp/tags/${id}`, { method: "DELETE", headers: headers() });
    carregar();
  };

  if (!hasWhatsApp) {
    return <PlanGate hasFeature={false} featureName="Tags WhatsApp" requiredPlan="Pro"><></></PlanGate>;
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-slate-900">Tags</h1>
            <p className="text-xs text-slate-400 mt-0.5">Classifique conversas com etiquetas coloridas</p>
          </div>
          <button onClick={() => abrirForm()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nova Tag
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 shrink-0">
          <h2 className="text-sm font-black text-slate-800 mb-3">{editando ? "Editar Tag" : "Nova Tag"}</h2>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nome *</label>
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: VIP, Urgente, Follow-up..." className="w-full max-w-xs px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Cor</label>
              <div className="flex gap-2 flex-wrap">
                {CORES.map(c => (
                  <button key={c.value} onClick={() => setCor(c.value)} title={c.label}
                    className={`w-7 h-7 rounded-full ${c.value} ring-2 ring-offset-2 transition ${cor === c.value ? "ring-slate-600" : "ring-transparent"}`}
                  />
                ))}
              </div>
            </div>
            {nome && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Preview</label>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-bold ${cor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />{nome}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
            <button onClick={salvar} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tags criadas</span>
            <span className="text-xs text-slate-400">{tags.length} tag{tags.length !== 1 ? "s" : ""}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              </div>
              <p className="text-sm font-bold text-slate-600 mb-1">Nenhuma tag criada</p>
              <p className="text-xs text-slate-400">Crie tags para organizar e filtrar conversas.</p>
            </div>
          ) : (
            <div className="px-5 py-4 flex flex-wrap gap-2">
              {tags.map(t => (
                <div key={t.id} className="flex items-center gap-2 group">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold ${t.cor}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60" />{t.nome}
                  </span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => abrirForm(t)} className="p-1 text-slate-400 hover:text-blue-600 rounded transition" title="Editar">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => deletar(t.id)} className="p-1 text-slate-400 hover:text-red-600 rounded transition" title="Remover">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
