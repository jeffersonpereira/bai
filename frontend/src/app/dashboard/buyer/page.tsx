"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PropertyCardSkeleton } from "@/app/components/ui/Skeleton";

export default function BuyerDashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfile, setActiveProfile] = useState<any>(null);

  const [exactProps, setExactProps] = useState<any[]>([]);
  const [expandedProps, setExpandedProps] = useState<any[]>([]);
  const [newProps, setNewProps] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

  useEffect(() => {
    const fetchProfiles = async () => {
      const token = localStorage.getItem("bai_token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${API}/api/v1/match/profiles`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setProfiles(data);
          if (data.length > 0) setActiveProfile(data[0]);

          const [visitsRes, newRes] = await Promise.all([
            fetch(`${API}/api/v1/appointments/`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API}/api/v1/views/properties/new?limit=12`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          if (visitsRes.ok) {
            setVisits(await visitsRes.json());
          }
          if (newRes.ok) setNewProps(await newRes.json());
        }
      } catch (err) {
        console.error("Erro", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, [router]);

  useEffect(() => {
    if (!activeProfile) return;
    
    const fetchMatches = async () => {
      setLoadingMatches(true);
      const token = localStorage.getItem("bai_token");
      try {
        const [resExact, resExp] = await Promise.all([
          fetch(`${API}/api/v1/match/properties/${activeProfile.id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/v1/match/properties/${activeProfile.id}?expanded=true`, { headers: { Authorization: `Bearer ${token}` } })
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

  const PropertyCard = ({ p }: { p: any }) => (
    <Link href={`/properties/${p.id}`} className="group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      <div className="h-56 bg-slate-100 relative overflow-hidden shrink-0">
        <img src={p.image_url || (p.media?.length ? p.media[0].url : "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80")} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        
        {activeProfile?.financing_approved && p.financing_eligible && (
          <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur text-white px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest shadow-sm">
            ACEITA FINANCIAMENTO
          </div>
        )}
        <div className="absolute bottom-4 left-4 bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm border border-white/20">
          {p.area}m²
        </div>
      </div>
      
      <div className="p-5 flex flex-col grow">
        <div className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mb-1.5">{p.neighborhood}, {p.city}</div>
        <h3 className="font-bold text-slate-900 text-base mb-4 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors h-11">{p.title}</h3>
        
        <div className="mt-auto">
          <div className="flex items-center gap-3 text-slate-500 font-medium text-xs pt-4 border-t border-slate-50 mb-4">
            {p.bedrooms > 0 && <span className="flex items-center gap-1.5">🛏️ {p.bedrooms} {p.bedrooms === 1 ? 'Quarto' : 'Quartos'}</span>}
            {p.bathrooms > 0 && <span className="flex items-center gap-1.5">🚿 {p.bathrooms} {p.bathrooms === 1 ? 'Banho' : 'Banhos'}</span>}
          </div>
          <div className="font-black text-2xl text-slate-900 tracking-tight">
            R$ {p.price.toLocaleString("pt-BR")}
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Para Você</h1>
          <p className="text-slate-500 font-medium text-lg">Suas curadorias inteligentes prontas para explorar.</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <Link 
            href="/dashboard" 
            className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-full shadow-sm hover:shadow-soft hover:bg-slate-50 transition-all text-sm tracking-wide text-center flex items-center gap-2"
          >
            ⚙️ Meus Anúncios
          </Link>
          <Link 
            href="/dashboard/buyer/financing" 
            className="px-6 py-3.5 bg-slate-100 text-slate-900 font-bold rounded-full shadow-sm hover:shadow-soft hover:bg-slate-200 transition-all text-sm tracking-wide text-center flex items-center gap-2"
          >
            📊 Financiamento
          </Link>
          <Link 
            href="/announce" 
            className="px-6 py-3.5 bg-emerald-600 text-white font-bold rounded-full shadow-sm hover:shadow-soft hover:bg-emerald-700 transition-all text-sm tracking-wide text-center flex items-center gap-2 whitespace-nowrap"
          >
            🏡 Anunciar Imóvel
          </Link>
          <Link 
            href="/dashboard/buyer/profile" 
            className="px-6 py-3.5 bg-blue-600 text-white font-bold rounded-full shadow-sm hover:shadow-soft hover:bg-blue-700 transition-all text-sm tracking-wide text-center whitespace-nowrap"
          >
            ➕ Criar Novo Perfil
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-10">
          <div>
            <div className="h-5 w-40 bg-slate-100 animate-pulse rounded-xl mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-3xl" />
              ))}
            </div>
          </div>
          <div>
            <div className="h-5 w-36 bg-slate-100 animate-pulse rounded-xl mb-6" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <PropertyCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-[3rem] text-center shadow-sm max-w-3xl mx-auto my-12">
          <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">🎯</div>
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
          {/* Seção de Gerenciamento de Perfis */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                🎯 Seus Perfis de Busca
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map(prof => {
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
                      <h3 className={`font-black text-lg ${isActive ? 'text-blue-600' : 'text-slate-700 group-hover:text-slate-900'}`}>
                        {prof.name}
                      </h3>
                      {isActive && (
                        <div className="bg-blue-600 text-white p-1 rounded-full text-[8px] animate-pulse">
                          ✨
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                      <div className="flex items-center gap-2">
                        📍 {prof.neighborhood ? `${prof.neighborhood}, ` : ''}{prof.city || 'Toda cidade'}
                      </div>
                      <div className="flex items-center gap-2">
                        💰 R$ {prof.min_price?.toLocaleString() || '0'} - {prof.max_price ? `R$ ${prof.max_price.toLocaleString()}` : 'Ilimitado'}
                      </div>
                      <div className="flex items-center gap-2">
                        🛏️ {prof.min_bedrooms || '0'}+ Quartos • {prof.property_type || 'Qualquer tipo'}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className={`text-[9px] font-black tracking-widest ${isActive ? 'text-blue-600' : 'text-slate-300'}`}>
                        {isActive ? 'PERFIL ATIVO' : 'CLIQUE PARA ATIVAR'}
                      </div>
                      <Link 
                        href={`/dashboard/buyer/profile?id=${prof.id}`}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ✏️ Editar
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
                  ➕
                </div>
                <span className="font-bold text-sm">Criar Outro Perfil</span>
              </Link>
            </div>
          </div>

          {loadingMatches ? (
             <div className="flex items-center gap-4 py-20 text-blue-600 font-bold justify-center">
               <span className="w-5 h-5 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
               Encontrando os melhores matches...
             </div>
          ) : (
            <div className="space-y-16">
              {/* Sessão Exata */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">✨</span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Matches Perfeitos</h2>
                </div>
                {exactProps.length === 0 ? (
                  <div className="bg-slate-50 p-8 rounded-3xl text-center border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">Não achamos imóveis com 100% dos critérios. Veja nossas sugestões abaixo!</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {exactProps.map((m, idx) => <PropertyCard key={`exact-${m.property.id || idx}`} p={m.property} />)}
                  </div>
                )}
              </section>

              {/* Sessão Expandida / Descubra Mais */}
              <section className="bg-blue-50/50 p-6 md:p-10 rounded-[3rem] border border-blue-100/50">
                <div className="flex flex-col mb-8">
                  <div className="flex items-center gap-3 mb-2">
                     <span className="text-2xl">👀</span>
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">Descubra Mais</h2>
                  </div>
                  <p className="text-slate-500 font-medium text-sm">Expandimos levemente seu raio de vizinhança e limite orçamentário. Veja o que está fora da caixa:</p>
                </div>
                
                {expandedProps.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 font-medium">Infelizmente, nem expandindo os limites achamos opções.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {expandedProps.map((m, idx) => <PropertyCard key={`exp-${m.property.id || idx}`} p={m.property} />)}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Seção: Novos para Você (imóveis ainda não vistos) */}
          {newProps.length > 0 && (
            <section className="mt-12 pt-12 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🆕</span>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Novos para Você</h2>
                  <p className="text-slate-500 text-sm font-medium mt-0.5">Imóveis publicados que você ainda não visualizou.</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {newProps.map((p, idx) => <PropertyCard key={`new-${p.id || idx}`} p={p} />)}
              </div>
            </section>
          )}

          {/* Seção de Visitas */}
          {visits.length > 0 && (
            <section className="mt-16 pt-16 border-t border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Minhas Visitas</h2>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full">
                  {visits.length} {visits.length === 1 ? 'Agendamento' : 'Agendamentos'}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {visits.map((v) => {
                  const status = v.status === 'confirmed' ? { label: 'Confirmada', color: 'emerald', icon: '✅' } : 
                                v.status === 'pending' ? { label: 'Pendente', color: 'amber', icon: '⏳' } : 
                                v.status === 'cancelled' ? { label: 'Cancelada', color: 'red', icon: '❌' } :
                                { label: 'Realizada', color: 'blue', icon: '🏁' };
                  
                  return (
                    <div key={v.id} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group flex flex-col sm:flex-row gap-6">
                      <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                        <img 
                          src={v.property?.image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80"} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                             <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-${status.color}-50 text-${status.color}-600 border border-${status.color}-100`}>
                               {status.icon} {status.label}
                             </span>
                             <span className="text-[10px] font-bold text-slate-400">
                               {new Date(v.visit_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {new Date(v.visit_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                             </span>
                          </div>
                          <Link href={`/properties/${v.property_id}`} className="font-black text-slate-900 hover:text-blue-600 transition truncate block mb-1">
                            {v.property?.title || `Imóvel #${v.property_id}`}
                          </Link>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            📍 {v.property?.neighborhood || 'Bairro'}, {v.property?.city || 'Cidade'}
                          </p>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between gap-4">
                           <Link href={`/properties/${v.property_id}`} className="text-xs font-black text-blue-600 hover:underline">
                              Ver Imóvel →
                           </Link>
                           {v.status === 'confirmed' && (
                             <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                               Visita Confirmada!
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
