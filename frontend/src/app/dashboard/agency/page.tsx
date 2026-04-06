"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function AgencyDashboard() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    total_properties: 0,
    total_leads: 0,
    total_brokers: 0,
    total_owners: 0
  });
  const [comissaoResumo, setComissaoResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

  useEffect(() => {
    if (authLoading || !token || !user) return;

    const fetchStats = async () => {
      try {
        if (user.role !== 'agency' && !(user.role === 'broker' && !user.parent_id)) {
          router.push("/dashboard");
          return;
        }

        const [propRes, leadRes, ownerRes] = await Promise.all([
          fetch(`${API}/api/v1/properties/user/stats`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${API}/api/v1/crm/leads`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${API}/api/v1/crm/owners`, { headers: { "Authorization": `Bearer ${token}` } }),
        ]);

        const propsStats = await propRes.json();
        const leads = await leadRes.json();
        const owners = await ownerRes.json();

        let brokers: any[] = [];
        if (user.role === 'agency') {
          const [brokerRes, comissaoRes] = await Promise.all([
            fetch(`${API}/api/v1/team/brokers`, { headers: { "Authorization": `Bearer ${token}` } }),
            fetch(`${API}/api/v1/comissoes/resumo`, { headers: { "Authorization": `Bearer ${token}` } }),
          ]);
          if (brokerRes.ok) brokers = await brokerRes.json();
          if (comissaoRes.ok) setComissaoResumo(await comissaoRes.json());
        }

        setStats({
          total_properties: propsStats?.total_properties || 0,
          total_leads: leads?.length || 0,
          total_brokers: brokers?.length || 0,
          total_owners: owners?.length || 0,
        });
      } catch (err) {
        console.error("Erro ao carregar dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, user, authLoading, router, API]);

  const cards = [
    { title: "Imóveis Ativos", value: stats.total_properties, icon: "🏠", link: "/dashboard" },
    { title: "Leads", value: stats.total_leads, icon: "🎯", link: "/dashboard/crm" },
    ...(user?.role === 'agency' ? [{ title: "Corretores", value: stats.total_brokers, icon: "👥", link: "/dashboard/team" }] : []),
    { title: "Proprietários", value: stats.total_owners, icon: "🤝", link: "/dashboard/owners" },
    { title: "Visitas", value: "Agenda", icon: "📅", link: "/dashboard/appointments" },
  ];

  const quickLinks = [
    { label: "Novo Anúncio", href: "/announce", primary: true },
    { label: "Agenda de Visitas", href: "/dashboard/appointments", primary: false },
    { label: "CRM / Leads", href: "/dashboard/crm", primary: false },
    ...(user?.role === 'agency' ? [{ label: "Equipe", href: "/dashboard/team", primary: false }] : []),
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {user?.role === 'agency' ? 'Central da Imobiliária' : 'Central do Corretor'}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Visão geral da operação.</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'agency' && (
            <Link
              href="/dashboard/team"
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
            >
              + Corretor
            </Link>
          )}
          <Link
            href="/announce"
            className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
          >
            + Novo Anúncio
          </Link>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.link}
              className="bg-white px-5 py-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{card.icon}</span>
                <span className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{card.value}</span>
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{card.title}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">

          {/* Comissões */}
          {comissaoResumo && (
            <div className="bg-white rounded-2xl border border-slate-100 px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Comissões</h3>
                <Link href="/dashboard/crm" className="text-xs font-bold text-blue-600 hover:underline">
                  Ver detalhes →
                </Link>
              </div>
              <div className="flex items-stretch divide-x divide-slate-100">
                <div className="flex-1 pr-4">
                  <div className="text-xl font-black text-slate-900">{comissaoResumo.total_comissoes}</div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total</div>
                </div>
                <div className="flex-1 px-4">
                  <div className="text-lg font-black text-amber-600">
                    R$ {(comissaoResumo.total_pendente ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mt-0.5">A receber</div>
                </div>
                <div className="flex-1 pl-4">
                  <div className="text-lg font-black text-emerald-600">
                    R$ {(comissaoResumo.total_pago ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">Recebido</div>
                </div>
              </div>
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="bg-white rounded-2xl border border-slate-100 px-6 py-5">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Ações Rápidas</h3>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                    link.primary
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar — Resumo */}
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Resumo da Carteira</p>
            <div className="flex items-end gap-2 mb-1">
              <div className="text-4xl font-black">{stats.total_leads}</div>
              <div className="text-sm font-bold text-slate-400 mb-1">leads ativos</div>
            </div>
            <p className="text-sm text-slate-400">
              {stats.total_properties} {stats.total_properties === 1 ? 'imóvel publicado' : 'imóveis publicados'}
              {stats.total_owners > 0 ? ` · ${stats.total_owners} ${stats.total_owners === 1 ? 'proprietário' : 'proprietários'}` : ''}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Navegação</p>
            {[
              { label: "Meus Imóveis", href: "/dashboard", icon: "🏠" },
              { label: "Painel do Vendedor", href: "/dashboard/seller", icon: "🏡" },
              { label: "Proprietários", href: "/dashboard/owners", icon: "🤝" },
              { label: "Financiamento", href: "/dashboard/buyer/financing", icon: "💰" },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 text-sm text-slate-600 hover:text-blue-600 transition font-medium"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
