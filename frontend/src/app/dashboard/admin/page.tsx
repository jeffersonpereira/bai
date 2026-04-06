"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

interface AdminStats {
  total_users: number;
  total_agencies: number;
  total_brokers: number;
  total_properties: number;
  total_leads: number;
  recent_registrations: number;
  premium_users: number;
}

export default function AdminCockpitPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch(`${API}/api/v1/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Erro ao carregar stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, token, authLoading, router]);

  if (authLoading || loading) {
     return <div className="p-20 text-center animate-pulse flex flex-col items-center"><div className="w-8 h-8 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mb-4"></div>Preparando Cockpit...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl animate-in fade-in duration-500">
      <div className="mb-12 border-b border-slate-200 pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Super Admin Cockpit</h1>
          <p className="text-slate-500 font-medium mt-2">Visão global da saúde da plataforma BAI.</p>
        </div>
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-red-100">
          Nível de Acesso: Máximo
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 relative z-10">Total de Usuários</div>
          <div className="text-4xl font-black text-slate-900 relative z-10">{stats?.total_users || 0}</div>
          <div className="text-sm font-bold text-emerald-600 mt-2 relative z-10">+{stats?.recent_registrations || 0} na última semana</div>
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-5">👥</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-3xl border border-purple-100 shadow-sm relative overflow-hidden">
          <div className="text-purple-600 text-xs font-black uppercase tracking-widest mb-2 relative z-10">LTV SaaS (Pagantes)</div>
          <div className="text-4xl font-black text-purple-900 relative z-10">{stats?.premium_users || 0}</div>
          <div className="text-sm font-bold text-purple-700 mt-2 relative z-10">Assinaturas Premium/Pro Ativas</div>
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-10">💎</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 relative z-10">Imóveis Ativos</div>
          <div className="text-4xl font-black text-slate-900 relative z-10">{stats?.total_properties || 0}</div>
          <div className="text-sm font-bold text-slate-500 mt-2 relative z-10">No inventário global</div>
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-5">🏢</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 relative z-10">Leads Gerados</div>
          <div className="text-4xl font-black text-slate-900 relative z-10">{stats?.total_leads || 0}</div>
          <div className="text-sm font-bold text-slate-500 mt-2 relative z-10">Contatos e pontes realizadas</div>
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-5">🎯</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Link href="/dashboard/admin/users" className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-6 group-hover:bg-blue-100 transition-colors">👥</div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Gestão de Usuários e SaaS</h2>
          <p className="text-slate-500 font-medium">Bloqueie usuários problemáticos, altere planos SaaS (Free/Pro/Premium) e edite prazos de vencimento.</p>
        </Link>
        
        <Link href="/dashboard/admin/properties" className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-3xl mb-6 group-hover:bg-red-100 transition-colors">🛡️</div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Auditoria de Imóveis</h2>
          <p className="text-slate-500 font-medium">Acesso a todo o inventário oculto e global. Suspenda (Takedown) ou ative anúncios do catálogo geral.</p>
        </Link>
      </div>
    </div>
  );
}
