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
    name: "Meu Perfil",
    min_price: "", max_price: "",
    city: "", neighborhood: "",
    property_type: "", listing_type: "venda",
    min_bedrooms: "", min_bathrooms: "", min_garage_spaces: "",
    financing_approved: false
  });

  useEffect(() => {
    fetch(`${API}/api/v1/properties/locations`)
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(console.error);

    if (!profileId) {
      setFormData(prev => ({ ...prev, name: "Novo Perfil de Busca" }));
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
            name: data.name || "Meu Perfil",
            min_price: data.min_price || "", max_price: data.max_price || "",
            city: data.city || "", neighborhood: data.neighborhood || "",
            property_type: data.property_type || "", listing_type: data.listing_type || "venda",
            min_bedrooms: data.min_bedrooms || "", min_bathrooms: data.min_bathrooms || "",
            min_garage_spaces: data.min_garage_spaces || "",
            financing_approved: data.financing_approved || false
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
      // Clear neighborhood if city changes to keep data consistent
      if (name === "city" && value !== prev.city) {
        newState.neighborhood = "";
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
    const minP = payload.min_price ? Number(payload.min_price) : 0;
    const maxP = payload.max_price ? Number(payload.max_price) : Infinity;

    if (maxP > 0 && minP > maxP) {
      setFeedback({ type: "error", message: "O preço mínimo não pode ser maior que o preço máximo." });
      setLoading(false);
      return;
    }

    ["min_price", "max_price", "min_bedrooms", "min_bathrooms", "min_garage_spaces"].forEach(k => {
      payload[k] = payload[k] === "" ? null : Number(payload[k]);
    });
    if (payload.city === "") payload.city = null;
    if (payload.neighborhood === "") payload.neighborhood = null;
    if (payload.property_type === "") payload.property_type = null;

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
            type="text" name="name" value={formData.name}
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
                value={formData.min_price}
                onChange={(val) => setFormData(p => ({...p, min_price: val !== undefined ? String(val) : ""}))}
                className={inputCls}
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <label className={labelCls}>Preço Máximo</label>
              <CurrencyInput
                value={formData.max_price}
                onChange={(val) => setFormData(p => ({...p, max_price: val !== undefined ? String(val) : ""}))}
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
              <select name="listing_type" value={formData.listing_type} onChange={handleChange} className={selectCls}>
                <option value="venda">Compra</option>
                <option value="aluguel">Aluguel</option>
                <option value="temporada">Temporada</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo de Imóvel</label>
              <select name="property_type" value={formData.property_type} onChange={handleChange} className={selectCls}>
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
              <select name="city" value={formData.city} onChange={handleChange} className={selectCls}>
                <option value="">Qualquer cidade</option>
                {Object.keys(locations).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Bairros / Regiões</label>
              <RegionTagsInput
                value={formData.neighborhood}
                onChange={(val) => setFormData(p => ({...p, neighborhood: val}))}
                placeholder="Ex: Pinheiros, Barra..."
                suggestions={formData.city ? locations[formData.city] || [] : []}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Características Mínimas</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Quartos</label>
              <input type="number" name="min_bedrooms" value={formData.min_bedrooms} onChange={handleChange} className={inputCls} placeholder="Mín." min="0" />
            </div>
            <div>
              <label className={labelCls}>Banheiros</label>
              <input type="number" name="min_bathrooms" value={formData.min_bathrooms} onChange={handleChange} className={inputCls} placeholder="Mín." min="0" />
            </div>
            <div>
              <label className={labelCls}>Vagas</label>
              <input type="number" name="min_garage_spaces" value={formData.min_garage_spaces} onChange={handleChange} className={inputCls} placeholder="Mín." min="0" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
          <input
            type="checkbox" id="financing" name="financing_approved"
            checked={formData.financing_approved} onChange={handleChange}
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
