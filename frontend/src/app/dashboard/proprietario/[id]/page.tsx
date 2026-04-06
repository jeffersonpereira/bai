"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Visit {
  id: number;
  visitor_name: string;
  visitor_phone: string;
  visit_date: string;
  status: string;
  notes: string | null;
  feedback_visita: string | null;
}

interface Proposal {
  id: number;
  buyer_name: string;
  buyer_phone: string | null;
  proposed_price: number;
  payment_method: string;
  status: string;
  created_at: string;
  message: string | null;
}

interface PropertyPortfolio {
  id: number;
  title: string;
  price: number;
  valor_aluguel: number | null;
  city: string | null;
  neighborhood: string | null;
  image_url: string | null;
  listing_type: string | null;
  status: string;
  commission_percentage: number | null;
  created_at: string;
  leads_count: number;
  visits_count: number;
  proposals_count: number;
  pending_proposals: number;
  favorites_count: number;
  next_visit: { date: string; visitor: string; status: string } | null;
  visits: Visit[];
  proposals: Proposal[];
}

interface Portfolio {
  owner: { id: number; name: string; email: string | null; phone: string | null; notes: string | null };
  broker: { name: string | null; phone: string | null; email: string | null; creci: string | null };
  totals: { properties: number; visits: number; proposals: number; leads: number; pending_proposals: number };
  properties: PropertyPortfolio[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

const VISIT_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Aguardando", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmada",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed: { label: "Realizada",   cls: "bg-blue-50 text-blue-700 border-blue-200" },
  cancelled: { label: "Cancelada",   cls: "bg-red-50 text-red-600 border-red-200" },
};

const PROPOSAL_STATUS: Record<string, { label: string; cls: string }> = {
  pendente:       { label: "Aguardando", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  visualizada:    { label: "Visualizada", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  aceita:         { label: "Aceita",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  recusada:       { label: "Recusada",    cls: "bg-red-50 text-red-600 border-red-200" },
  contraproposta: { label: "Contraproposta", cls: "bg-violet-50 text-violet-700 border-violet-200" },
};

const LISTING_LABEL: Record<string, string> = {
  venda: "Venda", aluguel: "Aluguel", ambos: "Venda e Aluguel", temporada: "Temporada",
};

const PROPERTY_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:   { label: "Ativo",    cls: "bg-emerald-100 text-emerald-700" },
  archived: { label: "Pausado",  cls: "bg-slate-100 text-slate-500" },
  sold:     { label: "Vendido",  cls: "bg-blue-100 text-blue-700" },
  rented:   { label: "Alugado",  cls: "bg-indigo-100 text-indigo-700" },
  pending:  { label: "Pendente", cls: "bg-amber-100 text-amber-700" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className={`flex flex-col items-center px-5 py-3 rounded-2xl ${accent ?? "bg-slate-50"}`}>
      <span className="text-2xl font-black text-slate-900">{value}</span>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{children}</h4>;
}

// ─── Property Detail Panel ────────────────────────────────────────────────────

type DetailTab = "visitas" | "propostas";

function PropertyDetail({ prop }: { prop: PropertyPortfolio }) {
  const [tab, setTab] = useState<DetailTab>("propostas");

  const statusBadge = PROPERTY_STATUS_BADGE[prop.status] ?? { label: prop.status, cls: "bg-slate-100 text-slate-600" };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Property header */}
      <div className="flex gap-4 p-5 border-b border-slate-50">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
          <img
            src={prop.image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80"}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link href={`/properties/${prop.id}`} className="font-black text-slate-900 hover:text-blue-600 transition truncate text-sm">
              {prop.title}
            </Link>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            {prop.neighborhood && `${prop.neighborhood}, `}{prop.city} · {LISTING_LABEL[prop.listing_type ?? ""] ?? prop.listing_type}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-base font-black text-slate-900">{fmtCurrency(prop.price)}</span>
            {prop.valor_aluguel && (
              <span className="text-xs text-slate-400">{fmtCurrency(prop.valor_aluguel)}/mês</span>
            )}
            {prop.commission_percentage && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-lg">
                {prop.commission_percentage}% comissão
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 divide-x divide-slate-50 border-b border-slate-50 text-center">
        {[
          { label: "Leads", value: prop.leads_count },
          { label: "Visitas", value: prop.visits_count },
          { label: "Propostas", value: prop.proposals_count },
          { label: "Favoritos", value: prop.favorites_count },
        ].map(s => (
          <div key={s.label} className="py-3">
            <div className="text-lg font-black text-slate-900">{s.value}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Next visit alert */}
      {prop.next_visit && (
        <div className="mx-4 mt-4 flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <span className="text-lg">📅</span>
          <div>
            <p className="text-xs font-black text-indigo-900">Próxima visita</p>
            <p className="text-xs text-indigo-600 font-medium">
              {fmtDateTime(prop.next_visit.date)} · {prop.next_visit.visitor}
            </p>
          </div>
        </div>
      )}

      {/* Pending proposals alert */}
      {prop.pending_proposals > 0 && (
        <div className="mx-4 mt-2 flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <span className="text-lg">💬</span>
          <p className="text-xs font-black text-amber-900">
            {prop.pending_proposals} proposta{prop.pending_proposals > 1 ? "s" : ""} aguardando análise
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 pb-0 border-b border-slate-100 mt-4">
        {(["propostas", "visitas"] as DetailTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl capitalize transition relative ${
              tab === t
                ? "text-blue-600 bg-blue-50"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {t === "propostas" ? `Propostas (${prop.proposals_count})` : `Visitas (${prop.visits_count})`}
            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-sm" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {tab === "visitas" && (
          prop.visits.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">Nenhuma visita registrada</p>
          ) : (
            <div className="space-y-2">
              {prop.visits.map(v => {
                const s = VISIT_STATUS[v.status] ?? { label: v.status, cls: "bg-slate-100 text-slate-600" };
                return (
                  <div key={v.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${s.cls}`}>{s.label}</span>
                        <span className="text-xs font-bold text-slate-700">{v.visitor_name}</span>
                      </div>
                      <p className="text-xs text-slate-400">{fmtDateTime(v.visit_date)}</p>
                      {v.notes && <p className="text-xs text-slate-500 italic mt-1">"{v.notes}"</p>}
                      {v.feedback_visita && (
                        <div className="mt-1.5 bg-blue-50 px-3 py-2 rounded-lg">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Relato</span>
                          <p className="text-xs text-slate-600">{v.feedback_visita}</p>
                        </div>
                      )}
                    </div>
                    {v.visitor_phone && (
                      <a
                        href={`https://wa.me/55${v.visitor_phone.replace(/\D/g, "")}`}
                        target="_blank"
                        className="shrink-0 text-[10px] font-bold text-emerald-600 hover:underline"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === "propostas" && (
          prop.proposals.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">Nenhuma proposta recebida</p>
          ) : (
            <div className="space-y-2">
              {prop.proposals.map(pr => {
                const s = PROPOSAL_STATUS[pr.status] ?? { label: pr.status, cls: "bg-slate-100 text-slate-600" };
                return (
                  <div key={pr.id} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${s.cls}`}>{s.label}</span>
                          <span className="text-xs font-bold text-slate-700">{pr.buyer_name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(pr.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-900">{fmtCurrency(pr.proposed_price)}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{pr.payment_method}</p>
                      </div>
                    </div>
                    {pr.message && (
                      <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-2 mt-2">
                        "{pr.message}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProprietarioPanel() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("bai_token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API}/api/v1/crm/owners/${id}/portfolio`, {
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error("Acesso negado ou proprietário não encontrado");
        return r.json();
      })
      .then(setPortfolio)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-100 rounded-xl w-64" />
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-80 bg-slate-100 rounded-2xl" />
            <div className="h-80 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <p className="text-red-600 font-bold">{error || "Erro ao carregar portfólio"}</p>
          <Link href="/dashboard/owners" className="text-sm text-blue-600 hover:underline mt-4 inline-block">
            ← Voltar para Proprietários
          </Link>
        </div>
      </div>
    );
  }

  const { owner, broker, totals, properties } = portfolio;

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <Link
            href="/dashboard/owners"
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition inline-flex items-center gap-1 mb-3"
          >
            ← Proprietários
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{owner.name}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
            {owner.phone && (
              <a href={`https://wa.me/55${owner.phone.replace(/\D/g, "")}`} target="_blank"
                className="hover:text-emerald-600 transition font-medium">
                📱 {owner.phone}
              </a>
            )}
            {owner.email && (
              <a href={`mailto:${owner.email}`} className="hover:text-blue-600 transition font-medium">
                ✉️ {owner.email}
              </a>
            )}
          </div>
        </div>

        {/* Broker card */}
        {broker.name && (
          <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Corretor responsável</p>
            <p className="text-sm font-black text-slate-900">{broker.name}</p>
            {broker.creci && <p className="text-[11px] text-slate-400">CRECI {broker.creci}</p>}
            {broker.phone && (
              <a href={`https://wa.me/55${broker.phone.replace(/\D/g, "")}`} target="_blank"
                className="text-xs font-bold text-emerald-600 hover:underline mt-1 inline-block">
                Contatar via WhatsApp →
              </a>
            )}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        <StatPill label="Imóveis" value={totals.properties} />
        <StatPill label="Leads" value={totals.leads} />
        <StatPill label="Visitas" value={totals.visits} />
        <StatPill label="Propostas" value={totals.proposals} accent={totals.proposals > 0 ? "bg-blue-50" : undefined} />
        <StatPill label="Pendentes" value={totals.pending_proposals} accent={totals.pending_proposals > 0 ? "bg-amber-50" : undefined} />
      </div>

      {/* Owner notes */}
      {owner.notes && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 mb-6">
          <SectionTitle>Observações</SectionTitle>
          <p className="text-sm text-slate-600">{owner.notes}</p>
        </div>
      )}

      {/* Properties */}
      {properties.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
          <p className="text-slate-400 font-medium">Nenhum imóvel vinculado a este proprietário.</p>
          <Link href="/announce" className="text-sm text-blue-600 hover:underline mt-3 inline-block font-bold">
            + Cadastrar imóvel
          </Link>
        </div>
      ) : (
        <>
          <SectionTitle>Portfólio de Imóveis</SectionTitle>
          <div className="grid md:grid-cols-2 gap-5">
            {properties.map(prop => (
              <PropertyDetail key={prop.id} prop={prop} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
