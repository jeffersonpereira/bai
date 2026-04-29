"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CardImovelSkeleton } from "@/app/components/ui/Skeleton";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Visit {
  id: number;
  imovel_id: number;
  situacao: "pendente" | "confirmado" | "cancelado" | "realizado";
  data_visita: string;
  data_fim_visita: string | null;
  nome_visitante: string;
  observacoes: string | null;
  feedback_visita: string | null;
  imovel: {
    id: number;
    titulo: string;
    bairro: string | null;
    cidade: string | null;
    url_imagem: string | null;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  confirmado: {
    label: "Confirmada",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
    card: "border-emerald-200 bg-emerald-50/40",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    date: "bg-emerald-50 border-emerald-100 text-emerald-600",
    banner: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  pendente: {
    label: "Aguardando confirmação",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    card: "border-amber-200 bg-amber-50/30",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    date: "bg-amber-50 border-amber-100 text-amber-600",
    banner: "bg-amber-50 border-amber-200 text-amber-800",
  },
  cancelado: {
    label: "Cancelada",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    card: "border-red-100 bg-white",
    badge: "bg-red-50 text-red-600 border-red-200",
    date: "bg-slate-50 border-slate-100 text-slate-500",
    banner: "bg-red-50 border-red-200 text-red-800",
  },
  realizado: {
    label: "Realizada",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    card: "border-blue-100 bg-white",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    date: "bg-blue-50 border-blue-100 text-blue-600",
    banner: "bg-blue-50 border-blue-200 text-blue-800",
  },
} as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "short", day: "2-digit", month: "short",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Visit Card ───────────────────────────────────────────────────────────────

function VisitCard({ v }: { v: Visit }) {
  const cfg = STATUS_CONFIG[v.situacao] ?? STATUS_CONFIG.pendente;
  const isConfirmed = v.situacao === "confirmado";
  const isPending = v.situacao === "pendente";
  const imgSrc = v.imovel?.url_imagem || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80";

  return (
    <div className={`rounded-3xl border p-5 flex flex-col sm:flex-row gap-5 transition ${cfg.card}`}>
      {/* Image */}
      <div className="w-full sm:w-28 h-28 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
        <img src={imgSrc} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {/* Status banner */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold ${cfg.banner}`}>
          {cfg.icon}
          <span>{cfg.label}</span>
          {isConfirmed && (
            <span className="ml-auto text-xs font-black uppercase tracking-wider text-emerald-600">
              Sua visita está confirmada!
            </span>
          )}
          {isPending && (
            <span className="ml-auto text-xs font-normal text-amber-600">
              O corretor ainda não confirmou
            </span>
          )}
        </div>

        {/* Property + date */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/properties/${v.imovel_id}`}
              className="font-black text-slate-900 hover:text-blue-600 transition text-base block truncate"
            >
              {v.imovel?.titulo || `Imóvel #${v.imovel_id}`}
            </Link>
            {(v.imovel?.bairro || v.imovel?.cidade) && (
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {[v.imovel.bairro, v.imovel.cidade].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          {/* Date block */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0 ${cfg.date}`}>
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <div className="text-[10px] font-black uppercase">{fmtDate(v.data_visita)}</div>
              <div className="text-sm font-black">{fmtTime(v.data_visita)}h</div>
            </div>
          </div>
        </div>

        {/* Observations */}
        {v.observacoes && (
          <p className="text-xs text-slate-500 italic bg-white/60 px-3 py-2 rounded-xl border border-slate-100">
            "{v.observacoes}"
          </p>
        )}

        {/* Feedback from broker */}
        {v.feedback_visita && (
          <div className="text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
            <span className="font-black">Feedback do corretor: </span>
            {v.feedback_visita}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 mt-auto pt-1">
          <Link
            href={`/properties/${v.imovel_id}`}
            className="text-xs font-black text-blue-600 hover:underline"
          >
            Ver imóvel →
          </Link>
          <span className={`ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${cfg.badge}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BuyerDashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfile, setActiveProfile] = useState<any>(null);

  const [exactProps, setExactProps] = useState<any[]>([]);
  const [expandedProps, setExpandedProps] = useState<any[]>([]);
  const [newProps, setNewProps] = useState<any[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("bai_token");
      if (!token) { router.push("/login"); return; }

      try {
        const [profilesRes, visitsRes, newRes] = await Promise.all([
          fetch(`${API}/api/v1/match/profiles`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/v1/agendamentos/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/v1/visualizacoes/properties/new?limit=12`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (profilesRes.ok) {
          const data = await profilesRes.json();
          setProfiles(data);
          if (data.length > 0) setActiveProfile(data[0]);
        }
        if (visitsRes.ok) setVisits(await visitsRes.json());
        if (newRes.ok) setNewProps(await newRes.json());
      } catch (err) {
        console.error("Erro ao carregar painel:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!activeProfile) return;
    const fetchMatches = async () => {
      setLoadingMatches(true);
      const token = localStorage.getItem("bai_token");
      try {
        const [resExact, resExp] = await Promise.all([
          fetch(`${API}/api/v1/match/properties/${activeProfile.id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/v1/match/properties/${activeProfile.id}?expanded=true`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (resExact.ok) setExactProps(await resExact.json());
        if (resExp.ok) setExpandedProps(await resExp.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchMatches();
  }, [activeProfile]);

  const CardImovel = useCallback(({ p }: { p: any }) => (
    <Link href={`/properties/${p.id}`} className="group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      <div className="h-56 bg-slate-100 relative overflow-hidden shrink-0">
        <img src={p.url_imagem || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        {activeProfile?.financiamento_aprovado && p.aceita_financiamento && (
          <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur text-white px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest shadow-sm">
            ACEITA FINANCIAMENTO
          </div>
        )}
        <div className="absolute bottom-4 left-4 bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm border border-white/20">
          {p.area}m²
        </div>
      </div>
      <div className="p-5 flex flex-col grow">
        <div className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mb-1.5">{p.bairro}, {p.cidade}</div>
        <h3 className="font-bold text-slate-900 text-base mb-4 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors h-11">{p.titulo}</h3>
        <div className="mt-auto">
          <div className="flex items-center gap-3 text-slate-500 font-medium text-xs pt-4 border-t border-slate-50 mb-4">
            {p.quartos > 0 && <span>{p.quartos} {p.quartos === 1 ? "Quarto" : "Quartos"}</span>}
            {p.banheiros > 0 && <span>{p.banheiros} {p.banheiros === 1 ? "Banho" : "Banhos"}</span>}
          </div>
          <div className="font-black text-2xl text-slate-900 tracking-tight">
            R$ {p.preco?.toLocaleString("pt-BR") ?? "—"}
          </div>
        </div>
      </div>
    </Link>
  ), [activeProfile]);

  // Derived: visits that need attention (pending = require confirmation from broker)
  const pendingVisits = visits.filter((v) => v.situacao === "pendente");
  const confirmedVisits = visits.filter((v) => v.situacao === "confirmado");
  const upcomingVisits = visits.filter((v) => v.situacao === "pendente" || v.situacao === "confirmado");
  const pastVisits = visits.filter((v) => v.situacao === "realizado" || v.situacao === "cancelado");

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="h-10 w-56 bg-slate-100 animate-pulse rounded-xl mb-8" />
        <div className="h-40 bg-slate-100 animate-pulse rounded-3xl mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <CardImovelSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Para Você</h1>
          <p className="text-slate-500 font-medium text-lg">Suas curadorias inteligentes prontas para explorar.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/seller" className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-full shadow-sm hover:bg-slate-50 transition text-sm flex items-center gap-2">
            Meus Anúncios
          </Link>
          <Link href="/dashboard/buyer/financing" className="px-6 py-3.5 bg-slate-100 text-slate-900 font-bold rounded-full hover:bg-slate-200 transition text-sm flex items-center gap-2">
            Financiamento
          </Link>
          <Link href="/announce" className="px-6 py-3.5 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition text-sm flex items-center gap-2">
            Anunciar Imóvel
          </Link>
          <Link href="/dashboard/buyer/profile" className="px-6 py-3.5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition text-sm">
            Criar Perfil de Busca
          </Link>
        </div>
      </div>

      {/* ── Minhas Visitas (sempre visível quando há agendamentos) ── */}
      {visits.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Minhas Visitas</h2>
            </div>
            <div className="flex items-center gap-2">
              {confirmedVisits.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full border border-emerald-200">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  {confirmedVisits.length} confirmada{confirmedVisits.length !== 1 ? "s" : ""}
                </span>
              )}
              {pendingVisits.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-black rounded-full border border-amber-200">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {pendingVisits.length} aguardando
                </span>
              )}
            </div>
          </div>

          {/* Próximas */}
          {upcomingVisits.length > 0 && (
            <div className="space-y-4 mb-6">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Próximas</p>
              {upcomingVisits.map((v) => <VisitCard key={v.id} v={v} />)}
            </div>
          )}

          {/* Histórico */}
          {pastVisits.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 list-none mb-3 select-none">
                <svg className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                Histórico ({pastVisits.length})
              </summary>
              <div className="space-y-4">
                {pastVisits.map((v) => <VisitCard key={v.id} v={v} />)}
              </div>
            </details>
          )}
        </section>
      )}

      {/* ── Sem perfis de busca ── */}
      {profiles.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-[3rem] text-center shadow-sm max-w-3xl mx-auto my-12">
          <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Seu feed está vazio!</h2>
          <p className="text-slate-500 text-lg mb-8 max-w-lg mx-auto">
            A mágica acontece quando você nos diz o que procura. Crie seu primeiro Perfil de Busca e deixe o trabalho pesado conosco.
          </p>
          <Link
            href="/dashboard/buyer/profile"
            className="inline-block px-10 py-4 bg-blue-600 text-white font-black rounded-full shadow-soft hover:scale-105 hover:bg-blue-700 transition-all"
          >
            Começar Agora
          </Link>
        </div>
      ) : (
        <>
          {/* Perfis de busca */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Seus Perfis de Busca
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((prof) => {
                const isActive = activeProfile?.id === prof.id;
                return (
                  <div
                    key={prof.id}
                    onClick={() => setActiveProfile(prof)}
                    className={`relative p-5 rounded-3xl border transition-all cursor-pointer group ${
                      isActive
                        ? "bg-white border-blue-500 ring-4 ring-blue-500/5 shadow-md"
                        : "bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`font-black text-lg ${isActive ? "text-blue-600" : "text-slate-700 group-hover:text-slate-900"}`}>
                        {prof.nome_perfil}
                      </h3>
                      {isActive && <div className="bg-blue-600 text-white p-1 rounded-full text-[8px] animate-pulse">✨</div>}
                    </div>
                    <div className="space-y-1 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                      <div>📍 {prof.bairro ? `${prof.bairro}, ` : ""}{prof.cidade || "Toda cidade"}</div>
                      <div>💰 R$ {prof.preco_minimo?.toLocaleString() || "0"} - {prof.preco_maximo ? `R$ ${prof.preco_maximo.toLocaleString()}` : "Ilimitado"}</div>
                      <div>🛏️ {prof.quartos_minimo || "0"}+ Quartos • {prof.tipo_imovel || "Qualquer tipo"}</div>
                    </div>
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className={`text-[9px] font-black tracking-widest ${isActive ? "text-blue-600" : "text-slate-300"}`}>
                        {isActive ? "PERFIL ATIVO" : "CLIQUE PARA ATIVAR"}
                      </div>
                      <Link
                        href={`/dashboard/buyer/profile?id=${prof.id}`}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all text-xs font-bold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                );
              })}
              <Link
                href="/dashboard/buyer/profile"
                className="flex flex-col items-center justify-center p-5 rounded-3xl border border-dashed border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all text-slate-400 group h-full min-h-[160px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl mb-2 group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                  +
                </div>
                <span className="font-bold text-sm">Criar Outro Perfil</span>
              </Link>
            </div>
          </div>

          {loadingMatches ? (
            <div className="flex items-center gap-4 py-20 text-blue-600 font-bold justify-center">
              <span className="w-5 h-5 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              Encontrando os melhores matches...
            </div>
          ) : (
            <div className="space-y-16">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Matches Perfeitos</h2>
                </div>
                {exactProps.length === 0 ? (
                  <div className="bg-slate-50 p-8 rounded-3xl text-center border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">Não achamos imóveis com 100% dos critérios. Veja nossas sugestões abaixo!</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {exactProps.map((m, idx) => <CardImovel key={`exact-${m.property.id || idx}`} p={m.property} />)}
                  </div>
                )}
              </section>

              <section className="bg-blue-50/50 p-6 md:p-10 rounded-[3rem] border border-blue-100/50">
                <div className="flex flex-col mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Descubra Mais</h2>
                  <p className="text-slate-500 font-medium text-sm">Expandimos levemente seu raio de vizinhança e limite orçamentário.</p>
                </div>
                {expandedProps.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 font-medium">Infelizmente, nem expandindo os limites achamos opções.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {expandedProps.map((m, idx) => <CardImovel key={`exp-${m.property.id || idx}`} p={m.property} />)}
                  </div>
                )}
              </section>
            </div>
          )}

          {newProps.length > 0 && (
            <section className="mt-12 pt-12 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Novos para Você</h2>
                  <p className="text-slate-500 text-sm font-medium mt-0.5">Imóveis publicados que você ainda não visualizou.</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {newProps.map((p, idx) => <CardImovel key={`new-${p.id || idx}`} p={p} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
