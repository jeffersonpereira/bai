"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FinancingSimulationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    property_value: 500000,
    down_payment: 100000,
    term_months: 360,
    user_income: 10000,
    amortization_type: "SAC"
  });
  
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/financing/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.offers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-12">
        <Link href="/dashboard/buyer" className="text-blue-600 font-bold flex items-center gap-2 mb-6 hover:underline transition-all">
          ← Voltar para o Painel
        </Link>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Simulação de Financiamento</h1>
        <p className="text-slate-500 text-xl font-medium max-w-2xl">
          Encontre o melhor financiamento para seu novo lar através de cálculos precisos nos principais bancos.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Formulário */}
        <div className="lg:col-span-4">
          <form onSubmit={handleSimulate} className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-slate-100 flex flex-col gap-6 sticky top-8">
            <h2 className="text-xl font-black text-slate-800 mb-2">Seus Dados</h2>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor do Imóvel (R$)</label>
              <input 
                type="number" 
                value={formData.property_value} 
                onChange={e => setFormData({...formData, property_value: Number(e.target.value)})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor de Entrada (R$)</label>
              <input 
                type="number" 
                value={formData.down_payment} 
                onChange={e => setFormData({...formData, down_payment: Number(e.target.value)})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Equivale a {Math.round((formData.down_payment / formData.property_value) * 100)}% do valor do imóvel.</p>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sua Renda Mensal Bruta (R$)</label>
              <input 
                type="number" 
                value={formData.user_income} 
                onChange={e => setFormData({...formData, user_income: Number(e.target.value)})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prazo (Meses)</label>
                <input 
                  type="number" 
                  value={formData.term_months} 
                  onChange={e => setFormData({...formData, term_months: Number(e.target.value)})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tabela</label>
                <select 
                  value={formData.amortization_type} 
                  onChange={e => setFormData({...formData, amortization_type: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                >
                  <option value="SAC">SAC</option>
                  <option value="PRICE">PRICE</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-soft hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Calculando...
                </>
              ) : "Simular Agora ✨"}
            </button>
          </form>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!results ? (
            <div className="bg-slate-50 rounded-[3rem] p-12 text-center border border-dashed border-slate-200 h-[600px] flex flex-col items-center justify-center">
              <div className="text-6xl mb-6 opacity-40">📊</div>
              <h3 className="text-2xl font-black text-slate-400 mb-2">Preencha os dados ao lado</h3>
              <p className="text-slate-400 font-medium">Clique em Simular para descobrir as melhores condições.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 px-2 gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Resultados da Simulação</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    ⚠️ Estas informações são estimativas baseadas em taxas médias e requerem validação oficial do banco.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest shrink-0">
                  {results.length} Ofertas Encontradas
                </span>
              </div>
              
              <div className="grid gap-6">
                {results.map((offer: any) => (
                  <div 
                    key={offer.bank_name} 
                    className={`relative p-8 rounded-[2.5rem] border-2 transition-all flex flex-col md:flex-row gap-8 items-start md:items-center ${
                      offer.is_best_offer 
                      ? "bg-white border-blue-500 shadow-xl ring-8 ring-blue-500/5" 
                      : "bg-white/60 border-slate-100 shadow-sm opacity-90 transition-opacity hover:opacity-100"
                    }`}
                  >
                    {offer.is_best_offer && (
                      <div className="absolute -top-4 left-8 bg-blue-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-md">
                        🏆 MELHOR OPÇÃO
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h4 className="text-xl font-black text-slate-900 mb-1">{offer.bank_name}</h4>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{offer.interest_rate}%</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">juros a.a.</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">1ª Parcela</p>
                          <p className="text-lg font-black text-slate-900">R$ {offer.first_installment.toLocaleString("pt-BR")}</p>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Última Parcela</p>
                          <p className="text-lg font-black text-slate-900">R$ {offer.last_installment.toLocaleString("pt-BR")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 min-w-[220px]">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Total Pago</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">R$ {offer.total_paid.toLocaleString("pt-BR")}</p>
                        <p className="text-[11px] font-bold text-blue-600 mt-1 italic">
                          (R$ {offer.total_interest.toLocaleString("pt-BR")} de juros)
                        </p>
                      </div>

                      {offer.max_financing_reached ? (
                         <div className="bg-amber-50 text-amber-600 p-3 rounded-xl border border-amber-100 flex items-start gap-2">
                           <span className="text-sm shrink-0">⚠️</span>
                           <p className="text-[10px] font-bold leading-tight uppercase">
                             Parcela acima de 30% da sua renda. O banco pode exigir maior entrada.
                           </p>
                         </div>
                      ) : (
                         <button className="w-full bg-slate-900 hover:bg-black text-white px-6 py-3.5 rounded-xl text-xs font-black tracking-widest transition-all hover:scale-105">
                           TENHO INTERESSE →
                         </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-600 p-10 rounded-[3rem] text-white overflow-hidden relative shadow-blue-500/20 shadow-2xl mt-8">
                 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-md">
                       <h3 className="text-3xl font-black mb-3">Temos parceiros correspondentes prontos para ajudar!</h3>
                       <p className="text-blue-100 font-medium">Aprovamos seu crédito de forma rápida e gratuita. Fale com um especialista.</p>
                    </div>
                    <button className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-sm tracking-widest shadow-xl hover:scale-110 active:scale-95 transition-all">
                       CHAMAR NO WHATSAPP
                    </button>
                 </div>
                 {/* Decorative circles */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] text-slate-400 font-medium leading-relaxed italic">
                * Isenção de Responsabilidade: Os valores apresentados são meramente simulados e podem variar conforme o perfil de crédito (score), idade do proponente e taxas de seguros obrigatórios (MIP/DFI). Esta simulação não substitui a análise de crédito oficial da instituição financeira. Crédito sujeito à aprovação.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
