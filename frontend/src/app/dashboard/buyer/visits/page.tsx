"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

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

function VisitCard({ v }: { v: Visit }) {
  const cfg = STATUS_CONFIG[v.situacao] ?? STATUS_CONFIG.pendente;
  const isConfirmed = v.situacao === "confirmado";
  const isPending = v.situacao === "pendente";
  const imgSrc = v.imovel?.url_imagem || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80";

  return (
    <div className={`rounded-3xl border p-5 flex flex-col sm:flex-row gap-5 transition ${cfg.card}`}>
      <div className="w-full sm:w-28 h-28 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
        <img src={imgSrc} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-3">
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

        {v.observacoes && (
          <p className="text-xs text-slate-500 italic bg-white/60 px-3 py-2 rounded-xl border border-slate-100">
            "{v.observacoes}"
          </p>
        )}

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

export default function VisitsPage() {
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bai_token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API}/api/v1/agendamentos/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then(setVisits)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const upcomingVisits = visits.filter((v) => v.situacao === "pendente" || v.situacao === "confirmado");
  const pastVisits = visits.filter((v) => v.situacao === "realizado" || v.situacao === "cancelado");
  const confirmedVisits = visits.filter((v) => v.situacao === "confirmado");
  const pendingVisits = visits.filter((v) => v.situacao === "pendente");

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="h-10 w-56 bg-slate-100 animate-pulse rounded-xl mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Histórico de Visitas</h1>
          <p className="text-slate-500 font-medium">Todas as suas visitas agendadas e realizadas.</p>
        </div>
        <div className="flex gap-2">
          {confirmedVisits.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full border border-emerald-200">
              {confirmedVisits.length} confirmada{confirmedVisits.length !== 1 ? "s" : ""}
            </span>
          )}
          {pendingVisits.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-black rounded-full border border-amber-200">
              {pendingVisits.length} aguardando
            </span>
          )}
        </div>
      </div>

      {visits.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-[3rem] text-center shadow-sm">
          <p className="text-slate-500 font-medium text-lg">Você ainda não tem visitas agendadas.</p>
          <Link href="/search" className="mt-6 inline-block px-8 py-3 bg-blue-600 text-white font-black rounded-full hover:bg-blue-700 transition">
            Buscar Imóveis
          </Link>
        </div>
      ) : (
        <>
          {upcomingVisits.length > 0 && (
            <section className="mb-10">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Próximas</p>
              <div className="space-y-4">
                {upcomingVisits.map((v) => <VisitCard key={v.id} v={v} />)}
              </div>
            </section>
          )}

          {pastVisits.length > 0 && (
            <section>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                Histórico ({pastVisits.length})
              </p>
              <div className="space-y-4">
                {pastVisits.map((v) => <VisitCard key={v.id} v={v} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
