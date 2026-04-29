"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RegionTagsInput from "@/app/components/RegionTagsInput";
import CurrencyInput from "@/app/components/ui/CurrencyInput";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

function BuyerProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [locations, setLocations] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({
    nome_perfil: "Meu Perfil",
    preco_minimo: "", preco_maximo: "",
    cidade: "", bairro: "",
    tipo_imovel: "", tipo_oferta: "venda",
    quartos_minimo: "", banheiros_minimo: "", vagas_minimo: "",
    financiamento_aprovado: false
  });

  useEffect(() => {
    fetch(`${API}/api/v1/imoveis/locations`)
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(console.error);

    if (!profileId) {
      setFormData(prev => ({ ...prev, nome_perfil: "Novo Perfil de Busca" }));
      return;
    }

    const fetchProfile = async () => {
      const token = localStorage.getItem("bai_token");
      try {
        const res = await fetch(`${API}/api/v1/match/profiles/${profileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            nome_perfil: data.nome_perfil || "Meu Perfil",
            preco_minimo: data.preco_minimo || "", preco_maximo: data.preco_maximo || "",
            cidade: data.cidade || "", bairro: data.bairro || "",
            tipo_imovel: data.tipo_imovel || "", tipo_oferta: data.tipo_oferta || "venda",
            quartos_minimo: data.quartos_minimo || "", banheiros_minimo: data.banheiros_minimo || "",
            vagas_minimo: data.vagas_minimo || "",
            financiamento_aprovado: data.financiamento_aprovado || false
          });
        }
      } catch (err) {}
    };
    fetchProfile();
  }, [profileId]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: type === 'checkbox' ? checked : value };
      // Clear bairro if cidade changes to keep data consistent
      if (name === "cidade" && value !== prev.cidade) {
        newState.bairro = "";
      }
      return newState;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    const token = localStorage.getItem("bai_token");

    const payload = { ...formData } as any;
    
    // Validations
    const minP = payload.preco_minimo ? Number(payload.preco_minimo) : 0;
    const maxP = payload.preco_maximo ? Number(payload.preco_maximo) : Infinity;

    if (maxP > 0 && minP > maxP) {
      setFeedback({ type: "error", message: "O preço mínimo não pode ser maior que o preço máximo." });
      setLoading(false);
      return;
    }

    ["preco_minimo", "preco_maximo", "quartos_minimo", "banheiros_minimo", "vagas_minimo"].forEach(k => {
      payload[k] = payload[k] === "" ? null : Number(payload[k]);
    });
    if (payload.cidade === "") payload.cidade = null;
    if (payload.bairro === "") payload.bairro = null;
    if (payload.tipo_imovel === "") payload.tipo_imovel = null;

    try {
      const url = profileId
        ? `${API}/api/v1/match/profiles/${profileId}`
        : `${API}/api/v1/match/profiles`;

      const res = await fetch(url, {
        method: profileId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erro desconhecido ao salvar perfil");
      }

      setFeedback({ type: "success", message: profileId ? "Perfil atualizado com sucesso!" : "Perfil criado com sucesso! Redirecionando..." });
      setTimeout(() => router.push("/dashboard/buyer"), 1500);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!profileId) return;
    if (!confirm("Tem certeza que deseja excluir este perfil?")) return;

    const token = localStorage.getItem("bai_token");
    try {
      await fetch(`${API}/api/v1/match/profiles/${profileId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      router.push("/dashboard/buyer");
    } catch (err) {
      setFeedback({ type: "error", message: "Erro ao excluir perfil." });
    }
  };

  const labelCls = "block text-sm font-semibold text-slate-600 mb-1.5";
  const inputCls = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition text-slate-800";
  const selectCls = inputCls + " appearance-none";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-black text-slate-900 mb-1">
          {profileId ? "Editar Perfil de Busca" : "Novo Perfil de Busca"}
        </h1>
        <p className="text-slate-500 text-sm">
          Defina o que você está procurando para que nosso sistema encontre as melhores opções.
        </p>
      </div>

      {feedback && (
        <div className={`mb-6 p-4 rounded-2xl text-sm font-bold border flex items-center gap-3 transition-all duration-300 ${
          feedback.type === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-100/50 shadow-sm shadow-emerald-100/20"
            : "bg-rose-50 text-rose-600 border-rose-100/50 shadow-sm shadow-rose-100/20"
        }`}>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-sm border border-inherit">
            {feedback.type === "success" ? "✓" : "!"}
          </span>
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">

        <div>
          <label className={labelCls}>Nome Sugestivo do Perfil</label>
          <input
            type="text" name="nome_perfil" value={formData.nome_perfil}
            onChange={handleChange} required
            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-900 font-black text-lg placeholder:text-slate-300"
            placeholder="Ex: Minha Casa Própria, Investimento..."
          />
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Capacidade Financeira</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Preço Mínimo</label>
              <CurrencyInput
                value={formData.preco_minimo}
                onChange={(val) => setFormData(p => ({...p, preco_minimo: val !== undefined ? String(val) : ""}))}
                className={inputCls}
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <label className={labelCls}>Preço Máximo</label>
              <CurrencyInput
                value={formData.preco_maximo}
                onChange={(val) => setFormData(p => ({...p, preco_maximo: val !== undefined ? String(val) : ""}))}
                placeholder="Sem limite"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Localização e Tipo</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Tipo de Negócio</label>
              <select name="tipo_oferta" value={formData.tipo_oferta} onChange={handleChange} className={selectCls}>
                <option value="venda">Compra</option>
                <option value="aluguel">Aluguel</option>
                <option value="temporada">Temporada</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo de Imóvel</label>
              <select name="tipo_imovel" value={formData.tipo_imovel} onChange={handleChange} className={selectCls}>
                <option value="">Qualquer tipo</option>
                <option value="apartamento">Apartamento</option>
                <option value="casa">Casa</option>
                <option value="terreno">Terreno</option>
                <option value="comercial">Comercial</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Cidade</label>
              <select name="cidade" value={formData.cidade} onChange={handleChange} className={selectCls}>
                <option value="">Qualquer cidade</option>
                {Object.keys(locations).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Bairros / Regiões</label>
              <RegionTagsInput
                value={formData.bairro}
                onChange={(val) => setFormData(p => ({...p, bairro: val}))}
                placeholder="Ex: Pinheiros, Barra..."
                suggestions={formData.cidade ? locations[formData.cidade] || [] : []}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Características Mínimas</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Quartos</label>
              <input type="number" name="quartos_minimo" value={formData.quartos_minimo} onChange={handleChange} className={inputCls} placeholder="Mín." min="0" />
            </div>
            <div>
              <label className={labelCls}>Banheiros</label>
              <input type="number" name="banheiros_minimo" value={formData.banheiros_minimo} onChange={handleChange} className={inputCls} placeholder="Mín." min="0" />
            </div>
            <div>
              <label className={labelCls}>Vagas</label>
              <input type="number" name="vagas_minimo" value={formData.vagas_minimo} onChange={handleChange} className={inputCls} placeholder="Mín." min="0" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
          <input
            type="checkbox" id="financing" name="financiamento_aprovado"
            checked={formData.financiamento_aprovado} onChange={handleChange}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
          />
          <label htmlFor="financing" className="text-sm font-semibold text-slate-700 cursor-pointer">
            Já tenho crédito aprovado / Busco financiamento
          </label>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
          {profileId ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition"
            >
              <span>🗑</span> Excluir
            </button>
          ) : <div />}
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-2.5 font-bold rounded-xl text-white transition-all ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100'}`}
          >
            {loading ? "Salvando..." : "Salvar Perfil"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BuyerProfileSettings() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-10 text-slate-400 italic">Carregando...</div>
    }>
      <BuyerProfileContent />
    </Suspense>
  );
}
