"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

type Tab = "upcoming" | "history";

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  
  // Feedback Modal State
  const [feedbackAppt, setFeedbackAppt] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      const token = localStorage.getItem("bai_token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${API}/api/v1/appointments/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Erro ao carregar agendamentos");
        const data = await res.json();
        
        // Busca detalhes dos imóveis para pegar o proprietário
        const enriched = await Promise.all(data.map(async (a: any) => {
          const pRes = await fetch(`${API}/api/v1/properties/${a.property_id}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            return { ...a, property: pData };
          }
          return a;
        }));
        
        setAppointments(enriched);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [router]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    const token = localStorage.getItem("bai_token");
    try {
      const res = await fetch(`${API}/api/v1/appointments/${id}/status?status=${newStatus}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        if (newStatus === 'completed') {
            const appt = appointments.find(a => a.id === id);
            setFeedbackAppt(appt);
            setFeedbackText("");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackAppt || !feedbackText.trim()) return;
    setIsSubmittingFeedback(true);
    const token = localStorage.getItem("bai_token");
    try {
      const res = await fetch(`${API}/api/v1/appointments/${feedbackAppt.id}/feedback?feedback=${encodeURIComponent(feedbackText)}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === feedbackAppt.id ? { ...a, feedback_visita: feedbackText } : a));
        setFeedbackAppt(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (activeTab === "upcoming") return a.status === 'pending' || a.status === 'confirmed';
    return a.status === 'completed' || a.status === 'cancelled';
  }).sort((a, b) => {
    const dateA = new Date(a.visit_date).getTime();
    const dateB = new Date(b.visit_date).getTime();
    return activeTab === "upcoming" ? dateA - dateB : dateB - dateA;
  });

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'pending': return { label: 'Pendente', class: 'bg-amber-100 text-amber-700', icon: '⏳' };
      case 'confirmed': return { label: 'Confirmada', class: 'bg-emerald-100 text-emerald-700', icon: '✅' };
      case 'completed': return { label: 'Realizada', class: 'bg-blue-100 text-blue-700', icon: '🏁' };
      case 'cancelled': return { label: 'Cancelada', class: 'bg-red-100 text-red-700', icon: '❌' };
      default: return { label: status, class: 'bg-slate-100 text-slate-700', icon: '•' };
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Gestão de Visitas</h1>
        <p className="text-slate-500 font-medium">Acompanhe e gerencie as solicitações de visita aos seus imóveis com transparência.</p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-8 border-b border-slate-100 pb-px">
        <button 
          onClick={() => setActiveTab("upcoming")}
          className={`pb-4 px-2 font-bold text-sm transition relative ${activeTab === 'upcoming' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Próximas Visitas
          {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={`pb-4 px-2 font-bold text-sm transition relative ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Histórico
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[2.5rem]"></div>)}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-8 rounded-[2.5rem] text-center font-bold border border-red-100">{error}</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white p-20 text-center rounded-[2.5rem] border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            {activeTab === 'upcoming' ? '📅' : '📜'}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {activeTab === 'upcoming' ? 'Nenhuma visita agendada' : 'Seu histórico está vazio'}
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            {activeTab === 'upcoming' 
              ? 'Quando novos clientes solicitarem visitas, elas aparecerão aqui em destaque.' 
              : 'Visitas concluídas ou canceladas serão listadas aqui para seu controle.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {filteredAppointments.map((appt) => {
            const status = getStatusDisplay(appt.status);
            return (
              <div key={appt.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                {/* Top Section: Property Info */}
                <div className="p-8 flex gap-6 border-b border-slate-50">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <img 
                      src={appt.property?.image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80"} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${status.class}`}>
                        {status.icon} {status.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">#{appt.id}</span>
                    </div>
                    <Link href={`/properties/${appt.property_id}`} className="block font-black text-slate-900 truncate hover:text-blue-600 transition">
                      {appt.property?.title || `Imóvel #${appt.property_id}`}
                    </Link>
                    <p className="text-xs text-slate-400 font-medium">
                      📍 {appt.property?.neighborhood || 'Bairro'}, {appt.property?.city || 'Cidade'}
                    </p>
                  </div>
                </div>

                {/* Middle Section: Visit Details */}
                <div className="p-8 flex-1">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-xs">Data e Hora</div>
                      <div className="text-sm font-bold text-slate-900">
                        {new Date(appt.visit_date).toLocaleString('pt-BR', { dateStyle: 'long' })}
                      </div>
                      <div className="text-xs font-bold text-blue-600">
                         às {new Date(appt.visit_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-xs">Comprador</div>
                      <div className="text-sm font-bold text-slate-900 truncate">{appt.visitor_name}</div>
                      <a 
                        href={`https://wa.me/55${appt.visitor_phone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline"
                      >
                        📱 {appt.visitor_phone}
                      </a>
                    </div>
                  </div>

                  {appt.notes && (
                    <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nota do Comprador</div>
                      <p className="text-xs text-slate-600 italic">"{appt.notes}"</p>
                    </div>
                  )}

                  {appt.feedback_visita && (
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                      <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Feedback da Agência</div>
                      <p className="text-xs text-slate-600">{appt.feedback_visita}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Section: Actions */}
                <div className="px-8 py-6 bg-slate-50 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    {appt.property?.actual_owner && (
                      <a 
                        href={`https://wa.me/55${appt.property.actual_owner.phone?.replace(/\D/g, '')}?text=Olá ${appt.property.actual_owner.name}, confirmamos a visita para o dia ${new Date(appt.visit_date).toLocaleDateString('pt-BR')} às ${new Date(appt.visit_date).getHours()}h.`}
                        target="_blank"
                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition flex items-center gap-1"
                      >
                         Proprietário: {appt.property.actual_owner.name.split(' ')[0]} ⭢
                      </a>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {appt.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(appt.id, 'confirmed')} 
                          className="px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                        >
                          Confirmar
                        </button>
                        <button 
                          onClick={() => handleStatusChange(appt.id, 'cancelled')} 
                          className="px-4 py-2 bg-white text-red-600 text-xs font-black rounded-xl border border-red-100 hover:bg-red-50 transition"
                        >
                          Recusar
                        </button>
                      </>
                    )}
                    {appt.status === 'confirmed' && (
                      <button 
                        onClick={() => handleStatusChange(appt.id, 'completed')} 
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                      >
                        Concluída
                      </button>
                    )}
                    {appt.status === 'completed' && !appt.feedback_visita && (
                      <button 
                        onClick={() => { setFeedbackAppt(appt); setFeedbackText(""); }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-black rounded-xl border border-blue-100 hover:bg-blue-100 transition"
                      >
                        + Feedback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {feedbackAppt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6">📝</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Relato da Visita</h2>
            <p className="text-slate-500 mb-8 text-sm font-medium">Como foi o encontro com <span className="text-slate-900 font-bold">{feedbackAppt.visitor_name}</span>? Descreva as impressões do cliente.</p>
            
            <textarea 
              autoFocus
              className="w-full px-6 py-4 rounded-[2rem] border-2 border-slate-100 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50 text-slate-700 font-medium text-sm min-h-[150px] mb-6 transition-all"
              placeholder="Ex: O cliente gostou do acabamento mas achou os quartos pequenos... Planeja fazer uma contraproposta em 2 dias."
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setFeedbackAppt(null)}
                className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition"
                disabled={isSubmittingFeedback}
              >
                Pular agora
              </button>
              <button 
                onClick={handleFeedbackSubmit}
                disabled={!feedbackText.trim() || isSubmittingFeedback}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {isSubmittingFeedback ? 'Salvando...' : 'Salvar Relato'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
