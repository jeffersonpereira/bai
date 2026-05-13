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
        const res = await fetch(`${API}/api/v1/agendamentos/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Erro ao carregar agendamentos");
        const data = await res.json();
        
        // Busca detalhes dos imóveis para pegar o proprietário
        const enriched = await Promise.all(data.map(async (a: any) => {
          const pRes = await fetch(`${API}/api/v1/imoveis/${a.imovel_id}`);
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
      const res = await fetch(`${API}/api/v1/agendamentos/${id}/status?situacao=${newStatus}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, situacao: newStatus } : a));
        if (newStatus === 'realizado') {
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
      const res = await fetch(`${API}/api/v1/agendamentos/${feedbackAppt.id}/feedback?feedback=${encodeURIComponent(feedbackText)}`, {
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
    if (activeTab === "upcoming") return a.situacao === 'pendente' || a.situacao === 'confirmado';
    return a.situacao === 'realizado' || a.situacao === 'cancelado';
  }).sort((a, b) => {
    const dateA = new Date(a.data_visita).getTime();
    const dateB = new Date(b.data_visita).getTime();
    return activeTab === "upcoming" ? dateA - dateB : dateB - dateA;
  });

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'pendente': return { label: 'Pendente', class: 'bg-amber-100 text-amber-700', icon: '⏳' };
      case 'confirmado': return { label: 'Confirmada', class: 'bg-emerald-100 text-emerald-700', icon: '✅' };
      case 'realizado': return { label: 'Realizada', class: 'bg-blue-100 text-blue-700', icon: '🏁' };
      case 'cancelado': return { label: 'Cancelada', class: 'bg-red-100 text-red-700', icon: '❌' };
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
      ) : activeTab === "history" ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Imóvel</th>
                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Visitante</th>
                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Feedback</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAppointments.map((appt) => {
                const status = getStatusDisplay(appt.situacao);
                return (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4">
                      <Link href={`/properties/${appt.imovel_id}`} className="font-bold text-sm text-slate-900 hover:text-blue-600 transition block truncate max-w-[200px]">
                        {appt.property?.titulo || `Imóvel #${appt.imovel_id}`}
                      </Link>
                      <span className="text-xs text-slate-400">{appt.property?.bairro}, {appt.property?.cidade}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-slate-700">{appt.nome_visitante}</div>
                      <a href={`https://wa.me/55${appt.telefone_visitante.replace(/\D/g, '')}`} target="_blank" className="text-xs text-emerald-600 hover:underline">
                        {appt.telefone_visitante}
                      </a>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(appt.data_visita).toLocaleDateString('pt-BR')}
                      <span className="block text-xs text-slate-400">
                        {new Date(appt.data_visita).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${status.class}`}>
                        {status.icon} {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-[220px]">
                      {appt.feedback_visita ? (
                        <p className="text-xs text-slate-500 truncate" title={appt.feedback_visita}>
                          {appt.feedback_visita}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {appt.situacao === 'realizado' && !appt.feedback_visita && (
                        <button
                          onClick={() => { setFeedbackAppt(appt); setFeedbackText(""); }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 hover:bg-blue-100 transition whitespace-nowrap"
                        >
                          + Feedback
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {filteredAppointments.map((appt) => {
            const status = getStatusDisplay(appt.situacao);
            return (
              <div key={appt.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                {/* Top Section: Property Info */}
                <div className="p-8 flex gap-6 border-b border-slate-50">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={appt.property?.url_imagem || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80"}
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
                    <Link href={`/properties/${appt.imovel_id}`} className="block font-black text-slate-900 truncate hover:text-blue-600 transition">
                      {appt.property?.titulo || `Imóvel #${appt.imovel_id}`}
                    </Link>
                    <p className="text-xs text-slate-400 font-medium">
                      📍 {appt.property?.bairro || 'Bairro'}, {appt.property?.cidade || 'Cidade'}
                    </p>
                  </div>
                </div>

                {/* Middle Section: Visit Details */}
                <div className="p-8 flex-1">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-xs">Data e Hora</div>
                      <div className="text-sm font-bold text-slate-900">
                        {new Date(appt.data_visita).toLocaleString('pt-BR', { dateStyle: 'long' })}
                      </div>
                      <div className="text-xs font-bold text-blue-600">
                         às {new Date(appt.data_visita).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-xs">Comprador</div>
                      <div className="text-sm font-bold text-slate-900 truncate">{appt.nome_visitante}</div>
                      <a
                        href={`https://wa.me/55${appt.telefone_visitante.replace(/\D/g, '')}`}
                        target="_blank"
                        className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline"
                      >
                        📱 {appt.telefone_visitante}
                      </a>
                    </div>
                  </div>

                  {appt.observacoes && (
                    <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nota do Comprador</div>
                      <p className="text-xs text-slate-600 italic">"{appt.observacoes}"</p>
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
                    {appt.property?.corretor && (
                      <a
                        href={`https://wa.me/55${appt.property.corretor.telefone?.replace(/\D/g, '')}?text=Olá ${appt.property.corretor.nome}, confirmamos a visita para o dia ${new Date(appt.data_visita).toLocaleDateString('pt-BR')} às ${new Date(appt.data_visita).getHours()}h.`}
                        target="_blank"
                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition flex items-center gap-1"
                      >
                         Responsável: {appt.property.corretor.nome?.split(' ')[0]} ⭢
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {appt.situacao === 'pendente' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(appt.id, 'confirmado')}
                          className="px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleStatusChange(appt.id, 'cancelado')}
                          className="px-4 py-2 bg-white text-red-600 text-xs font-black rounded-xl border border-red-100 hover:bg-red-50 transition"
                        >
                          Recusar
                        </button>
                      </>
                    )}
                    {appt.situacao === 'confirmado' && (
                      <button
                        onClick={() => handleStatusChange(appt.id, 'realizado')}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                      >
                        Concluída
                      </button>
                    )}
                    {appt.situacao === 'realizado' && !appt.feedback_visita && (
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
            <p className="text-slate-500 mb-8 text-sm font-medium">Como foi o encontro com <span className="text-slate-900 font-bold">{feedbackAppt.nome_visitante}</span>? Descreva as impressões do cliente.</p>
            
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
