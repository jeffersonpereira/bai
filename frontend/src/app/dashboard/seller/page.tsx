"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/app/components/ui/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyStat {
  id: number;
  titulo: string;
  preco: number;
  cidade: string | null;
  bairro: string | null;
  url_imagem: string | null;
  tipo_oferta: string | null;
  situacao: string | null;
  leads_count: number;
  visits_count: number;
  proposals_count: number;
  pending_proposals: number;
  pending_visits: number;
}

interface Lead {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  origem: string | null;
  situacao: string;
  criado_em: string;
}

interface Appointment {
  id: number;
  nome_visitante: string;
  telefone_visitante: string;
  data_visita: string;
  situacao: string;
  observacoes: string | null;
}

interface Proposal {
  id: number;
  nome_comprador: string;
  email_comprador: string | null;
  telefone_comprador: string | null;
  valor_ofertado: number;
  forma_pagamento: string;
  percentual_financiamento: number | null;
  condicoes: string | null;
  mensagem: string | null;
  situacao: string;
  criado_em: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtPrice = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_VISIT: Record<string, { label: string; color: string }> = {
  pendente:   { label: "Aguardando", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmado: { label: "Confirmada",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelado:  { label: "Cancelada",   color: "bg-red-50 text-red-600 border-red-200" },
  realizado:  { label: "Realizada",   color: "bg-blue-50 text-blue-700 border-blue-200" },
};

const STATUS_PROPOSAL: Record<string, { label: string; color: string }> = {
  pendente:       { label: "Aguardando análise", color: "bg-amber-50 text-amber-700 border-amber-200" },
  visualizada:    { label: "Visualizada",        color: "bg-blue-50 text-blue-600 border-blue-200" },
  encaminhada:    { label: "Encaminhada",        color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  aceita:         { label: "Aceita",             color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  recusada:       { label: "Recusada",           color: "bg-red-50 text-red-600 border-red-200" },
  contraproposta: { label: "Contraproposta",     color: "bg-violet-50 text-violet-700 border-violet-200" },
};

const PAYMENT_LABEL: Record<string, string> = {
  avista:        "À Vista",
  financiamento: "Financiamento",
  misto:         "Misto",
};

const TIPO_OFERTA_LABEL: Record<string, string> = {
  venda:     "Venda",
  aluguel:   "Aluguel",
  temporada: "Temporada",
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, highlight }: { label: string; value: number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${highlight ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${highlight ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-black ${highlight ? "text-amber-700" : "text-slate-900"}`}>{value}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  );
}

// ─── WhatsApp icon ────────────────────────────────────────────────────────────

const WAIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// ─── Property filter types ────────────────────────────────────────────────────

type PropertyFilter = "all" | "pending_visits" | "pending_proposals";

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "leads" | "visitas" | "propostas";

export default function SellerDashboard() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [properties, setProperties] = useState<PropertyStat[]>([]);
  const [selected, setSelected] = useState<PropertyStat | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("propostas");
  const [loading, setLoading] = useState(true);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Property search/filter state
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>("all");

  // Auth guard + initial load
  useEffect(() => {
    const token = localStorage.getItem("bai_token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API}/api/v1/vendedor/properties`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: PropertyStat[]) => {
        setProperties(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .catch(() => toastError("Erro ao carregar seus imóveis"))
      .finally(() => setLoading(false));
  }, [router]);

  // Filtered properties based on search and filter
  const filteredProperties = useMemo(() => {
    let list = properties;
    const q = propertySearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.titulo.toLowerCase().includes(q) ||
          (p.cidade ?? "").toLowerCase().includes(q) ||
          (p.bairro ?? "").toLowerCase().includes(q)
      );
    }
    if (propertyFilter === "pending_visits") {
      list = list.filter((p) => p.pending_visits > 0);
    } else if (propertyFilter === "pending_proposals") {
      list = list.filter((p) => p.pending_proposals > 0);
    }
    return list;
  }, [properties, propertySearch, propertyFilter]);

  const totalPendingVisits = useMemo(
    () => properties.reduce((acc, p) => acc + p.pending_visits, 0),
    [properties]
  );
  const totalPendingProposals = useMemo(
    () => properties.reduce((acc, p) => acc + p.pending_proposals, 0),
    [properties]
  );

  // Load tab data whenever selected property or tab changes
  const loadTabData = useCallback(async () => {
    if (!selected) return;
    const token = localStorage.getItem("bai_token");
    setTabLoading(true);
    try {
      const base = `${API}/api/v1/vendedor/properties/${selected.id}`;
      if (activeTab === "leads") {
        const r = await fetch(`${base}/leads`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) setLeads(await r.json());
      } else if (activeTab === "visitas") {
        const r = await fetch(`${base}/appointments`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) setAppointments(await r.json());
      } else {
        const r = await fetch(`${base}/proposals`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) setProposals(await r.json());
      }
    } finally {
      setTabLoading(false);
    }
  }, [selected, activeTab]);

  useEffect(() => { loadTabData(); }, [loadTabData]);

  const changeVisitStatus = async (visitId: number, situacao: "confirmado" | "cancelado" | "realizado") => {
    const token = localStorage.getItem("bai_token");
    try {
      const r = await fetch(`${API}/api/v1/agendamentos/${visitId}/status?situacao=${situacao}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error((await r.json()).detail ?? "Erro");
      setAppointments((prev) =>
        prev.map((a) => (a.id === visitId ? { ...a, situacao } : a))
      );
      setProperties((prev) =>
        prev.map((p) =>
          p.id === selected?.id && situacao !== "confirmado"
            ? { ...p, pending_visits: Math.max(0, p.pending_visits - 1) }
            : p
        )
      );
      if (selected && situacao !== "confirmado") {
        setSelected({ ...selected, pending_visits: Math.max(0, selected.pending_visits - 1) });
      }
      success(
        situacao === "confirmado" ? "Visita confirmada!"
        : situacao === "cancelado" ? "Visita cancelada."
        : "Visita marcada como realizada."
      );
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Erro ao atualizar visita");
    }
  };

  const decideProposal = async (proposalId: number, status: "aceita" | "recusada" | "contraproposta") => {
    const token = localStorage.getItem("bai_token");
    try {
      const r = await fetch(`${API}/api/v1/vendedor/proposals/${proposalId}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error((await r.json()).detail ?? "Erro");
      const updated = await r.json();
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, situacao: updated.situacao } : p))
      );
      setProperties((prev) =>
        prev.map((p) =>
          p.id === selected?.id
            ? { ...p, pending_proposals: Math.max(0, p.pending_proposals - 1) }
            : p
        )
      );
      success(
        status === "aceita" ? "Proposta aceita! O comprador será notificado."
        : status === "recusada" ? "Proposta recusada."
        : "Contraproposta registrada."
      );
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Erro ao processar decisão");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="skeleton h-8 w-48 rounded-xl mb-8" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="skeleton h-96 rounded-3xl" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">Nenhum imóvel anunciado</h2>
        <p className="text-slate-500 mb-8">Anuncie seu imóvel para começar a receber visitas e propostas.</p>
        <Link href="/announce" className="inline-block px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">
          Anunciar Imóvel
        </Link>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; count: number; pendingCount?: number }[] = [
    { id: "propostas", label: "Propostas",    count: selected?.proposals_count ?? 0, pendingCount: selected?.pending_proposals },
    { id: "visitas",   label: "Visitas",      count: selected?.visits_count ?? 0,    pendingCount: selected?.pending_visits },
    { id: "leads",     label: "Interessados", count: selected?.leads_count ?? 0 },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-1">Painel do Vendedor</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Meus Imóveis</h1>
          <p className="text-sm text-slate-400 mt-1">{properties.length} anúncio{properties.length !== 1 ? "s" : ""} cadastrado{properties.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/announce"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition text-sm shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Anunciar Imóvel
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Property selector panel ── */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            {/* Search input */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar imóvel..."
                  value={propertySearch}
                  onChange={(e) => setPropertySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter chips */}
            <div className="px-4 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setPropertyFilter("all")}
                className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  propertyFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setPropertyFilter("pending_visits")}
                className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  propertyFilter === "pending_visits"
                    ? "bg-orange-500 text-white"
                    : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Visitas pendentes
                {totalPendingVisits > 0 && (
                  <span className={`text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ${propertyFilter === "pending_visits" ? "bg-white/30 text-white" : "bg-orange-500 text-white"}`}>
                    {totalPendingVisits}
                  </span>
                )}
              </button>
              <button
                onClick={() => setPropertyFilter("pending_proposals")}
                className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  propertyFilter === "pending_proposals"
                    ? "bg-amber-500 text-white"
                    : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Propostas pendentes
                {totalPendingProposals > 0 && (
                  <span className={`text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ${propertyFilter === "pending_proposals" ? "bg-white/30 text-white" : "bg-amber-500 text-white"}`}>
                    {totalPendingProposals}
                  </span>
                )}
              </button>
            </div>

            {/* Property list */}
            <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
              {filteredProperties.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  Nenhum imóvel encontrado
                </div>
              ) : (
                filteredProperties.map((p) => {
                  const isSelected = selected?.id === p.id;
                  const hasPendingVisits = p.pending_visits > 0;
                  const hasPendingProposals = p.pending_proposals > 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition ${
                        isSelected
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                        {p.url_imagem && (
                          <img src={p.url_imagem} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{p.titulo}</div>
                        <div className={`text-xs truncate mt-0.5 ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                          {[p.bairro, p.cidade].filter(Boolean).join(", ") || fmtPrice(p.preco)}
                        </div>
                        {/* Badges row */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {p.tipo_oferta && (
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isSelected ? "bg-white/15 text-white/80" : "bg-slate-100 text-slate-500"}`}>
                              {TIPO_OFERTA_LABEL[p.tipo_oferta] ?? p.tipo_oferta}
                            </span>
                          )}
                          {hasPendingVisits && (
                            <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isSelected ? "bg-orange-400/30 text-orange-200" : "bg-orange-100 text-orange-600"}`}>
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {p.pending_visits} visita{p.pending_visits !== 1 ? "s" : ""}
                            </span>
                          )}
                          {hasPendingProposals && (
                            <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isSelected ? "bg-amber-400/30 text-amber-200" : "bg-amber-100 text-amber-700"}`}>
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {p.pending_proposals} proposta{p.pending_proposals !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer count */}
            {filteredProperties.length > 0 && filteredProperties.length < properties.length && (
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-center">
                Mostrando {filteredProperties.length} de {properties.length} imóveis
              </div>
            )}
          </div>
        </div>

        {/* ── Detail panel ── */}
        <div className="flex-1 min-w-0">
          {selected && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard
                  label="Propostas"
                  value={selected.proposals_count}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />
                <StatCard
                  label="Aguardando decisão"
                  value={selected.pending_proposals}
                  highlight={selected.pending_proposals > 0}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                  label="Visitas agendadas"
                  value={selected.visits_count}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
                <StatCard
                  label="Interessados"
                  value={selected.leads_count}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                />
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100">
                  {TABS.map((tab) => {
                    const hasPending = (tab.pendingCount ?? 0) > 0;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-4 px-6 text-sm font-bold transition flex items-center justify-center gap-2 ${
                          activeTab === tab.id
                            ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {tab.label}
                        {tab.count > 0 && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                            {tab.count}
                          </span>
                        )}
                        {hasPending && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${tab.id === "visitas" ? "bg-orange-100 text-orange-600" : "bg-amber-100 text-amber-700"}`}>
                            {tab.pendingCount} pend.
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-6">
                  {tabLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
                    </div>
                  ) : (
                    <>
                      {/* ── Proposals tab ── */}
                      {activeTab === "propostas" && (
                        <div className="space-y-4">
                          {proposals.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                              <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              <p className="font-medium">Nenhuma proposta recebida ainda</p>
                            </div>
                          ) : (
                            proposals.map((p) => {
                              const s = STATUS_PROPOSAL[p.situacao] ?? { label: p.situacao, color: "bg-slate-50 text-slate-500 border-slate-200" };
                              const isPending = p.situacao === "pendente";
                              return (
                                <div key={p.id} className={`rounded-2xl border p-6 transition ${isPending ? "border-amber-200 bg-amber-50/40" : "border-slate-100 bg-white"}`}>
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 flex-wrap mb-3">
                                        <span className="font-bold text-slate-900">{p.nome_comprador}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.color}`}>
                                          {s.label}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3">
                                        <div>
                                          <span className="text-slate-400 text-xs">Proposta</span>
                                          <div className="font-black text-lg text-slate-900">{fmtPrice(p.valor_ofertado)}</div>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 text-xs">Pagamento</span>
                                          <div className="font-semibold text-slate-700">{PAYMENT_LABEL[p.forma_pagamento] ?? p.forma_pagamento}
                                            {p.percentual_financiamento && <span className="text-slate-400 text-xs font-normal ml-1">({p.percentual_financiamento}%)</span>}
                                          </div>
                                        </div>
                                      </div>
                                      {p.condicoes && (
                                        <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg mb-2">
                                          <span className="font-bold">Condições:</span> {p.condicoes}
                                        </p>
                                      )}
                                      {p.mensagem && (
                                        <p className="text-xs text-slate-500 italic">"{p.mensagem}"</p>
                                      )}
                                      <div className="text-[10px] text-slate-400 mt-2">{fmtDate(p.criado_em)}</div>
                                    </div>

                                    {/* Contact + actions */}
                                    <div className="flex flex-col gap-2 shrink-0 min-w-[160px]">
                                      {p.telefone_comprador && (
                                        <a
                                          href={`https://wa.me/55${p.telefone_comprador.replace(/\D/g, "")}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                                        >
                                          <WAIcon />
                                          Contatar
                                        </a>
                                      )}
                                      {isPending && (
                                        <>
                                          <button
                                            onClick={() => decideProposal(p.id, "aceita")}
                                            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition"
                                          >
                                            Aceitar proposta
                                          </button>
                                          <button
                                            onClick={() => decideProposal(p.id, "recusada")}
                                            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition"
                                          >
                                            Recusar
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* ── Visits tab ── */}
                      {activeTab === "visitas" && (
                        <div className="space-y-3">
                          {/* Pending visits alert */}
                          {selected.pending_visits > 0 && (
                            <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-2xl mb-4">
                              <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-orange-800">
                                  {selected.pending_visits} visita{selected.pending_visits !== 1 ? "s" : ""} aguardando confirmação
                                </p>
                                <p className="text-xs text-orange-600">Entre em contato com o visitante para confirmar.</p>
                              </div>
                            </div>
                          )}

                          {appointments.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                              <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <p className="font-medium">Nenhuma visita agendada</p>
                            </div>
                          ) : (
                            appointments.map((a) => {
                              const s = STATUS_VISIT[a.situacao] ?? { label: a.situacao, color: "bg-slate-50 text-slate-500 border-slate-200" };
                              const isPending = a.situacao === "pendente";
                              return (
                                <div
                                  key={a.id}
                                  className={`rounded-2xl border p-5 flex items-center justify-between gap-4 transition ${
                                    isPending
                                      ? "border-orange-200 bg-orange-50/30"
                                      : "bg-white border-slate-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`rounded-xl p-3 text-center min-w-[64px] border ${isPending ? "bg-orange-50 border-orange-100" : "bg-blue-50 border-blue-100"}`}>
                                      <div className={`text-[10px] font-black uppercase ${isPending ? "text-orange-400" : "text-blue-400"}`}>
                                        {new Date(a.data_visita).toLocaleDateString("pt-BR", { month: "short" })}
                                      </div>
                                      <div className="text-xl font-black text-slate-900">{new Date(a.data_visita).getDate()}</div>
                                      <div className={`text-[10px] font-bold ${isPending ? "text-orange-600" : "text-blue-600"}`}>
                                        {new Date(a.data_visita).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-slate-900">{a.nome_visitante}</span>
                                        {isPending && (
                                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                                            Aguarda confirmação
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-slate-500 mt-0.5">{a.telefone_visitante}</div>
                                      {a.observacoes && <div className="text-xs text-slate-400 mt-1 italic">"{a.observacoes}"</div>}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.color}`}>
                                      {s.label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {a.telefone_visitante && (
                                        <a
                                          href={`https://wa.me/55${a.telefone_visitante.replace(/\D/g, "")}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition"
                                          title="WhatsApp"
                                        >
                                          <WAIcon />
                                        </a>
                                      )}
                                      {a.situacao === "pendente" && (
                                        <>
                                          <button
                                            onClick={() => changeVisitStatus(a.id, "confirmado")}
                                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black transition"
                                          >
                                            Confirmar
                                          </button>
                                          <button
                                            onClick={() => changeVisitStatus(a.id, "cancelado")}
                                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-[10px] font-black transition"
                                          >
                                            Cancelar
                                          </button>
                                        </>
                                      )}
                                      {a.situacao === "confirmado" && (
                                        <button
                                          onClick={() => changeVisitStatus(a.id, "realizado")}
                                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[10px] font-black transition"
                                        >
                                          Marcar realizada
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* ── Leads tab ── */}
                      {activeTab === "leads" && (
                        <div className="space-y-3">
                          {leads.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                              <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <p className="font-medium">Nenhum interessado ainda</p>
                            </div>
                          ) : (
                            leads.map((l) => (
                              <div key={l.id} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500 text-sm shrink-0">
                                    {l.nome[0]?.toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{l.nome}</div>
                                    <div className="text-xs text-slate-500">
                                      {[l.email, l.telefone].filter(Boolean).join(" · ")}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1">{fmtDate(l.criado_em)}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  {l.origem && (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-bold uppercase">
                                      {l.origem}
                                    </span>
                                  )}
                                  {l.telefone && (
                                    <a
                                      href={`https://wa.me/55${l.telefone.replace(/\D/g, "")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition"
                                      title="WhatsApp"
                                    >
                                      <WAIcon />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Property actions */}
              <div className="mt-4 flex items-center justify-between">
                <Link
                  href={`/properties/${selected.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-medium transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver anúncio
                </Link>
                <Link
                  href={`/announce/edit/${selected.id}`}
                  className="text-xs text-slate-400 hover:text-blue-600 font-medium transition"
                >
                  Editar anúncio →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
